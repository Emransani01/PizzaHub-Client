import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useCart: vi.fn(),
  quoteCart: vi.fn(),
  replace: vi.fn(),
  push: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  updateQty: vi.fn(),
  remove: vi.fn(),
  clear: vi.fn(),
  setSnapshots: vi.fn(),
}));

vi.mock("@/providers/auth-provider", () => ({
  useAuth: mocks.useAuth,
  roleHome: () => "/dashboard/customer",
}));

vi.mock("@/providers/cart-provider", () => ({ useCart: mocks.useCart }));

vi.mock("@/services/orders", () => ({
  quoteCart: mocks.quoteCart,
  checkoutCart: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mocks.replace,
    push: mocks.push,
    refresh: vi.fn(),
  }),
  usePathname: () => "/cart",
}));

vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} />,
}));

import { CartView } from "@/components/cart/cart-view";
import type { CartItem, CartQuoteResult } from "@/types";
import { testUser } from "./helpers";

function line(itemId: string, quantity: number, unitPrice = 10): CartItem {
  return {
    itemId,
    quantity,
    itemName: `Item ${itemId}`,
    category: "Pizzas",
    vendorId: "vendor-1",
    vendorName: "Vendor One",
    unitPrice,
    image: null,
  };
}

function quote(overrides: Partial<CartQuoteResult> = {}): CartQuoteResult {
  return {
    items: [
      { itemId: "a", quantity: 2, unitPrice: 10, lineTotal: 20 },
      { itemId: "b", quantity: 1, unitPrice: 20, lineTotal: 20 },
    ],
    subtotal: 40,
    total: 40,
    canCheckout: true,
    issues: [],
    quoteToken: "quote-token-1",
    quoteExpiresAt: null,
    ...overrides,
  };
}

function setCart(items: CartItem[] = [line("a", 2), line("b", 1, 20)]) {
  mocks.useCart.mockReturnValue({
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    quantityOf: vi.fn(() => 0),
    add: vi.fn(() => true),
    updateQty: mocks.updateQty,
    remove: mocks.remove,
    clear: mocks.clear,
    setSnapshots: mocks.setSnapshots,
  });
}

beforeEach(() => {
  mocks.useAuth.mockReturnValue({ user: testUser, loading: false });
  setCart();
  mocks.quoteCart.mockReset();
  mocks.replace.mockClear();
  mocks.push.mockClear();
  mocks.toastSuccess.mockClear();
  mocks.toastError.mockClear();
  mocks.updateQty.mockClear();
  mocks.remove.mockClear();
  mocks.clear.mockClear();
  mocks.setSnapshots.mockClear();
});

describe("CartView", () => {
  it("shows an empty state and does not quote an empty cart", () => {
    setCart([]);
    render(<CartView />);

    expect(screen.getByText("Your cart is empty")).toBeDefined();
    expect(mocks.quoteCart).not.toHaveBeenCalled();
  });

  it("renders quote totals and enables checkout when the quote is valid", async () => {
    mocks.quoteCart.mockResolvedValue(quote());
    render(<CartView />);

    await waitFor(() =>
      expect(mocks.quoteCart).toHaveBeenCalledWith({
        items: [
          { itemId: "a", quantity: 2, expectedUnitPrice: 10 },
          { itemId: "b", quantity: 1, expectedUnitPrice: 20 },
        ],
      }),
    );
    expect(screen.getAllByText("$40.00").length).toBeGreaterThan(0);
    await waitFor(() =>
      expect(
        (screen.getByRole("button", { name: "Proceed to Checkout" }) as HTMLButtonElement)
          .disabled,
      ).toBe(false),
    );
  });

  it("requires an explicit acknowledgement of price changes and re-quotes", async () => {
    mocks.quoteCart
      .mockResolvedValueOnce(
        quote({
          canCheckout: false,
          quoteToken: null,
          issues: [
            {
              itemId: "a",
              code: "PRICE_CHANGED",
              message: "Price changed",
              expectedUnitPrice: 10,
              currentUnitPrice: 12,
            },
          ],
        }),
      )
      .mockResolvedValueOnce(quote());

    render(<CartView />);

    const accept = await screen.findByRole("button", {
      name: /Review and accept new prices/i,
    });
    expect(
      (screen.getByRole("button", { name: "Proceed to Checkout" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);

    fireEvent.click(accept);

    await waitFor(() =>
      expect(mocks.setSnapshots).toHaveBeenCalledWith(
        expect.objectContaining({
          version: 1,
          items: expect.arrayContaining([
            expect.objectContaining({ itemId: "a", unitPrice: 12 }),
          ]),
        }),
      ),
    );
    await waitFor(() => expect(mocks.quoteCart).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(
        (screen.getByRole("button", { name: "Proceed to Checkout" }) as HTMLButtonElement)
          .disabled,
      ).toBe(false),
    );
  });

  it("blocks checkout for unavailable lines and offers removal", async () => {
    mocks.quoteCart.mockResolvedValue(
      quote({
        canCheckout: false,
        quoteToken: null,
        issues: [
          { itemId: "b", code: "UNAVAILABLE", message: "Item b is unavailable" },
        ],
      }),
    );

    render(<CartView />);

    expect((await screen.findAllByText("Item b is unavailable")).length).toBeGreaterThan(0);
    expect(
      (screen.getByRole("button", { name: "Proceed to Checkout" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Remove item" }));
    expect(mocks.remove).toHaveBeenCalledWith("b");
  });

  it("clears the cart only after confirmation", async () => {
    mocks.quoteCart.mockResolvedValue(quote());
    render(<CartView />);

    await waitFor(() =>
      expect(
        (screen.getByRole("button", { name: "Proceed to Checkout" }) as HTMLButtonElement)
          .disabled,
      ).toBe(false),
    );

    fireEvent.click(screen.getByRole("button", { name: /Clear cart/i }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeDefined();
    expect(mocks.clear).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole("button", { name: "Clear cart" }));
    expect(mocks.clear).toHaveBeenCalledTimes(1);
  });
});
