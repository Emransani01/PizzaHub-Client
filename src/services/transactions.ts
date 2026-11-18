import { apiFetch } from "@/lib/api";
import type { Paginated, Transaction, TransactionStatus } from "@/types";

export function listTransactions(query: {
  status?: TransactionStatus;
  page?: number;
  limit?: number;
} = {}): Promise<Paginated<Transaction>> {
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status);
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 20));
  return apiFetch<Paginated<Transaction>>(`/transactions?${params.toString()}`);
}

export function listMyTransactions(query: {
  status?: TransactionStatus;
  page?: number;
  limit?: number;
} = {}): Promise<Paginated<Transaction>> {
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status);
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 20));
  return apiFetch<Paginated<Transaction>>(
    `/transactions/me?${params.toString()}`,
  );
}
