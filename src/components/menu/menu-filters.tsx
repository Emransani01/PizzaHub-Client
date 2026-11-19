"use client";

import { RotateCcw } from "lucide-react";
import { MENU_CATEGORIES } from "@/constants";
import { cn } from "@/lib/utils";

interface MenuFiltersProps {
  activeCategory: string;
  activeLocation: string;
  canReset: boolean;
  locations: string[];
  locationsLoading: boolean;
  locationsError: string | null;
  onCategoryChange: (category: string) => void;
  onLocationChange: (location: string) => void;
  onReset: () => void;
}

export function MenuFilters({
  activeCategory,
  activeLocation,
  canReset,
  locations,
  locationsLoading,
  locationsError,
  onCategoryChange,
  onLocationChange,
  onReset,
}: MenuFiltersProps) {
  const showNoLocationsHint =
    locations.length === 0 && !locationsLoading && !locationsError;
  const locationOptions =
    activeLocation && !locations.includes(activeLocation)
      ? [activeLocation, ...locations]
      : locations;

  return (
    <div className="space-y-4 rounded-2xl border border-brand-brown/10 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by category">
        <button
          type="button"
          onClick={() => onCategoryChange("")}
          aria-pressed={activeCategory === ""}
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
            activeCategory === ""
              ? "border-brand-red bg-brand-red text-white"
              : "border-brand-brown/20 bg-white text-brand-brown/70 hover:border-brand-red hover:text-brand-red",
          )}
        >
          All
        </button>
        {MENU_CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => onCategoryChange(category)}
            aria-pressed={activeCategory === category}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
              activeCategory === category
                ? "border-brand-red bg-brand-red text-white"
                : "border-brand-brown/20 bg-white text-brand-brown/70 hover:border-brand-red hover:text-brand-red",
            )}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 border-t border-brand-brown/10 pt-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <label htmlFor="menu-location" className="text-xs font-bold uppercase tracking-wide text-brand-brown/55">
            Filter by location
          </label>
          <select
            id="menu-location"
            value={activeLocation}
            disabled={locationsLoading || Boolean(locationsError)}
            onChange={(event) => onLocationChange(event.target.value)}
            className="mt-1.5 h-11 w-full rounded-xl border border-brand-brown/15 bg-cream/30 px-3 text-sm font-semibold text-brand-brown outline-none focus:border-brand-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">
              {locationsLoading
                ? "Loading locations…"
                : locationsError
                  ? "Locations unavailable"
                  : "All locations"}
            </option>
            {!locationsLoading && !locationsError
              ? locationOptions.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))
              : null}
          </select>
          {locationsError ? (
            <p className="mt-1 text-[11px] text-brand-red">
              {locationsError} Menu results are still available.
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onReset}
          disabled={!canReset}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-brand-brown/15 px-4 text-sm font-semibold text-brand-brown transition-colors hover:border-brand-red hover:text-brand-red disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RotateCcw aria-hidden="true" className="size-4" />
          Clear filters
        </button>
      </div>

      {showNoLocationsHint ? (
        <p className="text-xs text-brand-brown/45">
          No locations are currently available for the public menu.
        </p>
      ) : null}
    </div>
  );
}
