"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Loader2,
  Pencil,
  Plus,
  Store,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { MenuStatusBadge } from "@/components/dashboard/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { FALLBACK_FOOD_IMAGE, ROUTES } from "@/constants";
import { errorMessage } from "@/lib/api";
import { cn, formatCurrency } from "@/lib/utils";
import {
  deleteMenuItem,
  listMyMenuItems,
  updateMenuItem,
} from "@/services/menu";
import type { MenuItem } from "@/types";

export default function MyMenuItemsPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MenuItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listMyMenuItems();
      setItems(result.items);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleAvailability(item: MenuItem) {
    setBusyId(item.id);
    try {
      const updated = await updateMenuItem(item.id, {
        isAvailable: !item.isAvailable,
      });
      setItems((current) =>
        current.map((entry) => (entry.id === updated.id ? updated : entry)),
      );
      toast.success(
        updated.isAvailable
          ? "Item is now available to order."
          : "Item hidden from customers.",
      );
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setBusyId(target.id);
    try {
      await deleteMenuItem(target.id);
      setItems((current) => current.filter((entry) => entry.id !== target.id));
      toast.success("Menu item deleted.");
      setPendingDelete(null);
    } catch (cause) {
      toast.error(errorMessage(cause));
      setPendingDelete(null);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My menu items"
        description="Approved and available items are visible to customers. Changes to content require re-approval."
      >
        <Link
          href={ROUTES.vendorAddMenuItem}
          className="inline-flex items-center gap-2 rounded-full bg-brand-red px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-red-dark"
        >
          <Plus aria-hidden="true" className="size-4" />
          Add item
        </Link>
      </PageHeader>

      {loading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-brand-brown/10 bg-white px-5 py-8 text-sm font-semibold text-brand-brown/60">
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          Loading your menu…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-brand-red/30 bg-white px-5 py-8">
          <p className="text-sm font-semibold text-brand-red">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-4 rounded-full bg-brand-red px-5 py-2 text-sm font-bold text-white"
          >
            Try again
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-brand-brown/20 bg-white px-6 py-16 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
            <Store aria-hidden="true" className="size-6" />
          </span>
          <h2 className="mt-4 text-xl font-extrabold text-brand-brown">
            Your menu is empty
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-brand-brown/55">
            Add your first dish. It will be reviewed by an administrator before it
            appears on the public menu.
          </p>
          <Link
            href={ROUTES.vendorAddMenuItem}
            className="mt-6 inline-flex rounded-full bg-brand-red px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-red-dark"
          >
            Add a menu item
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((item) => (
            <article
              key={item.id}
              className="flex gap-4 rounded-[1.25rem] border border-brand-brown/10 bg-white p-4 shadow-[0_16px_40px_-40px_rgba(43,26,18,0.5)]"
            >
              <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-cream-deep">
                <Image
                  src={item.images[0] ?? FALLBACK_FOOD_IMAGE}
                  alt={item.itemName}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="truncate text-sm font-extrabold text-brand-brown">
                    {item.itemName}
                  </h3>
                  <MenuStatusBadge status={item.status} />
                </div>
                <p className="mt-0.5 truncate text-xs text-brand-brown/50">
                  {item.category} · {formatCurrency(item.price)}
                </p>

                {item.status === "rejected" && item.rejectionReason ? (
                  <p className="mt-2 rounded-lg bg-brand-red/5 px-2.5 py-1.5 text-xs leading-5 text-brand-red">
                    {item.rejectionReason}
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void toggleAvailability(item)}
                    disabled={busyId === item.id}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-colors disabled:opacity-50",
                      item.isAvailable
                        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                        : "bg-brand-brown/10 text-brand-brown/60 hover:bg-brand-brown/15",
                    )}
                  >
                    {busyId === item.id
                      ? "Saving…"
                      : item.isAvailable
                        ? "Available"
                        : "Unavailable"}
                  </button>

                  <Link
                    href={ROUTES.vendorEditMenuItem(item.id)}
                    className="inline-flex items-center gap-1 rounded-full border border-brand-brown/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-brand-brown transition-colors hover:border-brand-red hover:text-brand-red"
                  >
                    <Pencil aria-hidden="true" className="size-3" />
                    Edit
                  </Link>

                  <button
                    type="button"
                    onClick={() => setPendingDelete(item)}
                    disabled={busyId === item.id}
                    className="inline-flex items-center gap-1 rounded-full border border-brand-red/30 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-brand-red transition-colors hover:bg-brand-red hover:text-white disabled:opacity-50"
                  >
                    <Trash2 aria-hidden="true" className="size-3" />
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this menu item?"
        description={
          pendingDelete
            ? `"${pendingDelete.itemName}" will be removed permanently. Items with existing orders cannot be deleted — mark them unavailable instead.`
            : undefined
        }
        confirmLabel="Delete item"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
