"use client";

import Link from "next/link";
import { Ban, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { AuthStateNotice } from "@/components/shared/auth-state-notice";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { cartItemFromMenuItem } from "@/lib/cart-storage";
import { safeNextPath } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { useCart } from "@/providers/cart-provider";
import type { MenuItem } from "@/types";

interface AddToCartButtonProps {
  item: MenuItem;
  quantity?: number;
  className?: string;
  /** Compact circular control used beside the existing Order button. */
  iconOnly?: boolean;
}

/**
 * Cart entry point for menu listings and the dish detail page. It never places
 * an order directly: guests are sent to sign-in, vendors/admins are blocked,
 * and customers store the line locally with the price captured at add time.
 */
export function AddToCartButton({
  item,
  quantity = 1,
  className,
  iconOnly = false,
}: AddToCartButtonProps) {
  const { user, loading, authError, refreshing, refresh } = useAuth();
  const { add, quantityOf } = useCart();

  // Public listings are already filtered, but stay defensive so an
  // unavailable or unapproved dish never exposes a cart action.
  if (item.status !== "approved" || !item.isAvailable) return null;

  const amount = Math.max(1, Math.trunc(quantity));
  const inCart = quantityOf(item.id);

  if (loading) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          iconOnly
            ? "inline-flex size-10 shrink-0 animate-pulse items-center justify-center rounded-full bg-brand-brown/10"
            : "inline-flex h-10 animate-pulse items-center justify-center rounded-full bg-brand-brown/10",
          className,
        )}
      />
    );
  }

  if (!user && authError) {
    return (
      <AuthStateNotice
        error={authError}
        refreshing={refreshing}
        onRetry={() => void refresh()}
      />
    );
  }

  if (user?.role === "vendor" || user?.role === "admin") {
    const explanation =
      user.role === "vendor"
        ? "Vendor accounts manage menu items and cannot add customer orders."
        : "Admin accounts moderate PizzaHub and cannot add customer orders.";

    return (
      <button
        type="button"
        disabled
        title={explanation}
        aria-label={explanation}
        className={cn(
          iconOnly
            ? "inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-brand-brown/20 text-brand-brown"
            : buttonVariants({ variant: "brandOutline", size: "cta-sm" }),
          "cursor-not-allowed opacity-50",
          className,
        )}
      >
        <Ban aria-hidden="true" className="size-4" />
        {iconOnly ? null : user.role === "vendor" ? "Vendors can't order" : "Admins can't order"}
      </button>
    );
  }

  if (!user) {
    const next = safeNextPath(ROUTES.menuOrder(item.id), ROUTES.browseMenu);
    return (
      <Link
        href={`${ROUTES.signIn}?next=${encodeURIComponent(next)}`}
        aria-label={iconOnly ? `Sign in to add ${item.itemName} to cart` : undefined}
        className={cn(
          iconOnly
            ? "inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-red text-white transition-all hover:-translate-y-0.5 hover:bg-brand-red-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red"
            : buttonVariants({ variant: "brand", size: "cta-sm" }),
          className,
        )}
      >
        <ShoppingCart aria-hidden="true" className="size-4" />
        {iconOnly ? null : "Sign in to add"}
      </Link>
    );
  }

  function onAdd() {
    const added = add(cartItemFromMenuItem(item, amount), amount);
    if (!added) {
      toast.error("Your cart is full. Remove an item before adding another.");
      return;
    }
    toast.success(
      amount === 1
        ? `${item.itemName} added to cart.`
        : `${amount} × ${item.itemName} added to cart.`,
    );
  }

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={onAdd}
        aria-label={`Add ${item.itemName} to cart`}
        title={`Add ${item.itemName} to cart`}
        className={cn(
          "inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-red text-white transition-all hover:-translate-y-0.5 hover:bg-brand-red-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red",
          className,
        )}
      >
        <ShoppingCart aria-hidden="true" className="size-4" />
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <button
        type="button"
        onClick={onAdd}
        className={cn(
          buttonVariants({ variant: "brand", size: "cta-sm" }),
          className,
        )}
      >
        <ShoppingCart aria-hidden="true" className="size-3.5" />
        Add to cart
      </button>
      {inCart > 0 ? (
        <p className="text-[11px] font-semibold text-brand-brown/55">
          In cart · {inCart}
          <span aria-hidden="true"> · </span>
          <Link href={ROUTES.cart} className="font-bold text-brand-red hover:underline">
            View cart
          </Link>
        </p>
      ) : null}
    </div>
  );
}
