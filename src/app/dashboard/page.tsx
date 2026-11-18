"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { roleHome, useAuth } from "@/providers/auth-provider";

export default function DashboardIndexPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? roleHome(user.role) : "/sign-in");
  }, [loading, router, user]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream">
      <div className="flex items-center gap-3 text-sm font-semibold text-brand-brown/60">
        <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        Opening your dashboard…
      </div>
    </div>
  );
}
