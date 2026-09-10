import { NextRequest, NextResponse } from "next/server";
import { QuizService } from "@/server/services/quiz-service";
import { QuizImportJSONSchema } from "@/server/validation/quiz";
import { getSessionFromRequest } from "@/server/lib/token";
import { errorResponse } from "@/server/lib/api-response";
import { checkRateLimit, getClientIp } from "@/server/lib/rate-limit";

export const dynamic = "force-dynamic";

// POST /api/quizzes/import - Admin import AI-generated JSON
export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(clientIp, {
      windowMs: 15 * 60 * 1000,
      max: 20,
      keyPrefix: "quiz-import",
    });

    if (!rateLimit.success) {
      return errorResponse(
        "RATE_LIMITED",
        "Too many quiz import requests. Please wait a few minutes before trying again.",
        429
      );
    }

    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Unauthorized: Admin session required", 401);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse("VALIDATION_ERROR", "Invalid JSON payload in request body", 400);
    }

    const validation = QuizImportJSONSchema.safeParse(body);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        fieldErrors[issue.path.join(".")] = issue.message;
      }
      return errorResponse("VALIDATION_ERROR", "Validation failed for quiz JSON", 400, fieldErrors);
    }

    const result = await QuizService.importQuizJson(validation.data);

    return NextResponse.json(
      {
        message: `Quiz created as DRAFT with ${result.questionCount} questions`,
        quiz: result.quiz,
        questionCount: result.questionCount,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("Quiz import API error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to import quiz JSON", 500);
  }
}
