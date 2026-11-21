import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useCart: vi.fn(),
  add: vi.fn(),
  quantityOf: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/providers/auth-provider", () => ({
  useAuth: mocks.useAuth,
  roleHome: () => "/dashboard/customer",
}));

vi.mock("@/providers/cart-provider", () => ({ useCart: mocks.useCart }));

vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/browse-menu",
}));

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} />,
}));

import { AddToCartButton } from "@/components/menu/add-to-cart-button";
import { MenuCard } from "@/components/menu/menu-card";
import type { MenuItem, UserProfile } from "@/types";
import { testUser } from "./helpers";

const item: MenuItem = {
  id: "item-a",
  vendorId: "vendor-1",
  vendorName: "Vendor One",
  vendorBusinessName: null,
  isPremiumVendor: false,
  itemName: "Margherita Pizza",
  category: "Classic Pizzas",
  description: "Tomato sauce and mozzarella.",
  price: 12.5,
  location: "Naples, FL",
  images: ["https://images.pizzahub.test/item.jpg"],
  status: "approved",
  isAvailable: true,
  rejectionReason: null,
  createdAt: null,
  updatedAt: null,
};

beforeEach(() => {
  mocks.useAuth.mockReturnValue({
    user: testUser,
    loading: false,
    favoriteIds: [],
    toggleFavorite: vi.fn(),
  });
  mocks.add.mockReset();
  mocks.add.mockReturnValue(true);
  mocks.quantityOf.mockReset();
  mocks.quantityOf.mockReturnValue(0);
  mocks.useCart.mockReturnValue({
    items: [],
    count: 0,
    lineCount: 0,
    subtotal: 0,
    quantityOf: mocks.quantityOf,
    add: mocks.add,
    updateQty: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
    setSnapshots: vi.fn(),
  });
  mocks.toastSuccess.mockClear();
  mocks.toastError.mockClear();
});

describe("Order Now and cart icon buttons", () => {
  it("keeps Order Now as a separate link to the detail order workflow", () => {
    render(<MenuCard item={item} />);

    const order = screen.getByRole("link", { name: /order/i });
    expect(order.getAttribute("href")).toBe("/menu/item-a#order");
    expect(screen.queryByRole("button", { name: /add margherita/i })).toBeNull();
  });

  it("adds the item to the existing customer cart from the icon button", () => {
    render(<AddToCartButton item={item} iconOnly />);

    const cart = screen.getByRole("button", {
      name: "Add Margherita Pizza to cart",
    });
    fireEvent.click(cart);

    expect(mocks.add).toHaveBeenCalledWith(
      expect.objectContaining({
        itemId: "item-a",
        itemName: "Margherita Pizza",
        unitPrice: 12.5,
        quantity: 1,
      }),
      1,
    );
    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      "Margherita Pizza added to cart.",
    );
    expect(mocks.toastError).not.toHaveBeenCalled();
  });

  it("sends guests to sign in instead of adding to a cart", () => {
    mocks.useAuth.mockReturnValue({
      user: null,
      loading: false,
      favoriteIds: [],
      toggleFavorite: vi.fn(),
    });

    render(<AddToCartButton item={item} iconOnly />);

    const signIn = screen.getByRole("link", {
      name: "Sign in to add Margherita Pizza to cart",
    });
    expect(signIn.getAttribute("href")).toContain("/sign-in?next=");
    fireEvent.click(signIn);
    expect(mocks.add).not.toHaveBeenCalled();
  });

  it("blocks vendor and admin accounts from the customer cart", () => {
    const vendor: UserProfile = { ...testUser, role: "vendor" };
    mocks.useAuth.mockReturnValue({
      user: vendor,
      loading: false,
      favoriteIds: [],
      toggleFavorite: vi.fn(),
    });

    render(<AddToCartButton item={item} iconOnly />);

    const button = screen.getByRole("button", {
      name: /cannot add customer orders/i,
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(mocks.add).not.toHaveBeenCalled();
  });
});
