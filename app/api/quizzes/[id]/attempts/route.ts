import { NextRequest, NextResponse } from "next/server";
import { QuizService } from "@/server/services/quiz-service";
import { SubmitQuizAttemptSchema } from "@/server/validation/quiz";
import { errorResponse } from "@/server/lib/api-response";
import { checkRateLimit, getClientIp } from "@/server/lib/rate-limit";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/server/lib/auth-options";

// POST /api/quizzes/:id/attempts - Authoritative attempt scoring
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(clientIp, {
      windowMs: 15 * 60 * 1000,
      max: 60,
      keyPrefix: "quiz-attempt",
    });

    if (!rateLimit.success) {
      return errorResponse(
        "RATE_LIMITED",
        "Too many attempt submissions. Please wait a few moments before trying again.",
        429
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse("VALIDATION_ERROR", "Invalid JSON payload in request body", 400);
    }

    const validation = SubmitQuizAttemptSchema.safeParse(body);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        fieldErrors[issue.path.join(".")] = issue.message;
      }
      return errorResponse("VALIDATION_ERROR", "Invalid quiz attempt submission", 400, fieldErrors);
    }

    // Retrieve logged-in student session if available
    let studentId: string | undefined;
    try {
      const session = await getServerSession(authOptions);
      if (session?.user && (session.user as any).id) {
        studentId = (session.user as any).id;
      }
    } catch (e) {
      // Guest attempt fallback
    }

    const result = await QuizService.evaluateAttempt(params.id, validation.data, studentId);
    if (!result) {
      return errorResponse("NOT_FOUND", "Quiz not found or has no active questions", 404);
    }

    return NextResponse.json({ result }, { status: 200 });
  } catch (err) {
    console.error("Quiz attempt evaluation API error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to evaluate quiz attempt", 500);
  }
}
