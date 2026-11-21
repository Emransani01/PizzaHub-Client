"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CircleCheck,
  CirclePlus,
  Clock3,
  Loader2,
  Plus,
  ShoppingBag,
} from "lucide-react";
import { DashboardChart } from "@/components/dashboard/dashboard-chart";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { OrderStatusBadge } from "@/components/dashboard/status-badge";
import { StatsCard } from "@/components/dashboard/stats-card";
import { PageHeader } from "@/components/shared/page-header";
import { ROUTES } from "@/constants";
import { errorMessage } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getDashboardOverview } from "@/services/dashboard";
import type { DashboardOverview, VendorStats } from "@/types";

export default function VendorDashboardPage() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
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

  const stats = data?.stats as VendorStats | undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Vendor dashboard"
        title="Kitchen overview"
        description="Track your menu, approvals and incoming orders."
      >
        <Link
          href={ROUTES.vendorAddMenuItem}
          className="inline-flex items-center gap-2 rounded-full bg-brand-red px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-red-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red"
        >
          <Plus aria-hidden="true" className="size-4" />
          Add menu item
        </Link>
      </PageHeader>

      {loading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-brand-brown/10 bg-white px-5 py-8 text-sm font-semibold text-brand-brown/60">
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          Loading your kitchen…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-brand-red/30 bg-white px-5 py-8">
          <p className="text-sm font-semibold text-brand-red">{error}</p>
        </div>
      ) : stats ? (
        <>
          {!stats.premiumActive ? (
            <div className="flex flex-col gap-4 rounded-2xl border border-brand-gold/50 bg-brand-gold/10 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-brown" />
                <div>
                  <p className="text-sm font-bold text-brand-brown">
                    Free plan: {stats.activeItems} of {stats.activeItemLimit} live
                    items used
                  </p>
                  <p className="mt-0.5 text-xs leading-5 text-brand-brown/60">
                    Only approved and available items count towards the limit.
                    Upgrade to Premium for unlimited listings.
                  </p>
                </div>
              </div>
              <Link
                href={ROUTES.vendorSubscription}
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-brand-brown px-4 py-2 text-sm font-bold text-cream transition-colors hover:bg-brand-brown-light"
              >
                Upgrade
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="text-sm font-bold text-emerald-800">
                Premium is active — unlimited menu items.
              </p>
              <p className="mt-0.5 text-xs text-emerald-700">
                Renews {formatDate(stats.subscriptionExpiresAt)}.
              </p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatsCard
              label="Total menu items"
              value={stats.totalItems}
              hint="All items you have submitted"
              icon={CirclePlus}
              accent="red"
            />
            <StatsCard
              label="Active menu items"
              value={`${stats.activeItems}${stats.premiumActive ? "" : ` / ${stats.activeItemLimit}`}`}
              hint={`${stats.inactiveItems} inactive · ${stats.approvedItems} approved`}
              icon={CircleCheck}
              accent="green"
            />
            <StatsCard
              label="Awaiting review"
              value={stats.pendingItems}
              hint="Items waiting for admin approval"
              icon={Clock3}
              accent="gold"
            />
            <StatsCard
              label="Orders received"
              value={stats.totalOrders}
              hint={`${stats.orders.pending} pending a decision`}
              icon={ShoppingBag}
              accent="brown"
            />
            <StatsCard
              label="Accepted orders"
              value={stats.orders.accepted}
              hint={`${stats.orders.rejected} rejected`}
              icon={CircleCheck}
              accent="green"
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <DashboardChart series={data?.series ?? []} />

            <DashboardPanel
              title="Latest orders"
              action={
                <Link
                  href={ROUTES.vendorCustomerOrders}
                  className="text-xs font-bold text-brand-red hover:underline"
                >
                  View all
                </Link>
              }
            >
              {data?.recentOrders.length === 0 ? (
                <p className="text-sm text-brand-brown/50">
                  No orders yet. Once a customer orders one of your dishes it will
                  appear here.
                </p>
              ) : (
                <ul className="divide-y divide-brand-brown/10">
                  {data?.recentOrders.map((order) => {
                    const quantity = order.quantity ?? 1;
                    return (
                      <li key={order.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-brand-brown">
                            {order.itemName}
                          </p>
                          <p className="truncate text-xs text-brand-brown/50">
                            {order.customerName} · {formatDate(order.deliveryDate)}
                          </p>
                          <p className="text-[11px] text-brand-brown/45">
                            Quantity × {quantity}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <OrderStatusBadge status={order.status} />
                          <span className="text-xs font-bold text-brand-brown/60">
                            {formatCurrency(
                              order.lineTotal ?? order.itemPrice * quantity,
                            )}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </DashboardPanel>
          </div>
        </>
      ) : null}
    </div>
  );
}
