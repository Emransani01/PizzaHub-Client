"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ChevronDown,
  Loader2,
  Package,
  ShoppingBag,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { OrderTimeline } from "@/components/dashboard/order-timeline";
import { OrderStatusBadge } from "@/components/dashboard/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import {
  FALLBACK_FOOD_IMAGE,
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  ROUTES,
} from "@/constants";
import { errorMessage } from "@/lib/api";
import { cn, formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { listOrders, updateOrderStatus } from "@/services/orders";
import type { Order, OrderStatus, Paginated } from "@/types";

type Filter = OrderStatus | "all";

function MyOrdersContent() {
  const searchParams = useSearchParams();
  const highlight = searchParams.get("highlight");

  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<Order> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingCancel, setPendingCancel] = useState<Order | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listOrders({
        status: filter === "all" ? undefined : filter,
        page,
        limit: 10,
      });
      setData(result);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!highlight) return;
    const element = document.getElementById(`order-${highlight}`);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlight, data]);

  async function confirmCancel() {
    if (!pendingCancel) return;
    const order = pendingCancel;
    setBusyId(order.id);
    try {
      const updated = await updateOrderStatus(order.id, "cancelled");
      setData((current) =>
        current
          ? {
              ...current,
              items: current.items.map((entry) =>
                entry.id === updated.id ? updated : entry,
              ),
            }
          : current,
      );
      toast.success("Order cancelled.");
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setBusyId(null);
      setPendingCancel(null);
    }
  }

  return (
    <>
      <PageHeader
        title="My orders"
        description="Follow every order from the moment you send it to the vendor's decision."
      >
        <Link
          href={ROUTES.browseMenu}
          className="inline-flex items-center gap-2 rounded-full bg-brand-red px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-red-dark"
        >
          <ShoppingBag aria-hidden="true" className="size-4" />
          Order something new
        </Link>
      </PageHeader>

      <div className="mt-6 flex flex-wrap gap-2">
        {(["all", ...ORDER_STATUSES] as Filter[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setFilter(option);
              setPage(1);
            }}
            aria-pressed={filter === option}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
              filter === option
                ? "border-brand-red bg-brand-red text-white"
                : "border-brand-brown/15 bg-white text-brand-brown/70 hover:border-brand-red hover:text-brand-red",
            )}
          >
            {option === "all" ? "All orders" : ORDER_STATUS_LABELS[option]}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="flex items-center gap-3 rounded-2xl border border-brand-brown/10 bg-white px-5 py-8 text-sm font-semibold text-brand-brown/60">
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            Loading your orders…
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-brand-red/30 bg-white px-5 py-8">
            <p className="text-sm font-semibold text-brand-red">{error}</p>
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-brand-brown/20 bg-white px-6 py-16 text-center">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
              <Package aria-hidden="true" className="size-6" />
            </span>
            <h2 className="mt-4 text-xl font-extrabold text-brand-brown">
              No orders yet
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-brand-brown/55">
              When you place an order it will show up here with its full status
              timeline.
            </p>
            <Link
              href={ROUTES.browseMenu}
              className="mt-6 inline-flex rounded-full bg-brand-red px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-red-dark"
            >
              Browse the menu
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {data.items.map((order) => (
              <article
                key={order.id}
                id={`order-${order.id}`}
                className={cn(
                  "rounded-[1.25rem] border bg-white p-5 transition-shadow",
                  highlight === order.id
                    ? "border-brand-red shadow-[0_0_0_3px_rgba(193,18,31,0.15)]"
                    : "border-brand-brown/10 shadow-[0_16px_40px_-40px_rgba(43,26,18,0.5)]",
                )}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-3">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-cream-deep">
                      <Image
                        src={order.itemImage ?? FALLBACK_FOOD_IMAGE}
                        alt={order.itemName}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-extrabold text-brand-brown">
                          <Link
                            href={ROUTES.menuItem(order.itemId)}
                            className="hover:text-brand-red"
                          >
                            {order.itemName}
                          </Link>
                        </h3>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <p className="mt-1 text-xs text-brand-brown/55">
                        {order.vendorName} · {formatCurrency(order.itemPrice)}
                      </p>
                      <p className="text-xs text-brand-brown/45">
                        Delivery requested for {formatDate(order.deliveryDate)} ·
                        placed {formatDateTime(order.createdAt)}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-brand-brown/60">
                        {order.deliveryAddress}
                      </p>
                      {order.message ? (
                        <p className="mt-1 rounded-lg bg-cream/80 px-2.5 py-1.5 text-xs leading-5 text-brand-brown/60">
                          “{order.message}”
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {order.status === "pending" ? (
                    <button
                      type="button"
                      onClick={() => setPendingCancel(order)}
                      disabled={busyId === order.id}
                      className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-brand-red/30 px-4 py-2 text-xs font-bold uppercase tracking-wide text-brand-red transition-colors hover:bg-brand-red hover:text-white disabled:opacity-50"
                    >
                      {busyId === order.id ? (
                        <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
                      ) : (
                        <XCircle aria-hidden="true" className="size-3.5" />
                      )}
                      Cancel order
                    </button>
                  ) : null}
                </div>

                <details className="group mt-4 border-t border-brand-brown/10 pt-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold uppercase tracking-wide text-brand-brown/50">
                    Status timeline ({order.statusHistory.length})
                    <ChevronDown
                      aria-hidden="true"
                      className="size-4 transition-transform group-open:rotate-180"
                    />
                  </summary>
                  <div className="mt-3">
                    <OrderTimeline entries={order.statusHistory} />
                  </div>
                </details>
              </article>
            ))}

            {data.totalPages > 1 ? (
              <div className="flex items-center justify-center gap-3 pt-2">
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
                  onClick={() =>
                    setPage((value) => Math.min(data.totalPages, value + 1))
                  }
                  disabled={page >= data.totalPages}
                  className="rounded-full border border-brand-brown/20 bg-white px-4 py-2 text-sm font-semibold text-brand-brown disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(pendingCancel)}
        title="Cancel this order?"
        description={
          pendingCancel
            ? `Your request for "${pendingCancel.itemName}" will be withdrawn. You can only cancel while it is still pending.`
            : undefined
        }
        confirmLabel="Cancel order"
        cancelLabel="Keep order"
        onConfirm={() => void confirmCancel()}
        onCancel={() => setPendingCancel(null)}
      />
    </>
  );
}

export default function CustomerMyOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-3 rounded-2xl border border-brand-brown/10 bg-white px-5 py-8 text-sm font-semibold text-brand-brown/60">
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          Loading your orders…
        </div>
      }
    >
      <MyOrdersContent />
    </Suspense>
  );
}
