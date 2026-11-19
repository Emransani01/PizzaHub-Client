import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardPanelProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function DashboardPanel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: DashboardPanelProps) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-panel border border-brand-brown/10 bg-card shadow-card",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-brand-brown/10 px-5 py-4">
        <div className="min-w-0 space-y-1">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-brand-brown/60">
            {title}
          </h2>
          {description ? (
            <p className="text-xs leading-5 text-brand-brown/50">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}
