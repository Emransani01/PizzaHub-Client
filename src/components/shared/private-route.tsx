"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AuthAccessError } from "@/components/shared/auth-access-error";
import { ROUTES } from "@/constants";
import { safeNextPath } from "@/lib/navigation";
import { roleHome, useAuth } from "@/providers/auth-provider";
import type { UserRole } from "@/types";

interface PrivateRouteProps {
  children: ReactNode;
  /** When supplied, only these roles may see the protected content. */
  roles?: readonly UserRole[];
}

/**
 * Client-side companion to the optimistic cookie check in `proxy.ts`.
 *
 * The Express API remains the real authorization boundary: this component only
 * prevents the UI from rendering before the session and role are known, and it
 * redirects to Sign In with a validated next path so the user returns to the
 * page they requested after authenticating.
 */
export function PrivateRoute({ children, roles }: PrivateRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, refreshing, authError, refresh } = useAuth();

  const allowed = Boolean(
    user &&
      user.roleOnboarded &&
      (!roles || roles.includes(user.role)),
  );

  useEffect(() => {
    if (loading || (!user && authError)) return;

    if (!user) {
      const destination = safeNextPath(
        `${window.location.pathname}${window.location.search}${window.location.hash}`,
        pathname,
      );
      router.replace(
        `${ROUTES.signIn}?next=${encodeURIComponent(destination)}`,
      );
      return;
    }

    if (!user.roleOnboarded) {
      router.replace(ROUTES.chooseRole);
      return;
    }

    if (roles && !roles.includes(user.role)) {
      router.replace(roleHome(user.role));
    }
  }, [authError, loading, pathname, roles, router, user]);

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
      <div
        className="flex min-h-screen items-center justify-center bg-cream"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3 text-sm font-semibold text-brand-brown/60">
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          Checking your access…
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
