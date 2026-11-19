import { ORDER_STATUS_LABELS } from "@/constants";
import { cn } from "@/lib/utils";
import type { MenuItemStatus, OrderStatus } from "@/types";

const BADGE_CLASS =
  "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide";

const ORDER_STYLES: Record<OrderStatus, string> = {
  pending: "bg-brand-gold/20 text-brand-brown dark:bg-brand-gold/15 dark:text-brand-gold",
  accepted:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  rejected: "bg-brand-red/10 text-brand-red dark:bg-brand-red/15",
  cancelled:
    "bg-brand-brown/10 text-brand-brown/60 dark:bg-brand-brown/15 dark:text-brand-brown/70",
};

const MENU_STYLES: Record<MenuItemStatus, string> = {
  pending: "bg-brand-gold/20 text-brand-brown dark:bg-brand-gold/15 dark:text-brand-gold",
  approved:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  rejected: "bg-brand-red/10 text-brand-red dark:bg-brand-red/15",
  inactive:
    "bg-brand-brown/10 text-brand-brown/60 dark:bg-brand-brown/15 dark:text-brand-brown/70",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(BADGE_CLASS, ORDER_STYLES[status])}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

export function MenuStatusBadge({
  status,
  isAvailable,
}: {
  status: MenuItemStatus;
  isAvailable?: boolean;
}) {
  // The server now returns `inactive` directly, but keep the availability
  // fallback for older cached responses that still report approved + unavailable.
  const displayStatus: MenuItemStatus =
    status === "approved" && isAvailable === false ? "inactive" : status;

  const labels: Record<MenuItemStatus, string> = {
    pending: "Pending review",
    approved: "Approved",
    rejected: "Rejected",
    inactive: "Inactive",
  };

  return (
    <span
      className={cn(BADGE_CLASS, MENU_STYLES[displayStatus])}
    >
      {labels[displayStatus]}
    </span>
  );
}
