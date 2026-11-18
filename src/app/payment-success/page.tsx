"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Loader2,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { ROUTES } from "@/constants";
import { errorMessage } from "@/lib/api";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";
import { getCheckoutStatus } from "@/services/subscriptions";
import type { CheckoutStatus } from "@/types";

const POLL_MS = 3000;
const MAX_ATTEMPTS = 20;

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [checkout, setCheckout] = useState<CheckoutStatus | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(sessionId));

  const isSettled =
    checkout?.status === "paid" ||
    checkout?.status === "failed" ||
    checkout?.status === "cancelled" ||
    checkout?.status === "expired";

  const poll = useCallback(async () => {
    if (!sessionId) return;
    try {
      const result = await getCheckoutStatus(sessionId);
      setCheckout(result);
      setError(null);
      setAttempts((value) => value + 1);
    } catch (cause) {
      setError(errorMessage(cause));
      setAttempts((value) => value + 1);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    void poll();
  }, [poll, sessionId]);

  useEffect(() => {
    if (!sessionId || isSettled || attempts >= MAX_ATTEMPTS) return;
    const timer = window.setTimeout(() => void poll(), POLL_MS);
    return () => window.clearTimeout(timer);
  }, [attempts, isSettled, poll, sessionId]);

  const waiting = Boolean(
    sessionId && !isSettled && attempts < MAX_ATTEMPTS && !error,
  );

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-lg rounded-[1.75rem] border border-brand-brown/10 bg-white p-7 text-center shadow-[0_28px_60px_-44px_rgba(43,26,18,0.6)] sm:p-9">
          {!sessionId ? (
            <>
              <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
                <ShieldAlert aria-hidden="true" className="size-7" />
              </span>
              <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-brand-brown">
                No checkout session
              </h1>
              <p className="mt-2 text-sm leading-6 text-brand-brown/60">
                This page is opened after a Stripe checkout. Start the upgrade
                from your subscription page.
              </p>
              <Link
                href={ROUTES.vendorSubscription}
                className="mt-6 inline-flex rounded-full bg-brand-red px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-red-dark"
              >
                Go to subscription
              </Link>
            </>
          ) : waiting || loading ? (
            <>
              <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-gold/20 text-brand-brown">
                <Loader2 aria-hidden="true" className="size-7 animate-spin" />
              </span>
              <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-brand-brown">
                Confirming your payment
              </h1>
              <p className="mt-2 text-sm leading-6 text-brand-brown/60">
                Premium is activated by Stripe&apos;s verified webhook, not by this
                page. We are checking the payment record now — this can take a few
                seconds.
              </p>
              <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-cream px-3 py-1.5 text-xs font-semibold text-brand-brown/55">
                <Clock aria-hidden="true" className="size-3.5" />
                Attempt {Math.min(attempts + 1, MAX_ATTEMPTS)} of {MAX_ATTEMPTS}
              </p>
            </>
          ) : checkout?.status === "paid" ? (
            <>
              <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 aria-hidden="true" className="size-7" />
              </span>
              <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-brand-brown">
                Payment received
              </h1>
              <p className="mt-2 text-sm leading-6 text-brand-brown/60">
                Stripe confirmed your Premium subscription. Your account has been
                upgraded on the server and you can now publish unlimited menu
                items.
              </p>
              <dl className="mt-5 space-y-2 rounded-2xl bg-cream/70 p-4 text-left text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-brand-brown/55">Amount</dt>
                  <dd className="font-bold text-brand-brown">
                    {formatCurrency(checkout.amount, checkout.currency)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-brand-brown/55">Plan</dt>
                  <dd className="font-bold capitalize text-brand-brown">
                    {checkout.plan}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-brand-brown/55">Paid</dt>
                  <dd className="font-bold text-brand-brown">
                    {formatDateTime(checkout.paidAt)}
                  </dd>
                </div>
              </dl>
              <Link
                href={ROUTES.vendorSubscription}
                className="mt-6 inline-flex rounded-full bg-brand-red px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-red-dark"
              >
                View subscription
              </Link>
            </>
          ) : (
            <>
              <span
                className={cn(
                  "mx-auto flex size-14 items-center justify-center rounded-full",
                  checkout?.status === "pending"
                    ? "bg-brand-gold/20 text-brand-brown"
                    : "bg-brand-red/10 text-brand-red",
                )}
              >
                {checkout?.status === "pending" ? (
                  <Clock aria-hidden="true" className="size-7" />
                ) : (
                  <XCircle aria-hidden="true" className="size-7" />
                )}
              </span>
              <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-brand-brown">
                {checkout?.status === "pending"
                  ? "Still waiting for Stripe"
                  : "Payment not confirmed"}
              </h1>
              <p className="mt-2 text-sm leading-6 text-brand-brown/60">
                {error
                  ? error
                  : checkout?.status === "pending"
                    ? "The webhook has not reached the server yet. Refresh in a moment or check your subscription page — Premium is not granted from this screen."
                    : `The latest status is "${checkout?.status ?? "unknown"}". No Premium access was granted. You can retry the upgrade safely.`}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAttempts(0);
                    setLoading(true);
                    void poll();
                  }}
                  className="inline-flex rounded-full border border-brand-brown/20 bg-white px-5 py-2.5 text-sm font-bold text-brand-brown transition-colors hover:border-brand-red hover:text-brand-red"
                >
                  Check again
                </button>
                <Link
                  href={ROUTES.vendorSubscription}
                  className="inline-flex rounded-full bg-brand-red px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-red-dark"
                >
                  Subscription page
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-cream">
          <p className="text-sm font-semibold text-brand-brown/60">
            Checking your payment…
          </p>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
