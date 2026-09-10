import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/lib/auth-options";
import { NotebookService } from "@/server/services/notebook-service";
import { errorResponse } from "@/server/lib/api-response";
import { checkRateLimit, getClientIp } from "@/server/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(clientIp, {
      windowMs: 60 * 1000,
      max: 60,
      keyPrefix: "student-bookmarks-id-del",
    });

    if (!rateLimit.success) {
      return errorResponse("RATE_LIMITED", "Too many requests. Please slow down.", 429);
    }

    const session = await getServerSession(authOptions);
    const studentId = (session?.user as any)?.id;

    if (!session?.user || !studentId) {
      return errorResponse(
        "UNAUTHORIZED",
        "Student authentication required to remove bookmark",
        401
      );
    }

    const questionId = params.id;
    if (!questionId || typeof questionId !== "string") {
      return errorResponse("VALIDATION_ERROR", "A valid questionId is required", 400);
    }

    const success = await NotebookService.removeBookmark(studentId, questionId);

    return NextResponse.json({
      success,
      message: success ? "Bookmark removed successfully" : "Bookmark not found",
      questionId,
    });
  } catch (err) {
    console.error("Student remove bookmark by id error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to remove bookmark", 500);
  }
}
