import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/server/lib/token";
import { QuizSubmissionRepository } from "@/server/repositories/quiz-submission";
import { QuizService } from "@/server/services/quiz-service";
import { errorResponse, successResponse } from "@/server/lib/api-response";

export const dynamic = "force-dynamic";

interface RouteProps {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteProps) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Unauthorized: Admin session required", 401);
    }

    const submission = await QuizSubmissionRepository.findById(params.id);
    if (!submission) {
      return errorResponse("NOT_FOUND", "Submission not found", 404);
    }

    // Convert student JSON submission to a new Quiz Draft
    const result = await QuizService.importQuizJson(submission.jsonData);

    // Update submission status to USED without mutating original jsonData
    await QuizSubmissionRepository.updateStatus(params.id, "USED");

    return NextResponse.json(
      {
        message: `Quiz draft created successfully with ${result.questionCount} questions`,
        quiz: result.quiz,
        questionCount: result.questionCount,
        originalSubmissionId: params.id,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Admin create quiz from submission error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to create quiz from submission", 500);
  }
}
