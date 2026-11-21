import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/navigation";

const SESSION_COOKIES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
];

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/profile-settings",
  "/favorites",
  "/cart",
  "/checkout",
];
const PROTECTED_EXACT_PATHS = ["/payment-success", "/payment-cancel"];
const MENU_DETAIL_PREFIX = "/menu/";

/**
 * First line of defence for authenticated pages. The Express API still
 * verifies the JWT, role, block state and ownership for every request, so this
 * redirect is only a UX guard, never the authorisation boundary.
 */
export function proxy(request: NextRequest) {
  const { pathname, search, hash } = request.nextUrl;

  const isProtected =
    PROTECTED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    ) ||
    PROTECTED_EXACT_PATHS.includes(pathname) ||
    pathname.startsWith(MENU_DETAIL_PREFIX);

  if (!isProtected) {
    return NextResponse.next();
  }

  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));

  if (hasSession) {
    return NextResponse.next();
  }

  const signIn = new URL("/sign-in", request.url);
  const destination = safeNextPath(`${pathname}${search}${hash}`, "/");
  signIn.searchParams.set("next", destination);
  return NextResponse.redirect(signIn);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile-settings",
    "/favorites",
    "/cart/:path*",
    "/checkout/:path*",
    "/menu/:id",
    "/payment-success",
    "/payment-cancel",
  ],
};
