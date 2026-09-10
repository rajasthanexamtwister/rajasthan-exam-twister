import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, AUTH_COOKIE_NAME } from "./server/lib/token";
import { validateCsrfHeader, csrfErrorResponse } from "./server/lib/csrf";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();

  // 1. CSRF Defense-in-depth for mutating API routes (POST, PUT, PATCH, DELETE)
  if (pathname.startsWith("/api/")) {
    const isMutating = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
    if (isMutating) {
      if (!validateCsrfHeader(request)) {
        return csrfErrorResponse();
      }
    }
    return NextResponse.next();
  }

  // 2. Only run auth guards on /admin routes
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifyAdminToken(token) : null;

  const isLoginPage = pathname === "/admin/login";

  if (!session && !isLoginPage) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session && isLoginPage) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};

