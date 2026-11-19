"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Ban,
  CircleDollarSign,
  ClipboardCheck,
  Loader2,
  Receipt,
  ShoppingBag,
  Users,
} from "lucide-react";
import { DashboardChart } from "@/components/dashboard/dashboard-chart";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { StatsCard } from "@/components/dashboard/stats-card";
import { PageHeader } from "@/components/shared/page-header";
import { ROUTES } from "@/constants";
import { errorMessage } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { getDashboardOverview } from "@/services/dashboard";
import { listTransactions } from "@/services/transactions";
import type { AdminStats, DashboardOverview } from "@/types";

const quickLinks = [
  { href: ROUTES.adminManageUsers, label: "Manage users", copy: "Block or restore accounts" },
  { href: ROUTES.adminManageMenuItems, label: "Approve menu items", copy: "Review pending listings" },
  { href: ROUTES.adminTransactions, label: "Transactions", copy: "Read-only Stripe records" },
];

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [transactionTotal, setTransactionTotal] = useState<number | null>(null);
  const [transactionError, setTransactionError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // The overview only reports paid transactions. The read-only admin ledger
    // already exposes the all-status total, so request one row and use its
    // `total` instead of adding another dashboard/API field.
    Promise.allSettled([
      getDashboardOverview(),
      listTransactions({ page: 1, limit: 1 }),
    ])
      .then(([overview, transactions]) => {
        if (cancelled) return;

        if (transactions.status === "fulfilled") {
          setTransactionTotal(transactions.value.total);
        } else {
          setTransactionError(true);
        }

        if (overview.status === "fulfilled") {
          setData(overview.value);
        } else {
          setError(errorMessage(overview.reason));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = data?.stats as AdminStats | undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin dashboard"
        title="Platform overview"
        description="Users, menu approvals, orders and vendor revenue at a glance."
      />

      {loading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-brand-brown/10 bg-white px-5 py-8 text-sm font-semibold text-brand-brown/60">
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          Loading platform data…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-brand-red/30 bg-white px-5 py-8">
          <p className="text-sm font-semibold text-brand-red">{error}</p>
        </div>
      ) : stats ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatsCard
              label="Accounts"
              value={stats.totalUsers}
              hint={`${stats.vendors} vendors · ${stats.customers} customers`}
              icon={Users}
              accent="brown"
            />
            <StatsCard
              label="Pending menu items"
              value={stats.pendingItems}
              hint={`${stats.approvedItems} approved · ${stats.rejectedItems} rejected`}
              icon={ClipboardCheck}
              accent="gold"
            />
            <StatsCard
              label="Orders"
              value={stats.totalOrders}
              hint={`${stats.orders.pending} awaiting a vendor decision`}
              icon={ShoppingBag}
              accent="red"
            />
            <StatsCard
              label="Premium revenue"
              value={formatCurrency(stats.revenue)}
              hint={`${stats.paidTransactions} paid transactions`}
              icon={CircleDollarSign}
              accent="green"
            />
            <StatsCard
              label="Total transactions"
              value={transactionTotal ?? "—"}
              hint={
                transactionError
                  ? "Transaction count unavailable"
                  : "All payment records"
              }
              icon={Receipt}
              accent="brown"
            />
          </div>

          {stats.blockedUsers > 0 ? (
            <div className="flex items-start gap-3 rounded-2xl border border-brand-red/20 bg-brand-red/5 px-4 py-3 text-sm font-semibold text-brand-red">
              <Ban aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <p>
                {stats.blockedUsers} blocked{" "}
                {stats.blockedUsers === 1 ? "account" : "accounts"} — they cannot
                use the platform until unblocked.
              </p>
            </div>
          ) : null}

          <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <DashboardChart series={data?.series ?? []} />

            <DashboardPanel title="Quick actions">
              <div className="space-y-2">
                {quickLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between gap-3 rounded-xl bg-cream px-3.5 py-3 transition-colors hover:bg-cream-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-brand-brown">
                        {link.label}
                      </span>
                      <span className="block text-xs text-brand-brown/50">
                        {link.copy}
                      </span>
                    </span>
                    <ArrowRight
                      aria-hidden="true"
                      className="size-4 shrink-0 text-brand-brown/40"
                    />
                  </Link>
                ))}
              </div>
            </DashboardPanel>
          </div>
        </>
      ) : null}
    </div>
  );
}
