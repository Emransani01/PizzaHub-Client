"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, Loader2, Lock, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { CartIssueBanner } from "@/components/cart/cart-issue-banner";
import { EmptyState } from "@/components/shared/empty-state";
import { PrivateRoute } from "@/components/shared/private-route";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  inputClass,
  labelClass,
  textareaClass,
} from "@/components/ui/form-field";
import { ROUTES } from "@/constants";
import { errorMessage, isApiError } from "@/lib/api";
import { cn, formatCurrency, todayIso } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { useCart } from "@/providers/cart-provider";
import { checkoutCart, quoteCart } from "@/services/orders";
import type { CartItem, CartQuoteResult, CheckoutResult } from "@/types";

const BLOCKING_CODES = new Set(["MISSING", "UNAVAILABLE", "OWN_ITEM"]);

function groupStorageKey(userId: string): string {
  return `pizzahub:checkout-group:v1:${userId}`;
}

function formatUuid(bytes: Uint8Array): string {
  // RFC 4122 version 4, variant 10xx. The server validates UUIDs, so even the
  // non-secure fallback must produce a value it will accept.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function newGroupId(): string {
  if (typeof crypto !== "undefined") {
    if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
    if (typeof crypto.getRandomValues === "function") {
      return formatUuid(crypto.getRandomValues(new Uint8Array(16)));
    }
  }
  const bytes = new Uint8Array(16);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Math.floor(Math.random() * 256);
  }
  return formatUuid(bytes);
}

function readGroupId(userId: string): string | null {
  try {
    return window.sessionStorage.getItem(groupStorageKey(userId));
  } catch {
    return null;
  }
}

function storeGroupId(userId: string, id: string): void {
  try {
    window.sessionStorage.setItem(groupStorageKey(userId), id);
  } catch {
    // A blocked sessionStorage still allows a one-shot checkout in memory.
  }
}

function forgetGroupId(userId: string): void {
  try {
    window.sessionStorage.removeItem(groupStorageKey(userId));
  } catch {
    // Ignore storage failures; the in-memory id is cleared by the caller.
  }
}

function signatureOf(items: CartItem[]): string {
  return items
    .map((item) => `${item.itemId}:${item.quantity}:${item.unitPrice}`)
    .join("|");
}

