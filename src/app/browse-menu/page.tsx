"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, CircleAlert, SlidersHorizontal } from "lucide-react";
import { MenuFilters } from "@/components/menu/menu-filters";
import { MenuGrid } from "@/components/menu/menu-grid";
import { MenuSearch } from "@/components/menu/menu-search";
import { EmptyState } from "@/components/shared/empty-state";
import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { buttonVariants } from "@/components/ui/button";
import { errorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { listMenuItems } from "@/services/menu";
import type { MenuItem, Paginated } from "@/types";

type SortOption = "newest" | "price_asc" | "price_desc";

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest first",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
};

function BrowseMenuContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const category = searchParams.get("category") ?? "";
  const sort = (searchParams.get("sort") as SortOption | null) ?? "newest";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const searchFromUrl = searchParams.get("search") ?? "";

  const [search, setSearch] = useState(searchFromUrl);
  const [debouncedSearch, setDebouncedSearch] = useState(searchFromUrl);
  const [data, setData] = useState<Paginated<MenuItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const firstRender = useRef(true);

  const updateQuery = useCallback(
    (patch: Record<string, string | number | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === "" || value === 1) {
          if (key === "page") params.delete(key);
          else if (value === "") params.delete(key);
          else params.set(key, String(value));
        } else {
          params.set(key, String(value));
        }
      }
      const query = params.toString();
      router.replace(query ? `/browse-menu?${query}` : "/browse-menu", {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  // Keep the URL in sync with the local search box without resetting the input
  // on every keystroke.
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (debouncedSearch === searchFromUrl) return;
    updateQuery({ search: debouncedSearch || undefined, page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    listMenuItems({
      category: category || undefined,
      sort,
      page,
      limit: 12,
      search: debouncedSearch || undefined,
    })
      .then((result) => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(errorMessage(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [category, sort, page, debouncedSearch, reloadKey]);

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <Navbar />
      <main id="main-content" className="flex-1">
        <section className="border-b border-brand-brown/10 bg-cream-deep/50 py-12 sm:py-16">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand-red">
              Live menu
            </p>
            <h1 className="page-title mt-3">Browse the menu</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-brand-brown/60 sm:text-base">
              Every dish below is approved by an administrator and currently
              available from its kitchen.
            </p>

            <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <MenuSearch value={search} onChange={setSearch} />
              <div className="flex items-center gap-3">
                <label
                  htmlFor="menu-sort"
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brand-brown/50"
                >
                  <SlidersHorizontal aria-hidden="true" className="size-4" />
                  Sort
                </label>
                <select
                  id="menu-sort"
                  value={sort}
                  onChange={(event) =>
                    updateQuery({ sort: event.target.value, page: 1 })
                  }
                  className="h-11 rounded-full border border-brand-brown/15 bg-card px-4 text-sm font-semibold text-brand-brown outline-none focus:border-brand-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red"
                >
                  {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
                    <option key={option} value={option}>
                      {SORT_LABELS[option]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        <section className="py-10 sm:py-12">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <MenuFilters
              activeCategory={category}
              onChange={(next) => updateQuery({ category: next, page: 1 })}
            />

            <div className="mt-5 flex items-center justify-between gap-4 text-sm text-brand-brown/55">
              <p>
                {data
                  ? `${data.total} ${data.total === 1 ? "dish" : "dishes"} found`
                  : "Loading dishes..."}
              </p>
              {data && data.totalPages > 1 ? (
                <p>
                  Page {data.page} of {data.totalPages}
                </p>
              ) : null}
            </div>

            <div className="mt-6">
              {loading ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-80 animate-pulse rounded-card bg-brand-brown/10"
                    />
                  ))}
                </div>
              ) : error ? (
                <EmptyState
                  icon={CircleAlert}
                  tone="neutral"
                  dashed={false}
                  title="We couldn’t load the menu"
                  description={error}
                >
                  <button
                    type="button"
                    onClick={() => setReloadKey((key) => key + 1)}
                    className={cn(
                      buttonVariants({ variant: "brand", size: "cta-md" }),
                    )}
                  >
                    Try again
                  </button>
                </EmptyState>
              ) : (
                <MenuGrid items={data?.items ?? []} />
              )}
            </div>

            {data && data.totalPages > 1 ? (
              <div className="mt-10 flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => updateQuery({ page: page - 1 })}
                  className={cn(
                    buttonVariants({ variant: "brandOutline", size: "cta-md" }),
                  )}
                >
                  <ArrowLeft aria-hidden="true" className="size-4" />
                  Previous
                </button>
                <span className="text-sm font-semibold text-brand-brown/60">
                  {page} / {data.totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= data.totalPages}
                  onClick={() => updateQuery({ page: page + 1 })}
                  className={cn(
                    buttonVariants({ variant: "brandOutline", size: "cta-md" }),
                  )}
                >
                  Next
                  <ArrowRight aria-hidden="true" className="size-4" />
                </button>
              </div>
            ) : null}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default function BrowseMenuPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-cream">
          <p className="text-sm font-semibold text-brand-brown/60">
            Loading the menu...
          </p>
        </div>
      }
    >
      <BrowseMenuContent />
    </Suspense>
  );
}
