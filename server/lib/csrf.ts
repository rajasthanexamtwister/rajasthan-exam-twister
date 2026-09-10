import { NextRequest, NextResponse } from "next/server";

export const CSRF_HEADER_NAME = "x-requested-with";
export const CSRF_HEADER_VALUE = "ret-admin";

/**
 * Validates that mutating requests contain the required custom anti-CSRF header.
 * Standard cross-origin browser form submissions cannot send custom headers.
 */
export function validateCsrfHeader(request: NextRequest): boolean {
  const headerVal = request.headers.get(CSRF_HEADER_NAME);
  return headerVal === CSRF_HEADER_VALUE || headerVal === "XMLHttpRequest";
}

export function csrfErrorResponse(): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: "CSRF_ERROR",
        message: "Missing or invalid CSRF protection header (x-requested-with: ret-admin)",
      },
    },
    { status: 403 }
  );
}
