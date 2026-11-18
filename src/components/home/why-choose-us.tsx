import { Bike, ShieldCheck, Store } from "lucide-react";
import { Reveal } from "@/components/shared/reveal";

const reasons = [
  {
    icon: Store,
    title: "Local kitchens, one menu",
    description:
      "Independent pizza vendors manage their own listings, so every dish you see is live and ready to order.",
  },
  {
    icon: ShieldCheck,
    title: "Reviewed before it goes live",
    description:
      "Administrators approve every menu item and can step in when an account breaks the rules.",
  },
  {
    icon: Bike,
    title: "Track every order",
    description:
      "Follow your order from pending to accepted or rejected, with a full timestamped history.",
  },
];

export function WhyChooseUs() {
  return (
    <section
      id="why-choose-us"
      aria-labelledby="why-choose-us-heading"
      className="bg-white py-16 sm:py-20"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand-red">
            Why PizzaHub
          </p>
          <h2
            id="why-choose-us-heading"
            className="mt-3 text-3xl font-extrabold tracking-tight text-brand-brown sm:text-4xl"
          >
            Built for hungry people and busy kitchens
          </h2>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {reasons.map((reason, index) => {
            const Icon = reason.icon;
            return (
              <Reveal key={reason.title} delay={index * 0.08}>
                <article className="h-full rounded-[1.75rem] border border-brand-brown/10 bg-cream p-7 shadow-[0_16px_40px_-30px_rgba(43,26,18,0.45)]">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-red/10 text-brand-red">
                    <Icon aria-hidden="true" className="size-6" />
                  </span>
                  <h3 className="mt-5 text-lg font-extrabold tracking-tight text-brand-brown">
                    {reason.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-brand-brown/60">
                    {reason.description}
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
