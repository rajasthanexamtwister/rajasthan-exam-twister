import { NextRequest, NextResponse } from "next/server";
import { QuizService } from "@/server/services/quiz-service";
import { errorResponse } from "@/server/lib/api-response";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const nextQuiz = await QuizService.getNextQuizInSeries(params.id);
    return NextResponse.json({ nextQuiz }, { status: 200 });
  } catch (err) {
    console.error("Next quiz API error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to get next quiz", 500);
  }
}
