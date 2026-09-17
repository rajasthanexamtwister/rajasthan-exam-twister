import { NextRequest } from "next/server";
import { getStudentSession } from "@/server/lib/student-auth";
import { QuizSubmissionRepository } from "@/server/repositories/quiz-submission";
import { errorResponse, successResponse } from "@/server/lib/api-response";

export const dynamic = "force-dynamic";

interface RouteProps {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  try {
    const session = await getStudentSession();
    if (!session || !session.user || !session.user.id) {
      return errorResponse("UNAUTHORIZED", "Authentication required to view submission", 401);
    }

    const submission = await QuizSubmissionRepository.findById(params.id);
    if (!submission) {
      return errorResponse("NOT_FOUND", "Submission not found", 404);
    }

    // Strict ownership verification: student can only view their own submission
    if (submission.userId.toString() !== session.user.id) {
      return errorResponse("FORBIDDEN", "Forbidden: Access to another student's submission is denied", 403);
    }

    return successResponse({ submission });
  } catch (err: any) {
    console.error("Failed to fetch student submission detail:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to load submission detail", 500);
  }
}
