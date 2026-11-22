"use client";

import Link from "next/link";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import type { AuthError } from "@/providers/auth-provider";

interface AuthStateNoticeProps {
  error: AuthError;
  refreshing: boolean;
  onRetry: () => void;
}

/**
 * Compact inline counterpart to `AuthAccessError` for public pages. It keeps a
 * temporary outage or expired session from being presented as "Sign in".
 */
export function AuthStateNotice({
  error,
  refreshing,
  onRetry,
}: AuthStateNoticeProps) {
  const blocked = error.kind === "forbidden";
  const expired = error.kind === "sessionExpired";
  const canRetry = error.kind === "unavailable";

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-[1.5rem] border border-brand-brown/10 bg-white p-6 text-center shadow-[0_18px_40px_-36px_rgba(43,26,18,0.5)]"
    >
      <AlertTriangle
        aria-hidden="true"
        className="mx-auto size-6 text-brand-red"
      />
      <h2 className="mt-3 text-base font-extrabold text-brand-brown">
        {blocked
          ? "Account access blocked"
          : expired
            ? "Session expired"
            : "Session check unavailable"}
      </h2>
      <p className="mt-1.5 text-sm leading-6 text-brand-brown/65">
        {error.message}
      </p>
      <div className="mt-4 flex justify-center">
        {canRetry ? (
          <Button
            type="button"
            variant="brand"
            size="cta-sm"
            onClick={onRetry}
            disabled={refreshing}
            aria-busy={refreshing}
          >
            {refreshing ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : null}
            {refreshing ? "Retrying…" : "Retry"}
          </Button>
        ) : (
          <Link
            href={
              expired ? `${ROUTES.signIn}?reason=session-expired` : ROUTES.signIn
            }
            className={buttonVariants({ variant: "brand", size: "cta-sm" })}
          >
            Back to sign in
          </Link>
        )}
      </div>
    </div>
  );
}
