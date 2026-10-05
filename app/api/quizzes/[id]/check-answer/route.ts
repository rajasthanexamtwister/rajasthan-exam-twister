import { NextRequest, NextResponse } from "next/server";
import { QuizService } from "@/server/services/quiz-service";
import { errorResponse } from "@/server/lib/api-response";
import { checkRateLimit, getClientIp } from "@/server/lib/rate-limit";
import { z } from "zod";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

const CheckAnswerSchema = z.object({
  questionId: z.string().min(1),
  selectedOptionIndex: z.number().nullable().optional(),
  isPracticeMode: z.boolean().optional(),
});

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(clientIp, {
      windowMs: 60 * 1000,
      max: 120,
      keyPrefix: "check-answer",
    });

    if (!rateLimit.success) {
      return errorResponse("RATE_LIMITED", "Too many requests", 429);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse("VALIDATION_ERROR", "Invalid JSON payload", 400);
    }

    const validation = CheckAnswerSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid question evaluation input", 400);
    }

    const { questionId, selectedOptionIndex, isPracticeMode } = validation.data;
    const feedback = await QuizService.checkSingleQuestionAnswer(
      params.id,
      questionId,
      selectedOptionIndex ?? null,
      isPracticeMode ?? false
    );

    if (!feedback) {
      return errorResponse("NOT_FOUND", "Quiz or question not found", 404);
    }

    return NextResponse.json({ feedback }, { status: 200 });
  } catch (err) {
    console.error("Check answer API error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to check answer", 500);
  }
}
