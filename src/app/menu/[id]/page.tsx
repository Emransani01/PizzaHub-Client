"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Crown,
  Heart,
  MapPin,
  Minus,
  Plus,
  ShieldAlert,
  Store,
} from "lucide-react";
import { AddToCartButton } from "@/components/menu/add-to-cart-button";
import { OrderForm } from "@/components/menu/order-form";
import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { PrivateRoute } from "@/components/shared/private-route";
import {
  CART_MAX_QUANTITY,
  FALLBACK_FOOD_IMAGE,
  MENU_STATUS_LABELS,
  ROUTES,
} from "@/constants";
import { errorMessage } from "@/lib/api";
import { cn, formatCurrency } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { getMenuItem } from "@/services/menu";
import type { MenuItem } from "@/types";

export default function MenuItemPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const {
    user,
    loading: authLoading,
    favoriteIds,
    toggleFavorite,
  } = useAuth();
  const [item, setItem] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrolledForId = useRef<string | null>(null);

  // The item is fetched client-side, so the browser's original hash scroll can
  // run before #order exists. Scroll again once the detail content is ready.
  useEffect(() => {
    if (!item || loading || !id) return;
    if (window.location.hash !== "#order") return;
    if (scrolledForId.current === id) return;
    scrolledForId.current = id;
    requestAnimationFrame(() => {
      document
        .getElementById("order")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [item, loading, id]);

  useEffect(() => {
    if (!id || authLoading || !user) return;
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
  }, [id, authLoading, user]);

  const isFavorite = item ? favoriteIds.includes(item.id) : false;

  return (
    <PrivateRoute>
      <div className="flex min-h-screen flex-col bg-cream">
        <Navbar />
        <main id="main-content" className="flex-1 py-8 sm:py-12">
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
                      loading="eager"
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
                      {item.isAvailable ? "available" : "inactive"}
                    </p>
                  ) : null}

                  <div id="order" className="mt-7 space-y-4 scroll-mt-24">
                    <OrderForm item={item} />
                    <div className="rounded-[1.5rem] border border-brand-brown/10 bg-white p-6 shadow-[0_18px_40px_-32px_rgba(43,26,18,0.5)]">
                      <h2 className="text-lg font-extrabold tracking-tight text-brand-brown">
                        Add to your cart
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-brand-brown/55">
                        Choose a quantity, then review everything in your cart
                        before placing a single checkout for multiple vendors.
                      </p>

                      <div className="mt-5 flex flex-wrap items-end gap-4">
                        <div className="space-y-1.5">
                          <label
                            htmlFor="item-quantity"
                            className="text-xs font-bold uppercase tracking-wide text-brand-brown/50"
                          >
                            Quantity
                          </label>
                          <div className="inline-flex items-center rounded-full border border-brand-brown/15 bg-cream/40 p-1">
                            <button
                              type="button"
                              onClick={() =>
                                setQuantity((value) => Math.max(1, value - 1))
                              }
                              disabled={quantity <= 1}
                              aria-label="Decrease quantity"
                              className="inline-flex size-8 items-center justify-center rounded-full text-brand-brown transition-colors hover:bg-white disabled:opacity-40"
                            >
                              <Minus aria-hidden="true" className="size-4" />
                            </button>
                            <input
                              id="item-quantity"
                              type="number"
                              min={1}
                              max={CART_MAX_QUANTITY}
                              value={quantity}
                              onChange={(event) => {
                                const value = Number(event.target.value);
                                setQuantity(
                                  Number.isFinite(value)
                                    ? Math.min(
                                        CART_MAX_QUANTITY,
                                        Math.max(1, Math.trunc(value)),
                                      )
                                    : 1,
                                );
                              }}
                              className="w-12 border-0 bg-transparent text-center text-sm font-bold text-brand-brown outline-none"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setQuantity((value) =>
                                  Math.min(CART_MAX_QUANTITY, value + 1),
                                )
                              }
                              disabled={quantity >= CART_MAX_QUANTITY}
                              aria-label="Increase quantity"
                              className="inline-flex size-8 items-center justify-center rounded-full text-brand-brown transition-colors hover:bg-white disabled:opacity-40"
                            >
                              <Plus aria-hidden="true" className="size-4" />
                            </button>
                          </div>
                        </div>

                        <div className="min-w-[180px] flex-1">
                          <AddToCartButton
                            item={item}
                            quantity={quantity}
                            className="w-full justify-center"
                          />
                        </div>
                      </div>

                      <p className="mt-4 text-xs leading-5 text-brand-brown/50">
                        {formatCurrency(item.price)} each ·{" "}
                        {formatCurrency(item.price * quantity)} for this line.
                        Final prices are confirmed before checkout.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </PrivateRoute>
  );
}
