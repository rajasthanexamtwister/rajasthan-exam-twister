import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/lib/auth-options";
import { AnalyticsService } from "@/server/services/analytics-service";
import { errorResponse } from "@/server/lib/api-response";
import { checkRateLimit, getClientIp } from "@/server/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(clientIp, {
      windowMs: 60 * 1000,
      max: 60,
      keyPrefix: "student-analytics",
    });

    if (!rateLimit.success) {
      return errorResponse("RATE_LIMITED", "Too many requests. Please slow down.", 429);
    }

    const session = await getServerSession(authOptions);
    const studentId = (session?.user as any)?.id;

    if (!session?.user || !studentId) {
      return errorResponse(
        "UNAUTHORIZED",
        "Student authentication required to view weak topic analysis",
        401
      );
    }

    const { searchParams } = request.nextUrl;
    const minSample = Math.max(1, parseInt(searchParams.get("minSampleSize") || "5", 10));

    const weakTopics = await AnalyticsService.getStudentWeakTopics(studentId, minSample);

    return NextResponse.json({
      weakTopics,
      totalAnalyzedTopics: weakTopics.length,
      studentId,
    });
  } catch (err) {
    console.error("Student weak topics analysis error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to retrieve weak topic analysis", 500);
  }
}
