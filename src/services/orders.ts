import { apiFetch } from "@/lib/api";
import type {
  CartQuoteResult,
  CheckoutInput,
  CheckoutResult,
  Order,
  OrderStatus,
  Paginated,
} from "@/types";

export interface CreateOrderInput {
  itemId: string;
  deliveryDate: string;
  deliveryAddress: string;
  message?: string;
}

export function createOrder(input: CreateOrderInput): Promise<Order> {
  return apiFetch<Order>("/orders", { method: "POST", body: input });
}

export interface QuoteCartInput {
  items: {
    itemId: string;
    quantity: number;
    expectedUnitPrice?: number;
    /** Explicit, server-verified acceptance of a changed database price. */
    acknowledgedUnitPrice?: number;
  }[];
}

/** Asks the API for authoritative prices and a short-lived checkout token. */
export function quoteCart(input: QuoteCartInput): Promise<CartQuoteResult> {
  return apiFetch<CartQuoteResult>("/orders/quote", {
    method: "POST",
    body: input,
  });
}

export function checkoutCart(input: CheckoutInput): Promise<CheckoutResult> {
  return apiFetch<CheckoutResult>("/orders/checkout", {
    method: "POST",
    body: input,
  });
}

export function listOrders(query: {
  status?: OrderStatus;
  page?: number;
  limit?: number;
} = {}): Promise<Paginated<Order>> {
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status);
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 10));
  return apiFetch<Paginated<Order>>(`/orders?${params.toString()}`);
}

export function updateOrderStatus(
  id: string,
  status: Extract<OrderStatus, "accepted" | "rejected" | "cancelled">,
  note?: string,
): Promise<Order> {
  return apiFetch<Order>(`/orders/${id}/status`, {
    method: "PATCH",
    body: { status, note },
  });
}
