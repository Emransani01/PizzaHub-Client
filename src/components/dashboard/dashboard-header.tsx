"use client";

import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ROLE_LABELS, ROUTES } from "@/constants";
import { useAuth } from "@/providers/auth-provider";

export function DashboardHeader() {
  const { user, signOut, signingOut } = useAuth();
  const firstName =
    user?.name
      .trim()
      .split(/\s+/)[0] ?? "Dashboard";

  return (
    <header className="flex flex-col gap-3 border-b border-brand-brown/10 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar
          name={user?.name ?? "PizzaHub"}
          image={user?.image}
          className="size-10 text-sm"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-brand-brown">
            {user ? `Welcome back, ${firstName}` : "Dashboard"}
          </p>
          <p className="truncate text-xs text-brand-brown/50">
            {user
              ? `${ROLE_LABELS[user.role]} account · ${user.email}`
              : "Manage your PizzaHub account"}
          </p>
        </div>
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {user?.role === "vendor" ? (
          <span className="rounded-full bg-brand-gold/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-brown">
            {user.subscriptionPlan === "premium" ? "Premium" : "Free plan"}
          </span>
        ) : null}
        <ThemeToggle className="size-9 border border-brand-brown/15" />
        <Link
          href={ROUTES.profileSettings}
          className="inline-flex items-center gap-1.5 rounded-full border border-brand-brown/15 bg-white px-3.5 py-2 text-xs font-bold text-brand-brown transition-colors hover:border-brand-red hover:text-brand-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red"
        >
          <Settings aria-hidden="true" className="size-3.5" />
          Profile
        </Link>
        <button
          type="button"
          onClick={() => void signOut()}
          disabled={signingOut}
          aria-busy={signingOut}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand-red px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-red-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogOut aria-hidden="true" className="size-3.5" />
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </header>
  );
}
