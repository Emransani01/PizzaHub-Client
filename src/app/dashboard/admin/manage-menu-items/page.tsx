"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Check, Loader2, ShieldX, X } from "lucide-react";
import { toast } from "sonner";
import { MenuStatusBadge } from "@/components/dashboard/status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { FALLBACK_FOOD_IMAGE } from "@/constants";
import { errorMessage } from "@/lib/api";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";
import { listAdminMenuItems, setMenuItemStatus } from "@/services/menu";
import type { MenuItem, MenuItemStatus, Paginated } from "@/types";

type StatusFilter = MenuItemStatus | "all";

export default function ManageMenuItemsPage() {
  const [status, setStatus] = useState<StatusFilter>("pending");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<MenuItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listAdminMenuItems({
        status: status === "all" ? undefined : status,
        page,
        limit: 12,
        sort: "newest",
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

  async function approve(item: MenuItem) {
    setBusyId(item.id);
    try {
      const updated = await setMenuItemStatus(item.id, "approved");
      setData((current) =>
        current
          ? {
              ...current,
              items:
                status === "pending"
                  ? current.items.filter((entry) => entry.id !== updated.id)
                  : current.items.map((entry) =>
                      entry.id === updated.id ? updated : entry,
                    ),
              total:
                status === "pending"
                  ? Math.max(0, current.total - 1)
                  : current.total,
            }
          : current,
      );
      toast.success("Menu item approved and published.");
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setBusyId(null);
    }
  }

  async function reject(item: MenuItem) {
    setBusyId(item.id);
    try {
      const updated = await setMenuItemStatus(
        item.id,
        "rejected",
        reason.trim() || undefined,
      );
      setData((current) =>
        current
          ? {
              ...current,
              items:
                status === "pending"
                  ? current.items.filter((entry) => entry.id !== updated.id)
                  : current.items.map((entry) =>
                      entry.id === updated.id ? updated : entry,
                    ),
              total:
                status === "pending"
                  ? Math.max(0, current.total - 1)
                  : current.total,
            }
          : current,
      );
      toast.success("Menu item rejected. The vendor can fix and resubmit it.");
      setRejectingId(null);
      setReason("");
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manage menu items"
        description="Approve listings for the public menu or reject them with a reason. Free vendors can hold at most three approved and available items."
      />

      <div className="flex flex-wrap gap-2">
        {(["pending", "approved", "rejected", "all"] as StatusFilter[]).map(
          (option) => (
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
              {option === "all" ? "All items" : option}
            </button>
          ),
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-brand-brown/10 bg-white px-5 py-8 text-sm font-semibold text-brand-brown/60">
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          Loading menu items…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-brand-red/30 bg-white px-5 py-8">
          <p className="text-sm font-semibold text-brand-red">{error}</p>
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-brand-brown/20 bg-white px-5 py-12 text-center text-sm text-brand-brown/55">
          {status === "pending"
            ? "Nothing is waiting for review right now."
            : "No menu items match this filter."}
        </div>
      ) : (
        <div className="space-y-4">
          {data.items.map((item) => (
            <article
              key={item.id}
              className="rounded-[1.25rem] border border-brand-brown/10 bg-white p-4 shadow-[0_16px_40px_-40px_rgba(43,26,18,0.5)]"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-3">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-cream-deep">
                    <Image
                      src={item.images[0] ?? FALLBACK_FOOD_IMAGE}
                      alt={item.itemName}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-extrabold text-brand-brown">
                        {item.itemName}
                      </h3>
                      <MenuStatusBadge status={item.status} />
                      {!item.isAvailable ? (
                        <span className="rounded-full bg-brand-brown/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-brown/55">
                          Unavailable
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-brand-brown/55">
                      {item.category} · {formatCurrency(item.price)} ·{" "}
                      {item.location}
                    </p>
                    <p className="text-xs text-brand-brown/45">
                      {item.vendorName}
                      {item.vendorBusinessName
                        ? ` (${item.vendorBusinessName})`
                        : ""}{" "}
                      · submitted {formatDateTime(item.createdAt)}
                    </p>
                    <p className="mt-1 line-clamp-2 max-w-xl text-xs leading-5 text-brand-brown/60">
                      {item.description}
                    </p>
                    {item.rejectionReason ? (
                      <p className="mt-1 rounded-lg bg-brand-red/5 px-2.5 py-1.5 text-xs leading-5 text-brand-red">
                        Previous rejection: {item.rejectionReason}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  {item.status !== "approved" ? (
                    <button
                      type="button"
                      onClick={() => void approve(item)}
                      disabled={busyId === item.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {busyId === item.id ? (
                        <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
                      ) : (
                        <Check aria-hidden="true" className="size-3.5" />
                      )}
                      Approve
                    </button>
                  ) : null}

                  {item.status !== "rejected" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setRejectingId(item.id);
                        setReason("");
                      }}
                      disabled={busyId === item.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-brand-red/30 px-4 py-2 text-xs font-bold uppercase tracking-wide text-brand-red transition-colors hover:bg-brand-red hover:text-white disabled:opacity-50"
                    >
                      <ShieldX aria-hidden="true" className="size-3.5" />
                      Reject
                    </button>
                  ) : null}
                </div>
              </div>

              {rejectingId === item.id ? (
                <div className="mt-4 space-y-2 rounded-xl border border-brand-red/20 bg-brand-red/5 p-3">
                  <label
                    htmlFor={`reject-${item.id}`}
                    className="text-xs font-bold uppercase tracking-wide text-brand-red"
                  >
                    Reason (optional, shown to the vendor)
                  </label>
                  <textarea
                    id={`reject-${item.id}`}
                    rows={2}
                    maxLength={500}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="e.g. Description is too short or image quality is poor."
                    className="w-full rounded-lg border border-brand-red/20 bg-white px-3 py-2 text-sm text-brand-brown outline-none focus:border-brand-red"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void reject(item)}
                      disabled={busyId === item.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-brand-red px-4 py-2 text-xs font-bold uppercase tracking-wide text-white disabled:opacity-50"
                    >
                      {busyId === item.id ? (
                        <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
                      ) : (
                        <ShieldX aria-hidden="true" className="size-3.5" />
                      )}
                      Confirm rejection
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRejectingId(null);
                        setReason("");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-brand-brown/20 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-brand-brown"
                    >
                      <X aria-hidden="true" className="size-3.5" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
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
                onClick={() => setPage((value) => Math.min(data.totalPages, value + 1))}
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
