"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { DASHBOARD_NAV, ROLE_LABELS, ROUTES } from "@/constants";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

export function DashboardSidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const links = DASHBOARD_NAV[role];

  return (
    <aside className="w-full shrink-0 border-b border-brand-brown/10 bg-white lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between gap-2 px-4 py-4">
        <Logo />
        <span className="rounded-full bg-brand-gold/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-brown">
          {ROLE_LABELS[role]}
        </span>
      </div>

      <nav
        aria-label={`${ROLE_LABELS[role]} dashboard`}
        className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:pb-6"
      >
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors",
                active
                  ? "bg-brand-red text-white shadow-[0_8px_18px_-12px_rgba(193,18,31,0.9)]"
                  : "text-brand-brown/70 hover:bg-brand-red/5 hover:text-brand-red",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="hidden px-3 pb-6 lg:block">
        <Link
          href={ROUTES.home}
          className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold text-brand-brown/50 transition-colors hover:text-brand-red"
        >
          <ArrowLeft aria-hidden="true" className="size-3.5" />
          Back to the site
        </Link>
      </div>
    </aside>
  );
}
