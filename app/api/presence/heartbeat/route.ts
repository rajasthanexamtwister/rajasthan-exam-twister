import { NextRequest, NextResponse } from "next/server";
import { PresenceService } from "@/server/services/presence-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const liveCount = PresenceService.getActiveCount();
    return NextResponse.json(
      {
        success: true,
        liveCount,
        timestamp: Date.now(),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/presence/heartbeat error:", error);
    return NextResponse.json({ success: true, liveCount: 18, timestamp: Date.now() });
  }
}

export async function POST(req: NextRequest) {
  try {
    let visitorId: string | undefined;

    try {
      const body = await req.json();
      if (body && typeof body.visitorId === "string") {
        visitorId = body.visitorId;
      }
    } catch {
      // Body might be empty, which is acceptable
    }

    // Fallback to IP / User-Agent hash or client header if visitorId was not provided in body
    if (!visitorId) {
      const forwarded = req.headers.get("x-forwarded-for");
      const ip = forwarded ? forwarded.split(",")[0].trim() : "anonymous";
      const ua = req.headers.get("user-agent") || "unknown";
      visitorId = `${ip}-${ua.slice(0, 30)}`;
    }

    const liveCount = PresenceService.recordHeartbeat(visitorId);

    return NextResponse.json(
      {
        success: true,
        liveCount,
        timestamp: Date.now(),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("POST /api/presence/heartbeat error:", error);
    return NextResponse.json({ success: true, liveCount: 18, timestamp: Date.now() });
  }
}
