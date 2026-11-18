"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Loader2, ShieldAlert } from "lucide-react";
import { MenuGrid } from "@/components/menu/menu-grid";
import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { ROUTES } from "@/constants";
import { errorMessage } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { listFavorites } from "@/services/favorites";
import type { MenuItem } from "@/types";

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
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
  }, [authLoading, load, user]);

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <Navbar />
      <main className="flex-1">
        <section className="border-b border-brand-brown/10 bg-cream-deep/50 py-12 sm:py-16">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand-red">
              Saved dishes
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-brown sm:text-4xl">
              Your favourites
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-brand-brown/60 sm:text-base">
              Everything you have saved in one place. Favourites stay linked to
              your account, not this browser.
            </p>
          </div>
        </section>

        <section className="py-10 sm:py-12">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            {authLoading || (loading && user?.role === "customer") ? (
              <div className="flex items-center gap-3 rounded-[1.5rem] border border-brand-brown/10 bg-white px-6 py-10 text-sm font-semibold text-brand-brown/60">
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                Loading your favourites…
              </div>
            ) : !user ? (
              <div className="rounded-[1.5rem] border border-brand-brown/10 bg-white px-6 py-14 text-center">
                <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
                  <Heart aria-hidden="true" className="size-6" />
                </span>
                <h2 className="mt-4 text-xl font-extrabold text-brand-brown">
                  Sign in to see your favourites
                </h2>
                <p className="mx-auto mt-2 max-w-sm text-sm text-brand-brown/55">
                  Save dishes while you browse and they will be waiting here next
                  time.
                </p>
                <Link
                  href={ROUTES.signIn}
                  className="mt-6 inline-flex rounded-full bg-brand-red px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-red-dark"
                >
                  Sign in
                </Link>
              </div>
            ) : user.role !== "customer" ? (
              <div className="rounded-[1.5rem] border border-brand-brown/10 bg-white px-6 py-14 text-center">
                <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-gold/20 text-brand-brown">
                  <ShieldAlert aria-hidden="true" className="size-6" />
                </span>
                <h2 className="mt-4 text-xl font-extrabold text-brand-brown">
                  Favourites are a customer feature
                </h2>
                <p className="mx-auto mt-2 max-w-sm text-sm text-brand-brown/55">
                  Vendor and administrator accounts do not place orders, so saved
                  dishes are not available here.
                </p>
                <Link
                  href={ROUTES.browseMenu}
                  className="mt-6 inline-flex rounded-full bg-brand-red px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-red-dark"
                >
                  Browse the menu
                </Link>
              </div>
            ) : error ? (
              <div className="rounded-[1.5rem] border border-brand-red/30 bg-white px-6 py-10 text-center">
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
                  <Heart aria-hidden="true" className="size-6" />
                </span>
                <h2 className="mt-4 text-xl font-extrabold text-brand-brown">
                  Nothing saved yet
                </h2>
                <p className="mx-auto mt-2 max-w-sm text-sm text-brand-brown/55">
                  Tap the heart on any dish to keep it handy.
                </p>
                <Link
                  href={ROUTES.browseMenu}
                  className="mt-6 inline-flex rounded-full bg-brand-red px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-red-dark"
                >
                  Find something delicious
                </Link>
              </div>
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
