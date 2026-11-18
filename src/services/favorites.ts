import { apiFetch } from "@/lib/api";
import type { MenuItem } from "@/types";

export function listFavorites(): Promise<{ items: MenuItem[] }> {
  return apiFetch<{ items: MenuItem[] }>("/favorites");
}

export function addFavorite(itemId: string): Promise<{ favorites: string[] }> {
  return apiFetch<{ favorites: string[] }>(`/favorites/${itemId}`, {
    method: "POST",
  });
}

export function removeFavorite(itemId: string): Promise<{ favorites: string[] }> {
  return apiFetch<{ favorites: string[] }>(`/favorites/${itemId}`, {
    method: "DELETE",
  });
}
