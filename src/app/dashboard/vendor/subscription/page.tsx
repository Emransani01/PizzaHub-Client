"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, CreditCard, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { errorMessage } from "@/lib/api";
import { cn, formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { createCheckoutSession, getSubscriptionStatus } from "@/services/subscriptions";
import { listMyTransactions } from "@/services/transactions";
import type { SubscriptionStatus, Transaction } from "@/types";

const FREE_FEATURES = [
  "Up to 3 approved and available menu items",
  "Unlimited pending and rejected drafts",
  "Accept or reject customer orders",
];

const PREMIUM_FEATURES = [
  "Unlimited approved menu items",
  "Everything in the free plan",
  "Priority placement on the homepage",
  "Billed securely through Stripe",
];

export default function VendorSubscriptionPage() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [subscription, history] = await Promise.all([
        getSubscriptionStatus(),
        listMyTransactions({ limit: 10 }),
      ]);
      setStatus(subscription);
      setTransactions(history.items);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function upgrade() {
    setStarting(true);
    try {
      const session = await createCheckoutSession();
      // Premium is only granted by the verified Stripe webhook. Redirecting here
      // simply hands the vendor to Stripe's hosted checkout.
      window.location.assign(session.url);
    } catch (cause) {
      toast.error(errorMessage(cause));
      setStarting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription"
        description="Vendor Premium is the only paid feature on PizzaHub. Customer orders never require payment."
      />

      {loading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-brand-brown/10 bg-white px-5 py-8 text-sm font-semibold text-brand-brown/60">
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          Loading your plan…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-brand-red/30 bg-white px-5 py-8">
          <p className="text-sm font-semibold text-brand-red">{error}</p>
        </div>
      ) : status ? (
        <>
          <div
            className={cn(
              "rounded-2xl border p-5",
              status.premiumActive
                ? "border-emerald-200 bg-emerald-50"
                : "border-brand-brown/10 bg-white",
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex size-11 items-center justify-center rounded-2xl",
                    status.premiumActive
                      ? "bg-emerald-600 text-white"
                      : "bg-brand-gold/20 text-brand-brown",
                  )}
                >
                  {status.premiumActive ? (
                    <CheckCircle2 aria-hidden="true" className="size-5" />
                  ) : (
                    <Sparkles aria-hidden="true" className="size-5" />
                  )}
                </span>
                <div>
                  <p className="text-sm font-extrabold text-brand-brown">
                    {status.premiumActive ? "Premium plan" : "Free plan"}
                  </p>
                  <p className="text-xs text-brand-brown/55">
                    {status.premiumActive
                      ? `Active until ${formatDate(status.expiresAt)}`
                      : `You can keep ${status.freePlanActiveItemLimit} approved and available items live.`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-brand-brown/10 bg-white p-6">
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-brand-brown/60">
                Free
              </h2>
              <p className="mt-2 text-3xl font-extrabold text-brand-brown">
                $0
                <span className="text-sm font-semibold text-brand-brown/40">
                  {" "}
                  / forever
                </span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-brand-brown/65">
                {FREE_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <CheckCircle2
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-brand-brown/35"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border-2 border-brand-red bg-white p-6 shadow-[0_24px_50px_-40px_rgba(193,18,31,0.7)]">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-extrabold uppercase tracking-wide text-brand-red">
                  Premium
                </h2>
                <Sparkles aria-hidden="true" className="size-4 text-brand-gold" />
              </div>
              <p className="mt-2 text-3xl font-extrabold text-brand-brown">
                Vendor
                <span className="text-sm font-semibold text-brand-brown/40">
                  {" "}
                  subscription
                </span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-brand-brown/65">
                {PREMIUM_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <CheckCircle2
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-brand-red"
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              {status.premiumActive ? (
                <p className="mt-5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                  Your subscription is active. Manage it from the Stripe customer
                  portal you receive by email.
                </p>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => void upgrade()}
                    disabled={starting || !status.stripeConfigured || !status.priceConfigured}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-red px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-red-dark disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {starting ? (
                      <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                    ) : (
                      <CreditCard aria-hidden="true" className="size-4" />
                    )}
                    {starting ? "Opening Stripe…" : "Upgrade with Stripe"}
                  </button>
                  {!status.stripeConfigured || !status.priceConfigured ? (
                    <p className="mt-3 rounded-xl bg-brand-gold/15 px-3 py-2 text-xs leading-5 text-brand-brown/65">
                      Stripe is not configured on this server yet. Add{" "}
                      <code className="font-mono text-[11px]">STRIPE_SECRET_KEY</code>,{" "}
                      <code className="font-mono text-[11px]">STRIPE_PREMIUM_PRICE_ID</code> and{" "}
                      <code className="font-mono text-[11px]">STRIPE_WEBHOOK_SECRET</code> to
                      enable checkout.
                    </p>
                  ) : null}
                </>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-brand-brown/10 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-brand-brown/60">
                Payment history
              </h2>
              <p className="text-xs text-brand-brown/40">
                Read-only · records created by Stripe webhooks
              </p>
            </div>

            {transactions.length === 0 ? (
              <p className="mt-4 text-sm text-brand-brown/50">
                No payments recorded yet.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-brand-brown/10 text-[11px] uppercase tracking-wide text-brand-brown/40">
                      <th className="py-2 pr-3 font-bold">Date</th>
                      <th className="py-2 pr-3 font-bold">Plan</th>
                      <th className="py-2 pr-3 font-bold">Amount</th>
                      <th className="py-2 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-b border-brand-brown/5 last:border-0"
                      >
                        <td className="py-2.5 pr-3 text-brand-brown/65">
                          {formatDateTime(transaction.paidAt ?? transaction.createdAt)}
                        </td>
                        <td className="py-2.5 pr-3 capitalize text-brand-brown/65">
                          {transaction.plan}
                        </td>
                        <td className="py-2.5 pr-3 font-semibold text-brand-brown">
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </td>
                        <td className="py-2.5">
                          <span className="rounded-full bg-brand-brown/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-brown/60">
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
