"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CircleCheck,
  Clock3,
  Heart,
  Loader2,
  Search,
  ShoppingBag,
  XCircle,
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
import type { CustomerStats, DashboardOverview } from "@/types";

export default function CustomerDashboardPage() {
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

  const stats = data?.stats as CustomerStats | undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Customer dashboard"
        title="Your orders"
        description="Everything you have ordered, all in one place."
      >
        <Link
          href={ROUTES.browseMenu}
          className="inline-flex items-center gap-2 rounded-full bg-brand-red px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-red-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red"
        >
          <Search aria-hidden="true" className="size-4" />
          Browse the menu
        </Link>
      </PageHeader>

      {loading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-brand-brown/10 bg-white px-5 py-8 text-sm font-semibold text-brand-brown/60">
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          Loading your dashboard…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-brand-red/30 bg-white px-5 py-8">
          <p className="text-sm font-semibold text-brand-red">{error}</p>
        </div>
      ) : stats ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatsCard
              label="Orders placed"
              value={stats.totalOrders}
              hint="Across every kitchen"
              icon={ShoppingBag}
              accent="red"
            />
            <StatsCard
              label="Pending"
              value={stats.orders.pending}
              hint="Waiting for the vendor"
              icon={Clock3}
              accent="gold"
            />
            <StatsCard
              label="Accepted"
              value={stats.orders.accepted}
              hint="Confirmed by the vendor"
              icon={CircleCheck}
              accent="green"
            />
            <StatsCard
              label="Rejected"
              value={stats.orders.rejected}
              hint="Declined by the vendor"
              icon={XCircle}
              accent="brown"
            />
          </div>

          <p className="text-sm text-brand-brown/55">
            Saved favourites:{" "}
            <Link
              href={ROUTES.favorites}
              className="font-bold text-brand-red hover:underline"
            >
              {stats.favoritesCount} dish{stats.favoritesCount === 1 ? "" : "es"}
            </Link>
          </p>

          <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <DashboardChart series={data?.series ?? []} />

            <DashboardPanel
              title="Recent orders"
              action={
                <Link
                  href={ROUTES.customerMyOrders}
                  className="text-xs font-bold text-brand-red hover:underline"
                >
                  View all
                </Link>
              }
            >
              {data?.recentOrders.length === 0 ? (
                <p className="text-sm text-brand-brown/50">
                  You have not ordered yet.{" "}
                  <Link
                    href={ROUTES.browseMenu}
                    className="font-bold text-brand-red hover:underline"
                  >
                    Find something delicious
                  </Link>
                  .
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
                            {order.vendorName} · {formatDate(order.deliveryDate)}
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

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <Link
                  href={ROUTES.customerMyOrders}
                  className="inline-flex items-center justify-between rounded-xl bg-cream px-3.5 py-3 text-xs font-bold text-brand-brown transition-colors hover:bg-cream-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red"
                >
                  Track orders
                  <ArrowRight aria-hidden="true" className="size-3.5" />
                </Link>
                <Link
                  href={ROUTES.favorites}
                  className="inline-flex items-center justify-between rounded-xl bg-cream px-3.5 py-3 text-xs font-bold text-brand-brown transition-colors hover:bg-cream-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Heart aria-hidden="true" className="size-3.5" />
                    Favourites
                  </span>
                  <ArrowRight aria-hidden="true" className="size-3.5" />
                </Link>
              </div>
            </DashboardPanel>
          </div>
        </>
      ) : null}
    </div>
  );
}
