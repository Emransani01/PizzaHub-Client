import { apiFetch } from "@/lib/api";
import type { PublicConfig } from "@/types";

export function getPublicConfig(): Promise<PublicConfig> {
  return apiFetch<PublicConfig>("/config/public");
}
