import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ useAuth: vi.fn() }));

vi.mock("@/providers/auth-provider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/providers/auth-provider")>();
  return { ...actual, useAuth: mocks.useAuth };
});

import { cartStorageKey } from "@/lib/cart-storage";
import { CartProvider, useCart } from "@/providers/cart-provider";
import type { CartItem, UserProfile } from "@/types";
import { testUser } from "./helpers";

function line(itemId: string, quantity = 1): CartItem {
  return {
    itemId,
    quantity,
    itemName: `Item ${itemId}`,
    category: "Pizzas",
    vendorId: "vendor-1",
    vendorName: "Vendor One",
    unitPrice: 10,
    image: null,
  };
}

function setAuth(user: UserProfile | null, signOutEpoch = 0) {
  mocks.useAuth.mockReturnValue({ user, loading: false, signOutEpoch });
}

function Probe() {
  const { items, count, subtotal, add, updateQty, remove, clear, setSnapshots } =
    useCart();
  return (
    <div>
      <span data-testid="items">
        {items.map((item) => `${item.itemId}:${item.quantity}`).join(",")}
      </span>
      <span data-testid="count">{count}</span>
      <span data-testid="subtotal">{subtotal}</span>
      <button type="button" onClick={() => add(line("a"), 2)}>
        Add A2
      </button>
      <button type="button" onClick={() => add(line("a"), 1)}>
        Add A1
      </button>
      <button type="button" onClick={() => add(line("b"), 1)}>
        Add B
      </button>
      <button type="button" onClick={() => updateQty("a", 4)}>
        Set A4
      </button>
      <button type="button" onClick={() => updateQty("a", 0)}>
        Remove A via qty
      </button>
      <button type="button" onClick={() => remove("b")}>
        Remove B
      </button>
      <button type="button" onClick={() => clear()}>
        Clear
      </button>
      <button
        type="button"
        onClick={() =>
          setSnapshots({
            version: 1,
            items: [line("remote", 7)],
            updatedAt: "2026-01-01",
          })
        }
      >
        Load snapshot
      </button>
    </div>
  );
}

function renderCart() {
  return render(
    <CartProvider>
      <Probe />
    </CartProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  setAuth(testUser);
});

