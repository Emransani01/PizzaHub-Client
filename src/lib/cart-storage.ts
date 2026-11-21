/**
 * Browser-only cart persistence.
 *
 * Carts are private to a signed-in customer and live under a versioned key so
 * a future schema change never has to interpret old, incompatible payloads.
 * Every helper is safe to call during SSR or when localStorage is unavailable
 * (private browsing, disabled storage, quota errors): an empty cart is
 * returned instead of throwing.
 */
import {
  CART_MAX_LINES,
  CART_MAX_QUANTITY,
  CART_STORAGE_PREFIX,
} from "@/constants";
import type { CartItem, CartSnapshot, MenuItem } from "@/types";

export function cartStorageKey(userId: string): string {
  return `${CART_STORAGE_PREFIX}${userId}`;
}

function emptySnapshot(): CartSnapshot {
  return { version: 1, items: [], updatedAt: "" };
}

function browserStorage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function asText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asImage(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function clampQuantity(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(CART_MAX_QUANTITY, Math.max(1, Math.trunc(value)));
}

/**
 * Validates, clamps and de-duplicates raw cart data. Duplicate lines are
 * merged by summing their quantities; the oldest position is preserved.
 */
export function normalizeCartItems(input: unknown): CartItem[] {
  if (!Array.isArray(input)) return [];

  const byId = new Map<string, CartItem>();

  for (const entry of input) {
    if (!entry || typeof entry !== "object") continue;
    const raw = entry as Record<string, unknown>;
    const itemId = asText(raw.itemId).trim();
    if (!itemId) continue;

    const quantity = clampQuantity(Number(raw.quantity));
    if (quantity === 0) continue;

    const price = Number(raw.unitPrice);
    const unitPrice =
      Number.isFinite(price) && price >= 0 ? Math.round(price * 100) / 100 : 0;

    const existing = byId.get(itemId);
    if (existing) {
      existing.quantity = clampQuantity(existing.quantity + quantity);
      continue;
    }

    byId.set(itemId, {
      itemId,
      quantity,
      itemName: asText(raw.itemName),
      category: asText(raw.category),
      vendorId: asText(raw.vendorId),
      vendorName: asText(raw.vendorName),
      unitPrice,
      image: asImage(raw.image),
    });
  }

  return Array.from(byId.values()).slice(0, CART_MAX_LINES);
}

export function readCart(userId: string): CartSnapshot {
  if (!userId) return emptySnapshot();
  const store = browserStorage();
  if (!store) return emptySnapshot();

  try {
    const raw = store.getItem(cartStorageKey(userId));
    if (!raw) return emptySnapshot();
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return emptySnapshot();
    const snapshot = parsed as Partial<CartSnapshot>;
    if (snapshot.version !== 1 || !Array.isArray(snapshot.items)) {
      return emptySnapshot();
    }
    return {
      version: 1,
      items: normalizeCartItems(snapshot.items),
      updatedAt: asText(snapshot.updatedAt),
    };
  } catch {
    return emptySnapshot();
  }
}

export function writeCart(userId: string, items: CartItem[]): CartSnapshot {
  const snapshot: CartSnapshot = {
    version: 1,
    items: normalizeCartItems(items),
    updatedAt: new Date().toISOString(),
  };
  const store = browserStorage();
  if (!userId || !store) return snapshot;

  try {
    store.setItem(cartStorageKey(userId), JSON.stringify(snapshot));
  } catch {
    // Storage can be full or blocked; the in-memory cart remains usable.
  }
  return snapshot;
}

export function removeCart(userId: string): void {
  const store = browserStorage();
  if (!userId || !store) return;
  try {
    store.removeItem(cartStorageKey(userId));
  } catch {
    // Nothing else to do: the in-memory cart is cleared by the provider.
  }
}

/** Builds a storable line from a public menu item, clamping its quantity. */
export function cartItemFromMenuItem(
  item: MenuItem,
  quantity = 1,
): CartItem {
  return {
    itemId: item.id,
    quantity: clampQuantity(quantity) || 1,
    itemName: item.itemName,
    category: item.category,
    vendorId: item.vendorId,
    vendorName: item.vendorName,
    unitPrice: item.price,
    image: item.images[0] ?? null,
  };
}
