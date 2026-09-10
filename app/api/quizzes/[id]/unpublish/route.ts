import { NextRequest, NextResponse } from "next/server";
import { QuizService } from "@/server/services/quiz-service";
import { getSessionFromRequest } from "@/server/lib/token";
import { errorResponse } from "@/server/lib/api-response";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

// POST /api/quizzes/:id/unpublish - Unpublish quiz back to DRAFT (Admin only)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Unauthorized: Admin session required", 401);
    }

    const quiz = await QuizService.unpublishQuiz(params.id);
    if (!quiz) {
      return errorResponse("NOT_FOUND", "Quiz not found", 404);
    }

    return NextResponse.json({ message: "Quiz unpublished successfully", quiz }, { status: 200 });
  } catch (err) {
    console.error("Unpublish quiz API error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to unpublish quiz", 500);
  }
}
