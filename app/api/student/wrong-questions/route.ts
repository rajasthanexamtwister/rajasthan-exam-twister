import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/lib/auth-options";
import { NotebookService } from "@/server/services/notebook-service";
import { errorResponse } from "@/server/lib/api-response";
import { checkRateLimit, getClientIp } from "@/server/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(clientIp, {
      windowMs: 60 * 1000,
      max: 60,
      keyPrefix: "student-wrong-questions",
    });

    if (!rateLimit.success) {
      return errorResponse("RATE_LIMITED", "Too many requests. Please slow down.", 429);
    }

    const session = await getServerSession(authOptions);
    const studentId = (session?.user as any)?.id;

    if (!session?.user || !studentId) {
      return errorResponse(
        "UNAUTHORIZED",
        "Student authentication required to view wrong questions",
        401
      );
    }

    const wrongQuestions = await NotebookService.getStudentWrongQuestions(studentId);

    return NextResponse.json({
      success: true,
      wrongQuestions,
      totalCount: wrongQuestions.length,
      studentId,
    });
  } catch (err) {
    console.error("Student wrong questions fetch error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to retrieve wrong questions", 500);
  }
}
