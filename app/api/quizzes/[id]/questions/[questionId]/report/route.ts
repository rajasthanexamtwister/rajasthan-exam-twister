import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { connectToDatabase } from "@/server/lib/mongodb";
import { authOptions } from "@/server/lib/auth-options";
import { Quiz } from "@/server/models/Quiz";
import { QuizQuestion } from "@/server/models/QuizQuestion";
import { Student } from "@/server/models/Student";
import { QuestionIssueReport } from "@/server/models/QuestionIssueReport";
import {
  CreateQuestionReportSchema,
  REASON_CONFIG,
} from "@/server/validation/question-report";
import { checkRateLimit, getClientIp } from "@/server/lib/rate-limit";
import { errorResponse, successResponse } from "@/server/lib/api-response";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
    questionId: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: quizId, questionId } = params;

    if (!mongoose.Types.ObjectId.isValid(quizId) || !mongoose.Types.ObjectId.isValid(questionId)) {
      return errorResponse("VALIDATION_ERROR", "Invalid quiz or question identifier", 400);
    }

    // Rate limiting: 20 reports per 15 minutes per IP
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(clientIp, {
      windowMs: 15 * 60 * 1000,
      max: 20,
      keyPrefix: "question-issue-report",
    });

    if (!rateLimit.success) {
      return errorResponse(
        "RATE_LIMITED",
        "Too many issue reports submitted from this network. Please wait a few moments before trying again.",
        429
      );
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return errorResponse("VALIDATION_ERROR", "Invalid JSON body", 400);
    }

    const validation = CreateQuestionReportSchema.safeParse(body);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        fieldErrors[issue.path.join(".")] = issue.message;
      }
      return errorResponse("VALIDATION_ERROR", "Invalid question report data", 400, fieldErrors);
    }

    const { reason, description, quizSlug } = validation.data;
    const reasonConfig = REASON_CONFIG[reason];

    await connectToDatabase();

    // Verify Quiz exists
    const quiz = await Quiz.findById(quizId).select("_id slug title").lean();
    if (!quiz) {
      return errorResponse("NOT_FOUND", "Quiz not found", 404);
    }

    // Verify Question exists and belongs to this quiz
    const question = await QuizQuestion.findById(questionId).select("_id quizId order questionText").lean();
    if (!question || question.quizId.toString() !== quiz._id.toString()) {
      return errorResponse("NOT_FOUND", "Question not found in the specified quiz", 404);
    }

    // Secure Student Identity extraction - strictly from session, never from client body
    let studentId: mongoose.Types.ObjectId | null = null;
    let studentEmail: string | null = null;
    let studentName: string | null = null;

    try {
      const session = await getServerSession(authOptions);
      if (session?.user) {
        studentEmail = session.user.email || null;
        studentName = session.user.name || null;

        const sessionUserId = (session.user as any).id;
        if (sessionUserId && mongoose.Types.ObjectId.isValid(sessionUserId)) {
          studentId = new mongoose.Types.ObjectId(sessionUserId);
        } else if (session.user.email) {
          const student = await Student.findOne({ email: session.user.email.toLowerCase() }).select("_id").lean();
          if (student) {
            studentId = student._id as mongoose.Types.ObjectId;
          }
        }
      }
    } catch (sessionErr) {
      // Non-fatal session lookup error -> proceed as guest
      console.warn("Session retrieval fallback in question report:", sessionErr);
    }

    // Duplicate check: Look for existing pending or under-review report for this question
    const duplicateQuery: any = {
      questionId: new mongoose.Types.ObjectId(questionId),
      reason,
      status: { $in: ["PENDING", "UNDER_REVIEW"] },
      createdAt: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) }, // within last 2 hours
    };

    if (studentId) {
      duplicateQuery.studentId = studentId;
    } else if (clientIp) {
      duplicateQuery.clientIp = clientIp;
    }

    const existingReport = await QuestionIssueReport.findOne(duplicateQuery).select("_id").lean();
    if (existingReport) {
      return NextResponse.json(
        {
          success: true,
          duplicate: true,
          message: "You have already reported this issue. Our editorial team is currently reviewing it. Thank you!",
        },
        { status: 200 }
      );
    }

    const userAgent = request.headers.get("user-agent") || undefined;

    const newReport = await QuestionIssueReport.create({
      quizId: quiz._id,
      quizSlug: quizSlug || (quiz as any).slug,
      questionId: question._id,
      studentId,
      studentEmail,
      studentName,
      reason,
      reasonLabel: reasonConfig.label,
      description: description?.trim() || "",
      status: "PENDING",
      clientIp,
      userAgent,
    });

    return NextResponse.json(
      {
        success: true,
        reportId: newReport._id.toString(),
        message: "Thank you! Your issue report has been submitted to the editorial review team.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Failed to submit question issue report:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to submit question report. Please try again.", 500);
  }
}
