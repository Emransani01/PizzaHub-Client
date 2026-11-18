"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { MenuItemForm } from "@/components/dashboard/menu-item-form";
import { PageHeader } from "@/components/shared/page-header";
import { FALLBACK_FOOD_IMAGE, ROUTES } from "@/constants";
import { errorMessage } from "@/lib/api";
import { getMenuItem } from "@/services/menu";
import type { MenuItem } from "@/types";

export default function EditMenuItemPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [item, setItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    getMenuItem(id)
      .then((result) => {
        if (!cancelled) setItem(result);
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
  }, [id]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit menu item"
        description="Update your listing. Content changes require a fresh admin approval."
      >
        <Link
          href={ROUTES.vendorMyMenuItems}
          className="inline-flex items-center rounded-full border border-brand-brown/15 bg-white px-4 py-2 text-sm font-bold text-brand-brown transition-colors hover:border-brand-red hover:text-brand-red"
        >
          Back to my menu
        </Link>
      </PageHeader>

      {loading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-brand-brown/10 bg-white px-5 py-8 text-sm font-semibold text-brand-brown/60">
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          Loading the item…
        </div>
      ) : error || !item ? (
        <div className="rounded-2xl border border-brand-red/30 bg-white px-5 py-8">
          <p className="text-sm font-semibold text-brand-red">
            {error ?? "This menu item could not be loaded."}
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 rounded-2xl border border-brand-brown/10 bg-white p-3">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-cream-deep">
              <Image
                src={item.images[0] ?? FALLBACK_FOOD_IMAGE}
                alt=""
                fill
                sizes="56px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-brand-brown">
                {item.itemName}
              </p>
              <p className="text-xs text-brand-brown/50">
                Current status: {item.status}
              </p>
            </div>
          </div>
          <MenuItemForm item={item} />
        </>
      )}
    </div>
  );
}
