"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  Check,
  ChevronDown,
  Loader2,
  Package,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { OrderTimeline } from "@/components/dashboard/order-timeline";
import { OrderStatusBadge } from "@/components/dashboard/status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { FALLBACK_FOOD_IMAGE, ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/constants";
import { errorMessage } from "@/lib/api";
import { cn, formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { listOrders, updateOrderStatus } from "@/services/orders";
import type { Order, OrderStatus, Paginated } from "@/types";

type Filter = OrderStatus | "all";

export default function VendorCustomerOrdersPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<Order> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

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

  async function decide(order: Order, status: "accepted" | "rejected") {
    setBusyId(order.id);
    try {
      const updated = await updateOrderStatus(
        order.id,
        status,
        notes[order.id]?.trim() || undefined,
      );
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
      setNotes((current) => ({ ...current, [order.id]: "" }));
      toast.success(
        status === "accepted" ? "Order accepted." : "Order rejected.",
      );
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer orders"
        description="Accept or reject pending orders for your dishes. Every decision is added to the customer's timeline."
      />

      <div className="flex flex-wrap gap-2">
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

      {loading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-brand-brown/10 bg-white px-5 py-8 text-sm font-semibold text-brand-brown/60">
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          Loading orders…
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
            No orders here
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-brand-brown/55">
            {filter === "all"
              ? "Once a customer orders one of your dishes it will appear here."
              : `You have no ${ORDER_STATUS_LABELS[filter].toLowerCase()} orders.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.items.map((order) => {
            const quantity = order.quantity ?? 1;
            const lineTotal = order.lineTotal ?? order.itemPrice * quantity;
            return (
            <article
              key={order.id}
              className="rounded-[1.25rem] border border-brand-brown/10 bg-white p-5 shadow-[0_16px_40px_-40px_rgba(43,26,18,0.5)]"
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
                        {order.itemName}
                      </h3>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="mt-1 text-xs text-brand-brown/55">
                      {order.customerName} · {formatCurrency(order.itemPrice)} ×{" "}
                      {quantity} · Line total {formatCurrency(lineTotal)}
                    </p>
                    <p className="text-xs text-brand-brown/45">
                      Requested for {formatDate(order.deliveryDate)} · placed{" "}
                      {formatDateTime(order.createdAt)}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-brand-brown/60">
                      Deliver to: {order.deliveryAddress}
                    </p>
                    {order.message ? (
                      <p className="mt-1 rounded-lg bg-cream/80 px-2.5 py-1.5 text-xs leading-5 text-brand-brown/60">
                        “{order.message}”
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              {order.status === "pending" ? (
                <div className="mt-4 space-y-3 rounded-xl border border-brand-brown/10 bg-cream/40 p-3">
                  <label
                    htmlFor={`note-${order.id}`}
                    className="text-xs font-bold uppercase tracking-wide text-brand-brown/50"
                  >
                    Note to customer (optional)
                  </label>
                  <input
                    id={`note-${order.id}`}
                    type="text"
                    maxLength={500}
                    value={notes[order.id] ?? ""}
                    onChange={(event) =>
                      setNotes((current) => ({
                        ...current,
                        [order.id]: event.target.value,
                      }))
                    }
                    placeholder="e.g. Ready for pickup at 6pm"
                    className="h-10 w-full rounded-lg border border-brand-brown/15 bg-white px-3 text-sm text-brand-brown outline-none focus:border-brand-red"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void decide(order, "accepted")}
                      disabled={busyId === order.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {busyId === order.id ? (
                        <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
                      ) : (
                        <Check aria-hidden="true" className="size-3.5" />
                      )}
                      Accept order
                    </button>
                    <button
                      type="button"
                      onClick={() => void decide(order, "rejected")}
                      disabled={busyId === order.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-brand-red px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-red-dark disabled:opacity-50"
                    >
                      <X aria-hidden="true" className="size-3.5" />
                      Reject order
                    </button>
                  </div>
                </div>
              ) : null}

              <details className="group mt-4 border-t border-brand-brown/10 pt-3">
                <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold uppercase tracking-wide text-brand-brown/50">
                  Status timeline
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
            );
          })}

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
  );
}
