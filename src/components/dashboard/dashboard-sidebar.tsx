"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Menu, X } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { DASHBOARD_NAV, ROLE_LABELS, ROUTES } from "@/constants";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

export function DashboardSidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const links = DASHBOARD_NAV[role];
  const overviewHref = links[0]?.href;

  // Close the mobile navigation after a route change so the main content is
  // immediately visible when keyboard or touch users follow a dashboard link.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <aside className="w-full shrink-0 border-b border-brand-brown/10 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:flex-col lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-5 lg:py-5">
        <Logo />
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-brand-gold/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-brown">
            {ROLE_LABELS[role]}
          </span>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="dashboard-navigation"
            aria-label={
              menuOpen
                ? `Close ${ROLE_LABELS[role]} navigation`
                : `Open ${ROLE_LABELS[role]} navigation`
            }
            className="inline-flex size-9 items-center justify-center rounded-xl border border-brand-brown/15 text-brand-brown transition-colors hover:border-brand-red hover:text-brand-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red lg:hidden"
          >
            {menuOpen ? (
              <X aria-hidden="true" className="size-4" />
            ) : (
              <Menu aria-hidden="true" className="size-4" />
            )}
          </button>
        </div>
      </div>

      <nav
        id="dashboard-navigation"
        aria-label={`${ROLE_LABELS[role]} dashboard navigation`}
        className={cn(
          "border-t border-brand-brown/10 px-3 pb-4 pt-2 lg:flex lg:flex-1 lg:flex-col lg:border-t-0 lg:px-3 lg:pb-6 lg:pt-0",
          menuOpen ? "block" : "hidden",
        )}
      >
        <ul className="space-y-1">
          {links.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== overviewHref &&
                pathname.startsWith(`${link.href}/`));
            const Icon = link.icon;

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red",
                    active
                      ? "bg-brand-red text-white shadow-[0_8px_18px_-12px_rgba(193,18,31,0.9)]"
                      : "text-brand-brown/70 hover:bg-brand-red/5 hover:text-brand-red",
                  )}
                >
                  <Icon aria-hidden="true" className="size-4 shrink-0" />
                  <span className="truncate">{link.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-3 border-t border-brand-brown/10 pt-3 lg:mt-auto">
          <Link
            href={ROUTES.home}
            onClick={() => setMenuOpen(false)}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-brand-brown/50 transition-colors hover:text-brand-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red"
          >
            <ArrowLeft aria-hidden="true" className="size-3.5" />
            Back to the site
          </Link>
        </div>
      </nav>
    </aside>
  );
}
