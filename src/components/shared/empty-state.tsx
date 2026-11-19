import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  children?: ReactNode;
  tone?: "brand" | "neutral";
  dashed?: boolean;
  className?: string;
}

/** Shared empty, error and no-access state used across public and dashboard pages. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  tone = "brand",
  dashed = true,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-card bg-card px-6 py-14 text-center shadow-card",
        dashed ? "border border-dashed border-brand-brown/20" : "border border-brand-brown/10",
        className,
      )}
    >
      <span
        className={cn(
          "mx-auto flex size-14 items-center justify-center rounded-full",
          tone === "neutral"
            ? "bg-brand-gold/20 text-brand-brown dark:text-brand-gold"
            : "bg-brand-red/10 text-brand-red",
        )}
      >
        <Icon aria-hidden="true" className="size-6" />
      </span>
      <h2 className="mt-4 text-xl font-extrabold text-brand-brown">{title}</h2>
      {description ? (
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-brand-brown/55">
          {description}
        </p>
      ) : null}
      {children ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {children}
        </div>
      ) : null}
    </div>
  );
}
