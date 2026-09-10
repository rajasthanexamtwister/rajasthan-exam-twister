import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/lib/auth-options";
import { BoosterService } from "@/server/services/booster-service";
import { errorResponse } from "@/server/lib/api-response";
import { checkRateLimit, getClientIp } from "@/server/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(clientIp, {
      windowMs: 60 * 1000,
      max: 10,
      keyPrefix: "student-booster-gen",
    });

    if (!rateLimit.success) {
      return errorResponse("RATE_LIMITED", "Too many booster requests. Please wait a moment.", 429);
    }

    const session = await getServerSession(authOptions);
    const studentId = (session?.user as any)?.id;

    if (!session?.user || !studentId) {
      return errorResponse(
        "UNAUTHORIZED",
        "Student authentication required to generate a booster test",
        401
      );
    }

    const result = await BoosterService.generateBoosterTest(studentId);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Booster test generated successfully",
    });
  } catch (err: any) {
    console.error("Student booster test generation error:", err);
    return errorResponse(
      "INTERNAL_ERROR",
      err?.message || "Failed to generate personalized booster test",
      500
    );
  }
}
