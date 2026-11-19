import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatsAccent = "red" | "gold" | "green" | "brown";

interface StatsCardProps {
  label: string;
  value?: string | number;
  hint?: string;
  icon?: LucideIcon;
  accent?: StatsAccent;
}

const ACCENT_STYLES: Record<StatsAccent, string> = {
  red: "bg-brand-red/10 text-brand-red",
  gold: "bg-brand-gold/20 text-brand-brown",
  green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  brown: "bg-brand-brown/10 text-brand-brown",
};

export function StatsCard({
  label,
  value = "—",
  hint,
  icon: Icon,
  accent = "red",
}: StatsCardProps) {
  return (
    <div className="flex min-w-0 items-start gap-4 rounded-panel border border-brand-brown/10 bg-card p-5 shadow-card">
      {Icon ? (
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl",
            ACCENT_STYLES[accent],
          )}
        >
          <Icon aria-hidden="true" className="size-5" />
        </span>
      ) : null}
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-brand-brown/50">
          {label}
        </p>
        <p className="mt-2 text-2xl font-extrabold tracking-tight text-brand-brown tabular-nums">
          {value}
        </p>
        {hint ? (
          <p className="mt-1 text-xs leading-5 text-brand-brown/50">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}
