import { ORDER_STATUS_LABELS } from "@/constants";
import { cn } from "@/lib/utils";
import type { MenuItemStatus, OrderStatus } from "@/types";

const ORDER_STYLES: Record<OrderStatus, string> = {
  pending: "bg-brand-gold/20 text-brand-brown",
  accepted: "bg-emerald-100 text-emerald-800",
  rejected: "bg-brand-red/10 text-brand-red",
  cancelled: "bg-brand-brown/10 text-brand-brown/60",
};

const MENU_STYLES: Record<MenuItemStatus, string> = {
  pending: "bg-brand-gold/20 text-brand-brown",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-brand-red/10 text-brand-red",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
        ORDER_STYLES[status],
      )}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

export function MenuStatusBadge({ status }: { status: MenuItemStatus }) {
  const labels: Record<MenuItemStatus, string> = {
    pending: "Pending review",
    approved: "Approved",
    rejected: "Rejected",
  };

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
        MENU_STYLES[status],
      )}
    >
      {labels[status]}
    </span>
  );
}
