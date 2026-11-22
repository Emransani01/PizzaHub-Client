"use client";

import { useEffect, useState } from "react";
import { Loader2, Store, UserRound } from "lucide-react";
import { toast } from "sonner";
import { AuthStateNotice } from "@/components/shared/auth-state-notice";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { errorMessage } from "@/lib/api";
import { hardNavigate } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { roleHome, useAuth } from "@/providers/auth-provider";
import { completeRole, updateMyProfile } from "@/services/users";
import type { UserRole } from "@/types";

type OnboardingRole = Extract<UserRole, "customer" | "vendor">;

export function ChooseRoleForm() {
  const { user, loading, authError, refreshing, refresh, refreshSession } =
    useAuth();

  const [role, setRole] = useState<OnboardingRole>("customer");
  const [businessName, setBusinessName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [verifyingRole, setVerifyingRole] = useState(false);
  const [savedRole, setSavedRole] = useState<OnboardingRole | null>(null);
  const [needsSessionRetry, setNeedsSessionRetry] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    // A temporary verification failure must show a recovery state, not bounce
    // the user to Sign In as though they were unauthenticated.
    if (!user && authError) return;
    if (!user) {
      hardNavigate(ROUTES.signIn);
      return;
    }
    if (user.roleOnboarded) {
      hardNavigate(roleHome(user.role));
    }
  }, [authError, loading, user]);

  /** Verifies the already-saved role without repeating the role change. */
  async function verifySavedRole() {
    setVerifyingRole(true);
    setError(null);
    try {
      const verified = await refreshSession();
      if (verified.kind === "unavailable") {
        setNeedsSessionRetry(true);
        setError(
          `${verified.message} Your account type was saved. Retry the session check below to continue.`,
        );
        return;
      }
      if (verified.kind !== "authenticated") {
        setNeedsSessionRetry(false);
        setError(
          "Your account type was saved, but the session could not be confirmed. Please sign in.",
        );
        return;
      }

      setNeedsSessionRetry(false);
      toast.success("Your account type is set. Welcome aboard.");
      hardNavigate(roleHome(verified.session.user.role ?? savedRole ?? role));
    } finally {
      setVerifyingRole(false);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    // The role change is one-shot; once saved, only session verification may retry.
    if (savedRole || submitting || verifyingRole) return;

    if (role === "vendor" && businessName.trim().length < 2) {
      setError("Enter your business name to continue as a vendor.");
      return;
    }

    setSubmitting(true);
    try {
      await completeRole(role);
      setSavedRole(role);
      setNeedsSessionRetry(false);

      if (role === "vendor" && businessName.trim()) {
        try {
          await updateMyProfile({ businessName: businessName.trim() });
        } catch {
          // A missing business name can be fixed later in profile settings.
        }
      }

      await verifySavedRole();
    } catch (cause) {
      const message = errorMessage(cause);
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="h-[360px] animate-pulse rounded-[1.5rem] bg-brand-brown/10" />
    );
  }

  if (!user && authError) {
    return (
      <AuthStateNotice
        error={authError}
        refreshing={refreshing}
        onRetry={() => void refresh()}
      />
    );
  }

  if (!user) {
    return (
      <div className="h-[360px] animate-pulse rounded-[1.5rem] bg-brand-brown/10" />
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[1.5rem] border border-brand-brown/10 bg-white p-6 shadow-[0_22px_50px_-38px_rgba(43,26,18,0.6)] sm:p-7"
    >
      <div className="space-y-1.5">
        <h1 className="text-2xl font-extrabold tracking-tight text-brand-brown">
          How will you use PizzaHub?
        </h1>
        <p className="text-sm text-brand-brown/55">
          Welcome, {user.name.split(" ")[0]}. This choice is permanent for this
          account, so pick carefully.
        </p>
      </div>

      <fieldset className="mt-6">
        <legend className="sr-only">Choose your account type</legend>
        <div className="grid gap-3">
          {(
            [
              {
                value: "customer" as const,
                icon: UserRound,
                title: "Customer",
                copy: "Browse approved dishes from every kitchen, place orders and follow their status.",
              },
              {
                value: "vendor" as const,
                icon: Store,
                title: "Vendor",
                copy: "Publish menu items for admin review and accept or reject incoming orders.",
              },
            ]
          ).map((option) => {
            const Icon = option.icon;
            const active = role === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setRole(option.value)}
                aria-pressed={active}
                disabled={Boolean(savedRole)}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors",
                  active
                    ? "border-brand-red bg-brand-red/5"
                    : "border-brand-brown/15 bg-white hover:border-brand-red/40",
                )}
              >
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl",
                    active
                      ? "bg-brand-red text-white"
                      : "bg-brand-brown/10 text-brand-brown",
                  )}
                >
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-brand-brown">
                    {option.title}
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-brand-brown/55">
                    {option.copy}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {role === "vendor" ? (
        <div className="mt-5 space-y-1.5">
          <label
            htmlFor="choose-role-business"
            className="text-xs font-bold uppercase tracking-wide text-brand-brown/50"
          >
            Business name
          </label>
          <input
            id="choose-role-business"
            type="text"
            required
            disabled={Boolean(savedRole)}
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
            placeholder="e.g. Napoli Slice House"
            className="h-11 w-full rounded-xl border border-brand-brown/15 bg-cream/40 px-3.5 text-sm text-brand-brown outline-none placeholder:text-brand-brown/35 focus:border-brand-red focus:ring-4 focus:ring-brand-red/10"
          />
        </div>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-brand-red/30 bg-brand-red/5 px-3 py-2 text-sm font-medium text-brand-red"
        >
          {error}
        </p>
      ) : null}

      {needsSessionRetry ? (
        <Button
          type="button"
          variant="brandOutline"
          size="cta-md"
          onClick={() => void verifySavedRole()}
          disabled={verifyingRole || submitting}
          className="mt-3 w-full"
        >
          {verifyingRole ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : null}
          Retry session check
        </Button>
      ) : null}

      {savedRole ? null : (
        <Button
          type="submit"
          variant="brand"
          size="cta-md"
          disabled={submitting}
          className="mt-5 w-full"
        >
          {submitting ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : null}
          {submitting ? "Saving…" : "Continue to my dashboard"}
        </Button>
      )}
    </form>
  );
}
