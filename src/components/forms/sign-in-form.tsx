"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, LogIn, Mail } from "lucide-react";
import { toast } from "sonner";
import { ROUTES } from "@/constants";
import { authClient } from "@/lib/auth-client";
import { getPublicConfig } from "@/services/config";
import { roleHome, useAuth } from "@/providers/auth-provider";

const inputClass =
  "h-11 w-full rounded-xl border border-brand-brown/15 bg-cream/40 px-3.5 text-sm text-brand-brown outline-none transition-colors placeholder:text-brand-brown/35 focus:border-brand-red focus:ring-4 focus:ring-brand-red/10";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();

  const nextParam = searchParams.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  async function finishSignIn() {
    const user = await refresh();

    if (!user) {
      setError(
        "Your session could not be confirmed. Please try signing in again.",
      );
      return;
    }

    if (user.isBlocked) {
      setError("This account has been blocked by an administrator.");
      return;
    }

    toast.success(`Welcome back, ${user.name.split(" ")[0]}.`);

    if (!user.roleOnboarded) {
      router.replace(ROUTES.chooseRole);
      return;
    }

    router.replace(nextParam && nextParam.startsWith("/") ? nextParam : roleHome(user.role));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Enter your email address and password.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await authClient.signIn.email({
        email: email.trim(),
        password,
      });

      if (result.error) {
        setError(result.error.message ?? "Those credentials were not accepted.");
        return;
      }

      await finishSignIn();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Sign in failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function onGoogle() {
    setError(null);
    const callbackURL = nextParam && nextParam.startsWith("/") ? nextParam : "/";
    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL,
    });
    if (result.error) {
      setError(result.error.message ?? "Google sign in could not start.");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[1.5rem] border border-brand-brown/10 bg-white p-6 shadow-[0_22px_50px_-38px_rgba(43,26,18,0.6)] sm:p-7"
    >
      <div className="space-y-1.5">
        <h1 className="text-2xl font-extrabold tracking-tight text-brand-brown">
          Welcome back
        </h1>
        <p className="text-sm text-brand-brown/55">
          Sign in to order, manage your menu or moderate the platform.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="sign-in-email"
            className="text-xs font-bold uppercase tracking-wide text-brand-brown/50"
          >
            Email
          </label>
          <div className="relative">
            <Mail
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-brand-brown/40"
            />
            <input
              id="sign-in-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className={`${inputClass} pl-10`}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="sign-in-password"
            className="text-xs font-bold uppercase tracking-wide text-brand-brown/50"
          >
            Password
          </label>
          <input
            id="sign-in-password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
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
        ) : (
          <LogIn aria-hidden="true" className="size-4" />
        )}
        {submitting ? "Signing in…" : "Sign in"}
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
        New to PizzaHub?{" "}
        <Link
          href={ROUTES.signUp}
          className="font-bold text-brand-red hover:underline"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
