import { ORDER_STATUS_LABELS, ROLE_LABELS } from "@/constants";
import { cn, formatDateTime } from "@/lib/utils";
import type { OrderStatusEntry } from "@/types";

const DOT_STYLES: Record<string, string> = {
  pending: "bg-brand-gold",
  accepted: "bg-emerald-500",
  rejected: "bg-brand-red",
  cancelled: "bg-brand-brown/40",
};

export function OrderTimeline({ entries }: { entries: OrderStatusEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No status changes recorded.</p>
    );
  }

  return (
    <ol className="space-y-4">
      {entries.map((entry, index) => (
        <li key={`${entry.status}-${entry.changedAt}-${index}`} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span
              className={cn(
                "mt-1 size-2.5 rounded-full ring-4 ring-background",
                DOT_STYLES[entry.status] ?? "bg-brand-brown/40",
              )}
            />
            {index < entries.length - 1 ? (
              <span className="mt-1 w-px flex-1 bg-brand-brown/10" />
            ) : null}
          </div>
          <div className="pb-1">
            <p className="text-sm font-bold text-brand-brown">
              {ORDER_STATUS_LABELS[entry.status]}
              <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-brand-brown/40">
                by {ROLE_LABELS[entry.changedByRole] ?? entry.changedByRole}
              </span>
            </p>
            <p className="text-xs text-brand-brown/45">
              {formatDateTime(entry.changedAt)}
            </p>
            {entry.note ? (
              <p className="mt-1 rounded-lg bg-cream/80 px-2.5 py-1.5 text-xs leading-5 text-brand-brown/60">
                {entry.note}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
