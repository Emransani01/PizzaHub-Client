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
/**
 * Incrementing this epoch invalidates every token exchange that started before
 * the change. A late response must not write a token or clear a newer session.
 */
let authEpoch = 0;
interface RefreshOperation {
  epoch: number;
  promise: Promise<TokenRefreshResult>;
}
let refreshOperation: RefreshOperation | null = null;

const TOKEN_TIMEOUT_MS = 10_000;
const TOKEN_UNAVAILABLE_MESSAGE =
  "We couldn't verify your session. Check your connection and try again.";
const TOKEN_BLOCKED_MESSAGE =
  "This account has been blocked by an administrator.";

export interface TokenResponse {
  token: string;
  expiresIn: string;
  user: UserProfile;
}

/**
 * Explicit outcome of the session-cookie → JWT exchange. A temporary outage
 * must never be collapsed into "signed out".
 */
export type TokenRefreshResult = (
  | { kind: "authenticated"; session: TokenResponse }
  | {
      kind: "unauthenticated";
      message: string;
      /** A session cookie existed but no longer maps to a valid session. */
      sessionExpired?: boolean;
    }
  | { kind: "forbidden"; message: string }
  | { kind: "unavailable"; message: string }
) & {
  /** Epoch of the session that initiated this exchange. */
  epoch?: number;
};

export function getAccessToken(): string | null {
  return accessToken;
}

export function clearAccessToken(): void {
  accessToken = null;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAuthEpoch(): number {
  return authEpoch;
}

/** Invalidates pre-change refreshes before a new cookie is established. */
export function beginAuthSessionChange(): number {
  authEpoch += 1;
  refreshOperation = null;
  return authEpoch;
}

/** Invalidates anything started during the change and clears the old token. */
export function completeAuthSessionChange(): number {
  authEpoch += 1;
  accessToken = null;
  refreshOperation = null;
  return authEpoch;
}

export function isStaleTokenResult(result: TokenRefreshResult): boolean {
  return result.epoch !== undefined && result.epoch !== authEpoch;
}

function messageFromBody(body: unknown, fallback: string): string {
  if (body && typeof body === "object") {
    const message = (body as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }
  return fallback;
}

function isTokenResponse(value: unknown): value is TokenResponse {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<TokenResponse>;
  if (
    typeof candidate.token !== "string" ||
    candidate.token.length === 0 ||
    typeof candidate.expiresIn !== "string"
  ) {
    return false;
  }
  if (!candidate.user || typeof candidate.user !== "object") return false;
  const user = candidate.user as Partial<UserProfile>;
  return typeof user.id === "string" && typeof user.role === "string";
}

/**
 * Exchanges the session cookie for a fresh JWT.
 *
 * Only a genuine 401/403 clears the local token. Network failures, timeouts,
 * rate limiting and 5xx responses are reported as `unavailable` so a temporary
 * outage can never look like a signed-out user. Concurrent callers share one
 * in-flight request.
 */
export async function fetchToken(): Promise<TokenRefreshResult> {
  if (!refreshOperation) {
    const epoch = authEpoch;
    const promise = runTokenRefresh(epoch);
    refreshOperation = { epoch, promise };
    void promise.finally(() => {
      // A session change may have detached this operation and started a new
      // one; never clear the newer shared promise from an older request.
      if (refreshOperation?.promise === promise) {
        refreshOperation = null;
      }
    });
  }

  return refreshOperation.promise;
}

async function runTokenRefresh(epoch: number): Promise<TokenRefreshResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TOKEN_TIMEOUT_MS);
  const isCurrent = () => epoch === authEpoch;
  const writeToken = (token: string | null) => {
    // A response that belongs to a replaced session must not touch the token.
    if (isCurrent()) accessToken = token;
  };

  try {
    const response = await fetch(`${API_BASE}/auth/token`, {
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (response.status === 401) {
      writeToken(null);
      const body = await parseBody(response);
      const sessionExpired =
        Boolean(body) &&
        typeof body === "object" &&
        (body as { code?: unknown }).code === "SESSION_EXPIRED";
      return {
        kind: "unauthenticated",
        message: messageFromBody(body, "Sign in to continue."),
        ...(sessionExpired ? { sessionExpired: true } : {}),
        epoch,
      };
    }

    if (response.status === 403) {
      writeToken(null);
      const body = await parseBody(response);
      return {
        kind: "forbidden",
        message: messageFromBody(body, TOKEN_BLOCKED_MESSAGE),
        epoch,
      };
    }

    if (!response.ok || response.status === 408 || response.status === 429) {
      const body = await parseBody(response);
      return {
        kind: "unavailable",
        message: messageFromBody(body, TOKEN_UNAVAILABLE_MESSAGE),
        epoch,
      };
    }

    const data: unknown = await response.json().catch(() => null);
    if (!isTokenResponse(data)) {
      return {
        kind: "unavailable",
        message: TOKEN_UNAVAILABLE_MESSAGE,
        epoch,
      };
    }

    writeToken(data.token);
    return { kind: "authenticated", session: data, epoch };
  } catch {
    // Network errors and AbortError (including our own timeout) are
    // intentionally non-destructive: keep the current token and user.
    return {
      kind: "unavailable",
      message: TOKEN_UNAVAILABLE_MESSAGE,
      epoch,
    };
  } finally {
    clearTimeout(timeout);
  }
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

    if (isStaleTokenResult(refreshed)) {
      // A newer session was established while this exchange was in flight.
      // Preserve the original 401 instead of retrying with no/old bearer token.
    } else if (refreshed.kind === "authenticated") {
      // Exactly one retry with the freshly issued bearer token.
      response = await send();
    } else if (refreshed.kind === "forbidden") {
      throw new ApiError(403, refreshed.message, { code: "FORBIDDEN" });
    } else if (refreshed.kind === "unavailable") {
      throw new ApiError(503, refreshed.message, {
        code: "AUTH_UNAVAILABLE",
      });
    }
    // `unauthenticated` falls through so the original 401 is preserved.
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
