import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/server/lib/token";
import { QuizSubmissionRepository } from "@/server/repositories/quiz-submission";
import { errorResponse, successResponse } from "@/server/lib/api-response";
import { QuizSubmissionStatus } from "@/server/models/QuizSubmission";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Unauthorized: Admin session required", 401);
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status") as QuizSubmissionStatus | "ALL" | null;
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);

    const result = await QuizSubmissionRepository.findAllPaginated({
      status: statusParam || "ALL",
      search,
      page,
      pageSize,
    });

    return successResponse(result);
  } catch (err: any) {
    console.error("Admin list quiz submissions error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to fetch student quiz submissions", 500);
  }
}
