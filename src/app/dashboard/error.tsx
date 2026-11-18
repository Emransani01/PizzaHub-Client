"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface DashboardErrorProps {
  error: unknown;
  retry: () => void;
}

export default function DashboardError({
  error,
  retry,
}: DashboardErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="w-full max-w-md space-y-4 rounded-xl border bg-card p-6 text-center shadow-sm">
        <h1 className="text-xl font-bold">Dashboard could not be loaded</h1>
        <p className="text-sm text-muted-foreground">
          An unexpected error occurred. Try loading the dashboard again.
        </p>
        <Button onClick={() => retry()}>Try Again</Button>
      </div>
    </div>
  );
}
