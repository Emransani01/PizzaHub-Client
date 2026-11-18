import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChefHat } from "lucide-react";
import { ROUTES } from "@/constants";

export function SpecialOffer() {
  return (
    <section
      id="special-offer"
      aria-labelledby="special-offer-heading"
      className="bg-cream py-16 sm:py-20"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-brand-red px-6 py-10 shadow-[0_30px_60px_-30px_rgba(142,14,23,0.8)] sm:px-10 lg:px-14 lg:py-14">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(246,185,59,0.35),transparent_45%),radial-gradient(circle_at_10%_100%,rgba(142,14,23,1),transparent_55%)]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle,rgba(255,255,255,0.45)_1px,transparent_1px)] [background-size:20px_20px]"
          />
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-20 size-64 rounded-full border-[40px] border-white/5"
          />

          <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-gold/40 bg-brand-gold/15 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold">
                <ChefHat aria-hidden="true" className="size-3.5" />
                For pizza kitchens
              </div>

              <h2
                id="special-offer-heading"
                className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-cream sm:text-4xl lg:text-5xl"
              >
                Put your kitchen on the{" "}
                <span className="text-brand-gold">PizzaHub menu</span>
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-cream/80 sm:text-base sm:leading-7">
                Create a free vendor account, publish up to three approved menu
                items and start receiving orders. Upgrade to Premium when you
                are ready to list more.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link
                  href={`${ROUTES.signUp}?role=vendor`}
                  className="group inline-flex items-center justify-center gap-3 rounded-full bg-cream px-7 py-4 text-sm font-bold uppercase tracking-wide text-brand-brown shadow-lg transition-all hover:-translate-y-0.5 hover:bg-brand-gold"
                >
                  Become a vendor
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                  />
                </Link>

                <Link
                  href={ROUTES.browseMenu}
                  className="text-xs font-semibold text-cream/70 underline-offset-4 transition-colors hover:text-cream hover:underline sm:text-sm"
                >
                  Or order from a local kitchen
                </Link>
              </div>
            </div>

            <div className="relative mx-auto hidden w-64 lg:block xl:w-72">
              <div
                aria-hidden="true"
                className="absolute inset-0 scale-90 rounded-full bg-brand-gold/30 blur-2xl"
              />
              <div className="relative aspect-square -rotate-6 overflow-hidden rounded-full border-[6px] border-cream/20 shadow-2xl transition-transform duration-500 hover:rotate-0">
                <Image
                  src="/images/home/margherita.jpg"
                  alt="Margherita pizza fresh from a partner kitchen"
                  fill
                  sizes="288px"
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-3 -left-3 flex size-20 -rotate-6 flex-col items-center justify-center rounded-full bg-brand-gold text-brand-brown shadow-xl">
                <span className="text-xl font-extrabold leading-none">3</span>
                <span className="mt-1 px-2 text-center text-[9px] font-bold uppercase leading-tight tracking-widest">
                  Free items
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
