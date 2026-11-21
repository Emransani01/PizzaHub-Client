"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { CartQuoteIssue } from "@/types";

interface CartIssueBannerProps {
  issues: CartQuoteIssue[];
  accepting?: boolean;
  onAcceptPrices?: () => void;
  onRemove?: (itemId: string) => void;
}

function issueLabel(issue: CartQuoteIssue): string {
  if (
    issue.code === "PRICE_CHANGED" &&
    typeof issue.currentUnitPrice === "number"
  ) {
    const from =
      typeof issue.expectedUnitPrice === "number"
        ? `${formatCurrency(issue.expectedUnitPrice)} → `
        : "";
    return `${issue.message}${from ? ` (${from}` : ""}${formatCurrency(issue.currentUnitPrice)}${from ? ")" : ""}`;
  }
  return issue.message;
}

export function CartIssueBanner({
  issues,
  accepting = false,
  onAcceptPrices,
  onRemove,
}: CartIssueBannerProps) {
  if (issues.length === 0) return null;

  const priceIssues = issues.filter((issue) => issue.code === "PRICE_CHANGED");
  const blockingIssues = issues.filter(
    (issue) => issue.code !== "PRICE_CHANGED",
  );

  return (
    <div
      role="alert"
      aria-live="polite"
      className="space-y-4 rounded-2xl border border-brand-gold/50 bg-brand-gold/10 p-4 sm:p-5"
    >
      <div className="flex gap-3">
        <AlertTriangle
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-brand-brown"
        />
        <div className="min-w-0">
          <h2 className="text-sm font-extrabold text-brand-brown">
            Review your cart before checkout
          </h2>
          <p className="mt-1 text-xs leading-5 text-brand-brown/65">
            We check prices and availability again before every order.
          </p>
        </div>
      </div>

      {priceIssues.length > 0 ? (
        <div className="rounded-xl border border-brand-gold/40 bg-white/70 p-3">
          <h3 className="text-xs font-bold uppercase tracking-wide text-brand-brown/60">
            Prices changed
          </h3>
          <ul className="mt-2 space-y-1.5">
            {priceIssues.map((issue, index) => (
              <li
                key={`${issue.itemId}-price-${index}`}
                className="text-sm leading-6 text-brand-brown"
              >
                {issueLabel(issue)}
              </li>
            ))}
          </ul>
          {onAcceptPrices ? (
            <Button
              type="button"
              variant="brand"
              size="cta-sm"
              onClick={onAcceptPrices}
              disabled={accepting}
              className="mt-3"
            >
              {accepting ? (
                <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
              ) : null}
              {accepting ? "Checking prices…" : "Review and accept new prices"}
            </Button>
          ) : null}
        </div>
      ) : null}

      {blockingIssues.length > 0 ? (
        <div className="rounded-xl border border-brand-red/30 bg-white/70 p-3">
          <h3 className="text-xs font-bold uppercase tracking-wide text-brand-red">
            These items are blocking checkout
          </h3>
          <ul className="mt-2 space-y-2">
            {blockingIssues.map((issue, index) => (
              <li
                key={`${issue.itemId}-${issue.code}-${index}`}
                className="flex flex-wrap items-center justify-between gap-2 text-sm text-brand-brown"
              >
                <span className="leading-5">{issue.message}</span>
                {onRemove ? (
                  <button
                    type="button"
                    onClick={() => onRemove(issue.itemId)}
                    className="rounded-full border border-brand-red/30 px-3 py-1 text-xs font-bold text-brand-red transition-colors hover:bg-brand-red hover:text-white"
                  >
                    Remove item
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
