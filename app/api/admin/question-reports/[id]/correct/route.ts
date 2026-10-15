import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/server/lib/mongodb";
import { getSessionFromRequest } from "@/server/lib/token";
import { QuestionIssueReport } from "@/server/models/QuestionIssueReport";
import { QuizQuestion, IQuestionAuditEntry } from "@/server/models/QuizQuestion";
import { QuizAttempt } from "@/server/models/QuizAttempt";
import { CorrectQuestionSchema } from "@/server/validation/question-report";
import { errorResponse, successResponse } from "@/server/lib/api-response";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * POST /api/admin/question-reports/:id/correct
 * Safe Question Correction Workflow with complete audit trail.
 * - Enforces admin authorization.
 * - Compares previous state and new state.
 * - Appends immutable audit entry to question.auditTrail.
 * - Updates question text, options, correct answer, and explanation.
 * - Preserves safety constraint: Keeps seoStatus as 'DRAFT' (does not auto-publish).
 * - Resolves the issue report with evidence source and student feedback.
 * - Reports count of historical student attempts that encountered this question without silently altering scores.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Admin authorization required", 401);
    }

    const { id: reportId } = params;
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return errorResponse("VALIDATION_ERROR", "Invalid report identifier", 400);
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return errorResponse("VALIDATION_ERROR", "Invalid JSON payload in request body", 400);
    }

    const validation = CorrectQuestionSchema.safeParse(body);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        fieldErrors[issue.path.join(".")] = issue.message;
      }
      return errorResponse("VALIDATION_ERROR", "Invalid correction data", 400, fieldErrors);
    }

    const {
      questionText,
      questionTextEn,
      options,
      optionsEn,
      correctOptionIndex,
      explanation,
      evidenceSource,
      changeReason,
      studentFeedback,
      adminNotes,
    } = validation.data;

    await connectToDatabase();

    const report = await QuestionIssueReport.findById(reportId);
    if (!report) {
      return errorResponse("NOT_FOUND", "Question issue report not found", 404);
    }

    const question = await QuizQuestion.findById(report.questionId);
    if (!question) {
      return errorResponse("NOT_FOUND", "Associated question not found", 404);
    }

    // Capture previous state snapshot for the immutable audit trail
    const previousState = {
      questionText: question.questionText,
      options: [...question.options],
      correctOptionIndex: question.correctOptionIndex,
      explanation: question.explanation || "",
    };

    // Construct new state
    const newState = {
      questionText,
      options,
      correctOptionIndex,
      explanation: explanation || "",
    };

    // Create immutable audit entry
    const auditEntry: IQuestionAuditEntry = {
      modifiedBy: session.email,
      modifiedAt: new Date(),
      changeReason,
      evidenceSource,
      reportId: report._id,
      previousState,
      newState,
    };

    if (!question.auditTrail) {
      question.auditTrail = [];
    }
    question.auditTrail.push(auditEntry);

    // Apply corrected fields
    question.questionText = questionText;
    if (questionTextEn !== undefined) {
      question.questionTextEn = questionTextEn || undefined;
    }
    question.options = options;
    if (optionsEn !== undefined) {
      question.optionsEn = optionsEn && optionsEn.length > 0 ? optionsEn : undefined;
    }
    question.correctOptionIndex = correctOptionIndex;
    question.explanation = explanation || "";

    // Editorial safety rules:
    // 1. Maintain verification metadata
    question.isAnswerVerified = true;
    question.verifiedOptionIndex = correctOptionIndex;
    question.verificationSource = evidenceSource;
    question.reviewedBy = session.email;
    question.reviewedAt = new Date();

    // 2. Strict constraint: corrected/disputed questions MUST NOT be automatically published for SEO
    // Keep seoStatus strictly as DRAFT so an explicit independent SEO review is required
    question.seoStatus = "DRAFT";

    await question.save();

    // Update the issue report to RESOLVED
    report.status = "RESOLVED";
    report.resolvedAt = new Date();
    report.resolvedBy = session.email;
    report.evidenceSource = evidenceSource;
    report.resolutionReason = changeReason;
    report.studentFeedback =
      studentFeedback ||
      `This question was reviewed and corrected by our editorial board using ${evidenceSource}. Thank you for helping keep Rajasthan Exam Twister accurate!`;

    if (adminNotes) {
      report.adminNotes = report.adminNotes
        ? `${report.adminNotes}\n[Correction by ${session.email}]: ${adminNotes}`
        : `[Correction by ${session.email}]: ${adminNotes}`;
    }

    await report.save();

    // Determine affected historical attempts (read-only audit, never silent score mutation)
    const affectedAttemptsCount = await QuizAttempt.countDocuments({
      "answers.questionId": question._id,
    });

    return successResponse(
      {
        message: "Question corrected successfully and issue report resolved.",
        questionId: question._id,
        reportId: report._id,
        auditEntry,
        affectedAttemptsCount,
        seoStatus: question.seoStatus,
        historicalNotice:
          affectedAttemptsCount > 0
            ? `${affectedAttemptsCount} historical student attempt(s) previously answered this question. Historical attempt scores are preserved and remain immutable.`
            : "No historical attempts were impacted.",
      },
      200
    );
  } catch (error: any) {
    console.error("Admin safe question correction error:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to correct question safely", 500);
  }
}
