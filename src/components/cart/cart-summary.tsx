"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, ShoppingBasket, Trash2 } from "lucide-react";
import { CartIssueBanner } from "@/components/cart/cart-issue-banner";
import { Button, buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { cn, formatCurrency } from "@/lib/utils";
import type { CartQuoteResult } from "@/types";

interface CartSummaryProps {
  quote: CartQuoteResult | null;
  localSubtotal: number;
  itemCount: number;
  loading?: boolean;
  accepting?: boolean;
  canProceed: boolean;
  onClear: () => void;
  onAcceptPrices?: () => void;
  onRemoveIssue?: (itemId: string) => void;
}

export function CartSummary({
  quote,
  localSubtotal,
  itemCount,
  loading = false,
  accepting = false,
  canProceed,
  onClear,
  onAcceptPrices,
  onRemoveIssue,
}: CartSummaryProps) {
  const router = useRouter();
  const subtotal = quote?.subtotal ?? localSubtotal;
  const total = quote?.total ?? localSubtotal;

  return (
    <aside className="lg:sticky lg:top-28 lg:self-start">
      <div className="rounded-[1.5rem] border border-brand-brown/10 bg-white p-5 shadow-[0_18px_45px_-40px_rgba(43,26,18,0.65)] sm:p-6">
        <h2 className="text-lg font-extrabold tracking-tight text-brand-brown">
          Order summary
        </h2>
        <p className="mt-1 text-xs text-brand-brown/55">
          Final prices are confirmed by the server before checkout.
        </p>

        <CartIssueBanner
          issues={quote?.issues ?? []}
          accepting={accepting}
          onAcceptPrices={onAcceptPrices}
          onRemove={onRemoveIssue}
        />

        <dl className="mt-5 space-y-3 border-t border-brand-brown/10 pt-5 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-brand-brown/60">Items</dt>
            <dd className="font-semibold text-brand-brown">{itemCount}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-brand-brown/60">Subtotal</dt>
            <dd className="font-semibold text-brand-brown">
              {formatCurrency(subtotal)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-brand-brown/60">Delivery fee</dt>
            <dd className="font-semibold text-brand-brown">{formatCurrency(0)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-brand-brown/60">Tax</dt>
            <dd className="font-semibold text-brand-brown">{formatCurrency(0)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-brand-brown/10 pt-3">
            <dt className="font-extrabold text-brand-brown">Total</dt>
            <dd className="text-lg font-extrabold text-brand-red">
              {formatCurrency(total)}
            </dd>
          </div>
        </dl>

        <div className="mt-5 space-y-2.5">
          <Button
            type="button"
            variant="brand"
            size="cta-md"
            disabled={!canProceed || loading}
            onClick={() => router.push(ROUTES.checkout)}
            className="w-full"
          >
            {loading ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <ArrowRight aria-hidden="true" className="size-4" />
            )}
            {loading ? "Checking prices…" : "Proceed to Checkout"}
          </Button>
          <Link
            href={ROUTES.browseMenu}
            className={cn(
              buttonVariants({ variant: "brandOutline", size: "cta-md" }),
              "w-full",
            )}
          >
            <ShoppingBasket aria-hidden="true" className="size-4" />
            Continue Shopping
          </Link>
          <button
            type="button"
            onClick={onClear}
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-brand-brown/55 transition-colors hover:text-brand-red disabled:opacity-50"
          >
            <Trash2 aria-hidden="true" className="size-3.5" />
            Clear cart
          </button>
        </div>
      </div>
    </aside>
  );
}
