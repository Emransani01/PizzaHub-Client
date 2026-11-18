import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { CATEGORY_IMAGES, ROUTES } from "@/constants";
import { fetchCategoryCounts } from "@/lib/server-api";

const CATEGORY_COPY: Record<string, string> = {
  "Classic Pizzas": "Stone-baked classics and house favourites",
  "Vegetarian Pizzas": "Garden-fresh toppings, no meat",
  "Meat Lovers": "Loaded with cured and grilled meats",
  "Specialty / Gourmet Pizzas": "Chef-led builds and premium toppings",
  "Sides & Appetizers": "Shareable bites, dips and garlic breads",
  "Beverages & Desserts": "Cool sips and sweet finishes",
};

export async function CategoriesSection() {
  const counts = await fetchCategoryCounts();

  return (
    <section
      id="categories"
      aria-labelledby="categories-heading"
      className="bg-cream py-16 sm:py-20"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand-red">
              Our Menu
            </p>
            <h2
              id="categories-heading"
              className="mt-3 text-3xl font-extrabold tracking-tight text-brand-brown sm:text-4xl"
            >
              Browse by Category
            </h2>
            <p className="mt-3 text-sm leading-6 text-brand-brown/60 sm:text-base">
              From stone-baked classics to sweet finishes, find exactly what
              you&apos;re craving.
            </p>
          </div>

          <Link
            href={ROUTES.browseMenu}
            className="group inline-flex items-center gap-2 self-start text-sm font-bold text-brand-red transition-colors hover:text-brand-red-dark sm:self-auto"
          >
            View full menu
            <ArrowUpRight
              aria-hidden="true"
              className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        {counts.length === 0 ? (
          <p className="mt-10 rounded-3xl border border-dashed border-brand-brown/20 bg-white/60 px-6 py-10 text-center text-sm text-brand-brown/60">
            The menu is being prepared. Please check back shortly.
          </p>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {counts.map((category) => (
              <Link
                key={category.category}
                href={`${ROUTES.browseMenu}?category=${encodeURIComponent(category.category)}`}
                className="group relative block aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-brand-brown shadow-[0_18px_40px_-24px_rgba(43,26,18,0.7)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_50px_-24px_rgba(43,26,18,0.6)] sm:aspect-[4/5]"
              >
                <Image
                  src={
                    CATEGORY_IMAGES[category.category] ??
                    "/images/home/category-pizzas.jpg"
                  }
                  alt={category.category}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/5"
                />

                <span className="absolute left-4 top-4 rounded-full bg-cream/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-brand-brown shadow-sm backdrop-blur">
                  {category.count} {category.count === 1 ? "item" : "items"}
                </span>

                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
                  <div className="min-w-0">
                    <h3 className="text-2xl font-extrabold tracking-tight text-cream">
                      {category.category}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-cream/70">
                      {CATEGORY_COPY[category.category] ?? ""}
                    </p>
                  </div>
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-cream text-brand-brown transition-all duration-300 group-hover:bg-brand-red group-hover:text-white">
                    <ArrowRight
                      aria-hidden="true"
                      className="size-4 transition-transform duration-300 group-hover:translate-x-0.5"
                    />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
