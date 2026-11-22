import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  beginAuthSessionChange,
  clearAccessToken,
  completeAuthSessionChange,
  fetchToken,
  getAccessToken,
  getAuthEpoch,
  isStaleTokenResult,
  setAccessToken,
  type TokenRefreshResult,
} from "@/lib/api";
import { jsonResponse, testUser } from "./helpers";

const validBody = { token: "new-token", expiresIn: "15m", user: testUser };

function stubFetch(handler: (init?: RequestInit) => Promise<Response>) {
  const mock = vi.fn((_input: string | URL | Request, init?: RequestInit) =>
    handler(init),
  );
  vi.stubGlobal("fetch", mock);
  return mock;
}

describe("fetchToken classification", () => {
  beforeEach(() => {
    completeAuthSessionChange();
    setAccessToken("old-token");
  });

  afterEach(() => {
    clearAccessToken();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("returns authenticated for a valid 200 and replaces the token", async () => {
    stubFetch(async () => jsonResponse(200, validBody));

    const result = await fetchToken();

    expect(result.kind).toBe("authenticated");
    if (result.kind === "authenticated") {
      expect(result.session.token).toBe("new-token");
      expect(result.session.user.id).toBe(testUser.id);
    }
    expect(getAccessToken()).toBe("new-token");
  });

  it("returns unauthenticated for 401 and clears the token", async () => {
    stubFetch(async () => jsonResponse(401, { message: "Sign in to continue." }));

    const result = await fetchToken();

    expect(result).toMatchObject({
      kind: "unauthenticated",
      message: "Sign in to continue.",
    });
    expect(getAccessToken()).toBeNull();
  });

  it("marks a 401 with SESSION_EXPIRED as a stale session", async () => {
    stubFetch(async () =>
      jsonResponse(401, {
        message: "Your session has expired. Please sign in again.",
        code: "SESSION_EXPIRED",
      }),
    );

    const result = await fetchToken();

    expect(result).toMatchObject({
      kind: "unauthenticated",
      sessionExpired: true,
      message: "Your session has expired. Please sign in again.",
    });
    expect(getAccessToken()).toBeNull();
  });

  it("returns forbidden with the server message for 403 and clears the token", async () => {
    stubFetch(async () =>
      jsonResponse(403, { message: "This account has been blocked by an administrator." }),
    );

    const result = await fetchToken();

    expect(result).toMatchObject({
      kind: "forbidden",
      message: "This account has been blocked by an administrator.",
    });
    expect(getAccessToken()).toBeNull();
  });

  it("returns unavailable for 408 and preserves the token", async () => {
    stubFetch(async () => jsonResponse(408, { message: "Gateway timeout." }));

    const result = await fetchToken();

    expect(result.kind).toBe("unavailable");
    expect(getAccessToken()).toBe("old-token");
  });

  it("returns unavailable for 429 and preserves the token", async () => {
    stubFetch(async () => jsonResponse(429, { message: "Too many requests." }));

    const result = await fetchToken();

    expect(result.kind).toBe("unavailable");
    expect(getAccessToken()).toBe("old-token");
  });

  it.each([500, 502, 503])("returns unavailable for %i", async (status) => {
    stubFetch(async () => jsonResponse(status, { message: "Server error." }));

    const result = await fetchToken();

    expect(result.kind).toBe("unavailable");
    expect(getAccessToken()).toBe("old-token");
  });

  it("returns unavailable for a network TypeError and preserves the token", async () => {
    stubFetch(async () => {
      throw new TypeError("Failed to fetch");
    });

    const result = await fetchToken();

    expect(result.kind).toBe("unavailable");
    expect(getAccessToken()).toBe("old-token");
  });

  it("returns unavailable for an abort/timeout and preserves the token", async () => {
    vi.useFakeTimers();
    const fetchMock = stubFetch(
      (init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        }),
    );

    const pending = fetchToken();
    await vi.advanceTimersByTimeAsync(10_000);
    const result = await pending;

    expect(result.kind).toBe("unavailable");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBe("old-token");
  });

  it("returns unavailable for a malformed 200 response and preserves the token", async () => {
    stubFetch(async () => jsonResponse(200, { token: "", user: testUser }));

    const result: TokenRefreshResult = await fetchToken();

    expect(result.kind).toBe("unavailable");
    expect(getAccessToken()).toBe("old-token");
  });

  it("deduplicates concurrent refresh calls", async () => {
    const fetchMock = stubFetch(async () => jsonResponse(200, validBody));

    const [first, second] = await Promise.all([fetchToken(), fetchToken()]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first.kind).toBe("authenticated");
    expect(second.kind).toBe("authenticated");
  });

  it("does not write a token from a refresh invalidated by a session change", async () => {
    let resolveResponse!: (response: Response) => void;
    const pendingResponse = new Promise<Response>((resolve) => {
      resolveResponse = resolve;
    });
    stubFetch(async () => pendingResponse);

    const pending = fetchToken();
    beginAuthSessionChange();
    resolveResponse(jsonResponse(200, validBody));

    const result = await pending;
    expect(isStaleTokenResult(result)).toBe(true);
    expect(getAccessToken()).toBe("old-token");
  });

  it("does not mark concurrent valid refresh results as stale", async () => {
    stubFetch(async () => jsonResponse(200, validBody));
    const epoch = getAuthEpoch();

    const [first, second] = await Promise.all([fetchToken(), fetchToken()]);

    expect(first.epoch).toBe(epoch);
    expect(second.epoch).toBe(epoch);
    expect(isStaleTokenResult(first)).toBe(false);
    expect(isStaleTokenResult(second)).toBe(false);
  });
});
