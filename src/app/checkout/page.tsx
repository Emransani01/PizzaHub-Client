import type { Metadata } from "next";
import { CheckoutView } from "@/components/checkout/checkout-view";
import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Confirm delivery details and place your PizzaHub order.",
};

export default function CheckoutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <Navbar />
      <main id="main-content" className="flex-1 py-10 sm:py-14">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand-red">
            Almost there
          </p>
          <h1 className="page-title mt-3">Checkout</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-brand-brown/60 sm:text-base">
            Confirm your delivery details. No card is required — you pay the
            vendor when the order is fulfilled.
          </p>
          <div className="mt-8">
            <CheckoutView />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
