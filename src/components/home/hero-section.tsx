import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bike, Clock, Star } from "lucide-react";
import { ROUTES } from "@/constants";

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-brand-brown">
      <Image
        src="/images/home/hero-bg.jpg"
        alt=""
        fill
        loading="eager"
        fetchPriority="high"
        sizes="100vw"
        className="object-cover object-center opacity-40"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-[#180d07] via-[#1d110a]/90 to-[#1d110a]/45"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_75%_40%,rgba(247,127,0,0.2),transparent_55%)]"
      />

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-14 px-4 pb-24 pt-16 sm:px-6 sm:pb-28 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:px-8 lg:pb-32 lg:pt-24">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-3">
            <span
              aria-hidden="true"
              className="h-px w-10 bg-brand-gold/70"
            />
            <p className="font-serif text-lg italic tracking-wide text-brand-gold sm:text-xl">
              Good Food. Good Mood!
            </p>
          </div>

          <h1 className="mt-5 text-shadow-hero text-4xl font-extrabold leading-[1.06] tracking-tight text-cream sm:text-5xl lg:text-6xl xl:text-7xl">
            Delicious Pizza,
            <br />
            <span className="relative inline-block text-brand-gold">
              Delivered
              <svg
                aria-hidden="true"
                viewBox="0 0 300 12"
                preserveAspectRatio="none"
                className="absolute -bottom-1.5 left-0 h-2.5 w-full text-brand-gold/70 sm:-bottom-2"
              >
                <path
                  d="M3 9C60 3 180 2 297 6"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="4"
                />
              </svg>
            </span>{" "}
            to
            <br />
            Your Door!
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-cream/75 sm:text-lg sm:leading-8">
            Hand-tossed dough, stone-baked crusts and generous layers of melted
            cheese. Your next favourite pizza is hot, fresh and only minutes
            away.
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href={ROUTES.browseMenu}
              className="group inline-flex items-center justify-center gap-3 rounded-full bg-brand-red px-7 py-4 text-sm font-bold uppercase tracking-wide text-white shadow-[0_16px_32px_-14px_rgba(193,18,31,1)] transition-all hover:-translate-y-0.5 hover:bg-brand-red-dark"
            >
              Browse Menu
              <span className="flex size-6 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-1">
                <ArrowRight aria-hidden="true" className="size-3.5" />
              </span>
            </Link>

            <div className="flex items-center gap-2.5 text-sm font-medium text-cream/65">
              <span className="flex size-9 items-center justify-center rounded-full border border-cream/15 bg-white/5">
                <Clock aria-hidden="true" className="size-4 text-brand-gold" />
              </span>
              30 min average delivery
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[30rem] lg:mr-4 lg:max-w-none">
          <div
            aria-hidden="true"
            className="absolute inset-8 rounded-full bg-brand-orange/25 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 animate-pizzahub-spin-slow rounded-full border border-dashed border-brand-gold/30"
          />

          <div className="relative aspect-square animate-pizzahub-float overflow-hidden rounded-full border-[6px] border-cream/10 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.85)]">
            <Image
              src="/images/home/hero-pizza.jpg"
              alt="Stone-baked pizza with melted mozzarella, basil and blistered crust"
              fill
              loading="eager"
              sizes="(min-width: 1024px) 520px, (min-width: 640px) 480px, 86vw"
              className="object-cover object-[38%_center]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/15"
            />
          </div>

          <div className="absolute -right-2 top-5 flex items-center gap-2.5 rounded-2xl bg-cream px-4 py-3 shadow-xl shadow-black/25 sm:right-2 sm:top-8">
            <div className="flex size-9 items-center justify-center rounded-full bg-brand-gold/25">
              <Star
                aria-hidden="true"
                className="size-4 fill-brand-gold text-brand-gold"
              />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-extrabold text-brand-brown">4.9 / 5</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-brown/50">
                2k+ foodies
              </p>
            </div>
          </div>

          <div className="absolute -left-2 bottom-8 flex items-center gap-3 rounded-2xl bg-cream px-4 py-3 shadow-xl shadow-black/25 sm:-left-4 sm:bottom-12">
            <div className="flex size-10 items-center justify-center rounded-full bg-brand-red text-white">
              <Bike aria-hidden="true" className="size-5" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-extrabold text-brand-brown">
                Hot &amp; fresh
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-brown/50">
                At your door in 30 min
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
