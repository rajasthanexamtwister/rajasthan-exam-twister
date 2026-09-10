import { NextRequest, NextResponse } from "next/server";
import { QuizService } from "@/server/services/quiz-service";
import { UpdateQuizQuestionSchema } from "@/server/validation/quiz";
import { getSessionFromRequest } from "@/server/lib/token";
import { errorResponse } from "@/server/lib/api-response";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
    questionId: string;
  };
}

// PATCH /api/quizzes/:id/questions/:questionId - Edit single question inline (Admin only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Unauthorized: Admin session required", 401);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse("VALIDATION_ERROR", "Invalid JSON payload", 400);
    }

    const validation = UpdateQuizQuestionSchema.safeParse(body);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        fieldErrors[issue.path.join(".")] = issue.message;
      }
      return errorResponse("VALIDATION_ERROR", "Validation failed", 400, fieldErrors);
    }

    const updated = await QuizService.updateQuestion(params.questionId, validation.data);
    if (!updated) {
      return errorResponse("NOT_FOUND", "Question not found", 404);
    }

    return NextResponse.json({ question: updated }, { status: 200 });
  } catch (err) {
    console.error("Update quiz question API error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to update question", 500);
  }
}
