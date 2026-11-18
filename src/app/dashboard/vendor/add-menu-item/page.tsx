"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { MenuItemForm } from "@/components/dashboard/menu-item-form";
import { PageHeader } from "@/components/shared/page-header";
import { ROUTES } from "@/constants";
import { errorMessage } from "@/lib/api";
import { getSubscriptionStatus } from "@/services/subscriptions";
import type { SubscriptionStatus } from "@/types";

export default function AddMenuItemPage() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSubscriptionStatus()
      .then((result) => {
        if (!cancelled) setStatus(result);
      })
      .catch((cause) => {
        if (!cancelled) setError(errorMessage(cause));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add menu item"
        description="New items are created as pending and only go live after an administrator approves them."
      >
        <Link
          href={ROUTES.vendorMyMenuItems}
          className="inline-flex items-center rounded-full border border-brand-brown/15 bg-white px-4 py-2 text-sm font-bold text-brand-brown transition-colors hover:border-brand-red hover:text-brand-red"
        >
          Back to my menu
        </Link>
      </PageHeader>

      {status && !status.premiumActive ? (
        <div className="rounded-2xl border border-brand-gold/50 bg-brand-gold/10 px-4 py-3 text-sm text-brand-brown/70">
          <strong className="text-brand-brown">Free plan:</strong>{" "}
          {status.freePlanActiveItemLimit} approved and available items maximum.
          Pending or rejected items do not count.{" "}
          <Link
            href={ROUTES.vendorSubscription}
            className="font-bold text-brand-red hover:underline"
          >
            Go Premium
          </Link>
        </div>
      ) : null}

      {error ? (
        <p className="flex items-center gap-2 rounded-xl border border-brand-red/30 bg-white px-4 py-3 text-sm font-semibold text-brand-red">
          <Loader2 aria-hidden="true" className="size-4" />
          {error}
        </p>
      ) : (
        <MenuItemForm />
      )}
    </div>
  );
}
