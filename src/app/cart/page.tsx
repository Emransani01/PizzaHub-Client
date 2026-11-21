import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";
import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";

export const metadata: Metadata = {
  title: "Your cart",
  description: "Review your dishes and check out in one step.",
};

export default function CartPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <Navbar />
      <main id="main-content" className="flex-1">
        <section className="border-b border-brand-brown/10 bg-cream-deep/50 py-12 sm:py-16">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand-red">
              Your order
            </p>
            <h1 className="page-title mt-3">Cart</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-brand-brown/60 sm:text-base">
              Review every dish before you order. Prices are confirmed again at
              checkout, and one checkout can include items from several vendors.
            </p>
          </div>
        </section>

        <section className="py-10 sm:py-12">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <CartView />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
