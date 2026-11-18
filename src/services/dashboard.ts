import { apiFetch } from "@/lib/api";
import type { DashboardOverview } from "@/types";

export function getDashboardOverview(): Promise<DashboardOverview> {
  return apiFetch<DashboardOverview>("/dashboard/overview");
}
