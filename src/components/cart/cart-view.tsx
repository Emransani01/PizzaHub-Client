"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Heart, Loader2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { CartLine } from "@/components/cart/cart-line";
import { CartSummary } from "@/components/cart/cart-summary";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PrivateRoute } from "@/components/shared/private-route";
import { Button, buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { errorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { useCart } from "@/providers/cart-provider";
import { quoteCart } from "@/services/orders";
import type { CartItem, CartQuoteResult } from "@/types";

function signatureOf(items: CartItem[]): string {
  return items
    .map((item) => `${item.itemId}:${item.quantity}:${item.unitPrice}`)
    .join("|");
}

const BLOCKING_CODES = new Set(["MISSING", "UNAVAILABLE", "OWN_ITEM"]);

function CartViewContent() {
  const { user, loading: authLoading } = useAuth();
  const { items, count, subtotal, updateQty, remove, clear, setSnapshots } =
    useCart();

  const [quote, setQuote] = useState<CartQuoteResult | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const lastRequest = useRef<string>("");

  const signature = useMemo(() => signatureOf(items), [items]);

  const loadQuote = useCallback(
    async (
      lines: CartItem[],
      options: {
        force?: boolean;
        /** Server-validated acknowledgement values for changed prices. */
        acknowledgements?: Record<string, number>;
        /** Prices previously shown to the customer, before acceptance. */
        expectedPrices?: Record<string, number>;
      } = {},
    ) => {
      if (!user || user.role !== "customer") return;
      const nextSignature = signatureOf(lines);
      if (!options.force && nextSignature === lastRequest.current) return;
      lastRequest.current = nextSignature;

      setQuoteLoading(true);
      setQuoteError(null);
      try {
        const result = await quoteCart({
          items: lines.map((line) => ({
            itemId: line.itemId,
            quantity: line.quantity,
            expectedUnitPrice:
              options.expectedPrices?.[line.itemId] ?? line.unitPrice,
            ...(options.acknowledgements?.[line.itemId] !== undefined
              ? { acknowledgedUnitPrice: options.acknowledgements[line.itemId] }
              : {}),
          })),
        });
        setQuote(result);
      } catch (cause) {
        setQuote(null);
        setQuoteError(errorMessage(cause));
      } finally {
        setQuoteLoading(false);
      }
    },
    [user],
  );

  useEffect(() => {
    if (authLoading || !user || user.role !== "customer") return;
    if (items.length === 0) {
      setQuote(null);
      setQuoteError(null);
      lastRequest.current = "";
      return;
    }
    void loadQuote(items);
  }, [authLoading, items, loadQuote, signature, user]);

  const issues = quote?.issues ?? [];
  const hasPriceChanges = issues.some((issue) => issue.code === "PRICE_CHANGED");
  const hasBlockingIssue = issues.some((issue) =>
    BLOCKING_CODES.has(issue.code),
  );
  const canProceed =
    items.length > 0 &&
    !quoteLoading &&
    !quoteError &&
    !accepting &&
    !hasPriceChanges &&
    !hasBlockingIssue &&
    Boolean(quote?.canCheckout && quote.quoteToken);

  function acceptNewPrices() {
    const acknowledgements: Record<string, number> = {};
    for (const issue of issues) {
      if (
        issue.code === "PRICE_CHANGED" &&
        typeof issue.currentUnitPrice === "number"
      ) {
        acknowledgements[issue.itemId] = issue.currentUnitPrice;
      }
    }
    const expectedPrices: Record<string, number> = {};
    for (const line of items) expectedPrices[line.itemId] = line.unitPrice;
    const updates = items.map((line) =>
      acknowledgements[line.itemId] !== undefined
        ? { ...line, unitPrice: acknowledgements[line.itemId] }
        : line,
    );
    setAccepting(true);
    setSnapshots({
      version: 1,
      items: updates,
      updatedAt: new Date().toISOString(),
    });
    // Quote the updated cart so the signature matches the stored prices, but
    // send the stale displayed prices plus explicit acknowledgements so the
    // server can verify acceptance and sign that proof into the token.
    void loadQuote(updates, {
      force: true,
      acknowledgements,
      expectedPrices,
    }).finally(() => setAccepting(false));
  }

  function confirmClear() {
    clear();
    setClearOpen(false);
    toast.success("Your cart has been cleared.");
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Your cart is empty"
        description="Browse the menu, add a few dishes and review them here before you check out. Favourites stay saved to your account."
      >
        <Link
          href={ROUTES.browseMenu}
          className={cn(buttonVariants({ variant: "brand", size: "cta-md" }))}
        >
          <ShoppingCart aria-hidden="true" className="size-4" />
          Browse Menu
        </Link>
        <Link
          href={ROUTES.favorites}
          className={cn(
            buttonVariants({ variant: "brandOutline", size: "cta-md" }),
          )}
        >
          <Heart aria-hidden="true" className="size-4" />
          View Favourites
        </Link>
      </EmptyState>
    );
  }

  return (
    <>
      {quoteLoading ? (
        <div
          role="status"
          className="mb-4 flex items-center gap-2 text-xs font-semibold text-brand-brown/55"
        >
          <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
          Checking the latest prices and availability…
        </div>
      ) : null}

      {quoteError ? (
        <div
          role="alert"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-red/30 bg-white px-4 py-3 text-sm text-brand-red"
        >
          <span className="font-semibold">{quoteError}</span>
          <Button
            type="button"
            variant="brandOutline"
            size="cta-sm"
            onClick={() => void loadQuote(items, { force: true })}
          >
            Retry
          </Button>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {items.map((item) => (
            <CartLine
              key={item.itemId}
              item={item}
              line={quote?.items.find((line) => line.itemId === item.itemId)}
              issue={issues.find((issue) => issue.itemId === item.itemId)}
              busy={quoteLoading || accepting}
              onQuantityChange={(quantity) => updateQty(item.itemId, quantity)}
              onRemove={() => remove(item.itemId)}
            />
          ))}
        </div>

        <CartSummary
          quote={quote}
          localSubtotal={subtotal}
          itemCount={count}
          loading={quoteLoading}
          accepting={accepting}
          canProceed={canProceed}
          onClear={() => setClearOpen(true)}
          onAcceptPrices={acceptNewPrices}
          onRemoveIssue={(itemId) => remove(itemId)}
        />
      </div>

      <ConfirmDialog
        open={clearOpen}
        title="Clear your cart?"
        description="Every item in your cart will be removed. This cannot be undone."
        confirmLabel="Clear cart"
        cancelLabel="Keep items"
        onConfirm={confirmClear}
        onCancel={() => setClearOpen(false)}
      />
    </>
  );
}

export function CartView() {
  return (
    <PrivateRoute roles={["customer"]}>
      <CartViewContent />
    </PrivateRoute>
  );
}
