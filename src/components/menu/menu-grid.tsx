"use client";

import { UtensilsCrossed } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import type { MenuItem } from "@/types";
import { MenuCard } from "./menu-card";

interface MenuGridProps {
  items: MenuItem[];
}

export function MenuGrid({ items }: MenuGridProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={UtensilsCrossed}
        title="No dishes to show"
        description="Try a different category or clear the search box. Only approved and available dishes are shown."
      />
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
