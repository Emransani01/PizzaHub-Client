import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useCart: vi.fn(),
  quoteCart: vi.fn(),
  checkoutCart: vi.fn(),
  replace: vi.fn(),
  push: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
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
  checkoutCart: mocks.checkoutCart,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mocks.replace,
    push: mocks.push,
    refresh: vi.fn(),
  }),
  usePathname: () => "/checkout",
}));

vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));

import { CheckoutView } from "@/components/checkout/checkout-view";
import { ApiError } from "@/lib/api";
import type { CartItem, CartQuoteResult, CheckoutResult } from "@/types";
import { testUser } from "./helpers";

const GROUP_KEY = "pizzahub:checkout-group:v1:user-1";

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

function success(overrides: Partial<CheckoutResult> = {}): CheckoutResult {
  return {
    checkoutGroupId: "group-from-server",
    orders: [{ id: "order-1" } as CheckoutResult["orders"][number]],
    summary: { orderCount: 2, subtotal: 40, total: 40 },
    replayed: false,
    ...overrides,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function fillForm() {
  fireEvent.change(screen.getByLabelText("Delivery date"), {
    target: { value: "2099-01-01" },
  });
  fireEvent.change(screen.getByLabelText("Delivery address"), {
    target: { value: "123 Main Street, Springfield" },
  });
}

async function readyToSubmit() {
  const button = await screen.findByRole("button", { name: "Place order" });
  await waitFor(() => expect((button as HTMLButtonElement).disabled).toBe(false));
  return button;
}

beforeEach(() => {
  window.sessionStorage.clear();
  mocks.useAuth.mockReturnValue({ user: testUser, loading: false });
  mocks.useCart.mockReturnValue({
    items: [line("a", 2), line("b", 1, 20)],
    count: 3,
    subtotal: 40,
    quantityOf: vi.fn(() => 0),
    add: vi.fn(),
    updateQty: vi.fn(),
    remove: vi.fn(),
    clear: mocks.clear,
    setSnapshots: mocks.setSnapshots,
  });
  mocks.quoteCart.mockReset();
  mocks.checkoutCart.mockReset();
  mocks.quoteCart.mockResolvedValue(quote());
  mocks.replace.mockClear();
  mocks.push.mockClear();
  mocks.toastSuccess.mockClear();
  mocks.toastError.mockClear();
  mocks.clear.mockClear();
  mocks.setSnapshots.mockClear();
});

describe("CheckoutView", () => {
  it("submits the quote token with a stable group, clears the cart and redirects", async () => {
    mocks.checkoutCart.mockResolvedValue(success());
    render(<CheckoutView />);

    const button = await readyToSubmit();
    fillForm();
    fireEvent.click(button);

    await waitFor(() => expect(mocks.checkoutCart).toHaveBeenCalledTimes(1));
    const payload = mocks.checkoutCart.mock.calls[0][0];
    expect(payload).toMatchObject({
      quoteToken: "quote-token-1",
      items: [
        { itemId: "a", quantity: 2 },
        { itemId: "b", quantity: 1 },
      ],
      deliveryDate: "2099-01-01",
      deliveryAddress: "123 Main Street, Springfield",
    });
    expect(payload.checkoutGroupId).toBeTruthy();
    expect(window.sessionStorage.getItem(GROUP_KEY)).toBeNull();
    expect(mocks.clear).toHaveBeenCalledTimes(1);
    expect(mocks.push).toHaveBeenCalledWith(
      expect.stringContaining(`group=${success().checkoutGroupId}`),
    );
    expect(mocks.push).toHaveBeenCalledWith(
      expect.stringContaining("highlight=order-1"),
    );
  });

  it("keeps the same group after a transient failure and still clears on replay", async () => {
    mocks.checkoutCart
      .mockRejectedValueOnce(new Error("Network is down"))
      .mockResolvedValueOnce(success({ replayed: true }));
    render(<CheckoutView />);

    const button = await readyToSubmit();
    fillForm();
    fireEvent.click(button);

    await waitFor(() => expect(mocks.toastError).toHaveBeenCalled());
    expect(mocks.clear).not.toHaveBeenCalled();
    const firstGroup = mocks.checkoutCart.mock.calls[0][0].checkoutGroupId;
    expect(window.sessionStorage.getItem(GROUP_KEY)).toBe(firstGroup);

    fireEvent.click(await readyToSubmit());

    await waitFor(() => expect(mocks.checkoutCart).toHaveBeenCalledTimes(2));
    expect(mocks.checkoutCart.mock.calls[1][0].checkoutGroupId).toBe(firstGroup);
    await waitFor(() => expect(mocks.clear).toHaveBeenCalledTimes(1));
    expect(window.sessionStorage.getItem(GROUP_KEY)).toBeNull();
    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      "These orders were already placed.",
    );
  });

  it("disables double submissions while a request is in flight", async () => {
    const pending = deferred<CheckoutResult>();
    mocks.checkoutCart.mockReturnValue(pending.promise);
    render(<CheckoutView />);

    const button = await readyToSubmit();
    fillForm();
    fireEvent.click(button);
    fireEvent.click(button);

    expect(mocks.checkoutCart).toHaveBeenCalledTimes(1);
    pending.resolve(success());
    await waitFor(() => expect(mocks.clear).toHaveBeenCalledTimes(1));
  });

  it("refreshes an expired quote and allows a retry without editing the cart", async () => {
    mocks.quoteCart
      .mockResolvedValueOnce(quote())
      .mockResolvedValueOnce(quote({ quoteToken: "quote-token-2" }));
    mocks.checkoutCart
      .mockRejectedValueOnce(
        new ApiError(409, "Your price quote has expired.", {
          code: "QUOTE_EXPIRED",
          details: { requiresFreshQuote: true },
        }),
      )
      .mockResolvedValueOnce(success());

    render(<CheckoutView />);

    const button = await readyToSubmit();
    fillForm();
    fireEvent.click(button);

    await waitFor(() => expect(mocks.quoteCart).toHaveBeenCalledTimes(2));
    expect(mocks.toastError).toHaveBeenCalledWith(
      "Your price quote has expired.",
    );
    // No automatic submit loop: the customer decides when to retry.
    expect(mocks.checkoutCart).toHaveBeenCalledTimes(1);

    fireEvent.click(await readyToSubmit());
    await waitFor(() => expect(mocks.checkoutCart).toHaveBeenCalledTimes(2));
    expect(mocks.checkoutCart.mock.calls[1][0].quoteToken).toBe("quote-token-2");
    await waitFor(() => expect(mocks.clear).toHaveBeenCalledTimes(1));
  });

  it("gates submission behind price-change acknowledgement", async () => {
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
    mocks.checkoutCart.mockResolvedValue(success());

    render(<CheckoutView />);

    const accept = await screen.findByRole("button", {
      name: /Review and accept new prices/i,
    });
    const place = await screen.findByRole("button", { name: "Place order" });
    expect((place as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(accept);

    await waitFor(() => expect(mocks.quoteCart).toHaveBeenCalledTimes(2));
    expect(mocks.quoteCart.mock.calls[1][0].items).toEqual([
      expect.objectContaining({
        itemId: "a",
        expectedUnitPrice: 10,
        acknowledgedUnitPrice: 12,
      }),
      expect.objectContaining({ itemId: "b", expectedUnitPrice: 20 }),
    ]);
    expect(mocks.setSnapshots).toHaveBeenCalledWith(
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({ itemId: "a", unitPrice: 12 }),
        ]),
      }),
    );
    await waitFor(() =>
      expect(
        (screen.getByRole("button", { name: "Place order" }) as HTMLButtonElement)
          .disabled,
      ).toBe(false),
    );
  });
});
