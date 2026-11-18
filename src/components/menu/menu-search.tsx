"use client";

import { Search } from "lucide-react";

interface MenuSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function MenuSearch({ value, onChange }: MenuSearchProps) {
  return (
    <div className="relative w-full">
      <label htmlFor="menu-search" className="sr-only">
        Search the menu
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-brand-brown/40"
      />
      <input
        id="menu-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search dishes, ingredients or kitchens..."
        className="h-11 w-full rounded-full border border-brand-brown/15 bg-white pl-11 pr-4 text-sm text-brand-brown outline-none transition-colors placeholder:text-brand-brown/40 focus:border-brand-red focus:ring-4 focus:ring-brand-red/10"
      />
    </div>
  );
}
