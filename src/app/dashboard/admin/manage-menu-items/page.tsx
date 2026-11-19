"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Check,
  Loader2,
  RotateCcw,
  Search,
  ShieldX,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { MenuStatusBadge } from "@/components/dashboard/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { inputClass, labelClass } from "@/components/ui/form-field";
import { FALLBACK_FOOD_IMAGE, MENU_CATEGORIES } from "@/constants";
import { errorMessage } from "@/lib/api";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";
import {
  deleteMenuItem,
  listAdminMenuItems,
  setMenuItemStatus,
} from "@/services/menu";
import type { MenuItem, MenuItemStatus, Paginated } from "@/types";

type StatusFilter = MenuItemStatus | "all";

const SEARCH_DEBOUNCE_MS = 300;

export default function ManageMenuItemsPage() {
  const [status, setStatus] = useState<StatusFilter>("pending");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<MenuItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MenuItem | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const load = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const result = await listAdminMenuItems({
        status: status === "all" ? undefined : status,
        search: search || undefined,
        category: category || undefined,
        location: location || undefined,
        page,
        limit: 12,
        sort: "newest",
      });
      if (currentRequest === requestId.current) setData(result);
    } catch (cause) {
      if (currentRequest === requestId.current) setError(errorMessage(cause));
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [category, location, page, search, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const hasActiveFilters =
    status !== "pending" ||
    searchInput.trim().length > 0 ||
    category.length > 0 ||
    location.length > 0;

  function resetFilters() {
    setStatus("pending");
    setSearchInput("");
    setSearch("");
    setCategory("");
    setLocation("");
    setPage(1);
  }

  async function approve(item: MenuItem) {
    setBusyId(item.id);
    try {
      await setMenuItemStatus(item.id, "approved");
      // Refetch so the active tab, pagination and total always match the
      // server's post-transition state, including reactivation from inactive.
      await load();
      toast.success(
        item.status === "inactive"
          ? "Menu item reactivated and published."
          : "Menu item approved and published.",
      );
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setBusyId(null);
    }
  }

  async function deactivate(item: MenuItem) {
    setBusyId(item.id);
    try {
      await setMenuItemStatus(item.id, "inactive");
      await load();
      toast.success("Menu item is now inactive and hidden from customers.");
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setBusyId(null);
    }
  }

  async function reject(item: MenuItem) {
    setBusyId(item.id);
    try {
      await setMenuItemStatus(
        item.id,
        "rejected",
        reason.trim() || undefined,
      );
      await load();
      toast.success("Menu item rejected. The vendor can fix and resubmit it.");
      setRejectingId(null);
      setReason("");
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setBusyId(null);
    }
  }

  async function remove(item: MenuItem) {
    setDeletingId(item.id);
    try {
      await deleteMenuItem(item.id);
      setData((current) =>
        current
          ? {
              ...current,
              items: current.items.filter((entry) => entry.id !== item.id),
              total: Math.max(0, current.total - 1),
            }
          : current,
      );
      toast.success("Menu item deleted.");
      setPendingDelete(null);
    } catch (cause) {
      toast.error(errorMessage(cause));
      setPendingDelete(null);
    } finally {
      setDeletingId(null);
    }
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    void remove(pendingDelete);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manage menu items"
        description="Approve, reject, or deactivate listings. Inactive and rejected items never appear on the public menu; free vendors can hold at most three active items."
      />

      <div className="rounded-2xl border border-brand-brown/10 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1.6fr)_minmax(180px,1fr)_minmax(180px,1fr)_auto] xl:items-end">
          <div>
            <label htmlFor="admin-menu-search" className={labelClass}>
              Search items
            </label>
            <div className="relative mt-1.5">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-brand-brown/40"
              />
              <input
                id="admin-menu-search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Item name or description"
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="admin-menu-category" className={labelClass}>
              Category
            </label>
            <select
              id="admin-menu-category"
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setPage(1);
              }}
              className={`${inputClass} mt-1.5`}
            >
              <option value="">All categories</option>
              {MENU_CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="admin-menu-location" className={labelClass}>
              Location
            </label>
            <input
              id="admin-menu-location"
              type="text"
              value={location}
              onChange={(event) => {
                setLocation(event.target.value);
                setPage(1);
              }}
              aria-describedby="admin-menu-location-hint"
              placeholder="e.g. Lahore"
              className={`${inputClass} mt-1.5`}
            />
            <p
              id="admin-menu-location-hint"
              className="mt-1 text-[11px] text-brand-brown/45"
            >
              Matches the full location.
            </p>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            disabled={!hasActiveFilters}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-brand-brown/15 bg-cream/40 px-4 text-sm font-semibold text-brand-brown transition-colors hover:border-brand-red hover:text-brand-red disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw aria-hidden="true" className="size-4" />
            Clear filters
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-brand-brown/10 pt-4">
          <span className="mr-1 text-xs font-bold uppercase tracking-wide text-brand-brown/45">
            Status
          </span>
          {(
            ["pending", "approved", "rejected", "inactive", "all"] as StatusFilter[]
          ).map(
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
          <p>
            {hasActiveFilters
              ? "No menu items match these filters."
              : "Nothing is waiting for review right now."}
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 rounded-full bg-brand-red px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-red-dark"
            >
              Clear filters
            </button>
          ) : null}
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
                      <MenuStatusBadge
                        status={item.status}
                        isAvailable={item.isAvailable}
                      />
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
                      disabled={busyId === item.id || deletingId === item.id}
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

                  {item.status === "approved" ? (
                    <button
                      type="button"
                      onClick={() => void deactivate(item)}
                      disabled={busyId === item.id || deletingId === item.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-brand-brown/20 px-4 py-2 text-xs font-bold uppercase tracking-wide text-brand-brown transition-colors hover:border-brand-red hover:text-brand-red disabled:opacity-50"
                    >
                      Deactivate
                    </button>
                  ) : null}

                  {item.status !== "rejected" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setRejectingId(item.id);
                        setReason("");
                      }}
                      disabled={busyId === item.id || deletingId === item.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-brand-red/30 px-4 py-2 text-xs font-bold uppercase tracking-wide text-brand-red transition-colors hover:bg-brand-red hover:text-white disabled:opacity-50"
                    >
                      <ShieldX aria-hidden="true" className="size-3.5" />
                      Reject
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => setPendingDelete(item)}
                    disabled={
                      busyId === item.id ||
                      deletingId === item.id ||
                      pendingDelete?.id === item.id
                    }
                    className="inline-flex items-center gap-1.5 rounded-full border border-brand-brown/20 px-4 py-2 text-xs font-bold uppercase tracking-wide text-brand-brown transition-colors hover:border-brand-red hover:text-brand-red disabled:opacity-50"
                  >
                    {deletingId === item.id ? (
                      <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 aria-hidden="true" className="size-3.5" />
                    )}
                    Delete
                  </button>
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

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this menu item?"
        description={
          pendingDelete
            ? `"${pendingDelete.itemName}" will be removed from the platform permanently. This is only allowed when the item has no order history.`
            : undefined
        }
        confirmLabel="Delete item"
        cancelLabel="Keep item"
        busy={Boolean(deletingId)}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
