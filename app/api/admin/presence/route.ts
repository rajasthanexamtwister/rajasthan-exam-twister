import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/server/lib/token";
import { PresenceService } from "@/server/services/presence-service";
import { errorResponse } from "@/server/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Unauthorized: Valid admin session required", 401);
    }

    const presence = await PresenceService.getActivePresence(90);

    return NextResponse.json(presence, { status: 200 });
  } catch (err) {
    console.error("Admin presence error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to fetch presence data", 500);
  }
}
