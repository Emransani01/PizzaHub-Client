"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Camera, Loader2, Store, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { ROUTES } from "@/constants";
import { errorMessage, isApiError } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { hardNavigate } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { getPublicConfig } from "@/services/config";
import { Button } from "@/components/ui/button";
import { inputClass, labelClass } from "@/components/ui/form-field";
import { uploadProfileImage } from "@/services/uploads";
import { completeRole, updateMyProfile } from "@/services/users";
import { roleHome, useAuth } from "@/providers/auth-provider";
import type { UserRole } from "@/types";

type SignUpRole = Extract<UserRole, "customer" | "vendor">;

export function SignUpForm() {
  const searchParams = useSearchParams();
  const { refreshSession, beginSessionChange, completeSessionChange } = useAuth();

  const initialRole: SignUpRole =
    searchParams.get("role") === "vendor" ? "vendor" : "customer";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<SignUpRole>(initialRole);
  const [businessName, setBusinessName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [needsVerificationRetry, setNeedsVerificationRetry] = useState(false);
  const [googleStatus, setGoogleStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [imgbbEnabled, setImgbbEnabled] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadGoogleConfig = useCallback(async () => {
    setGoogleStatus("loading");
    try {
      const config = await getPublicConfig();
      setGoogleEnabled(config.googleEnabled);
      setImgbbEnabled(config.imgbbEnabled);
      setGoogleStatus("ready");
    } catch {
      setGoogleStatus("error");
    }
  }, []);

  useEffect(() => {
    void loadGoogleConfig();
  }, [loadGoogleConfig]);

  useEffect(() => {
    return () => {
      if (profilePreview) URL.revokeObjectURL(profilePreview);
    };
  }, [profilePreview]);

  function onProfileImageChange(file: File | null) {
    setError(null);
    if (profilePreview) URL.revokeObjectURL(profilePreview);

    if (!file) {
      setProfileImageFile(null);
      setProfilePreview(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (PNG, JPEG or WebP).");
      setProfileImageFile(null);
      setProfilePreview(null);
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setError("Profile images must be 4 MB or smaller.");
      setProfileImageFile(null);
      setProfilePreview(null);
      return;
    }

    setProfileImageFile(file);
    setProfilePreview(URL.createObjectURL(file));
  }

  async function verifyAndContinue() {
    setVerifying(true);
    try {
      const result = await refreshSession();

      if (result.kind === "unavailable") {
        setNeedsVerificationRetry(true);
        setError(
          `${result.message} Your account is ready. Retry the session check instead of signing in again.`,
        );
        return;
      }
      if (result.kind === "forbidden") {
        setNeedsVerificationRetry(false);
        setError(result.message);
        return;
      }
      if (result.kind !== "authenticated") {
        setNeedsVerificationRetry(false);
        setError(
          "Your account was created, but the session could not be confirmed. Please sign in.",
        );
        return;
      }

      setNeedsVerificationRetry(false);
      setError(null);
      toast.success("Your PizzaHub account is ready.");
      const user = result.session.user;
      hardNavigate(
        user.roleOnboarded ? roleHome(user.role) : ROUTES.chooseRole,
      );
    } finally {
      setVerifying(false);
    }
  }

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
      await beginSessionChange();

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

      completeSessionChange();

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

      if (profileImageFile && imgbbEnabled) {
        try {
          const uploaded = await uploadProfileImage(profileImageFile);
          await updateMyProfile({ image: uploaded.displayUrl || uploaded.url });
        } catch {
          toast.error(
            "Account created, but the profile photo could not be uploaded. You can add it later in Profile Settings.",
          );
        }
      }

      await verifyAndContinue();
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
          <span className={labelClass}>Profile photo (optional)</span>
          <div className="flex items-center gap-3 rounded-xl border border-brand-brown/15 bg-cream/30 p-3">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-full bg-brand-brown/10">
              {profilePreview ? (
                <Image
                  src={profilePreview}
                  alt="Selected profile photo preview"
                  fill
                  sizes="56px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <span className="flex h-full items-center justify-center text-brand-brown/40">
                  <Camera aria-hidden="true" className="size-5" />
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={!imgbbEnabled || submitting}
                  className="rounded-full border border-brand-brown/20 bg-white px-3 py-1.5 text-xs font-bold text-brand-brown transition-colors hover:border-brand-red hover:text-brand-red disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {profileImageFile ? "Change photo" : "Upload photo"}
                </button>
                {profileImageFile ? (
                  <button
                    type="button"
                    onClick={() => {
                      onProfileImageChange(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold text-brand-brown/60 hover:text-brand-red"
                  >
                    <X aria-hidden="true" className="size-3.5" />
                    Remove
                  </button>
                ) : null}
              </div>
              <p className="mt-1 text-xs leading-5 text-brand-brown/45">
                {imgbbEnabled
                  ? "Optional. PNG, JPEG or WebP up to 4 MB. You can add or change it later in Profile Settings."
                  : "Photo upload is unavailable until ImgBB is configured. You can add one later in Profile Settings."}
              </p>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              onProfileImageChange(file);
            }}
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

      {needsVerificationRetry ? (
        <Button
          type="button"
          variant="brandOutline"
          size="cta-md"
          onClick={() => void verifyAndContinue()}
          disabled={verifying || submitting}
          className="mt-3 w-full"
        >
          {verifying ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : null}
          Retry session check
        </Button>
      ) : null}

      <Button
        type="submit"
        variant="brand"
        size="cta-md"
        disabled={submitting || needsVerificationRetry}
        className="mt-5 w-full"
      >
        {submitting ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        ) : null}
        {submitting ? "Creating your account…" : "Create account"}
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
