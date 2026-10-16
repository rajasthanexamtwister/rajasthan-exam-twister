import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { connectToDatabase } from "@/server/lib/mongodb";
import { authOptions } from "@/server/lib/auth-options";
import { QuestionIssueReport } from "@/server/models/QuestionIssueReport";
import { Quiz } from "@/server/models/Quiz";
import { QuizQuestion } from "@/server/models/QuizQuestion";
import { Student } from "@/server/models/Student";
import { errorResponse, successResponse } from "@/server/lib/api-response";

export const dynamic = "force-dynamic";

/**
 * GET /api/student/question-reports
 * Retrieves questions reported by the currently authenticated student.
 * - Authenticates student session.
 * - Filters strictly by studentId or student email.
 * - CRITICAL SECURITY: Excludes internal adminNotes, IP addresses, and editorial internal logs.
 * - Exposes only public studentFeedback, status, resolutionReason, and question reference.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return errorResponse("UNAUTHORIZED", "Please log in to view your reported issues", 401);
    }

    await connectToDatabase();

    const studentEmail = session.user.email.toLowerCase();
    const sessionUserId = (session.user as any).id;

    let studentId: mongoose.Types.ObjectId | null = null;
    if (sessionUserId && mongoose.Types.ObjectId.isValid(sessionUserId)) {
      studentId = new mongoose.Types.ObjectId(sessionUserId);
    } else {
      const student = await Student.findOne({ email: studentEmail }).select("_id").lean();
      if (student) {
        studentId = student._id as mongoose.Types.ObjectId;
      }
    }

    const filter: any = studentId
      ? { $or: [{ studentId }, { studentEmail }] }
      : { studentEmail };

    const reports = await QuestionIssueReport.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("quizId", "title slug subject")
      .populate("questionId", "questionText order")
      .select(
        "_id quizId quizSlug questionId reason reasonLabel description status resolutionReason studentFeedback resolvedAt createdAt"
      )
      .lean();

    return successResponse({
      success: true,
      data: {
        reports,
        total: reports.length,
      },
      reports,
      total: reports.length,
    });
  } catch (error: any) {
    console.error("Student question reports retrieval error:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to retrieve your reported issues", 500);
  }
}
