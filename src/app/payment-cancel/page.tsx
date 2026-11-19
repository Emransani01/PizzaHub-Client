import Link from "next/link";
import type { Metadata } from "next";
import { XCircle } from "lucide-react";
import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { PrivateRoute } from "@/components/shared/private-route";
import { ROUTES } from "@/constants";

export const metadata: Metadata = {
  title: "Checkout cancelled",
  description: "Your PizzaHub Premium checkout was cancelled.",
};

const VENDOR_ONLY = ["vendor"] as const;

export default function PaymentCancelPage() {
  return (
    <PrivateRoute roles={VENDOR_ONLY}>
      <div className="flex min-h-screen flex-col bg-cream">
        <Navbar />
        <main
          id="main-content"
          className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6"
        >
          <div className="w-full max-w-md rounded-[1.75rem] border border-brand-brown/10 bg-white p-7 text-center shadow-[0_28px_60px_-44px_rgba(43,26,18,0.6)] sm:p-9">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-gold/20 text-brand-brown">
              <XCircle aria-hidden="true" className="size-7" />
            </span>
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-brand-brown">
              Checkout cancelled
            </h1>
            <p className="mt-2 text-sm leading-6 text-brand-brown/60">
              No payment was taken and your plan has not changed. You can upgrade
              whenever you are ready.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Link
                href={ROUTES.vendorSubscription}
                className="inline-flex rounded-full bg-brand-red px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-red-dark"
              >
                Back to subscription
              </Link>
              <Link
                href={ROUTES.vendorMyMenuItems}
                className="inline-flex rounded-full border border-brand-brown/20 bg-white px-5 py-2.5 text-sm font-bold text-brand-brown transition-colors hover:border-brand-red hover:text-brand-red"
              >
                My menu items
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </PrivateRoute>
  );
}
