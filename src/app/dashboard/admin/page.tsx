"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { DashboardChart } from "@/components/dashboard/dashboard-chart";
import { StatsCard } from "@/components/dashboard/stats-card";
import { PageHeader } from "@/components/shared/page-header";
import { ROUTES } from "@/constants";
import { errorMessage } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { getDashboardOverview } from "@/services/dashboard";
import type { AdminStats, DashboardOverview } from "@/types";

const quickLinks = [
  { href: ROUTES.adminManageUsers, label: "Manage users", copy: "Block or restore accounts" },
  { href: ROUTES.adminManageMenuItems, label: "Approve menu items", copy: "Review pending listings" },
  { href: ROUTES.adminTransactions, label: "Transactions", copy: "Read-only Stripe records" },
];

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDashboardOverview()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((cause) => {
        if (!cancelled) setError(errorMessage(cause));
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
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatsCard
              label="Accounts"
              value={stats.totalUsers}
              hint={`${stats.vendors} vendors · ${stats.customers} customers`}
            />
            <StatsCard
              label="Pending menu items"
              value={stats.pendingItems}
              hint={`${stats.approvedItems} approved · ${stats.rejectedItems} rejected`}
            />
            <StatsCard
              label="Orders"
              value={stats.totalOrders}
              hint={`${stats.orders.pending} awaiting a vendor decision`}
            />
            <StatsCard
              label="Premium revenue"
              value={formatCurrency(stats.revenue)}
              hint={`${stats.paidTransactions} paid transactions`}
            />
          </div>

          {stats.blockedUsers > 0 ? (
            <p className="rounded-2xl border border-brand-red/20 bg-brand-red/5 px-4 py-3 text-sm font-semibold text-brand-red">
              {stats.blockedUsers} blocked{" "}
              {stats.blockedUsers === 1 ? "account" : "accounts"} — they cannot
              use the platform until unblocked.
            </p>
          ) : null}

          <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <DashboardChart series={data?.series ?? []} />

            <div className="rounded-[1.25rem] border border-brand-brown/10 bg-white p-5">
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-brand-brown/60">
                Quick actions
              </h2>
              <div className="mt-4 space-y-2">
                {quickLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between gap-3 rounded-xl bg-cream px-3.5 py-3 transition-colors hover:bg-cream-deep"
                  >
                    <span>
                      <span className="block text-sm font-bold text-brand-brown">
                        {link.label}
                      </span>
                      <span className="block text-xs text-brand-brown/50">
                        {link.copy}
                      </span>
                    </span>
                    <ArrowRight aria-hidden="true" className="size-4 text-brand-brown/40" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
