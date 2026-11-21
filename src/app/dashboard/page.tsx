"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PrivateRoute } from "@/components/shared/private-route";
import { roleHome, useAuth } from "@/providers/auth-provider";

function DashboardIndexRedirect() {
  const router = useRouter();
  const { user, loading, authError } = useAuth();

  useEffect(() => {
    // PrivateRoute already handles unauthenticated and auth-error states; this
    // effect only chooses the role's landing page once the session is known.
    if (loading || authError || !user) return;
    router.replace(roleHome(user.role));
  }, [authError, loading, router, user]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="flex items-center gap-3 text-sm font-semibold text-brand-brown/60">
        <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        Opening your dashboard…
      </div>
    </div>
  );
}

export default function DashboardIndexPage() {
  return (
    <PrivateRoute>
      <DashboardIndexRedirect />
    </PrivateRoute>
  );
}
