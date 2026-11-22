"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Camera, Check, Loader2, Store } from "lucide-react";
import { toast } from "sonner";
import { AuthStateNotice } from "@/components/shared/auth-state-notice";
import { ROLE_LABELS } from "@/constants";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { getPublicConfig } from "@/services/config";
import { Button } from "@/components/ui/button";
import { inputClass, labelClass } from "@/components/ui/form-field";
import { uploadProfileImage } from "@/services/uploads";
import { updateMyProfile } from "@/services/users";

export function ProfileForm() {
  const { user, loading, authError, refreshing, refresh, setUser } = useAuth();

  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imgbbEnabled, setImgbbEnabled] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setBusinessName(user.businessName ?? "");
    setImage(user.image);
  }, [user]);

  useEffect(() => {
    getPublicConfig()
      .then((config) => setImgbbEnabled(config.imgbbEnabled))
      .catch(() => setImgbbEnabled(false));
  }, []);

  async function onUpload(file: File) {
    setError(null);
    setUploading(true);
    try {
      const result = await uploadProfileImage(file);
      setImage(result.displayUrl || result.url);
      toast.success("Image uploaded. Save your profile to keep it.");
    } catch (cause) {
      const message = errorMessage(cause);
      setError(message);
      toast.error(message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Your name must be at least 2 characters long.");
      return;
    }
    if (user?.role === "vendor" && businessName.trim().length < 2) {
      setError("Vendors need a business name (at least 2 characters).");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateMyProfile({
        name: name.trim(),
        image,
        ...(user?.role === "vendor"
          ? { businessName: businessName.trim() }
          : {}),
      });
      setUser(updated);
      toast.success("Profile updated.");
    } catch (cause) {
      const message = errorMessage(cause);
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="h-96 animate-pulse rounded-[1.5rem] bg-brand-brown/10" />
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
      <div className="rounded-[1.5rem] border border-brand-brown/10 bg-white p-6">
        <p className="text-sm font-semibold text-brand-brown">
          Sign in to manage your profile.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[1.5rem] border border-brand-brown/10 bg-white p-6 shadow-[0_22px_50px_-40px_rgba(43,26,18,0.55)] sm:p-7"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="relative">
          <div className="relative size-20 overflow-hidden rounded-full bg-brand-brown/10">
            {image ? (
              <Image
                src={image}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : (
              <span className="flex h-full items-center justify-center text-2xl font-extrabold text-brand-brown/50">
                {user.name.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || !imgbbEnabled}
            aria-label="Upload a new profile photo"
            className="absolute -bottom-1 -right-1 inline-flex size-8 items-center justify-center rounded-full bg-brand-red text-white shadow transition-colors hover:bg-brand-red-dark disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Camera aria-hidden="true" className="size-4" />
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onUpload(file);
            }}
          />
        </div>

        <div className="min-w-0">
          <p className="text-lg font-extrabold tracking-tight text-brand-brown">
            {user.name}
          </p>
          <p className="truncate text-sm text-brand-brown/55">{user.email}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="inline-flex rounded-full bg-brand-gold/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-brown">
              {ROLE_LABELS[user.role]}
            </span>
            {user.role === "vendor" ? (
              <span className="inline-flex rounded-full bg-brand-red/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-red">
                {user.subscriptionPlan === "premium" ? "Premium plan" : "Free plan"}
              </span>
            ) : null}
            {user.isBlocked ? (
              <span className="inline-flex rounded-full bg-brand-red px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Blocked
              </span>
            ) : null}
          </div>
          {!imgbbEnabled ? (
            <p className="mt-2 text-xs text-brand-brown/45">
              Photo uploads are disabled until ImgBB is configured on the server.
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="profile-name" className={labelClass}>
            Full name
          </label>
          <input
            id="profile-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="profile-email" className={labelClass}>
            Email
          </label>
          <input
            id="profile-email"
            name="email"
            type="email"
            value={user.email}
            readOnly
            disabled
            className={inputClass}
          />
          <p className="text-xs text-brand-brown/40">
            Email addresses are managed by your sign-in provider.
          </p>
        </div>

        {user.role === "vendor" ? (
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="profile-business" className={labelClass}>
              Business name
            </label>
            <div className="relative">
              <Store
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-brand-brown/40"
              />
              <input
                id="profile-business"
                name="businessName"
                type="text"
                required
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                className={`${inputClass} pl-10`}
              />
            </div>
            <p className="text-xs text-brand-brown/40">
              Shown on every menu item you publish.
            </p>
          </div>
        ) : null}
      </div>

      <dl className="mt-7 grid gap-3 rounded-2xl bg-cream/70 p-4 text-sm sm:grid-cols-3">
        <div>
          <dt className={labelClass}>Account type</dt>
          <dd className="mt-1 font-semibold text-brand-brown">
            {ROLE_LABELS[user.role]}
          </dd>
        </div>
        <div>
          <dt className={labelClass}>Saved favourites</dt>
          <dd className="mt-1 font-semibold text-brand-brown">
            {user.role === "customer" ? user.favoritesCount : "—"}
          </dd>
        </div>
        <div>
          <dt className={labelClass}>Member since</dt>
          <dd className="mt-1 font-semibold text-brand-brown">
            {formatDate(user.createdAt)}
          </dd>
        </div>
        {user.role === "vendor" ? (
          <div>
            <dt className={labelClass}>Plan renews / expires</dt>
            <dd className="mt-1 font-semibold text-brand-brown">
              {user.subscriptionPlan === "premium"
                ? formatDate(user.subscriptionExpiresAt)
                : "No expiry on the free plan"}
            </dd>
          </div>
        ) : null}
      </dl>

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
        disabled={saving}
        className="mt-5"
      >
        {saving ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <Check aria-hidden="true" className="size-4" />
        )}
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
