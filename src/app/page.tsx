import { Suspense } from "react";
import { CategoriesSection } from "@/components/home/categories-section";
import { FeaturedMenu } from "@/components/home/featured-menu";
import { HeroSection } from "@/components/home/hero-section";
import { HowItWorks } from "@/components/home/how-it-works";
import { ServiceHighlights } from "@/components/home/service-highlights";
import { SpecialOffer } from "@/components/home/special-offer";
import { WhyChooseUs } from "@/components/home/why-choose-us";
import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";

function CategoriesFallback() {
  return (
    <div className="bg-cream py-16 sm:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-8 w-56 animate-pulse rounded-full bg-brand-brown/10" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="aspect-[4/3] animate-pulse rounded-[1.75rem] bg-brand-brown/10 sm:aspect-[4/5]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FeaturedFallback() {
  return (
    <div className="bg-white py-16 sm:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-8 w-64 animate-pulse rounded-full bg-brand-brown/10" />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-80 animate-pulse rounded-[1.75rem] bg-brand-brown/10"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div id="top" className="flex min-h-screen flex-col bg-cream">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <ServiceHighlights />
        <Suspense fallback={<CategoriesFallback />}>
          <CategoriesSection />
        </Suspense>
        <Suspense fallback={<FeaturedFallback />}>
          <FeaturedMenu />
        </Suspense>
        <WhyChooseUs />
        <HowItWorks />
        <SpecialOffer />
      </main>
      <Footer />
    </div>
  );
}
