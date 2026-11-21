import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  apiFetch,
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "@/lib/api";
import { jsonResponse, testUser } from "./helpers";

const tokenBody = { token: "fresh-token", expiresIn: "15m", user: testUser };

function stubRouter(
  handler: (url: string, init?: RequestInit) => Promise<Response>,
) {
  const mock = vi.fn((input: string | URL | Request, init?: RequestInit) =>
    handler(String(input), init),
  );
  vi.stubGlobal("fetch", mock);
  return mock;
}

function authorizationOf(init: RequestInit | undefined): string | undefined {
  const headers = init?.headers as Record<string, string> | undefined;
  return headers?.Authorization;
}

describe("apiFetch 401 refresh-and-retry", () => {
  beforeEach(() => {
    setAccessToken("stale-token");
  });

  afterEach(() => {
    clearAccessToken();
    vi.unstubAllGlobals();
  });

  it("retries once with the new token when refresh is authenticated", async () => {
    let orderCalls = 0;
    const fetchMock = stubRouter(async (url) => {
      if (url === "/api/auth/token") return jsonResponse(200, tokenBody);
      if (url === "/api/orders") {
        orderCalls += 1;
        return orderCalls === 1
          ? jsonResponse(401, { message: "Token expired." })
          : jsonResponse(200, { ok: true });
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    const result = await apiFetch<{ ok: boolean }>("/orders");

    expect(result).toEqual({ ok: true });
    expect(orderCalls).toBe(2);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const orderInit = fetchMock.mock.calls.filter(
      ([input]) => String(input) === "/api/orders",
    )[1][1];
    expect(authorizationOf(orderInit)).toBe("Bearer fresh-token");
  });

  it("preserves the original 401 when refresh is unauthenticated", async () => {
    let orderCalls = 0;
    stubRouter(async (url) => {
      if (url === "/api/auth/token") {
        return jsonResponse(401, { message: "Sign in to continue." });
      }
      if (url === "/api/orders") {
        orderCalls += 1;
        return jsonResponse(401, { message: "Sign in to continue." });
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    await expect(apiFetch("/orders")).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
      message: "Sign in to continue.",
    });
    expect(orderCalls).toBe(1);
    expect(getAccessToken()).toBeNull();
  });

  it("propagates a connectivity error when refresh is unavailable", async () => {
    let orderCalls = 0;
    stubRouter(async (url) => {
      if (url === "/api/auth/token") {
        return jsonResponse(503, { message: "Server error." });
      }
      if (url === "/api/orders") {
        orderCalls += 1;
        return jsonResponse(401, { message: "Token expired." });
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    await expect(apiFetch("/orders")).rejects.toMatchObject({
      name: "ApiError",
      status: 503,
      code: "AUTH_UNAVAILABLE",
    });
    expect(orderCalls).toBe(1);
    expect(getAccessToken()).toBe("stale-token");
  });

  it("never retries more than once when the retry also returns 401", async () => {
    let orderCalls = 0;
    stubRouter(async (url) => {
      if (url === "/api/auth/token") return jsonResponse(200, tokenBody);
      if (url === "/api/orders") {
        orderCalls += 1;
        return jsonResponse(401, { message: "Still unauthorized." });
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    await expect(apiFetch("/orders")).rejects.toMatchObject({ status: 401 });
    expect(orderCalls).toBe(2);
  });
});
