"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import { ROUTES, ROLE_LABELS } from "@/constants";
import { cn } from "@/lib/utils";
import { roleHome, useAuth } from "@/providers/auth-provider";
import { Logo } from "./logo";

const navLinks = [
  { href: ROUTES.home, label: "Home" },
  { href: ROUTES.browseMenu, label: "Browse Menu" },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, loading, favoriteIds, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) =>
    href === ROUTES.home ? pathname === href : pathname.startsWith(href);

  useEffect(() => {
    setOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    const onClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const dashboardHref = user ? roleHome(user.role) : ROUTES.dashboardCustomer;

  return (
    <header className="sticky top-0 z-50 border-b border-brand-brown/10 bg-cream/95 backdrop-blur-md">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-8 lg:flex"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={cn(
                "relative inline-flex h-20 items-center text-[15px] font-semibold transition-colors after:absolute after:bottom-5 after:left-1/2 after:h-0.5 after:w-0 after:-translate-x-1/2 after:rounded-full after:bg-brand-red after:transition-all after:duration-300 hover:text-brand-red hover:after:w-full",
                isActive(link.href)
                  ? "text-brand-red after:w-full"
                  : "text-brand-brown/75",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {user ? (
            <Link
              href={dashboardHref}
              className="hidden items-center gap-2 rounded-full bg-brand-red px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_-8px_rgba(193,18,31,0.9)] transition-all hover:-translate-y-0.5 hover:bg-brand-red-dark hover:shadow-[0_12px_24px_-8px_rgba(193,18,31,0.9)] sm:inline-flex"
            >
              <LayoutDashboard aria-hidden="true" className="size-4" />
              Dashboard
            </Link>
          ) : null}

          <Link
            href={ROUTES.favorites}
            aria-label={
              user
                ? `Saved favourites (${favoriteIds.length})`
                : "Saved favourites — sign in to view"
            }
            className="group relative ml-0.5 inline-flex size-10 items-center justify-center rounded-full text-brand-brown transition-colors hover:bg-brand-red/10 hover:text-brand-red"
          >
            <Heart aria-hidden="true" className="size-5" />
            {user && favoriteIds.length > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-brand-gold text-[10px] font-bold text-brand-brown">
                {favoriteIds.length}
              </span>
            ) : null}
          </Link>

          {loading ? (
            <span
              aria-hidden="true"
              className="hidden size-8 animate-pulse rounded-full bg-brand-brown/10 md:inline-block"
            />
          ) : user ? (
            <div ref={menuRef} className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setMenuOpen((value) => !value)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="inline-flex items-center gap-2 rounded-full border border-brand-brown/15 bg-white/70 py-1.5 pl-1.5 pr-3 text-sm font-semibold text-brand-brown transition-colors hover:border-brand-red/30 hover:text-brand-red"
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-brand-red text-xs font-bold text-white">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="max-w-28 truncate">{user.name}</span>
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    "size-4 transition-transform",
                    menuOpen && "rotate-180",
                  )}
                />
              </button>

              {menuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-12 w-60 overflow-hidden rounded-2xl border border-brand-brown/10 bg-white shadow-2xl shadow-brand-brown/15"
                >
                  <div className="border-b border-brand-brown/10 px-4 py-3">
                    <p className="truncate text-sm font-bold text-brand-brown">
                      {user.name}
                    </p>
                    <p className="truncate text-xs text-brand-brown/55">
                      {user.email}
                    </p>
                    <span className="mt-2 inline-flex rounded-full bg-brand-gold/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-brown">
                      {ROLE_LABELS[user.role]}
                      {user.subscriptionPlan === "premium" ? " · Premium" : ""}
                    </span>
                  </div>
                  <div className="p-1.5">
                    <Link
                      href={dashboardHref}
                      role="menuitem"
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-brand-brown transition-colors hover:bg-brand-red/5 hover:text-brand-red"
                    >
                      <LayoutDashboard aria-hidden="true" className="size-4" />
                      Dashboard
                    </Link>
                    <Link
                      href={ROUTES.profileSettings}
                      role="menuitem"
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-brand-brown transition-colors hover:bg-brand-red/5 hover:text-brand-red"
                    >
                      <Settings aria-hidden="true" className="size-4" />
                      Profile settings
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        void signOut();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-brand-red transition-colors hover:bg-brand-red/5"
                    >
                      <LogOut aria-hidden="true" className="size-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <Link
                href={ROUTES.signIn}
                className="hidden rounded-full px-3 py-2 text-sm font-semibold text-brand-brown/80 transition-colors hover:text-brand-red md:inline-flex"
              >
                Sign In
              </Link>
              <Link
                href={ROUTES.signUp}
                className="hidden rounded-full border border-brand-brown/20 px-4 py-2 text-sm font-semibold text-brand-brown transition-colors hover:border-brand-red hover:text-brand-red md:inline-flex"
              >
                Sign Up
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex size-10 items-center justify-center rounded-full text-brand-brown transition-colors hover:bg-brand-red/10 hover:text-brand-red lg:hidden"
          >
            {open ? (
              <X aria-hidden="true" className="size-5" />
            ) : (
              <Menu aria-hidden="true" className="size-5" />
            )}
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="mobile-navigation"
          className="absolute inset-x-0 top-full max-h-[calc(100vh-5rem)] overflow-y-auto border-b border-brand-brown/10 bg-cream px-4 pb-6 pt-2 shadow-2xl shadow-brand-brown/10 lg:hidden"
        >
          <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "flex items-center justify-between rounded-2xl px-4 py-3 text-base font-semibold transition-colors",
                  isActive(link.href)
                    ? "bg-brand-red/10 text-brand-red"
                    : "text-brand-brown hover:bg-brand-red/5",
                )}
              >
                {link.label}
                <ArrowRight aria-hidden="true" className="size-4 opacity-50" />
              </Link>
            ))}
            <div className="my-3 h-px bg-brand-brown/10" />

            {user ? (
              <>
                <div className="mb-2 flex items-center gap-3 rounded-2xl bg-white/60 px-4 py-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-brand-red text-sm font-bold text-white">
                    {user.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-brand-brown">
                      {user.name}
                    </p>
                    <p className="truncate text-xs text-brand-brown/55">
                      {ROLE_LABELS[user.role]}
                    </p>
                  </div>
                </div>
                <Link
                  href={dashboardHref}
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-red px-5 py-3 text-sm font-bold text-white"
                >
                  <LayoutDashboard aria-hidden="true" className="size-4" />
                  Dashboard
                </Link>
                <Link
                  href={ROUTES.favorites}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-2xl px-4 py-3 text-base font-semibold text-brand-brown transition-colors hover:bg-brand-red/5"
                >
                  <Heart aria-hidden="true" className="size-4" />
                  Favourites
                </Link>
                <Link
                  href={ROUTES.profileSettings}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-2xl px-4 py-3 text-base font-semibold text-brand-brown transition-colors hover:bg-brand-red/5"
                >
                  <Settings aria-hidden="true" className="size-4" />
                  Profile settings
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    void signOut();
                  }}
                  className="flex items-center gap-2 rounded-2xl px-4 py-3 text-left text-base font-semibold text-brand-red transition-colors hover:bg-brand-red/5"
                >
                  <LogOut aria-hidden="true" className="size-4" />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href={ROUTES.signIn}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-2xl px-4 py-3 text-base font-semibold text-brand-brown transition-colors hover:bg-brand-red/5"
                >
                  <UserRound aria-hidden="true" className="size-4" />
                  Sign In
                </Link>
                <Link
                  href={ROUTES.signUp}
                  onClick={() => setOpen(false)}
                  className="rounded-2xl px-4 py-3 text-base font-semibold text-brand-brown transition-colors hover:bg-brand-red/5"
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
