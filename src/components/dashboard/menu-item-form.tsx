"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MENU_CATEGORIES, ROUTES } from "@/constants";
import { ApiError, errorMessage } from "@/lib/api";
import { getPublicConfig } from "@/services/config";
import { createMenuItem, updateMenuItem } from "@/services/menu";
import { Button } from "@/components/ui/button";
import { inputClass, labelClass } from "@/components/ui/form-field";
import { uploadMenuImage } from "@/services/uploads";
import type { MenuItem } from "@/types";

const EMPTY_ADD_FORM = {
  itemName: "",
  category: MENU_CATEGORIES[0],
  description: "",
  price: "",
  location: "",
  isAvailable: true,
};

interface MenuItemFormProps {
  item?: MenuItem;
}

function detailMessage(cause: unknown): string {
  if (cause instanceof ApiError && Array.isArray(cause.details)) {
    const first = cause.details[0] as { message?: unknown } | undefined;
    if (first && typeof first.message === "string") return first.message;
  }
  return errorMessage(cause);
}

export function MenuItemForm({ item }: MenuItemFormProps) {
  const router = useRouter();
  const isEdit = Boolean(item);

  const [itemName, setItemName] = useState(item?.itemName ?? "");
  const [category, setCategory] = useState(item?.category ?? MENU_CATEGORIES[0]);
  const [description, setDescription] = useState(item?.description ?? "");
  const [price, setPrice] = useState(item ? String(item.price) : "");
  const [location, setLocation] = useState(item?.location ?? "");
  const [images, setImages] = useState<string[]>(item?.images ?? []);
  const [isAvailable, setIsAvailable] = useState(item?.isAvailable ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imgbbEnabled, setImgbbEnabled] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const submitLock = useRef(false);

  function resetAddForm() {
    setItemName(EMPTY_ADD_FORM.itemName);
    setCategory(EMPTY_ADD_FORM.category);
    setDescription(EMPTY_ADD_FORM.description);
    setPrice(EMPTY_ADD_FORM.price);
    setLocation(EMPTY_ADD_FORM.location);
    setImages([]);
    setIsAvailable(EMPTY_ADD_FORM.isAvailable);
    setError(null);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  useEffect(() => {
    getPublicConfig()
      .then((config) => setImgbbEnabled(config.imgbbEnabled))
      .catch(() => setImgbbEnabled(false));
  }, []);

  async function onFiles(files: FileList) {
    setError(null);
    if (!imgbbEnabled) {
      const message =
        "Image uploads are unavailable because ImgBB is not configured on the server.";
      setError(message);
      toast.error(message);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    const remaining = 3 - images.length;
    if (remaining <= 0) {
      setError("A menu item can have at most three images.");
      return;
    }

    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files).slice(0, remaining)) {
        if (!file.type.startsWith("image/")) {
          throw new Error("Only image files can be uploaded.");
        }
        if (file.size > 4 * 1024 * 1024) {
          throw new Error("Each image must be 4 MB or smaller.");
        }
        const result = await uploadMenuImage(file);
        uploaded.push(result.displayUrl || result.url);
      }
      setImages((current) => [...current, ...uploaded].slice(0, 3));
      toast.success(
        uploaded.length === 1 ? "Image uploaded to ImgBB." : "Images uploaded to ImgBB.",
      );
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : detailMessage(cause);
      setError(message);
      toast.error(message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLock.current) return;
    submitLock.current = true;
    setError(null);

    const priceValue = Number(price);
    let validationMessage: string | null = null;
    if (itemName.trim().length < 2) {
      validationMessage = "Give the item a name (at least 2 characters).";
    } else if (description.trim().length < 10) {
      validationMessage = "Write a description of at least 10 characters.";
    } else if (!Number.isFinite(priceValue) || priceValue <= 0) {
      validationMessage = "Enter a price greater than zero.";
    } else if (location.trim().length < 2) {
      validationMessage = "Enter the kitchen location.";
    } else if (images.length === 0) {
      validationMessage = "Upload at least one image file through ImgBB.";
    }

    if (validationMessage) {
      setError(validationMessage);
      submitLock.current = false;
      return;
    }

    const payload = {
      itemName: itemName.trim(),
      category,
      description: description.trim(),
      price: priceValue,
      location: location.trim(),
      images,
      isAvailable,
    };

    setSubmitting(true);
    try {
      if (item) {
        const updated = await updateMenuItem(item.id, payload);
        toast.success(
          updated.status === "pending"
            ? "Item updated and sent back for admin review."
            : "Menu item updated.",
        );
        router.push(ROUTES.vendorMyMenuItems);
        router.refresh();
      } else {
        await createMenuItem(payload);
        toast.success("Item submitted for admin approval.");
        resetAddForm();
      }
    } catch (cause) {
      const message = detailMessage(cause);
      setError(message);
      toast.error(message);
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-[1.5rem] border border-brand-brown/10 bg-white p-6 shadow-[0_20px_50px_-42px_rgba(43,26,18,0.55)]"
    >
      {isEdit && (item?.status === "approved" || item?.status === "inactive") ? (
        <p className="rounded-xl border border-brand-gold/50 bg-brand-gold/10 px-3 py-2 text-xs font-semibold leading-5 text-brand-brown/70">
          Changing the name, category, description, price, location or images
          sends this item back to <strong>pending review</strong>. Availability-only
          changes keep it approved.
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="item-name" className={labelClass}>
            Item name
          </label>
          <input
            id="item-name"
            type="text"
            required
            maxLength={120}
            value={itemName}
            onChange={(event) => setItemName(event.target.value)}
            placeholder="e.g. Margherita Pizza"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="item-category" className={labelClass}>
            Category
          </label>
          <select
            id="item-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className={inputClass}
          >
            {MENU_CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="item-description" className={labelClass}>
            Description
          </label>
          <textarea
            id="item-description"
            required
            rows={4}
            minLength={10}
            maxLength={1200}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Ingredients, crust style, what makes it special…"
            className="w-full rounded-xl border border-brand-brown/15 bg-cream/40 px-3.5 py-2.5 text-sm text-brand-brown outline-none placeholder:text-brand-brown/35 focus:border-brand-red focus:ring-4 focus:ring-brand-red/10"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="item-price" className={labelClass}>
            Price (USD)
          </label>
          <input
            id="item-price"
            type="number"
            required
            min={0.01}
            max={100000}
            step="0.01"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="12.99"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="item-location" className={labelClass}>
            Kitchen location
          </label>
          <input
            id="item-location"
            type="text"
            required
            maxLength={160}
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="e.g. Naples, FL"
            className={inputClass}
          />
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className={labelClass}>Images ({images.length}/3)</legend>

        <div className="flex flex-wrap gap-3">
          {images.map((image, index) => (
            <div
              key={`${image}-${index}`}
              className="relative size-24 overflow-hidden rounded-xl border border-brand-brown/10 bg-cream-deep"
            >
              <Image
                src={image}
                alt={`Item image ${index + 1}`}
                fill
                sizes="96px"
                className="object-cover"
              />
              <button
                type="button"
                onClick={() =>
                  setImages((current) => current.filter((_, i) => i !== index))
                }
                aria-label={`Remove image ${index + 1}`}
                className="absolute right-1 top-1 inline-flex size-6 items-center justify-center rounded-full bg-brand-red text-white"
              >
                <Trash2 aria-hidden="true" className="size-3" />
              </button>
            </div>
          ))}

          {images.length < 3 ? (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading || !imgbbEnabled}
              className="flex size-24 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-brand-brown/25 bg-cream/50 text-[11px] font-bold uppercase tracking-wide text-brand-brown/45 transition-colors hover:border-brand-red hover:text-brand-red disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 aria-hidden="true" className="size-5 animate-spin" />
              ) : (
                <ImagePlus aria-hidden="true" className="size-5" />
              )}
              {uploading ? "Uploading" : "Upload"}
            </button>
          ) : null}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="sr-only"
          onChange={(event) => {
            if (event.target.files?.length) void onFiles(event.target.files);
          }}
        />

        <p className="text-xs text-brand-brown/40">
          {imgbbEnabled
            ? "Upload 1–3 images as files (PNG, JPEG or WebP, up to 4 MB each). Images are hosted on ImgBB."
            : "Image uploads are unavailable until ImgBB is configured on the server."}
        </p>
      </fieldset>

      <label className="flex items-center gap-2.5 text-sm font-semibold text-brand-brown">
        <input
          type="checkbox"
          checked={isAvailable}
          onChange={(event) => setIsAvailable(event.target.checked)}
          className="size-4 accent-[#c1121f]"
        />
        Available to order right now
      </label>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-brand-red/30 bg-brand-red/5 px-3 py-2 text-sm font-medium text-brand-red"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          variant="brand"
          size="cta-md"
          disabled={submitting || uploading}
        >
          {submitting ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Save aria-hidden="true" className="size-4" />
          )}
          {submitting
            ? "Saving…"
            : isEdit
              ? "Save changes"
              : "Submit for review"}
        </Button>
        <Button
          type="button"
          variant="brandOutline"
          size="cta-md"
          onClick={() => router.push(ROUTES.vendorMyMenuItems)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
