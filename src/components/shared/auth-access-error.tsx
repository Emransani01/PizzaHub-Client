"use client";

import Link from "next/link";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import type { AuthError } from "@/providers/auth-provider";

interface AuthAccessErrorProps {
  error: AuthError;
  refreshing: boolean;
  onRetry: () => void;
}

/**
 * Shared protected-route state for token refresh failures. It is rendered
 * instead of a redirect only when there is no user, so a valid session keeps
 * access to the page it was already on.
 */
export function AuthAccessError({
  error,
  refreshing,
  onRetry,
}: AuthAccessErrorProps) {
  const blocked = error.kind === "forbidden";

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-cream px-4"
      role="alert"
      aria-live="assertive"
    >
      <div className="w-full max-w-md rounded-[1.5rem] border border-brand-brown/10 bg-white p-6 text-center shadow-[0_20px_50px_-42px_rgba(43,26,18,0.55)]">
        <AlertTriangle
          aria-hidden="true"
          className="mx-auto size-7 text-brand-red"
        />
        <h1 className="mt-3 text-lg font-bold text-brand-brown">
          {blocked ? "Account access blocked" : "Session check unavailable"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-brand-brown/70">
          {error.message}
        </p>

        <div className="mt-5 flex justify-center">
          {blocked ? (
            <Link href={ROUTES.signIn} className={buttonVariants({ variant: "brand", size: "cta-md" })}>
              Back to sign in
            </Link>
          ) : (
            <Button
              type="button"
              variant="brand"
              size="cta-md"
              onClick={onRetry}
              disabled={refreshing}
              aria-busy={refreshing}
            >
              {refreshing ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : null}
              {refreshing ? "Retrying…" : "Retry"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
