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
