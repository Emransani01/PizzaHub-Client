"use client";

import Link from "next/link";
import { Ban, ShoppingBag } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { safeNextPath } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import type { MenuItem } from "@/types";

interface OrderButtonProps {
  item: MenuItem;
  className?: string;
}

/**
 * Role-aware entry point to the existing menu-detail order form. This never
 * creates an order itself; it only links to the detail page's `#order` section.
 */
export function OrderButton({ item, className }: OrderButtonProps) {
  const { user, loading } = useAuth();

  // Public listings are already filtered, but stay defensive so an
  // unavailable or unapproved item can never expose an order action.
  if (item.status !== "approved" || !item.isAvailable) return null;

  const orderHref = ROUTES.menuOrder(item.id);

  if (loading) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex h-10 animate-pulse items-center justify-center rounded-full bg-brand-brown/10",
          className,
        )}
      />
    );
  }

  if (user?.role === "vendor" || user?.role === "admin") {
    const explanation =
      user.role === "vendor"
        ? "Vendor accounts manage menu items and cannot place customer orders."
        : "Admin accounts moderate PizzaHub and cannot place customer orders.";

    return (
      <button
        type="button"
        disabled
        title={explanation}
        aria-label={explanation}
        className={cn(
          buttonVariants({ variant: "brandOutline", size: "cta-sm" }),
          "cursor-not-allowed opacity-50",
          className,
        )}
      >
        <Ban aria-hidden="true" className="size-3.5" />
        {user.role === "vendor" ? "Vendors can't order" : "Admins can't order"}
      </button>
    );
  }

  const href = user
    ? orderHref
    : `${ROUTES.signIn}?next=${encodeURIComponent(
        safeNextPath(orderHref, ROUTES.menuItem(item.id)),
      )}`;

  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: "brand", size: "cta-sm" }),
        className,
      )}
    >
      <ShoppingBag aria-hidden="true" className="size-3.5" />
      Order
    </Link>
  );
}
