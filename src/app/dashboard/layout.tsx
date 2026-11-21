"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { AuthAccessError } from "@/components/shared/auth-access-error";
import { ROUTES } from "@/constants";
import { roleHome, useAuth } from "@/providers/auth-provider";
import type { UserRole } from "@/types";

function requiredRole(pathname: string): UserRole {
  if (pathname.startsWith("/dashboard/admin")) return "admin";
  if (pathname.startsWith("/dashboard/vendor")) return "vendor";
  return "customer";
}

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, refreshing, authError, refresh } = useAuth();

  const required = requiredRole(pathname);
  const allowed = Boolean(
    user && user.roleOnboarded && user.role === required,
  );

  useEffect(() => {
    if (loading || (!user && authError)) return;

    if (!user) {
      router.replace(
        `${ROUTES.signIn}?next=${encodeURIComponent(pathname)}`,
      );
      return;
    }

    if (!user.roleOnboarded) {
      router.replace(ROUTES.chooseRole);
      return;
    }

    if (user.role !== required) {
      router.replace(roleHome(user.role));
    }
  }, [authError, loading, pathname, required, router, user]);

  if (!loading && !user && authError) {
    return (
      <AuthAccessError
        error={authError}
        refreshing={refreshing}
        onRetry={() => void refresh()}
      />
    );
  }

  if (loading || !allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="flex items-center gap-3 text-sm font-semibold text-brand-brown/60">
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          Checking your access…
        </div>
      </div>
    );
  }

  return (
    <>
      <a
        href="#dashboard-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-brand-red focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
      >
        Skip to dashboard content
      </a>
      <div className="min-h-screen bg-cream lg:flex">
        <DashboardSidebar role={required} />
        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardHeader />
          <main
            id="dashboard-content"
            className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
          >
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
