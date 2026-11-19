"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Loader2, ShieldAlert } from "lucide-react";
import { MenuGrid } from "@/components/menu/menu-grid";
import { EmptyState } from "@/components/shared/empty-state";
import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { errorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { listFavorites } from "@/services/favorites";
import type { MenuItem } from "@/types";

export default function FavoritesPage() {
  const { user, favoriteIds, loading: authLoading } = useAuth();
  const favoriteKey = favoriteIds.join(",");
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listFavorites();
      setItems(result.items);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (user?.role !== "customer") {
      setLoading(false);
      return;
    }
    void load();
    // Refetch when the shared favourite set changes so un-favouriting on this
    // page removes the card immediately instead of leaving a stale item.
  }, [authLoading, load, user, favoriteKey]);

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <Navbar />
      <main id="main-content" className="flex-1">
        <section className="border-b border-brand-brown/10 bg-cream-deep/50 py-12 sm:py-16">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand-red">
              Saved dishes
            </p>
            <h1 className="page-title mt-3">Your favourites</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-brand-brown/60 sm:text-base">
              Everything you have saved in one place. Favourites stay linked to
              your account, not this browser.
            </p>
          </div>
        </section>

        <section className="py-10 sm:py-12">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            {authLoading || (loading && user?.role === "customer") ? (
              <div className="flex items-center gap-3 rounded-card border border-brand-brown/10 bg-card px-6 py-10 text-sm font-semibold text-brand-brown/60 shadow-card">
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                Loading your favourites…
              </div>
            ) : !user ? (
              <EmptyState
                icon={Heart}
                title="Sign in to see your favourites"
                description="Save dishes while you browse and they will be waiting here next time."
              >
                <Link
                  href={ROUTES.signIn}
                  className={cn(buttonVariants({ variant: "brand", size: "cta-md" }))}
                >
                  Sign in
                </Link>
              </EmptyState>
            ) : user.role !== "customer" ? (
              <EmptyState
                icon={ShieldAlert}
                tone="neutral"
                title="Favourites are a customer feature"
                description="Vendor and administrator accounts do not place orders, so saved dishes are not available here."
              >
                <Link
                  href={ROUTES.browseMenu}
                  className={cn(buttonVariants({ variant: "brand", size: "cta-md" }))}
                >
                  Browse the menu
                </Link>
              </EmptyState>
            ) : error ? (
              <div className="rounded-card border border-brand-red/30 bg-card px-6 py-10 text-center shadow-card">
                <p className="text-sm font-semibold text-brand-red">{error}</p>
                <button
                  type="button"
                  onClick={() => void load()}
                  className={cn(
                    buttonVariants({ variant: "brand", size: "cta-sm" }),
                    "mt-4",
                  )}
                >
                  Try again
                </button>
              </div>
            ) : items.length === 0 ? (
              <EmptyState
                icon={Heart}
                title="Nothing saved yet"
                description="Tap the heart on any dish to keep it handy."
              >
                <Link
                  href={ROUTES.browseMenu}
                  className={cn(buttonVariants({ variant: "brand", size: "cta-md" }))}
                >
                  Find something delicious
                </Link>
              </EmptyState>
            ) : (
              <>
                <p className="mb-6 text-sm text-brand-brown/55">
                  {items.length} saved {items.length === 1 ? "dish" : "dishes"}
                </p>
                <MenuGrid items={items} />
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
