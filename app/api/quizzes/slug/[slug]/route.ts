import { NextRequest, NextResponse } from "next/server";
import { QuizService } from "@/server/services/quiz-service";
import { errorResponse } from "@/server/lib/api-response";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    slug: string;
  };
}

// GET /api/quizzes/slug/:slug - Public detail view (Answers strictly omitted)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const quiz = await QuizService.getPublicQuizBySlug(params.slug);
    if (!quiz) {
      return errorResponse("NOT_FOUND", "Quiz not found or not published", 404);
    }

    return NextResponse.json({ quiz }, { status: 200 });
  } catch (err) {
    console.error("Get public quiz by slug API error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to retrieve quiz", 500);
  }
}
