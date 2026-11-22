/**
 * Only allow same-origin, root-relative paths to be used as a post-login
 * destination. Values such as `//example.com` or `/\example.com` can be
 * interpreted as a protocol-relative URL by browsers, so they are rejected.
 */
export function safeNextPath(
  value: string | null | undefined,
  fallback: string,
): string {
  if (!value) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (value.includes("\\")) return fallback;
  if (/[\u0000-\u001F\u007F]/.test(value)) return fallback;
  return value;
}

/**
 * Auth changes invalidate prefetched/RSC route payloads that were cached while
 * the browser was signed out. A full document request re-runs the proxy with the
 * new cookie and clears that cache; this is deliberate after login, role setup
 * and sign-up. The caller must already have validated the destination path.
 */
export function hardNavigate(path: string): void {
  if (typeof window === "undefined") return;
  window.location.replace(path);
}
