import Image from "next/image";
import type { ReactNode } from "react";
import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";

interface AuthShellProps {
  children: ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <Navbar />
      <main
        id="main-content"
        className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-14"
      >
        <div className="grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="relative hidden overflow-hidden rounded-[2rem] bg-brand-brown p-10 lg:block">
            <Image
              src="/images/home/hero-bg.jpg"
              alt=""
              fill
              sizes="(min-width: 1024px) 45vw, 0px"
              className="object-cover opacity-35"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-br from-[#180d07]/90 via-[#1d110a]/85 to-[#8e0e17]/70"
            />
            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand-gold">
                PizzaHub
              </p>
              <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-cream xl:text-4xl">
                One account.
                <br />
                Every local kitchen.
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-7 text-cream/70">
                Customers order and track, vendors manage menus and orders, and
                administrators keep the marketplace honest — all from one
                platform.
              </p>
              <ul className="mt-8 space-y-3 text-sm text-cream/80">
                <li className="flex items-start gap-2">
                  <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-gold" />
                  No card required to place a pizza order.
                </li>
                <li className="flex items-start gap-2">
                  <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-gold" />
                  Free vendor plan with three live menu items.
                </li>
                <li className="flex items-start gap-2">
                  <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-gold" />
                  Premium vendor billing handled securely by Stripe.
                </li>
              </ul>
            </div>
          </section>

          <div className="w-full">{children}</div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