describe("CartProvider", () => {
  it("adds, de-duplicates, updates, removes and clears with persistence", async () => {
    renderCart();
    await waitFor(() =>
      expect(screen.getByTestId("items").textContent).toBe(""),
    );

    fireEvent.click(screen.getByRole("button", { name: "Add A2" }));
    expect(screen.getByTestId("items").textContent).toBe("a:2");
    expect(screen.getByTestId("count").textContent).toBe("2");
    expect(screen.getByTestId("subtotal").textContent).toBe("20");

    fireEvent.click(screen.getByRole("button", { name: "Add A1" }));
    expect(screen.getByTestId("items").textContent).toBe("a:3");
    await waitFor(() => {
      const stored = JSON.parse(
        window.localStorage.getItem(cartStorageKey("user-1")) ?? "{}",
      );
      expect(stored.items[0].quantity).toBe(3);
    });

    fireEvent.click(screen.getByRole("button", { name: "Add B" }));
    expect(screen.getByTestId("items").textContent).toBe("a:3,b:1");

    fireEvent.click(screen.getByRole("button", { name: "Set A4" }));
    expect(screen.getByTestId("items").textContent).toBe("a:4,b:1");

    fireEvent.click(screen.getByRole("button", { name: "Remove A via qty" }));
    expect(screen.getByTestId("items").textContent).toBe("b:1");

    fireEvent.click(screen.getByRole("button", { name: "Remove B" }));
    expect(screen.getByTestId("items").textContent).toBe("");

    fireEvent.click(screen.getByRole("button", { name: "Add A1" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByTestId("items").textContent).toBe("");
  });

  it("isolates carts by user and reloads on a user switch", async () => {
    window.localStorage.setItem(
      cartStorageKey("user-2"),
      JSON.stringify({
        version: 1,
        items: [line("other", 5)],
        updatedAt: "2026-01-01",
      }),
    );

    const { rerender } = renderCart();
    fireEvent.click(screen.getByRole("button", { name: "Add A1" }));
    await waitFor(() =>
      expect(screen.getByTestId("items").textContent).toBe("a:1"),
    );

    setAuth({ ...testUser, id: "user-2" });
    rerender(
      <CartProvider>
        <Probe />
      </CartProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("items").textContent).toBe("other:5"),
    );
    expect(window.localStorage.getItem(cartStorageKey("user-1"))).not.toBeNull();
  });

  it("deletes the stored cart only after an explicit successful sign-out", async () => {
    const { rerender } = renderCart();
    fireEvent.click(screen.getByRole("button", { name: "Add A1" }));
    await waitFor(() =>
      expect(window.localStorage.getItem(cartStorageKey("user-1"))).not.toBeNull(),
    );

    // AuthProvider increments this only after Better Auth confirms sign-out.
    setAuth(null, 1);
    rerender(
      <CartProvider>
        <Probe />
      </CartProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("items").textContent).toBe(""),
    );
    expect(window.localStorage.getItem(cartStorageKey("user-1"))).toBeNull();
  });

  it("keeps the stored cart on session expiry or a failed refresh", async () => {
    const key = cartStorageKey("user-1");
    const { rerender } = renderCart();
    fireEvent.click(screen.getByRole("button", { name: "Add A1" }));
    await waitFor(() => expect(window.localStorage.getItem(key)).not.toBeNull());

    // 401 / refresh failure clears the user but never increments signOutEpoch.
    setAuth(null);
    rerender(
      <CartProvider>
        <Probe />
      </CartProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("items").textContent).toBe(""),
    );
    expect(window.localStorage.getItem(key)).not.toBeNull();

    // A retry restores the same cart.
    setAuth(testUser);
    rerender(
      <CartProvider>
        <Probe />
      </CartProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("items").textContent).toBe("a:1"),
    );
  });

  it("keeps the stored cart when a blocked-account transition clears the user", async () => {
    const key = cartStorageKey("user-1");
    const { rerender } = renderCart();
    fireEvent.click(screen.getByRole("button", { name: "Add A1" }));
    await waitFor(() => expect(window.localStorage.getItem(key)).not.toBeNull());

    // A blocked account is a 403: AuthProvider clears the user with an
    // authError but performs no successful sign-out.
    mocks.useAuth.mockReturnValue({
      user: null,
      loading: false,
      signOutEpoch: 0,
      authError: { kind: "forbidden", message: "This account has been blocked." },
    });
    rerender(
      <CartProvider>
        <Probe />
      </CartProvider>,
    );
    expect(window.localStorage.getItem(key)).not.toBeNull();
  });

  it("reacts to another tab writing the same user's cart", async () => {
    renderCart();
    await waitFor(() =>
      expect(screen.getByTestId("items").textContent).toBe(""),
    );

    const key = cartStorageKey("user-1");
    const newValue = JSON.stringify({
      version: 1,
      items: [line("shared", 9)],
      updatedAt: "2026-01-01",
    });
    window.localStorage.setItem(key, newValue);
    window.dispatchEvent(new StorageEvent("storage", { key, newValue }));

    await waitFor(() =>
      expect(screen.getByTestId("items").textContent).toBe("shared:9"),
    );
  });

  it("replaces the cart from a validated snapshot", async () => {
    renderCart();
    await waitFor(() =>
      expect(screen.getByTestId("items").textContent).toBe(""),
    );
    fireEvent.click(screen.getByRole("button", { name: "Load snapshot" }));
    expect(screen.getByTestId("items").textContent).toBe("remote:7");
  });

  it("does not add items for vendor or admin accounts", async () => {
    setAuth({ ...testUser, role: "vendor" });
    renderCart();
    await waitFor(() =>
      expect(screen.getByTestId("items").textContent).toBe(""),
    );

    fireEvent.click(screen.getByRole("button", { name: "Add A2" }));
    expect(screen.getByTestId("items").textContent).toBe("");
    expect(window.localStorage.getItem(cartStorageKey("user-1"))).toBeNull();
  });
});
