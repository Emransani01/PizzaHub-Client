/**
 * Browser API transport.
 *
 * The short-lived JWT lives in a module variable only — never in localStorage —
 * and is refreshed from the HttpOnly Better Auth session cookie when the API
 * answers 401.
 */
import type { UserProfile } from "@/types";

export const API_BASE = "/api";

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(
    status: number,
    message: string,
    options: { code?: string; details?: unknown } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = options.code;
    this.details = options.details;
  }
}

let accessToken: string | null = null;
let refreshPromise: Promise<TokenResponse | null> | null = null;

export interface TokenResponse {
  token: string;
  expiresIn: string;
  user: UserProfile;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function clearAccessToken(): void {
  accessToken = null;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

/** Exchanges the session cookie for a fresh JWT. Returns null when signed out. */
export async function fetchToken(): Promise<TokenResponse | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE}/auth/token`, {
          credentials: "include",
          cache: "no-store",
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          accessToken = null;
          return null;
        }

        const data = (await response.json()) as TokenResponse;
        accessToken = data.token;
        return data;
      } catch {
        accessToken = null;
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

async function parseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json().catch(() => null);
  }
  const text = await response.text().catch(() => "");
  return text || null;
}

function errorFromResponse(status: number, body: unknown): ApiError {
  if (body && typeof body === "object") {
    const payload = body as { message?: unknown; code?: unknown; details?: unknown };
    const message =
      typeof payload.message === "string"
        ? payload.message
        : `Request failed with status ${status}.`;
    return new ApiError(status, message, {
      code: typeof payload.code === "string" ? payload.code : undefined,
      details: payload.details,
    });
  }

  return new ApiError(
    status,
    typeof body === "string" && body.length > 0
      ? body
      : `Request failed with status ${status}.`,
  );
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  /** Send as multipart form data instead of JSON. */
  formData?: FormData;
  /** Skip the automatic token refresh/retry (used by the token call itself). */
  noRetry?: boolean;
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  const send = async (): Promise<Response> => {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

    let body: BodyInit | undefined;
    if (options.formData) {
      body = options.formData;
    } else if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(options.body);
    }

    return fetch(url, {
      method: options.method ?? "GET",
      headers,
      body,
      credentials: "include",
      cache: "no-store",
      signal: options.signal,
    });
  };

  let response = await send();

  if (response.status === 401 && !options.noRetry) {
    const refreshed = await fetchToken();
    if (refreshed) {
      response = await send();
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await parseBody(response);

  if (!response.ok) {
    throw errorFromResponse(response.status, payload);
  }

  return payload as T;
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function errorMessage(error: unknown): string {
  if (isApiError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
