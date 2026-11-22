"use client";

import Image from "next/image";
import Link from "next/link";
import { Crown, Heart, MapPin, Store } from "lucide-react";
import { FALLBACK_FOOD_IMAGE, ROUTES } from "@/constants";
import { cn, formatCurrency } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import type { MenuItem } from "@/types";
import { OrderButton } from "./order-button";

interface MenuCardProps {
  item: MenuItem;
}

export function MenuCard({ item }: MenuCardProps) {
  const { user, favoriteIds, toggleFavorite } = useAuth();
  const isFavorite = favoriteIds.includes(item.id);
  const canFavorite = user?.role === "customer";

  return (
    <article className="group flex flex-col overflow-hidden rounded-card border border-brand-brown/10 bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-red/20 hover:shadow-card-hover">
      <div className="relative aspect-[4/3] overflow-hidden bg-cream-deep">
        <Link
          href={ROUTES.menuItem(item.id)}
          prefetch={false}
          aria-label={item.itemName}
          className="absolute inset-0 block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red"
        >
          <Image
            src={item.images[0] ?? FALLBACK_FOOD_IMAGE}
            alt={item.itemName}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </Link>
        <span className="absolute left-3 top-3 rounded-full bg-brand-brown/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-cream backdrop-blur">
          {item.category}
        </span>
        {item.isPremiumVendor ? (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-brand-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-brown">
            <Crown aria-hidden="true" className="size-3" />
            Premium
          </span>
        ) : null}
        {canFavorite ? (
          <button
            type="button"
            onClick={() => void toggleFavorite(item.id)}
            aria-pressed={isFavorite}
            aria-label={
              isFavorite
                ? `Remove ${item.itemName} from favourites`
                : `Save ${item.itemName} to favourites`
            }
            className={cn(
              "absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-full backdrop-blur transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red",
              isFavorite
                ? "bg-brand-red text-white"
                : "bg-white/90 text-brand-brown hover:bg-brand-red hover:text-white",
            )}
          >
            <Heart
              aria-hidden="true"
              className={cn("size-4", isFavorite && "fill-current")}
            />
          </button>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-extrabold tracking-tight text-brand-brown transition-colors group-hover:text-brand-red">
            <Link href={ROUTES.menuItem(item.id)} prefetch={false}>
              {item.itemName}
            </Link>
          </h3>
          <span className="shrink-0 text-base font-extrabold text-brand-red">
            {formatCurrency(item.price)}
          </span>
        </div>

        <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-brand-brown/55">
          {item.description}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-4 text-[11px] font-semibold text-brand-brown/45">
          <span className="inline-flex items-center gap-1">
            <Store aria-hidden="true" className="size-3.5" />
            {item.vendorName}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin aria-hidden="true" className="size-3.5" />
            {item.location}
          </span>
        </div>

        <div className="mt-4">
          <OrderButton item={item} className="w-full justify-center" />
        </div>
      </div>
    </article>
  );
}
