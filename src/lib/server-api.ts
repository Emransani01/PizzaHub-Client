import "server-only";

import { connection } from "next/server";
import type { CategoryCount, MenuItem } from "@/types";

const API_URL = (process.env.API_URL ?? "http://localhost:5000").replace(
  /\/+$/,
  "",
);

async function getJson<T>(path: string): Promise<T | null> {
  // The homepage shows live menu data, so these fetches must run per request
  // instead of being captured during the static prerender.
  await connection();

  try {
    const response = await fetch(`${API_URL}/api${path}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch (error) {
    console.warn(`[server-api] Could not reach ${path}:`, error);
    return null;
  }
}

export async function fetchFeaturedItems(): Promise<MenuItem[]> {
  const result = await getJson<{ items: MenuItem[] }>("/menu-items/featured");
  return result?.items ?? [];
}

export async function fetchCategoryCounts(): Promise<CategoryCount[]> {
  const result = await getJson<{ categories: CategoryCount[] }>(
    "/menu-items/categories",
  );
  return result?.categories ?? [];
}
