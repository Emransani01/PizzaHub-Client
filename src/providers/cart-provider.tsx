"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CART_MAX_LINES, CART_MAX_QUANTITY } from "@/constants";
import {
  cartStorageKey,
  normalizeCartItems,
  readCart,
  removeCart,
  writeCart,
} from "@/lib/cart-storage";
import type { CartItem, CartSnapshot } from "@/types";
import { useAuth } from "./auth-provider";

interface CartContextValue {
  items: CartItem[];
  /** Total number of items (sum of line quantities), for the navbar badge. */
  count: number;
  lineCount: number;
  /** Locally computed guide price; the server quote is authoritative. */
  subtotal: number;
  quantityOf: (itemId: string) => number;
  /** Adds a line or increments an existing one. Returns false when blocked. */
  add: (item: CartItem, quantity?: number) => boolean;
  updateQty: (itemId: string, quantity: number) => void;
  remove: (itemId: string) => void;
  clear: () => void;
  /** Replaces the whole cart from a validated snapshot (storage events too). */
  setSnapshots: (snapshot: CartSnapshot) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading, signOutEpoch } = useAuth();
  // Only customers own a cart. Deriving the id keeps user switches isolated.
  const activeUserId = user?.role === "customer" ? user.id : null;

  const [items, setItems] = useState<CartItem[]>([]);
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);
  const previousUserId = useRef<string | null>(null);
  const lastSignOutEpoch = useRef(signOutEpoch);

  useEffect(() => {
    if (loading) return;

    if (activeUserId) {
      setItems(readCart(activeUserId).items);
      previousUserId.current = activeUserId;
      lastSignOutEpoch.current = signOutEpoch;
      setHydratedFor(activeUserId);
      return;
    }

    // Only a confirmed, explicit sign-out destroys a stored cart. A 401, a
    // failed token refresh, a blocked account or any other transient auth
    // state keeps the cart intact so the customer can resume after retrying.
    const confirmedSignOut =
      previousUserId.current !== null && signOutEpoch !== lastSignOutEpoch.current;
    if (confirmedSignOut) {
      removeCart(previousUserId.current as string);
      previousUserId.current = null;
    }
    lastSignOutEpoch.current = signOutEpoch;
    setItems([]);
    setHydratedFor(null);
  }, [activeUserId, loading, signOutEpoch]);

  useEffect(() => {
    if (!activeUserId || hydratedFor !== activeUserId) return;
    writeCart(activeUserId, items);
  }, [activeUserId, hydratedFor, items]);

  useEffect(() => {
    if (!activeUserId) return;
    const key = cartStorageKey(activeUserId);
    const onStorage = (event: StorageEvent) => {
      if (event.key !== key) return;
      if (event.newValue === null) {
        setItems([]);
        return;
      }
      setItems(readCart(activeUserId).items);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [activeUserId]);

  const add = useCallback(
    (item: CartItem, quantity = item.quantity): boolean => {
      if (!activeUserId) return false;
      const incoming = normalizeCartItems([{ ...item, quantity }])[0];
      if (!incoming) return false;

      const index = items.findIndex((line) => line.itemId === incoming.itemId);
      if (index >= 0) {
        const current = items[index].quantity;
        if (current >= CART_MAX_QUANTITY) return false;
        setItems(
          items.map((line, position) =>
            position === index
              ? {
                  ...line,
                  quantity: Math.min(
                    CART_MAX_QUANTITY,
                    current + incoming.quantity,
                  ),
                }
              : line,
          ),
        );
        return true;
      }

      if (items.length >= CART_MAX_LINES) return false;
      setItems([...items, incoming]);
      return true;
    },
    [activeUserId, items],
  );

  const updateQty = useCallback(
    (itemId: string, quantity: number) => {
      if (!activeUserId) return;
      if (!Number.isFinite(quantity) || quantity < 1) {
        setItems(items.filter((line) => line.itemId !== itemId));
        return;
      }
      setItems(
        items.map((line) =>
          line.itemId === itemId
            ? {
                ...line,
                quantity: Math.min(CART_MAX_QUANTITY, Math.trunc(quantity)),
              }
            : line,
        ),
      );
    },
    [activeUserId, items],
  );

  const remove = useCallback(
    (itemId: string) => {
      if (!activeUserId) return;
      setItems(items.filter((line) => line.itemId !== itemId));
    },
    [activeUserId, items],
  );

  const clear = useCallback(() => {
    if (!activeUserId) return;
    setItems([]);
  }, [activeUserId]);

  const setSnapshots = useCallback((snapshot: CartSnapshot) => {
    if (!snapshot || snapshot.version !== 1) return;
    setItems(normalizeCartItems(snapshot.items));
  }, []);

  const quantityOf = useCallback(
    (itemId: string) =>
      items.find((line) => line.itemId === itemId)?.quantity ?? 0,
    [items],
  );

  const value = useMemo<CartContextValue>(() => {
    const subtotal = roundCurrency(
      items.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
    );
    return {
      items,
      count: items.reduce((sum, line) => sum + line.quantity, 0),
      lineCount: items.length,
      subtotal,
      quantityOf,
      add,
      updateQty,
      remove,
      clear,
      setSnapshots,
    };
  }, [add, clear, items, quantityOf, remove, setSnapshots, updateQty]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside <CartProvider>.");
  }
  return context;
}
