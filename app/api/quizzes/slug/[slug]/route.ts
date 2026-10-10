import { NextRequest, NextResponse } from "next/server";
import { QuizService } from "@/server/services/quiz-service";
import { errorResponse } from "@/server/lib/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/lib/auth-options";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    slug: string;
  };
}

// GET /api/quizzes/slug/:slug - Public detail view (Answers strictly omitted)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const partParam = searchParams.get("part");
    const part = partParam ? parseInt(partParam, 10) : undefined;
    const excludeParam = searchParams.get("excludeQuestionIds");
    const excludeQuestionIds = excludeParam ? excludeParam.split(",").filter(Boolean) : undefined;

    let studentId = searchParams.get("studentId") || undefined;
    if (!studentId) {
      const session = await getServerSession(authOptions);
      const user = session?.user as any;
      if (user?.role === "student" && user?.id) {
        studentId = user.id;
      }
    }

    const quiz = await QuizService.getPublicQuizBySlug(params.slug, {
      limit: limit && !isNaN(limit) ? limit : undefined,
      part: part && !isNaN(part) ? part : undefined,
      studentId,
      excludeQuestionIds,
    });

    if (!quiz) {
      return errorResponse("NOT_FOUND", "Quiz not found or not published", 404);
    }

    return NextResponse.json({ quiz }, { status: 200 });
  } catch (err) {
    console.error("Get public quiz by slug API error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to retrieve quiz", 500);
  }
}

