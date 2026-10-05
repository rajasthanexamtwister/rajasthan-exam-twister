import { NextRequest, NextResponse } from "next/server";
import { QuizService } from "@/server/services/quiz-service";
import { errorResponse } from "@/server/lib/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/lib/auth-options";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { searchParams } = new URL(request.url);
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

    const nextQuiz = await QuizService.getNextQuizInSeries(params.id, studentId, excludeQuestionIds);
    return NextResponse.json({ nextQuiz }, { status: 200 });
  } catch (err) {
    console.error("Next quiz API error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to get next quiz", 500);
  }
}

