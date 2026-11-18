import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { APP_NAME, ROUTES } from "@/constants";
import { Logo } from "./logo";
import { SocialLinks } from "./social-links";

const quickLinks = [
  { href: ROUTES.home, label: "Home" },
  { href: ROUTES.browseMenu, label: "Browse Menu" },
  { href: ROUTES.signIn, label: "Sign In" },
  { href: ROUTES.signUp, label: "Sign Up" },
  { href: ROUTES.dashboardCustomer, label: "Dashboard" },
];

const supportLinks = [
  { href: "mailto:support@pizzahub.com", label: "Help Center" },
  { href: ROUTES.customerMyOrders, label: "Track Your Order" },
  { href: "/#service-highlights", label: "Delivery Information" },
  { href: "mailto:feedback@pizzahub.com", label: "Send Feedback" },
];

const contactItems = [
  {
    icon: MapPin,
    text: "123 Oven Street, Naples, FL 34101",
    href: "https://maps.google.com/?q=Naples+FL",
  },
  {
    icon: Phone,
    text: "+1 (555) 012-3456",
    href: "tel:+15550123456",
  },
  {
    icon: Mail,
    text: "hello@pizzahub.com",
    href: "mailto:hello@pizzahub.com",
  },
  {
    icon: Clock,
    text: "Open daily · 11:00 AM – 11:00 PM",
  },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-brand-brown text-cream">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(247,127,0,0.16),transparent_40%),radial-gradient(circle_at_90%_100%,rgba(193,18,31,0.18),transparent_45%)]"
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1.2fr] lg:gap-12 lg:py-16">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo tone="light" />
            <p className="mt-5 max-w-xs text-sm leading-6 text-cream/60">
              Hand-tossed pizza, honest ingredients and doorstep delivery.
              Serving happiness one slice at a time since 1998.
            </p>
            <div className="mt-6">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-gold">
                Follow Us
              </h2>
              <SocialLinks className="mt-3 flex gap-2" />
            </div>
          </div>

          <nav aria-label="Quick links">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-gold">
              Quick Links
            </h2>
            <ul className="mt-4 space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="inline-flex text-sm text-cream/60 transition-colors hover:text-cream"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Support">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-gold">
              Support
            </h2>
            <ul className="mt-4 space-y-2.5">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="inline-flex text-sm text-cream/60 transition-colors hover:text-cream"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-gold">
              Contact Us
            </h2>
            <ul className="mt-4 space-y-3.5">
              {contactItems.map((item) => {
                const Icon = item.icon;
                const content = (
                  <>
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-white/5 text-brand-gold">
                      <Icon aria-hidden="true" className="size-3.5" />
                    </span>
                    <span className="text-sm leading-5 text-cream/60">
                      {item.text}
                    </span>
                  </>
                );

                return (
                  <li key={item.text}>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="flex items-start gap-3 transition-colors hover:text-cream [&>span:last-child]:transition-colors hover:[&>span:last-child]:text-cream"
                      >
                        {content}
                      </a>
                    ) : (
                      <div className="flex items-start gap-3">{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-cream/10 py-6 text-xs text-cream/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; 2026 {APP_NAME}. All rights reserved. Made with extra cheese.
          </p>
          <p>Vendor subscriptions are billed securely through Stripe.</p>
        </div>
      </div>
    </footer>
  );
}
