"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Store, UserRound } from "lucide-react";
import { toast } from "sonner";
import { ROUTES } from "@/constants";
import { errorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { roleHome, useAuth } from "@/providers/auth-provider";
import { completeRole, updateMyProfile } from "@/services/users";
import type { UserRole } from "@/types";

type OnboardingRole = Extract<UserRole, "customer" | "vendor">;

export function ChooseRoleForm() {
  const router = useRouter();
  const { user, loading, refresh } = useAuth();

  const [role, setRole] = useState<OnboardingRole>("customer");
  const [businessName, setBusinessName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(ROUTES.signIn);
      return;
    }
    if (user.roleOnboarded) {
      router.replace(roleHome(user.role));
    }
  }, [loading, router, user]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (role === "vendor" && businessName.trim().length < 2) {
      setError("Enter your business name to continue as a vendor.");
      return;
    }

    setSubmitting(true);
    try {
      let updated = await completeRole(role);

      if (role === "vendor" && businessName.trim()) {
        try {
          updated = await updateMyProfile({ businessName: businessName.trim() });
        } catch {
          // A missing business name can be fixed later in profile settings.
        }
      }

      await refresh();
      toast.success("Your account type is set. Welcome aboard.");
      router.replace(roleHome(updated.role));
    } catch (cause) {
      const message = errorMessage(cause);
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !user) {
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

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-red px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-red-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        ) : null}
        {submitting ? "Saving…" : "Continue to my dashboard"}
      </button>
    </form>
  );
}
