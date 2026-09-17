import { NextRequest, NextResponse } from "next/server";
import { PresenceService } from "@/server/services/presence-service";
import { checkRateLimit, getClientIp } from "@/server/lib/rate-limit";
import { errorResponse } from "@/server/lib/api-response";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const VISITOR_COOKIE_NAME = "ret_sid";
const COOKIE_MAX_AGE = 24 * 60 * 60; // 24 hours in seconds

export async function POST(request: NextRequest) {
  try {
    let sessionId = request.cookies.get(VISITOR_COOKIE_NAME)?.value;
    let isNewSession = false;

    // Validate sessionId format (alphanumeric UUID format) or generate new anonymous session ID
    if (
      !sessionId ||
      typeof sessionId !== "string" ||
      sessionId.length > 64 ||
      !/^[a-zA-Z0-9_-]+$/.test(sessionId)
    ) {
      sessionId = crypto.randomUUID();
      isNewSession = true;
    }

    // Rate limiting check
    const ip = getClientIp(request);
    const rateLimitKey = `presence:${sessionId}:${ip}`;
    const rateLimit = checkRateLimit(rateLimitKey, {
      windowMs: 30 * 1000,
      max: 10,
    });

    if (!rateLimit.success) {
      return errorResponse("RATE_LIMITED", "Heartbeat rate limit exceeded", 429);
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Empty or non-JSON body ok, fallback to default path
    }

    const currentPath = typeof body.currentPath === "string" ? body.currentPath : "/";
    const userAgent = request.headers.get("user-agent") || "";

    const result = await PresenceService.recordHeartbeat({
      sessionId,
      currentPath,
      userAgent,
    });

    const response = NextResponse.json(
      {
        ok: true,
        recorded: result.recorded,
      },
      { status: 200 }
    );

    // Ensure ret_sid cookie is set if missing or new
    if (isNewSession || !request.cookies.has(VISITOR_COOKIE_NAME)) {
      response.cookies.set(VISITOR_COOKIE_NAME, sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: COOKIE_MAX_AGE,
      });
    }

    return response;
  } catch (err) {
    console.error("Presence heartbeat error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to process heartbeat", 500);
  }
}
