import { ClipboardList, Search, UtensilsCrossed } from "lucide-react";
import { Reveal } from "@/components/shared/reveal";

const steps = [
  {
    step: "01",
    icon: Search,
    title: "Find your dish",
    description:
      "Filter the live menu by category, kitchen location or price and open the item you want.",
  },
  {
    step: "02",
    icon: UtensilsCrossed,
    title: "Place your order",
    description:
      "Pick a delivery date, confirm your address and send the order straight to the vendor. No card needed.",
  },
  {
    step: "03",
    icon: ClipboardList,
    title: "Follow the timeline",
    description:
      "Watch the vendor accept or reject it, and revisit every status change from your dashboard.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="bg-cream-deep/60 py-16 sm:py-20"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand-red">
            How it works
          </p>
          <h2
            id="how-it-works-heading"
            className="mt-3 text-3xl font-extrabold tracking-tight text-brand-brown sm:text-4xl"
          >
            Three steps from craving to dinner
          </h2>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.step} delay={index * 0.08}>
                <article className="relative h-full overflow-hidden rounded-[1.75rem] border border-brand-brown/10 bg-white p-7">
                  <span className="absolute right-5 top-4 text-5xl font-extrabold text-brand-brown/5">
                    {item.step}
                  </span>
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-brown text-brand-gold">
                    <Icon aria-hidden="true" className="size-6" />
                  </span>
                  <h3 className="mt-5 text-lg font-extrabold tracking-tight text-brand-brown">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-brand-brown/60">
                    {item.description}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
