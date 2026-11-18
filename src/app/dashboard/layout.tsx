"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
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
  const { user, loading } = useAuth();

  const required = requiredRole(pathname);
  const allowed = Boolean(
    user && user.roleOnboarded && user.role === required,
  );

  useEffect(() => {
    if (loading) return;

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
  }, [loading, pathname, required, router, user]);

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
    <div className="min-h-screen bg-cream lg:flex">
      <DashboardSidebar role={required} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
