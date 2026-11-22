"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, LogIn, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/form-field";
import { ROUTES } from "@/constants";
import { authClient } from "@/lib/auth-client";
import { hardNavigate, safeNextPath } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { getPublicConfig } from "@/services/config";
import { roleHome, useAuth } from "@/providers/auth-provider";

export function SignInForm() {
  const searchParams = useSearchParams();
  const { refreshSession, beginSessionChange, completeSessionChange } = useAuth();

  const nextParam = searchParams.get("next");
  const sessionExpired = searchParams.get("reason") === "session-expired";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleStatus, setGoogleStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGoogleConfig = useCallback(async () => {
    setGoogleStatus("loading");
    try {
      const config = await getPublicConfig();
      setGoogleEnabled(config.googleEnabled);
      setGoogleStatus("ready");
    } catch {
      setGoogleStatus("error");
    }
  }, []);

  useEffect(() => {
    void loadGoogleConfig();
  }, [loadGoogleConfig]);

  useEffect(() => {
    if (sessionExpired) {
      setError("Your session has expired. Please sign in again.");
    }
  }, [sessionExpired]);

  async function finishSignIn() {
    const result = await refreshSession();

    if (result.kind === "unavailable") {
      setError(
        `${result.message} Your credentials were accepted, but we couldn't confirm the session. Try signing in again.`,
      );
      return;
    }
    if (result.kind === "forbidden") {
      setError(result.message);
      return;
    }
    if (result.kind !== "authenticated") {
      setError(
        "Your session could not be confirmed. Please try signing in again.",
      );
      return;
    }

    const user = result.session.user;
    if (user.isBlocked) {
      setError("This account has been blocked by an administrator.");
      return;
    }

    toast.success(`Welcome back, ${user.name.split(" ")[0]}.`);

    const destination = !user.roleOnboarded
      ? ROUTES.chooseRole
      : safeNextPath(
          nextParam,
          user.role === "customer" ? ROUTES.home : roleHome(user.role),
        );

    // A signed-out prefetch of a protected route can be cached by the router.
    // A full document request re-runs the proxy with the new cookie.
    hardNavigate(destination);
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
      // Invalidate pre-login refreshes and let any older cookie cleanup finish
      // before Better Auth writes the new session cookie.
      await beginSessionChange();

      const result = await authClient.signIn.email({
        email: email.trim(),
        password,
      });

      if (result.error) {
        setError(result.error.message ?? "Those credentials were not accepted.");
        return;
      }

      completeSessionChange();
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
    const callbackURL = safeNextPath(nextParam, "/");
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
          <div className="relative">
            <input
              id="sign-in-password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className={cn(inputClass, "pr-12")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              aria-controls="sign-in-password"
              className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-brand-brown/45 transition-colors hover:text-brand-brown focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red"
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" className="size-4" />
              ) : (
                <Eye aria-hidden="true" className="size-4" />
              )}
            </button>
          </div>
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

      <Button
        type="submit"
        variant="brand"
        size="cta-md"
        disabled={submitting}
        className="mt-5 w-full"
      >
        {submitting ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <LogIn aria-hidden="true" className="size-4" />
        )}
        {submitting ? "Signing in…" : "Sign in"}
      </Button>

      {googleStatus === "error" ? (
        <>
          <div className="my-5 flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-brand-brown/30">
            <span className="h-px flex-1 bg-brand-brown/10" />
            or
            <span className="h-px flex-1 bg-brand-brown/10" />
          </div>
          <div className="rounded-xl border border-brand-brown/10 bg-cream/40 px-4 py-3 text-center text-sm text-brand-brown/60">
            Google sign-in is temporarily unavailable.{" "}
            <button
              type="button"
              onClick={() => void loadGoogleConfig()}
              className="font-bold text-brand-red hover:underline"
            >
              Retry
            </button>
          </div>
        </>
      ) : googleStatus === "ready" && googleEnabled ? (
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