function CheckoutViewContent() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { items, count, subtotal, clear, setSnapshots } = useCart();

  const [groupId, setGroupId] = useState<string | null>(null);
  const [quote, setQuote] = useState<CartQuoteResult | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<CheckoutResult | null>(null);
  const submittingRef = useRef(false);
  const lastRequest = useRef<string>("");
  // Avoid re-requesting a quote repeatedly for the same cart/error pair.
  const lastQuoteRecovery = useRef<string>("");

  const signature = useMemo(() => signatureOf(items), [items]);
  const isCustomer = Boolean(user && user.role === "customer");

  useEffect(() => {
    if (authLoading || !isCustomer || !user) return;
    const existing = readGroupId(user.id);
    if (existing) {
      setGroupId(existing);
      return;
    }
    const created = newGroupId();
    storeGroupId(user.id, created);
    setGroupId(created);
  }, [authLoading, isCustomer, user]);

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
      if (!isCustomer) return;
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
        lastQuoteRecovery.current = "";
      } catch (cause) {
        setQuote(null);
        setQuoteError(errorMessage(cause));
      } finally {
        setQuoteLoading(false);
      }
    },
    [isCustomer],
  );

  useEffect(() => {
    if (authLoading || !isCustomer || success) return;
    if (items.length === 0) {
      setQuote(null);
      setQuoteError(null);
      lastRequest.current = "";
      return;
    }
    void loadQuote(items);
  }, [authLoading, isCustomer, items, loadQuote, signature, success]);

  const issues = quote?.issues ?? [];
  const hasPriceChanges = issues.some((issue) => issue.code === "PRICE_CHANGED");
  const hasBlockingIssue = issues.some((issue) =>
    BLOCKING_CODES.has(issue.code),
  );
  const canSubmit =
    Boolean(groupId) &&
    Boolean(quote?.quoteToken) &&
    Boolean(quote?.canCheckout) &&
    !hasPriceChanges &&
    !hasBlockingIssue &&
    !quoteLoading &&
    !quoteError &&
    !submitting &&
    !accepting;

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
    // Quote the updated cart so the signature matches the stored prices, while
    // sending the stale displayed prices plus acknowledgements so the server
    // can verify acceptance and sign that proof into the replacement token.
    void loadQuote(updates, {
      force: true,
      acknowledgements,
      expectedPrices,
    }).finally(() => setAccepting(false));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // A synchronous ref guard closes the double-click window before React
    // has committed the disabled state to the DOM.
    if (submittingRef.current) return;
    setFormError(null);

    if (!deliveryDate) {
      setFormError("Choose a delivery date.");
      return;
    }
    if (deliveryAddress.trim().length < 10) {
      setFormError("Enter a full delivery address (at least 10 characters).");
      return;
    }
    if (!groupId || !quote?.quoteToken || !quote.canCheckout) {
      setFormError("We are still confirming prices. Please try again in a moment.");
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const result = await checkoutCart({
        checkoutGroupId: groupId,
        items: items.map((line) => ({
          itemId: line.itemId,
          quantity: line.quantity,
        })),
        quoteToken: quote.quoteToken,
        deliveryDate,
        deliveryAddress: deliveryAddress.trim(),
        message: message.trim() || undefined,
      });

      setSuccess(result);
      // Only a confirmed response may destroy the client cart and the id that
      // made checkout replay-safe.
      clear();
      if (user) forgetGroupId(user.id);
      toast.success(
        result.replayed
          ? "These orders were already placed."
          : "Orders sent to the vendors.",
      );

      const params = new URLSearchParams({ group: result.checkoutGroupId });
      if (result.orders[0]?.id) params.set("highlight", result.orders[0].id);
      router.push(`${ROUTES.customerMyOrders}?${params.toString()}`);
    } catch (cause) {
      const text = errorMessage(cause);
      setFormError(text);
      toast.error(text);

      const definitive =
        isApiError(cause) &&
        (cause.code === "CHECKOUT_GROUP_CONFLICT" ||
          cause.code === "ACTIVE_ORDER_EXISTS" ||
          cause.code === "CHECKOUT_GROUP_INVALID" ||
          cause.code === "INVALID_CHECKOUT_GROUP" ||
          cause.status === 403);
      if (definitive && user) {
        // The old id can no longer be used, so start a fresh one for the next
        // attempt instead of replaying a mismatched request.
        forgetGroupId(user.id);
        const replacement = newGroupId();
        storeGroupId(user.id, replacement);
        setGroupId(replacement);
      }

      // A rejected quote means prices or availability moved again. Refresh so
      // the acknowledgement gate reappears (or a new token replaces an expired
      // one), keeping the same checkout group for the retry. The recovery key
      // prevents an endless refresh loop for an unchanged cart/error pair.
      if (
        isApiError(cause) &&
        (cause.code === "PRICE_CHANGED" ||
          cause.code === "QUOTE_INVALID" ||
          cause.code === "QUOTE_EXPIRED" ||
          cause.code === "ITEM_MISSING" ||
          cause.code === "ITEM_UNAVAILABLE")
      ) {
        const recoveryKey = `${signature}:${cause.code}`;
        if (lastQuoteRecovery.current !== recoveryKey) {
          lastQuoteRecovery.current = recoveryKey;
          void loadQuote(items, { force: true });
        }
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div
        role="status"
        className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-6 py-12 text-center"
      >
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-600 text-white">
          <ShoppingCart aria-hidden="true" className="size-6" />
        </span>
        <h2 className="mt-4 text-xl font-extrabold text-emerald-900">
          {success.replayed ? "Orders already placed" : "Orders on their way"}
        </h2>
        <p className="mt-2 text-sm text-emerald-800">
          Taking you to your orders…
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Nothing to check out"
        description="Your cart is empty. Add a few dishes from the menu, then come back here to place them in one step."
      >
        <Link
          href={ROUTES.browseMenu}
          className={cn(buttonVariants({ variant: "brand", size: "cta-md" }))}
        >
          Browse Menu
        </Link>
      </EmptyState>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <form
        onSubmit={(event) => void onSubmit(event)}
        className="space-y-5 rounded-[1.5rem] border border-brand-brown/10 bg-white p-5 shadow-[0_18px_45px_-40px_rgba(43,26,18,0.65)] sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-brand-brown">
              Delivery details
            </h2>
            <p className="mt-1 text-xs text-brand-brown/55">
              These details are attached to every order in this checkout.
            </p>
          </div>
          <Link
            href={ROUTES.cart}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-red hover:underline"
          >
            <ArrowLeft aria-hidden="true" className="size-3.5" />
            Back to cart
          </Link>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="checkout-date" className={labelClass}>
              Delivery date
            </label>
            <div className="relative">
              <CalendarDays
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-brand-brown/40"
              />
              <input
                id="checkout-date"
                type="date"
                required
                min={todayIso()}
                value={deliveryDate}
                onChange={(event) => setDeliveryDate(event.target.value)}
                className={cn(inputClass, "pl-10")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="checkout-address" className={labelClass}>
              Delivery address
            </label>
            <textarea
              id="checkout-address"
              required
              rows={3}
              minLength={10}
              maxLength={400}
              value={deliveryAddress}
              onChange={(event) => setDeliveryAddress(event.target.value)}
              placeholder="Street, apartment, city and postcode"
              className={textareaClass}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="checkout-message" className={labelClass}>
              Note for the kitchen <span className="font-medium">(optional)</span>
            </label>
            <textarea
              id="checkout-message"
              rows={2}
              maxLength={600}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Allergies, gate code, delivery instructions"
              className={textareaClass}
            />
          </div>
        </div>

        <div className="border-t border-brand-brown/10 pt-4">
          <h3 className="text-xs font-bold uppercase tracking-wide text-brand-brown/50">
            Items in this checkout
          </h3>
          <ul className="mt-3 divide-y divide-brand-brown/10">
            {items.map((item) => {
              const line = quote?.items.find(
                (entry) => entry.itemId === item.itemId,
              );
              const unitPrice = line?.unitPrice ?? item.unitPrice;
              const lineTotal = line?.lineTotal ?? unitPrice * item.quantity;
              return (
                <li
                  key={item.itemId}
                  className="flex items-center justify-between gap-3 py-2 text-sm"
                >
                  <span className="min-w-0 truncate text-brand-brown">
                    <span className="font-bold">{item.itemName}</span>
                    <span className="text-brand-brown/55">
                      {" "}
                      × {item.quantity}
                    </span>
                    <span className="block truncate text-xs text-brand-brown/45">
                      {item.vendorName}
                    </span>
                  </span>
                  <span className="shrink-0 font-bold text-brand-brown">
                    {formatCurrency(lineTotal)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {formError ? (
          <p
            role="alert"
            className="rounded-xl border border-brand-red/30 bg-brand-red/5 px-3 py-2 text-sm font-medium text-brand-red"
          >
            {formError}
          </p>
        ) : null}

        <Button
          type="submit"
          variant="brand"
          size="cta-md"
          disabled={!canSubmit}
          aria-busy={submitting}
          className="w-full"
        >
          {submitting ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Lock aria-hidden="true" className="size-4" />
          )}
          {submitting ? "Placing order…" : "Place order"}
        </Button>
        <p className="text-center text-[11px] text-brand-brown/45">
          No online payment. Each cart line becomes its own order for the
          vendor to accept or reject.
        </p>
      </form>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-[1.5rem] border border-brand-brown/10 bg-white p-5 shadow-[0_18px_45px_-40px_rgba(43,26,18,0.65)] sm:p-6">
          <h2 className="text-lg font-extrabold tracking-tight text-brand-brown">
            Final summary
          </h2>

          <CartIssueBanner
            issues={issues}
            accepting={accepting}
            onAcceptPrices={acceptNewPrices}
          />

          {quoteLoading ? (
            <div
              role="status"
              className="mt-4 flex items-center gap-2 text-xs font-semibold text-brand-brown/55"
            >
              <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
              Confirming prices…
            </div>
          ) : null}

          {quoteError ? (
            <div className="mt-4 rounded-xl border border-brand-red/30 bg-brand-red/5 px-3 py-2 text-sm font-medium text-brand-red">
              {quoteError}
              <button
                type="button"
                onClick={() => void loadQuote(items, { force: true })}
                className="ml-2 font-bold underline"
              >
                Retry
              </button>
            </div>
          ) : null}

          <dl className="mt-5 space-y-3 border-t border-brand-brown/10 pt-5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-brand-brown/60">Items</dt>
              <dd className="font-semibold text-brand-brown">{count}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-brand-brown/60">Subtotal</dt>
              <dd className="font-semibold text-brand-brown">
                {formatCurrency(quote?.subtotal ?? subtotal)}
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
                {formatCurrency(quote?.total ?? subtotal)}
              </dd>
            </div>
          </dl>

          {groupId ? (
            <p className="mt-5 rounded-xl bg-cream/70 px-3 py-2 text-[11px] leading-5 text-brand-brown/50">
              Checkout reference: <span className="font-bold">{groupId}</span>.
              Retrying a failed submission reuses this reference so an order
              is never created twice.
            </p>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

export function CheckoutView() {
  return (
    <PrivateRoute roles={["customer"]}>
      <CheckoutViewContent />
    </PrivateRoute>
  );
}
