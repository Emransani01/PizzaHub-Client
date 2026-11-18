"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Crown,
  Heart,
  MapPin,
  ShieldAlert,
  Store,
} from "lucide-react";
import { OrderForm } from "@/components/menu/order-form";
import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { FALLBACK_FOOD_IMAGE, MENU_STATUS_LABELS, ROUTES } from "@/constants";
import { errorMessage } from "@/lib/api";
import { cn, formatCurrency } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { getMenuItem } from "@/services/menu";
import type { MenuItem } from "@/types";

export default function MenuItemPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { user, favoriteIds, toggleFavorite } = useAuth();
  const [item, setItem] = useState<MenuItem | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    getMenuItem(id)
      .then((result) => {
        if (!cancelled) {
          setItem(result);
          setActiveImage(0);
        }
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

  const isFavorite = item ? favoriteIds.includes(item.id) : false;

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <Navbar />
      <main className="flex-1 py-8 sm:py-12">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href={ROUTES.browseMenu}
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-brown/60 transition-colors hover:text-brand-red"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back to the menu
          </Link>

          {loading ? (
            <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="aspect-[4/3] animate-pulse rounded-[1.75rem] bg-brand-brown/10" />
              <div className="space-y-4">
                <div className="h-8 w-2/3 animate-pulse rounded-full bg-brand-brown/10" />
                <div className="h-4 w-1/3 animate-pulse rounded-full bg-brand-brown/10" />
                <div className="h-24 animate-pulse rounded-2xl bg-brand-brown/10" />
              </div>
            </div>
          ) : error || !item ? (
            <div className="mt-8 rounded-[1.75rem] border border-brand-brown/10 bg-white px-6 py-16 text-center">
              <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
                <ShieldAlert aria-hidden="true" className="size-7" />
              </span>
              <h1 className="mt-4 text-2xl font-extrabold text-brand-brown">
                Dish not available
              </h1>
              <p className="mx-auto mt-2 max-w-md text-sm text-brand-brown/60">
                {error ??
                  "This item may have been removed or is no longer approved."}
              </p>
              <Link
                href={ROUTES.browseMenu}
                className="mt-6 inline-flex rounded-full bg-brand-red px-6 py-3 text-sm font-bold text-white"
              >
                Browse the menu
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-brand-brown">
                  <Image
                    src={item.images[activeImage] ?? FALLBACK_FOOD_IMAGE}
                    alt={item.itemName}
                    fill
                    priority
                    sizes="(min-width: 1024px) 60vw, 100vw"
                    className="object-cover"
                  />
                  {item.isPremiumVendor ? (
                    <span className="absolute left-5 top-5 inline-flex items-center gap-1 rounded-full bg-brand-gold px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-brown">
                      <Crown aria-hidden="true" className="size-3" />
                      Premium kitchen
                    </span>
                  ) : null}
                </div>

                {item.images.length > 1 ? (
                  <div className="mt-3 flex gap-3">
                    {item.images.map((image, index) => (
                      <button
                        key={`${image}-${index}`}
                        type="button"
                        onClick={() => setActiveImage(index)}
                        aria-label={`View image ${index + 1}`}
                        aria-pressed={activeImage === index}
                        className={cn(
                          "relative size-20 overflow-hidden rounded-xl border-2 transition-colors",
                          activeImage === index
                            ? "border-brand-red"
                            : "border-transparent opacity-70 hover:opacity-100",
                        )}
                      >
                        <Image
                          src={image}
                          alt=""
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div>
                <span className="inline-flex rounded-full bg-brand-red/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-red">
                  {item.category}
                </span>

                <div className="mt-3 flex items-start justify-between gap-4">
                  <h1 className="text-3xl font-extrabold tracking-tight text-brand-brown sm:text-4xl">
                    {item.itemName}
                  </h1>
                  {user?.role === "customer" ? (
                    <button
                      type="button"
                      onClick={() => void toggleFavorite(item.id)}
                      aria-pressed={isFavorite}
                      aria-label={
                        isFavorite ? "Remove from favourites" : "Save to favourites"
                      }
                      className={cn(
                        "inline-flex size-11 shrink-0 items-center justify-center rounded-full border transition-colors",
                        isFavorite
                          ? "border-brand-red bg-brand-red text-white"
                          : "border-brand-brown/20 bg-white text-brand-brown hover:border-brand-red hover:text-brand-red",
                      )}
                    >
                      <Heart
                        aria-hidden="true"
                        className={cn("size-5", isFavorite && "fill-current")}
                      />
                    </button>
                  ) : null}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold text-brand-brown/55">
                  <span className="inline-flex items-center gap-1.5">
                    <Store aria-hidden="true" className="size-4" />
                    {item.vendorName}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin aria-hidden="true" className="size-4" />
                    {item.location}
                  </span>
                </div>

                <p className="mt-5 text-3xl font-extrabold tracking-tight text-brand-red">
                  {formatCurrency(item.price)}
                </p>

                <p className="mt-4 text-sm leading-7 text-brand-brown/70">
                  {item.description}
                </p>

                {user && user.role !== "customer" ? (
                  <p className="mt-4 inline-flex items-center gap-2 rounded-xl border border-brand-gold/50 bg-brand-gold/10 px-3 py-2 text-xs font-semibold text-brand-brown/70">
                    Vendor/admin view · {MENU_STATUS_LABELS[item.status]} ·{" "}
                    {item.isAvailable ? "available" : "unavailable"}
                  </p>
                ) : null}

                <div className="mt-7">
                  <OrderForm item={item} />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
