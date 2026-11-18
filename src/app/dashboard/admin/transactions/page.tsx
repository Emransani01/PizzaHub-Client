"use client";

import { useCallback, useEffect, useState } from "react";
import { Lock, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { errorMessage } from "@/lib/api";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";
import { listTransactions } from "@/services/transactions";
import type { Paginated, Transaction, TransactionStatus } from "@/types";

type StatusFilter = TransactionStatus | "all";
type Status = TransactionStatus;

const STATUSES: Status[] = ["pending", "paid", "failed", "cancelled", "expired"];

const STATUS_STYLES: Record<Status, string> = {
  pending: "bg-brand-gold/20 text-brand-brown",
  paid: "bg-emerald-100 text-emerald-800",
  failed: "bg-brand-red/10 text-brand-red",
  cancelled: "bg-brand-brown/10 text-brand-brown/60",
  expired: "bg-brand-brown/10 text-brand-brown/60",
};

export default function AdminTransactionsPage() {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<Transaction> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listTransactions({
        status: status === "all" ? undefined : status,
        page,
        limit: 20,
      });
      setData(result);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Premium transactions"
        description="Read-only payment records created by verified Stripe webhooks. Administrators cannot create, edit or delete them."
      />

      <div className="flex flex-wrap gap-2">
        {(["all", ...STATUSES] as StatusFilter[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setStatus(option);
              setPage(1);
            }}
            aria-pressed={status === option}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-semibold capitalize transition-colors",
              status === option
                ? "border-brand-red bg-brand-red text-white"
                : "border-brand-brown/15 bg-white text-brand-brown/70 hover:border-brand-red hover:text-brand-red",
            )}
          >
            {option === "all" ? "All records" : option}
          </button>
        ))}
      </div>

      <div className="flex items-start gap-2 rounded-2xl border border-brand-brown/10 bg-white px-4 py-3 text-xs leading-5 text-brand-brown/55">
        <Lock aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
        This ledger is written only by the Stripe webhook handler. There is no
        API route that allows an administrator to modify a payment record.
      </div>

      {loading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-brand-brown/10 bg-white px-5 py-8 text-sm font-semibold text-brand-brown/60">
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          Loading transactions…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-brand-red/30 bg-white px-5 py-8">
          <p className="text-sm font-semibold text-brand-red">{error}</p>
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-brand-brown/20 bg-white px-5 py-12 text-center text-sm text-brand-brown/55">
          No payment records yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-brand-brown/10 bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-brand-brown/10 text-[11px] uppercase tracking-wide text-brand-brown/40">
                <th className="px-4 py-3 font-bold">Vendor</th>
                <th className="px-4 py-3 font-bold">Plan</th>
                <th className="px-4 py-3 font-bold">Amount</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Paid</th>
                <th className="px-4 py-3 font-bold">Stripe session</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="border-b border-brand-brown/5 last:border-0"
                >
                  <td className="px-4 py-3">
                    <p className="font-bold text-brand-brown">
                      {transaction.vendorName}
                    </p>
                    <p className="font-mono text-[10px] text-brand-brown/40">
                      {transaction.vendorId}
                    </p>
                  </td>
                  <td className="px-4 py-3 capitalize text-brand-brown/65">
                    {transaction.plan}
                  </td>
                  <td className="px-4 py-3 font-semibold text-brand-brown">
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                        STATUS_STYLES[transaction.status],
                      )}
                    >
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-brand-brown/55">
                    {formatDateTime(transaction.paidAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-[10px] text-brand-brown/45">
                      {transaction.stripeSessionId}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={page <= 1}
            className="rounded-full border border-brand-brown/20 bg-white px-4 py-2 text-sm font-semibold text-brand-brown disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm font-semibold text-brand-brown/60">
            {data.page} / {data.totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((value) => Math.min(data.totalPages, value + 1))}
            disabled={page >= data.totalPages}
            className="rounded-full border border-brand-brown/20 bg-white px-4 py-2 text-sm font-semibold text-brand-brown disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
