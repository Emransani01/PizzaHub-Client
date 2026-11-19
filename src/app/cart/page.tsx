import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Your cart",
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
              PizzaHub places each order directly from a menu item. This page is
              a quick way back to the menu and your saved dishes.
            </p>
          </div>
        </section>

        <section className="py-10 sm:py-12">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <EmptyState
              icon={ShoppingCart}
              title="Your cart is empty"
              description="Browse the menu, open a dish and use its Order button to place an order. Favourites stay saved to your account."
            >
              <Link
                href={ROUTES.browseMenu}
                className={cn(buttonVariants({ variant: "brand", size: "cta-md" }))}
              >
                <ShoppingCart aria-hidden="true" className="size-4" />
                Browse Menu
              </Link>
              <Link
                href={ROUTES.favorites}
                className={cn(
                  buttonVariants({ variant: "brandOutline", size: "cta-md" }),
                )}
              >
                <Heart aria-hidden="true" className="size-4" />
                View Favourites
              </Link>
            </EmptyState>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
