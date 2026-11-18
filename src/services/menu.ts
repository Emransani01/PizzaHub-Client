import { apiFetch } from "@/lib/api";
import type {
  CategoryCount,
  MenuItem,
  MenuItemStatus,
  Paginated,
} from "@/types";

export interface MenuQuery {
  search?: string;
  category?: string;
  location?: string;
  sort?: "newest" | "price_asc" | "price_desc";
  page?: number;
  limit?: number;
}

export interface AdminMenuQuery extends MenuQuery {
  status?: MenuItemStatus;
  vendorId?: string;
}

function toQueryString(query: MenuQuery & { status?: string; vendorId?: string }) {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.category) params.set("category", query.category);
  if (query.location) params.set("location", query.location);
  if (query.sort) params.set("sort", query.sort);
  if (query.status) params.set("status", query.status);
  if (query.vendorId) params.set("vendorId", query.vendorId);
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 12));
  return params.toString();
}

export function listMenuItems(query: MenuQuery = {}): Promise<Paginated<MenuItem>> {
  return apiFetch<Paginated<MenuItem>>(`/menu-items?${toQueryString(query)}`);
}

export function listFeaturedItems(): Promise<{ items: MenuItem[] }> {
  return apiFetch<{ items: MenuItem[] }>("/menu-items/featured");
}

export function listCategoryCounts(): Promise<{ categories: CategoryCount[] }> {
  return apiFetch<{ categories: CategoryCount[] }>("/menu-items/categories");
}

export function listLocations(): Promise<{ locations: string[] }> {
  return apiFetch<{ locations: string[] }>("/menu-items/locations");
}

export function getMenuItem(id: string): Promise<MenuItem> {
  return apiFetch<MenuItem>(`/menu-items/${id}`);
}

export function listMyMenuItems(): Promise<{ items: MenuItem[] }> {
  return apiFetch<{ items: MenuItem[] }>("/menu-items/mine");
}

export function listAdminMenuItems(
  query: AdminMenuQuery = {},
): Promise<Paginated<MenuItem>> {
  return apiFetch<Paginated<MenuItem>>(
    `/menu-items/admin?${toQueryString(query)}`,
  );
}

export interface CreateMenuItemInput {
  itemName: string;
  category: string;
  description: string;
  price: number;
  location: string;
  images: string[];
  isAvailable?: boolean;
}

export function createMenuItem(input: CreateMenuItemInput): Promise<MenuItem> {
  return apiFetch<MenuItem>("/menu-items", { method: "POST", body: input });
}

export function updateMenuItem(
  id: string,
  input: Partial<CreateMenuItemInput>,
): Promise<MenuItem> {
  return apiFetch<MenuItem>(`/menu-items/${id}`, {
    method: "PATCH",
    body: input,
  });
}

export function setMenuItemStatus(
  id: string,
  status: MenuItemStatus,
  reason?: string,
): Promise<MenuItem> {
  return apiFetch<MenuItem>(`/menu-items/${id}/status`, {
    method: "PATCH",
    body: { status, reason },
  });
}

export function deleteMenuItem(id: string): Promise<void> {
  return apiFetch<void>(`/menu-items/${id}`, { method: "DELETE" });
}
