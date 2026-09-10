import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/lib/auth-options";
import { QuizAttemptRepository } from "@/server/repositories/quiz-attempt";
import { errorResponse } from "@/server/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const studentId = (session?.user as any)?.id;

    if (!session?.user || !studentId) {
      return errorResponse("UNAUTHORIZED", "Please log in with Google to view your attempt history", 401);
    }

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "10", 10)));

    const result = await QuizAttemptRepository.listByStudentId(studentId, page, pageSize);

    // Compute student aggregate stats
    const allAttempts = result.attempts;
    let totalScoreSum = 0;
    let totalPossibleSum = 0;
    let bestScorePercentage = 0;

    for (const att of allAttempts) {
      totalScoreSum += att.score;
      totalPossibleSum += att.totalPossibleScore;
      const pct = att.totalPossibleScore > 0 ? (att.score / att.totalPossibleScore) * 100 : 0;
      if (pct > bestScorePercentage) {
        bestScorePercentage = pct;
      }
    }

    const stats = {
      totalAttempts: result.total,
      averagePercentage: totalPossibleSum > 0 ? Math.round((totalScoreSum / totalPossibleSum) * 10000) / 100 : 0,
      bestPercentage: Math.round(bestScorePercentage * 100) / 100,
    };

    return NextResponse.json({
      ...result,
      stats,
    });
  } catch (err) {
    console.error("Student attempts history error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to retrieve student attempt history", 500);
  }
}
