import { NextRequest, NextResponse } from "next/server";
import { QuizAttemptRepository } from "@/server/repositories/quiz-attempt";
import { errorResponse } from "@/server/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const windowParam = searchParams.get("window") || "7";
    const limitParam = parseInt(searchParams.get("limit") || "50", 10);
    const limit = Math.min(100, Math.max(1, isNaN(limitParam) ? 50 : limitParam));

    let windowDays = 7;
    if (windowParam === "30") {
      windowDays = 30;
    } else if (windowParam === "all" || windowParam === "0") {
      windowDays = 0;
    }

    const leaderboard = await QuizAttemptRepository.getLeaderboard(windowDays, limit);

    return NextResponse.json(
      {
        window: windowParam,
        leaderboard,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Leaderboard API error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to retrieve leaderboard", 500);
  }
}
