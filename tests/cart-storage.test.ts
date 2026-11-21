import { beforeEach, describe, expect, it, vi } from "vitest";
import { CART_MAX_LINES, CART_MAX_QUANTITY } from "@/constants";
import {
  cartItemFromMenuItem,
  cartStorageKey,
  normalizeCartItems,
  readCart,
  removeCart,
  writeCart,
} from "@/lib/cart-storage";
import type { CartItem, MenuItem } from "@/types";

function line(itemId: string, overrides: Partial<CartItem> = {}): CartItem {
  return {
    itemId,
    quantity: 1,
    itemName: `Item ${itemId}`,
    category: "Pizzas",
    vendorId: "vendor-1",
    vendorName: "Vendor One",
    unitPrice: 10,
    image: null,
    ...overrides,
  };
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("cart storage", () => {
  it("uses a versioned key per user and isolates stored carts", () => {
    writeCart("user-1", [line("a")]);

    expect(cartStorageKey("user-1")).toBe("pizzahub:cart:v1:user-1");
    expect(window.localStorage.getItem(cartStorageKey("user-1"))).toContain(
      '"version":1',
    );
    expect(readCart("user-1").items).toEqual([line("a")]);
    expect(readCart("user-2").items).toEqual([]);

    removeCart("user-1");
    expect(readCart("user-1").items).toEqual([]);
  });

  it("falls back to an empty cart for corrupt or future payloads", () => {
    window.localStorage.setItem(cartStorageKey("user-1"), "not-json");
    expect(readCart("user-1")).toMatchObject({ version: 1, items: [] });

    window.localStorage.setItem(
      cartStorageKey("user-1"),
      JSON.stringify({ version: 2, items: [line("a")] }),
    );
    expect(readCart("user-1").items).toEqual([]);
  });

  it("merges duplicates, clamps quantities and caps the number of lines", () => {
    const many = Array.from({ length: CART_MAX_LINES + 3 }, (_, index) =>
      line(`item-${index}`),
    );
    const result = normalizeCartItems([
      line("huge", { quantity: CART_MAX_QUANTITY + 50 }),
      ...many,
      line("item-0", { quantity: 3 }),
      line("invalid", { quantity: 0 }),
    ]);

    expect(result).toHaveLength(CART_MAX_LINES);
    expect(result[0].quantity).toBe(CART_MAX_QUANTITY);
    expect(result.find((item) => item.itemId === "item-0")?.quantity).toBe(4);
    expect(result.some((item) => item.itemId === "invalid")).toBe(false);
  });

  it("does not throw when localStorage is unavailable", () => {
    const getItem = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });
    const removeItem = vi
      .spyOn(Storage.prototype, "removeItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });

    expect(readCart("user-1").items).toEqual([]);
    expect(() => writeCart("user-1", [line("a")])).not.toThrow();
    expect(() => removeCart("user-1")).not.toThrow();

    getItem.mockRestore();
    setItem.mockRestore();
    removeItem.mockRestore();
  });

  it("projects a menu item into a storable cart line", () => {
    const menuItem = {
      id: "menu-1",
      itemName: "Margherita",
      category: "Classic Pizzas",
      vendorId: "vendor-9",
      vendorName: "Vendor Nine",
      price: 12.5,
      images: ["pizza.jpg"],
    } as MenuItem;

    expect(cartItemFromMenuItem(menuItem, 3)).toMatchObject({
      itemId: "menu-1",
      quantity: 3,
      itemName: "Margherita",
      unitPrice: 12.5,
      image: "pizza.jpg",
    });
  });
});
