"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Loader2, Lock, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { AuthStateNotice } from "@/components/shared/auth-state-notice";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { errorMessage } from "@/lib/api";
import { todayIso } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { createOrder } from "@/services/orders";
import type { MenuItem } from "@/types";

export function OrderForm({ item }: { item: MenuItem }) {
  const router = useRouter();
  const { user, loading, authError, refreshing, refresh } = useAuth();
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="h-64 animate-pulse rounded-[1.5rem] bg-brand-brown/10" />
    );
  }

  if (!user && authError) {
    return (
      <AuthStateNotice
        error={authError}
        refreshing={refreshing}
        onRetry={() => void refresh()}
      />
    );
  }

  if (!user) {
    return (
      <div className="rounded-[1.5rem] border border-brand-brown/10 bg-white p-6">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-red/10 text-brand-red">
          <Lock aria-hidden="true" className="size-5" />
        </span>
        <h2 className="mt-4 text-lg font-extrabold text-brand-brown">
          Sign in to order
        </h2>
        <p className="mt-2 text-sm leading-6 text-brand-brown/60">
          Orders are tied to your account so you can follow their status. No
          card details are needed — PizzaHub orders are settled directly with the
          vendor.
        </p>
        <Link
          href={`${ROUTES.signIn}?next=${encodeURIComponent(ROUTES.menuOrder(item.id))}`}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-red px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-red-dark"
        >
          Sign in to continue
        </Link>
      </div>
    );
  }

  if (user.role !== "customer") {
    return (
      <div className="rounded-[1.5rem] border border-brand-brown/10 bg-white p-6">
        <h2 className="text-lg font-extrabold text-brand-brown">
          Customer accounts only
        </h2>
        <p className="mt-2 text-sm leading-6 text-brand-brown/60">
          You are signed in as a {user.role}. Vendor and administrator accounts
          manage the platform and cannot place orders.
        </p>
      </div>
    );
  }

  if (item.vendorId === user.id) {
    return (
      <div className="rounded-[1.5rem] border border-brand-brown/10 bg-white p-6">
        <h2 className="text-lg font-extrabold text-brand-brown">
          This is your own dish
        </h2>
        <p className="mt-2 text-sm leading-6 text-brand-brown/60">
          Vendors cannot order their own menu items. Customers will see this
          item on the public menu.
        </p>
      </div>
    );
  }

  const minDate = todayIso();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!deliveryDate) {
      setError("Choose a delivery date.");
      return;
    }
    if (deliveryAddress.trim().length < 10) {
      setError("Enter a full delivery address (at least 10 characters).");
      return;
    }

    setSubmitting(true);
    try {
      const order = await createOrder({
        itemId: item.id,
        deliveryDate,
        deliveryAddress: deliveryAddress.trim(),
        message: message.trim() || undefined,
      });
      toast.success("Order sent to the vendor.");
      router.push(`/dashboard/customer/my-orders?highlight=${order.id}`);
    } catch (cause) {
      const text = errorMessage(cause);
      setError(text);
      toast.error(text);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[1.5rem] border border-brand-brown/10 bg-white p-6 shadow-[0_18px_40px_-32px_rgba(43,26,18,0.5)]"
    >
      <h2 className="text-lg font-extrabold tracking-tight text-brand-brown">
        Place an order
      </h2>
      <p className="mt-1 text-sm text-brand-brown/55">
        No online payment required. The vendor accepts or rejects your request.
      </p>

      <div className="mt-5 space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="delivery-date"
            className="text-xs font-bold uppercase tracking-wide text-brand-brown/50"
          >
            Delivery date
          </label>
          <div className="relative">
            <CalendarDays
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-brand-brown/40"
            />
            <input
              id="delivery-date"
              type="date"
              required
              min={minDate}
              value={deliveryDate}
              onChange={(event) => setDeliveryDate(event.target.value)}
              className="h-11 w-full rounded-xl border border-brand-brown/15 bg-cream/40 pl-10 pr-3 text-sm text-brand-brown outline-none focus:border-brand-red focus:ring-4 focus:ring-brand-red/10"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="delivery-address"
            className="text-xs font-bold uppercase tracking-wide text-brand-brown/50"
          >
            Delivery address
          </label>
          <textarea
            id="delivery-address"
            required
            rows={3}
            minLength={10}
            maxLength={400}
            value={deliveryAddress}
            onChange={(event) => setDeliveryAddress(event.target.value)}
            placeholder="Street, apartment, city and postcode"
            className="w-full rounded-xl border border-brand-brown/15 bg-cream/40 px-3 py-2.5 text-sm text-brand-brown outline-none placeholder:text-brand-brown/35 focus:border-brand-red focus:ring-4 focus:ring-brand-red/10"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="order-message"
            className="text-xs font-bold uppercase tracking-wide text-brand-brown/50"
          >
            Note for the kitchen <span className="font-medium">(optional)</span>
          </label>
          <textarea
            id="order-message"
            rows={2}
            maxLength={600}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Allergies, gate code, delivery instructions"
            className="w-full rounded-xl border border-brand-brown/15 bg-cream/40 px-3 py-2.5 text-sm text-brand-brown outline-none placeholder:text-brand-brown/35 focus:border-brand-red focus:ring-4 focus:ring-brand-red/10"
          />
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-brand-red/30 bg-brand-red/5 px-3 py-2 text-sm font-medium text-brand-red"
        >
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        variant="brand"
        size="cta-md"
        disabled={submitting}
        className="mt-5 w-full"
      >
        {submitting ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <ShoppingBag aria-hidden="true" className="size-4" />
        )}
        {submitting ? "Sending order..." : "Send order request"}
      </Button>
    </form>
  );
}
