"use client";

import { MENU_CATEGORIES } from "@/constants";
import { cn } from "@/lib/utils";

interface MenuFiltersProps {
  activeCategory: string;
  onChange: (category: string) => void;
}

export function MenuFilters({ activeCategory, onChange }: MenuFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
      <button
        type="button"
        onClick={() => onChange("")}
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
          onClick={() => onChange(category)}
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
  );
}
