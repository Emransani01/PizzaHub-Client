import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useCart: vi.fn(),
  quoteCart: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/providers/auth-provider", () => ({
  useAuth: mocks.useAuth,
  roleHome: (role: string) => `/dashboard/${role}`,
}));

vi.mock("@/providers/cart-provider", () => ({ useCart: mocks.useCart }));

vi.mock("@/services/orders", () => ({
  quoteCart: mocks.quoteCart,
  checkoutCart: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/cart",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} />,
}));

import DashboardIndexPage from "@/app/dashboard/page";
import { CartView } from "@/components/cart/cart-view";
import { CheckoutView } from "@/components/checkout/checkout-view";
import { testUser } from "./helpers";

beforeEach(() => {
  mocks.replace.mockClear();
  mocks.refresh.mockClear();
  mocks.quoteCart.mockReset();
  mocks.quoteCart.mockResolvedValue({
    items: [],
    lines: [],
    canCheckout: false,
    quoteToken: null,
    issues: [],
    subtotal: 0,
    total: 0,
    quoteExpiresAt: null,
  });
  mocks.useCart.mockReturnValue({
    items: [],
    count: 0,
    lineCount: 0,
    subtotal: 0,
    quantityOf: vi.fn(() => 0),
    add: vi.fn(),
    updateQty: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
    setSnapshots: vi.fn(),
  });
  mocks.useAuth.mockReturnValue({
    user: null,
    loading: false,
    refreshing: false,
    authError: { kind: "unavailable", message: "Check your connection." },
    refresh: mocks.refresh,
  });
});

describe("customer pages use the shared auth-error state", () => {
  it.each([
    ["cart", () => <CartView />],
    ["checkout", () => <CheckoutView />],
    ["dashboard index", () => <DashboardIndexPage />],
  ])("%s shows a retry state instead of redirecting on a transient error", async (_name, renderPage) => {
    render(renderPage());

    expect(await screen.findByRole("alert")).toBeDefined();
    expect(screen.getByRole("button", { name: /retry/i })).toBeDefined();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("does not render protected content while the session check is unavailable", () => {
    render(<CartView />);

    expect(screen.queryByText("Your cart is empty")).toBeNull();
    expect(screen.queryByRole("button", { name: "Place order" })).toBeNull();
  });

  it("keeps rendering for a valid customer even with a transient auth error", async () => {
    mocks.useAuth.mockReturnValue({
      user: testUser,
      loading: false,
      refreshing: false,
      authError: { kind: "unavailable", message: "Check your connection." },
      refresh: mocks.refresh,
    });

    render(<CartView />);

    await waitFor(() =>
      expect(screen.getByText("Your cart is empty")).toBeDefined(),
    );
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});

const customerOnlyPages = {
  cart: () => <CartView />,
  checkout: () => <CheckoutView />,
} as const;

describe("customer-only page role enforcement", () => {
  it.each(["vendor", "admin"] as const)(
    "%s is redirected away from cart and checkout",
    async (role) => {
      mocks.useAuth.mockReturnValue({
        user: { ...testUser, role },
        loading: false,
        refreshing: false,
        authError: null,
        refresh: mocks.refresh,
      });

      for (const renderPage of Object.values(customerOnlyPages)) {
        mocks.replace.mockClear();
        render(renderPage());

        await waitFor(() =>
          expect(mocks.replace).toHaveBeenCalledWith(`/dashboard/${role}`),
        );
      }
    },
  );

  it.each(["cart", "checkout"] as const)(
    "a customer can access %s without a role redirect",
    async (page) => {
      mocks.useAuth.mockReturnValue({
        user: testUser,
        loading: false,
        refreshing: false,
        authError: null,
        refresh: mocks.refresh,
      });

      render(customerOnlyPages[page]());

      await waitFor(() =>
        expect(screen.queryByText("Checking your access…")).toBeNull(),
      );
      expect(mocks.replace).not.toHaveBeenCalled();
    },
  );
});
