import {
  BadgeCheck,
  Bike,
  Headphones,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

interface Service {
  icon: LucideIcon;
  title: string;
  description: string;
}

const services: Service[] = [
  {
    icon: Bike,
    title: "Fast Delivery",
    description: "Hot, fresh pizza at your door in 30 minutes or less.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payment",
    description: "Safe, simple checkout with trusted payment partners.",
  },
  {
    icon: BadgeCheck,
    title: "Top Quality",
    description: "Fresh ingredients and dough prepared every morning.",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Real people ready to help whenever you need us.",
  },
];

export function ServiceHighlights() {
  return (
    <section
      id="service-highlights"
      aria-label="Why order from PizzaHub"
      className="relative z-20 bg-cream"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="-mt-10 grid overflow-hidden rounded-[1.75rem] border border-brand-brown/10 bg-white shadow-[0_24px_60px_-30px_rgba(43,26,18,0.45)] sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.title}
                className="group flex items-start gap-4 border-b border-brand-brown/10 p-6 transition-colors duration-300 last:border-b-0 hover:bg-cream/70 sm:border-r sm:[&:nth-child(2n)]:border-r-0 sm:[&:nth-child(3)]:border-b-0 lg:border-b-0 lg:border-r lg:[&:nth-child(2n)]:border-r lg:[&:nth-child(4)]:border-r-0"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-red/10 text-brand-red transition-all duration-300 group-hover:-rotate-6 group-hover:bg-brand-red group-hover:text-white">
                  <Icon aria-hidden="true" className="size-6" strokeWidth={1.8} />
                </span>
                <div>
                  <h2 className="text-sm font-extrabold tracking-tight text-brand-brown sm:text-base">
                    {service.title}
                  </h2>
                  <p className="mt-1.5 text-xs leading-5 text-brand-brown/60 sm:text-sm">
                    {service.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
