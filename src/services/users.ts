import { apiFetch } from "@/lib/api";
import type { AdminUser, Paginated, UserProfile, UserRole } from "@/types";

export function updateMyProfile(input: {
  name?: string;
  image?: string | null;
  businessName?: string | null;
}): Promise<UserProfile> {
  return apiFetch<UserProfile>("/users/me", { method: "PATCH", body: input });
}

export function completeRole(role: Exclude<UserRole, "admin">): Promise<UserProfile> {
  return apiFetch<UserProfile>("/users/me/role", {
    method: "POST",
    body: { role },
  });
}

export function listUsers(query: {
  search?: string;
  role?: UserRole;
  page?: number;
  limit?: number;
}): Promise<Paginated<AdminUser>> {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.role) params.set("role", query.role);
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 20));
  return apiFetch<Paginated<AdminUser>>(`/users?${params.toString()}`);
}

export function setUserBlocked(id: string, blocked: boolean): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/users/${id}/block`, {
    method: "PATCH",
    body: { blocked },
  });
}
