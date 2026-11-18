"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Store, UserRound } from "lucide-react";
import { toast } from "sonner";
import { ROUTES } from "@/constants";
import { errorMessage, isApiError } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { getPublicConfig } from "@/services/config";
import { completeRole, updateMyProfile } from "@/services/users";
import { roleHome, useAuth } from "@/providers/auth-provider";
import type { UserRole } from "@/types";

const inputClass =
  "h-11 w-full rounded-xl border border-brand-brown/15 bg-cream/40 px-3.5 text-sm text-brand-brown outline-none transition-colors placeholder:text-brand-brown/35 focus:border-brand-red focus:ring-4 focus:ring-brand-red/10";

const labelClass =
  "text-xs font-bold uppercase tracking-wide text-brand-brown/50";

type SignUpRole = Extract<UserRole, "customer" | "vendor">;

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();

  const initialRole: SignUpRole =
    searchParams.get("role") === "vendor" ? "vendor" : "customer";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<SignUpRole>(initialRole);
  const [businessName, setBusinessName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPublicConfig()
      .then((config) => {
        if (!cancelled) setGoogleEnabled(config.googleEnabled);
      })
      .catch(() => {
        if (!cancelled) setGoogleEnabled(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Enter your full name.");
      return;
    }
    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z]).{6,}$/.test(password)) {
      setError(
        "Use at least 6 characters with one uppercase and one lowercase letter.",
      );
      return;
    }
    if (role === "vendor" && businessName.trim().length < 2) {
      setError("Enter your business name so customers know your kitchen.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await authClient.signUp.email({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      if (result.error) {
        setError(
          result.error.message ??
            "We could not create that account. Try a different email.",
        );
        return;
      }

      // The account is always created as a customer by Better Auth. The role is
      // applied here through the API, which rejects "admin" and can only run
      // while `roleOnboarded` is false.
      try {
        await completeRole(role);
      } catch (cause) {
        // A 409 means the profile was already onboarded (for example by a
        // retried request), which is safe to ignore.
        if (!isApiError(cause) || cause.status !== 409) {
          throw cause;
        }
      }

      if (role === "vendor" && businessName.trim()) {
        try {
          await updateMyProfile({ businessName: businessName.trim() });
        } catch {
          // The business name can be added later from profile settings.
        }
      }

      const user = await refresh();

      toast.success("Your PizzaHub account is ready.");

      if (!user) {
        router.replace(ROUTES.signIn);
        return;
      }

      if (!user.roleOnboarded) {
        router.replace(ROUTES.chooseRole);
        return;
      }

      router.replace(roleHome(user.role));
    } catch (cause) {
      const message = errorMessage(cause);
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function onGoogle() {
    setError(null);
    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL: ROUTES.chooseRole,
    });
    if (result.error) {
      setError(result.error.message ?? "Google sign up could not start.");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[1.5rem] border border-brand-brown/10 bg-white p-6 shadow-[0_22px_50px_-38px_rgba(43,26,18,0.6)] sm:p-7"
    >
      <div className="space-y-1.5">
        <h1 className="text-2xl font-extrabold tracking-tight text-brand-brown">
          Create your account
        </h1>
        <p className="text-sm text-brand-brown/55">
          Order from local kitchens, or join as a vendor and publish your menu.
        </p>
      </div>

      <fieldset className="mt-6">
        <legend className={labelClass}>I am joining as</legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setRole("customer")}
            aria-pressed={role === "customer"}
            className={cn(
              "flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors",
              role === "customer"
                ? "border-brand-red bg-brand-red/5"
                : "border-brand-brown/15 bg-white hover:border-brand-red/40",
            )}
          >
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-xl",
                role === "customer"
                  ? "bg-brand-red text-white"
                  : "bg-brand-brown/10 text-brand-brown",
              )}
            >
              <UserRound aria-hidden="true" className="size-4" />
            </span>
            <span>
              <span className="block text-sm font-bold text-brand-brown">
                Customer
              </span>
              <span className="mt-0.5 block text-xs leading-5 text-brand-brown/55">
                Browse and order from any kitchen.
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setRole("vendor")}
            aria-pressed={role === "vendor"}
            className={cn(
              "flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors",
              role === "vendor"
                ? "border-brand-red bg-brand-red/5"
                : "border-brand-brown/15 bg-white hover:border-brand-red/40",
            )}
          >
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-xl",
                role === "vendor"
                  ? "bg-brand-red text-white"
                  : "bg-brand-brown/10 text-brand-brown",
              )}
            >
              <Store aria-hidden="true" className="size-4" />
            </span>
            <span>
              <span className="block text-sm font-bold text-brand-brown">
                Vendor
              </span>
              <span className="mt-0.5 block text-xs leading-5 text-brand-brown/55">
                Sell your dishes. Free plan includes 3 live items.
              </span>
            </span>
          </button>
        </div>
      </fieldset>

      <div className="mt-5 space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="sign-up-name" className={labelClass}>
            Full name
          </label>
          <input
            id="sign-up-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            className={inputClass}
          />
        </div>

        {role === "vendor" ? (
          <div className="space-y-1.5">
            <label htmlFor="sign-up-business" className={labelClass}>
              Business name
            </label>
            <input
              id="sign-up-business"
              name="businessName"
              type="text"
              required
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
              placeholder="e.g. Napoli Slice House"
              className={inputClass}
            />
          </div>
        ) : null}

        <div className="space-y-1.5">
          <label htmlFor="sign-up-email" className={labelClass}>
            Email
          </label>
          <input
            id="sign-up-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="sign-up-password" className={labelClass}>
            Password
          </label>
          <input
            id="sign-up-password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="6+ characters, upper and lower case"
            className={inputClass}
          />
        </div>
      </div>

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
        {submitting ? "Creating your account…" : "Create account"}
      </button>

      {googleEnabled ? (
        <>
          <div className="my-5 flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-brand-brown/30">
            <span className="h-px flex-1 bg-brand-brown/10" />
            or
            <span className="h-px flex-1 bg-brand-brown/10" />
          </div>
          <button
            type="button"
            onClick={() => void onGoogle()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-brand-brown/15 bg-white px-5 py-3 text-sm font-bold text-brand-brown transition-colors hover:border-brand-red hover:text-brand-red"
          >
            Continue with Google
          </button>
        </>
      ) : null}

      <p className="mt-6 text-center text-sm text-brand-brown/55">
        Already have an account?{" "}
        <Link
          href={ROUTES.signIn}
          className="font-bold text-brand-red hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
