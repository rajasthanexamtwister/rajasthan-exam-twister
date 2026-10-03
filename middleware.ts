import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, AUTH_COOKIE_NAME } from "./server/lib/token";
import { validateCsrfHeader, csrfErrorResponse } from "./server/lib/csrf";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const method = request.method.toUpperCase();
  const host = (request.headers.get("host") || "").split(":")[0];

  // 1. Canonical domain redirect: any non-www domain (e.g. rajasthanexamtwister.in, *.vercel.app) 301 redirects to www.rajasthanexamtwister.in
  const isCustomCanonical = host === "www.rajasthanexamtwister.in";
  const isLocalDev = host.includes("localhost") || host.includes("127.0.0.1");

  if (host && !isCustomCanonical && !isLocalDev) {
    const canonicalUrl = new URL(`https://www.rajasthanexamtwister.in${pathname}${search}`);
    return NextResponse.redirect(canonicalUrl, { status: 301 });
  }

  // 2. CSRF Defense-in-depth for mutating admin API routes only (POST, PUT, PATCH, DELETE)
  // Only /api/admin/* requires the custom CSRF header — student routes and NextAuth routes are excluded
  if (pathname.startsWith("/api/admin/")) {
    const isMutating = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
    if (isMutating) {
      if (!validateCsrfHeader(request)) {
        return csrfErrorResponse();
      }
    }
    return NextResponse.next();
  }

  // 3. Only run auth guards on /admin routes
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
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand/|assests/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

