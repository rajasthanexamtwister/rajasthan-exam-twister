import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/server/lib/mongodb";
import { getSessionFromRequest } from "@/server/lib/token";
import { QuestionIssueReport } from "@/server/models/QuestionIssueReport";
import { Quiz } from "@/server/models/Quiz";
import { QuizQuestion } from "@/server/models/QuizQuestion";
import { UpdateQuestionReportStatusSchema } from "@/server/validation/question-report";
import { errorResponse, successResponse } from "@/server/lib/api-response";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Admin authorization required", 401);
    }

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("VALIDATION_ERROR", "Invalid report identifier", 400);
    }

    await connectToDatabase();

    const report = await QuestionIssueReport.findById(id)
      .populate("quizId", "title slug subject difficulty status")
      .populate(
        "questionId",
        "questionText questionTextEn options optionsEn correctOptionIndex explanation order seoStatus isAnswerVerified verifiedOptionIndex verificationSource reviewedBy reviewedAt auditTrail"
      )
      .lean();

    if (!report) {
      return errorResponse("NOT_FOUND", "Question issue report not found", 404);
    }

    // Fetch other reports for this same question to see duplicate patterns
    const otherReports = await QuestionIssueReport.find({
      questionId: (report as any).questionId?._id || (report as any).questionId,
      _id: { $ne: report._id },
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return successResponse({
      success: true,
      data: {
        report,
        otherReports,
      },
      report,
      otherReports,
    });
  } catch (error: any) {
    console.error("Admin get question report error:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to retrieve question report details", 500);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Admin authorization required", 401);
    }

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("VALIDATION_ERROR", "Invalid report identifier", 400);
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return errorResponse("VALIDATION_ERROR", "Invalid JSON payload", 400);
    }

    const validation = UpdateQuestionReportStatusSchema.safeParse(body);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        fieldErrors[issue.path.join(".")] = issue.message;
      }
      return errorResponse("VALIDATION_ERROR", "Invalid update payload", 400, fieldErrors);
    }

    const {
      status,
      adminNotes,
      assignedTo,
      evidenceSource,
      resolutionReason,
      studentFeedback,
    } = validation.data;

    await connectToDatabase();

    const existingReport = await QuestionIssueReport.findById(id);
    if (!existingReport) {
      return errorResponse("NOT_FOUND", "Question issue report not found", 404);
    }

    existingReport.status = status as any;

    if (adminNotes !== undefined) {
      existingReport.adminNotes = adminNotes;
    }

    if (assignedTo !== undefined) {
      existingReport.assignedTo = assignedTo;
      if (assignedTo && !existingReport.assignedAt) {
        existingReport.assignedAt = new Date();
      } else if (!assignedTo) {
        existingReport.assignedAt = null;
      }
    }

    if (evidenceSource !== undefined) {
      existingReport.evidenceSource = evidenceSource;
    }

    if (resolutionReason !== undefined) {
      existingReport.resolutionReason = resolutionReason;
    }

    if (studentFeedback !== undefined) {
      existingReport.studentFeedback = studentFeedback;
    }

    if (status === "RESOLVED" || status === "REJECTED") {
      existingReport.resolvedAt = new Date();
      existingReport.resolvedBy = session.email || (session as any).username || "Admin";
    } else {
      // Reopening or putting under review resets resolved fields
      existingReport.resolvedAt = null;
      existingReport.resolvedBy = null;
    }

    await existingReport.save();

    return successResponse({
      success: true,
      data: {
        report: existingReport,
        message: `Report status updated to ${status}.`,
      },
      report: existingReport,
      message: `Report status updated to ${status}.`,
    });
  } catch (error: any) {
    console.error("Admin update question report error:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to update question issue report", 500);
  }
}
