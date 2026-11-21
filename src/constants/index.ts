import {
  CirclePlus,
  ClipboardCheck,
  CreditCard,
  Crown,
  Heart,
  LayoutDashboard,
  ReceiptText,
  Settings,
  ShoppingBag,
  UtensilsCrossed,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { MenuItemStatus, OrderStatus, UserRole } from "@/types";

export const APP_NAME = "PizzaHub";
export const APP_DESCRIPTION =
  "Order fresh pizza, manage your menu and track deliveries in one place.";

export const ROUTES = {
  home: "/",
  browseMenu: "/browse-menu",
  signIn: "/sign-in",
  signUp: "/sign-up",
  chooseRole: "/choose-role",
  menuItem: (id: string) => `/menu/${id}`,
  menuOrder: (id: string) => `/menu/${id}#order`,
  favorites: "/favorites",
  cart: "/cart",
  checkout: "/checkout",
  profileSettings: "/profile-settings",
  paymentSuccess: "/payment-success",
  paymentCancel: "/payment-cancel",
  dashboard: "/dashboard",
  dashboardVendor: "/dashboard/vendor",
  vendorMyMenuItems: "/dashboard/vendor/my-menu-items",
  vendorAddMenuItem: "/dashboard/vendor/add-menu-item",
  vendorEditMenuItem: (id: string) => `/dashboard/vendor/my-menu-items/${id}/edit`,
  vendorCustomerOrders: "/dashboard/vendor/customer-orders",
  vendorSubscription: "/dashboard/vendor/subscription",
  dashboardCustomer: "/dashboard/customer",
  customerMyOrders: "/dashboard/customer/my-orders",
  dashboardAdmin: "/dashboard/admin",
  adminManageUsers: "/dashboard/admin/manage-users",
  adminManageMenuItems: "/dashboard/admin/manage-menu-items",
  adminTransactions: "/dashboard/admin/transactions",
} as const;

/** The six categories fixed by the assignment brief. */
export const MENU_CATEGORIES = [
  "Classic Pizzas",
  "Vegetarian Pizzas",
  "Meat Lovers",
  "Specialty / Gourmet Pizzas",
  "Sides & Appetizers",
  "Beverages & Desserts",
] as const;

export const CATEGORY_IMAGES: Record<string, string> = {
  "Classic Pizzas": "/images/home/category-pizzas.jpg",
  "Vegetarian Pizzas": "/images/home/veggie.jpg",
  "Meat Lovers": "/images/home/pepperoni.jpg",
  "Specialty / Gourmet Pizzas": "/images/home/bbq-chicken.jpg",
  "Sides & Appetizers": "/images/home/category-sides.jpg",
  "Beverages & Desserts": "/images/home/category-desserts.jpg",
};

export const FALLBACK_FOOD_IMAGE = "/images/home/margherita.jpg";

/** Client cart constraints, mirrored by the quote/checkout API validation. */
export const CART_MAX_LINES = 20;
export const CART_MAX_QUANTITY = 20;
export const CART_STORAGE_PREFIX = "pizzahub:cart:v1:";

export const ORDER_STATUSES = [
  "pending",
  "accepted",
  "rejected",
  "cancelled",
] as const;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const MENU_STATUS_LABELS: Record<MenuItemStatus, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  inactive: "Inactive",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  customer: "Customer",
  vendor: "Vendor",
  admin: "Admin",
};

export const DASHBOARD_NAV: Record<
  UserRole,
  readonly { href: string; label: string; icon: LucideIcon }[]
> = {
  vendor: [
    {
      href: ROUTES.dashboardVendor,
      label: "Overview",
      icon: LayoutDashboard,
    },
    {
      href: ROUTES.vendorMyMenuItems,
      label: "My Menu Items",
      icon: UtensilsCrossed,
    },
    {
      href: ROUTES.vendorAddMenuItem,
      label: "Add Menu Item",
      icon: CirclePlus,
    },
    {
      href: ROUTES.vendorCustomerOrders,
      label: "Customer Orders",
      icon: ReceiptText,
    },
    {
      href: ROUTES.vendorSubscription,
      label: "Subscription",
      icon: Crown,
    },
  ],
  customer: [
    {
      href: ROUTES.dashboardCustomer,
      label: "Overview",
      icon: LayoutDashboard,
    },
    {
      href: ROUTES.customerMyOrders,
      label: "My Orders",
      icon: ShoppingBag,
    },
    {
      href: ROUTES.favorites,
      label: "Favourites",
      icon: Heart,
    },
    {
      href: ROUTES.profileSettings,
      label: "Profile Settings",
      icon: Settings,
    },
  ],
  admin: [
    {
      href: ROUTES.dashboardAdmin,
      label: "Overview",
      icon: LayoutDashboard,
    },
    {
      href: ROUTES.adminManageUsers,
      label: "Manage Users",
      icon: Users,
    },
    {
      href: ROUTES.adminManageMenuItems,
      label: "Manage Menu Items",
      icon: ClipboardCheck,
    },
    {
      href: ROUTES.adminTransactions,
      label: "Transactions",
      icon: CreditCard,
    },
  ],
};
