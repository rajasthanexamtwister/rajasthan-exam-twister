import { NextRequest, NextResponse } from "next/server";
import { QuizService } from "@/server/services/quiz-service";
import { QuizQuerySchema } from "@/server/validation/quiz";
import { getSessionFromRequest } from "@/server/lib/token";
import { errorResponse } from "@/server/lib/api-response";
import { ContentStatus } from "@/server/models/Blog";

export const dynamic = "force-dynamic";

// GET /api/quizzes - List quizzes (Public: PUBLISHED only; Admin: with filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const session = await getSessionFromRequest(request);
    const isAdmin = !!session;

    const queryValidation = QuizQuerySchema.safeParse({
      status: searchParams.get("status") || undefined,
      subject: searchParams.get("subject") || undefined,
      categoryId: searchParams.get("categoryId") || searchParams.get("category") || undefined,
      search: searchParams.get("search") || searchParams.get("q") || undefined,
      page: searchParams.get("page") || undefined,
      pageSize: searchParams.get("pageSize") || undefined,
    });

    if (!queryValidation.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid query parameters", 400);
    }

    const { status, subject, categoryId, search, page, pageSize } = queryValidation.data;

    const result = await QuizService.listQuizzes(
      {
        status: status as ContentStatus | "ALL",
        subject,
        categoryId,
        search,
        page,
        pageSize,
      },
      isAdmin
    );

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("List quizzes API error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to retrieve quizzes", 500);
  }
}
