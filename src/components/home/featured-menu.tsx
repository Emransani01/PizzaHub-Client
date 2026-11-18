import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Crown, MapPin, Store } from "lucide-react";
import { FALLBACK_FOOD_IMAGE, ROUTES } from "@/constants";
import { formatCurrency } from "@/lib/utils";
import { fetchFeaturedItems } from "@/lib/server-api";

export async function FeaturedMenu() {
  const items = await fetchFeaturedItems();

  return (
    <section
      id="popular-pizzas"
      aria-labelledby="popular-pizzas-heading"
      className="bg-white py-16 sm:py-20"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand-red">
              Fresh from the oven
            </p>
            <h2
              id="popular-pizzas-heading"
              className="mt-3 text-3xl font-extrabold tracking-tight text-brand-brown sm:text-4xl"
            >
              Popular Right Now
            </h2>
            <p className="mt-3 text-sm leading-6 text-brand-brown/60 sm:text-base">
              Live dishes from approved vendor menus, with Premium kitchens
              placed first.
            </p>
          </div>

          <Link
            href={ROUTES.browseMenu}
            className="group inline-flex items-center gap-2 self-start text-sm font-bold text-brand-red transition-colors hover:text-brand-red-dark lg:self-auto"
          >
            Browse everything
            <ArrowUpRight
              aria-hidden="true"
              className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="mt-10 rounded-[1.75rem] border border-dashed border-brand-brown/20 bg-cream px-6 py-14 text-center">
            <p className="text-lg font-bold text-brand-brown">
              No approved dishes yet
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-brand-brown/60">
              Vendors are still stocking their kitchens. Once an administrator
              approves a menu item it will appear here automatically.
            </p>
            <Link
              href={ROUTES.browseMenu}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-red px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-red-dark"
            >
              Visit the menu
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {items.slice(0, 8).map((item) => (
              <article
                key={item.id}
                className="group flex flex-col overflow-hidden rounded-[1.75rem] border border-brand-brown/10 bg-white shadow-[0_16px_40px_-30px_rgba(43,26,18,0.55)] transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-red/20 hover:shadow-[0_26px_50px_-26px_rgba(43,26,18,0.5)]"
              >
                <Link
                  href={ROUTES.menuItem(item.id)}
                  className="relative block aspect-[4/3] overflow-hidden bg-cream-deep"
                >
                  <Image
                    src={item.images[0] ?? FALLBACK_FOOD_IMAGE}
                    alt={item.itemName}
                    fill
                    sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {item.isPremiumVendor ? (
                    <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-brand-gold px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-brown">
                      <Crown aria-hidden="true" className="size-3" />
                      Premium
                    </span>
                  ) : null}
                  <span className="absolute right-4 top-4 rounded-full bg-brand-brown/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-cream backdrop-blur">
                    {item.category}
                  </span>
                </Link>

                <div className="flex flex-1 flex-col p-5">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-brown/50">
                    <Store aria-hidden="true" className="size-3.5" />
                    {item.vendorName}
                  </p>

                  <h3 className="mt-2 text-lg font-extrabold tracking-tight text-brand-brown transition-colors group-hover:text-brand-red">
                    <Link href={ROUTES.menuItem(item.id)}>{item.itemName}</Link>
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-brand-brown/55">
                    {item.description}
                  </p>

                  <div className="mt-auto flex items-end justify-between gap-3 pt-6">
                    <div>
                      <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-brand-brown/40">
                        <MapPin aria-hidden="true" className="size-3" />
                        {item.location}
                      </p>
                      <p className="mt-1 text-xl font-extrabold tracking-tight text-brand-red">
                        {formatCurrency(item.price)}
                      </p>
                    </div>
                    <Link
                      href={ROUTES.menuItem(item.id)}
                      aria-label={`View ${item.itemName}`}
                      className="inline-flex size-10 items-center justify-center rounded-full bg-brand-red text-white transition-all hover:-translate-y-0.5 hover:bg-brand-red-dark"
                    >
                      <ArrowUpRight aria-hidden="true" className="size-4" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
