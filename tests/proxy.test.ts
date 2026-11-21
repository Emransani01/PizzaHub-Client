import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { config, proxy } from "@/proxy";

function makeRequest(path: string, signedIn = false): NextRequest {
  const headers = new Headers();
  if (signedIn) {
    headers.set("cookie", "better-auth.session_token=test-session");
  }
  return new NextRequest(`https://pizzahub.test${path}`, { headers });
}

function redirectLocation(path: string, signedIn = false): string | null {
  return proxy(makeRequest(path, signedIn)).headers.get("location");
}

describe("proxy coverage for cart and checkout", () => {
  it("includes cart and checkout in the static matcher", () => {
    expect(config.matcher).toContain("/cart/:path*");
    expect(config.matcher).toContain("/checkout/:path*");
  });

  it.each(["/cart", "/cart/review", "/checkout", "/checkout/review"])(
    "redirects guests from %s to sign-in",
    (path) => {
      const response = proxy(makeRequest(path));

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        `https://pizzahub.test/sign-in?next=${encodeURIComponent(path)}`,
      );
    },
  );

  it("preserves query parameters in the sign-in redirect", () => {
    const path = "/checkout?step=delivery&from=cart";

    expect(redirectLocation(path)).toBe(
      `https://pizzahub.test/sign-in?next=${encodeURIComponent(path)}`,
    );
  });

  it.each(["/cart", "/cart/review", "/checkout", "/checkout/review"])(
    "allows a signed-in session to continue to %s",
    (path) => {
      const response = proxy(makeRequest(path, true));

      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    },
  );

  it.each([
    "/dashboard",
    "/dashboard/customer",
    "/profile-settings",
    "/favorites",
    "/menu/pizza-1",
    "/payment-success",
    "/payment-cancel",
  ])("keeps the existing protected route %s guarded", (path) => {
    expect(redirectLocation(path)).toBe(
      `https://pizzahub.test/sign-in?next=${encodeURIComponent(path)}`,
    );
  });

  it.each(["/", "/menu", "/sign-in", "/sign-up"])(
    "leaves public route %s accessible",
    (path) => {
      const response = proxy(makeRequest(path));

      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    },
  );
});
