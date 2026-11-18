"use client";

import { UtensilsCrossed } from "lucide-react";
import type { MenuItem } from "@/types";
import { MenuCard } from "./menu-card";

interface MenuGridProps {
  items: MenuItem[];
}

export function MenuGrid({ items }: MenuGridProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-brand-brown/20 bg-white px-6 py-16 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
          <UtensilsCrossed aria-hidden="true" className="size-6" />
        </span>
        <p className="mt-4 text-lg font-bold text-brand-brown">
          Nothing matches that search
        </p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-brand-brown/55">
          Try a different category or clear the search box. Only approved and
          available dishes are shown.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <MenuCard key={item.id} item={item} />
      ))}
    </div>
  );
}
