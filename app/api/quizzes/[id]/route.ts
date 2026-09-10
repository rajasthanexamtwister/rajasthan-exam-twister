import { NextRequest, NextResponse } from "next/server";
import { QuizService } from "@/server/services/quiz-service";
import { UpdateQuizSettingsSchema } from "@/server/validation/quiz";
import { getSessionFromRequest } from "@/server/lib/token";
import { errorResponse } from "@/server/lib/api-response";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/quizzes/:id - Admin view quiz with questions and answers
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Unauthorized: Admin session required", 401);
    }

    const data = await QuizService.getAdminQuizById(params.id);
    if (!data) {
      return errorResponse("NOT_FOUND", "Quiz not found", 404);
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("Get quiz by ID API error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to retrieve quiz", 500);
  }
}

// PATCH /api/quizzes/:id - Update quiz settings (Admin only)
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

    const validation = UpdateQuizSettingsSchema.safeParse(body);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        fieldErrors[issue.path.join(".")] = issue.message;
      }
      return errorResponse("VALIDATION_ERROR", "Validation failed", 400, fieldErrors);
    }

    const updatedQuiz = await QuizService.updateQuizSettings(params.id, validation.data);
    if (!updatedQuiz) {
      return errorResponse("NOT_FOUND", "Quiz not found", 404);
    }

    return NextResponse.json({ quiz: updatedQuiz }, { status: 200 });
  } catch (err) {
    console.error("Update quiz API error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to update quiz", 500);
  }
}

// DELETE /api/quizzes/:id - Delete quiz (Admin only, requires ?confirm=true)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Unauthorized: Admin session required", 401);
    }

    const confirm = request.nextUrl.searchParams.get("confirm") === "true";
    if (!confirm) {
      return errorResponse(
        "CONFLICT",
        "Deletion confirmation required (?confirm=true)",
        409
      );
    }

    const deleted = await QuizService.deleteQuiz(params.id);
    if (!deleted) {
      return errorResponse("NOT_FOUND", "Quiz not found or already deleted", 404);
    }

    return NextResponse.json({ message: "Quiz deleted successfully" }, { status: 200 });
  } catch (err) {
    console.error("Delete quiz API error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to delete quiz", 500);
  }
}
