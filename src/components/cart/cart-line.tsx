"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { CART_MAX_QUANTITY, FALLBACK_FOOD_IMAGE } from "@/constants";
import { cn, formatCurrency } from "@/lib/utils";
import type { CartItem, CartQuoteIssue, CartQuoteLine } from "@/types";

interface CartLineProps {
  item: CartItem;
  line?: CartQuoteLine | null;
  issue?: CartQuoteIssue | null;
  busy?: boolean;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}

export function CartLine({
  item,
  line,
  issue,
  busy = false,
  onQuantityChange,
  onRemove,
}: CartLineProps) {
  const unitPrice = line?.unitPrice ?? item.unitPrice;
  const lineTotal = line?.lineTotal ?? unitPrice * item.quantity;
  const priceChanged = issue?.code === "PRICE_CHANGED";
  const blocked =
    issue?.code === "MISSING" ||
    issue?.code === "UNAVAILABLE" ||
    issue?.code === "OWN_ITEM";

  return (
    <article
      className={cn(
        "rounded-[1.25rem] border bg-white p-4 shadow-[0_16px_40px_-40px_rgba(43,26,18,0.5)] sm:p-5",
        blocked ? "border-brand-red/40" : "border-brand-brown/10",
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-cream-deep sm:size-24">
          <Image
            src={item.image ?? FALLBACK_FOOD_IMAGE}
            alt={item.itemName}
            fill
            sizes="(min-width: 640px) 96px, 80px"
            className="object-cover"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-brand-brown sm:text-base">
                {item.itemName || "Menu item"}
              </h3>
              <p className="mt-0.5 text-xs text-brand-brown/55">
                {item.category ? `${item.category} · ` : ""}
                {item.vendorName || "Vendor"}
              </p>
            </div>
            <p className="shrink-0 text-sm font-extrabold text-brand-red sm:text-base">
              {formatCurrency(lineTotal)}
            </p>
          </div>

          <p className="mt-2 text-xs text-brand-brown/55">
            {formatCurrency(unitPrice)} each
            {priceChanged ? (
              <span className="ml-2 font-semibold text-brand-red">
                was {formatCurrency(item.unitPrice)}
              </span>
            ) : null}
          </p>

          {issue ? (
            <p
              className={cn(
                "mt-2 rounded-lg px-2.5 py-1.5 text-xs leading-5",
                blocked
                  ? "bg-brand-red/5 text-brand-red"
                  : "bg-brand-gold/15 text-brand-brown",
              )}
            >
              {issue.message}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center rounded-full border border-brand-brown/15 bg-cream/40 p-1">
              <button
                type="button"
                onClick={() => onQuantityChange(item.quantity - 1)}
                disabled={busy || item.quantity <= 1}
                aria-label={`Decrease quantity of ${item.itemName}`}
                className="inline-flex size-7 items-center justify-center rounded-full text-brand-brown transition-colors hover:bg-white disabled:opacity-40"
              >
                <Minus aria-hidden="true" className="size-3.5" />
              </button>
              <span
                aria-label={`Quantity ${item.quantity}`}
                className="w-8 text-center text-sm font-bold text-brand-brown"
              >
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={() => onQuantityChange(item.quantity + 1)}
                disabled={busy || item.quantity >= CART_MAX_QUANTITY}
                aria-label={`Increase quantity of ${item.itemName}`}
                className="inline-flex size-7 items-center justify-center rounded-full text-brand-brown transition-colors hover:bg-white disabled:opacity-40"
              >
                <Plus aria-hidden="true" className="size-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={onRemove}
              disabled={busy}
              aria-label={`Remove ${item.itemName} from cart`}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold text-brand-brown/55 transition-colors hover:bg-brand-red/5 hover:text-brand-red disabled:opacity-50"
            >
              <Trash2 aria-hidden="true" className="size-3.5" />
              Remove
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
