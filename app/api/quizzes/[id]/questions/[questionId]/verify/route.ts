import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/server/lib/mongodb";
import { getSessionFromRequest } from "@/server/lib/token";
import { errorResponse, successResponse } from "@/server/lib/api-response";
import { VerifyQuestionSchema } from "@/server/validation/quiz";
import { QuestionSeoRepository } from "@/server/repositories/question-seo";
import { QuizQuestion } from "@/server/models/QuizQuestion";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
    questionId: string;
  };
}

/**
 * POST /api/quizzes/:id/questions/:questionId/verify
 * Auditable Admin Verification Endpoint.
 * Strictly verifies and publishes ONE question at a time.
 * Verifies that verifiedOptionIndex strictly matches correctOptionIndex.
 * Stores reviewer identity, timestamp, and official verification source.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Unauthorized: Admin session required", 401);
    }

    const { id: quizId, questionId } = params;
    if (!mongoose.Types.ObjectId.isValid(quizId) || !mongoose.Types.ObjectId.isValid(questionId)) {
      return errorResponse("VALIDATION_ERROR", "Invalid quiz or question identifier", 400);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse("VALIDATION_ERROR", "Invalid JSON payload", 400);
    }

    const validation = VerifyQuestionSchema.safeParse(body);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        fieldErrors[issue.path.join(".")] = issue.message;
      }
      return errorResponse("VALIDATION_ERROR", "Validation failed", 400, fieldErrors);
    }

    await connectToDatabase();

    const existingQuestion = await QuizQuestion.findById(questionId);
    if (!existingQuestion) {
      return errorResponse("NOT_FOUND", "Question not found", 404);
    }

    if (existingQuestion.quizId.toString() !== quizId) {
      return errorResponse("VALIDATION_ERROR", "Question does not belong to the specified quiz", 400);
    }

    // If reviewer provided an updated explanation, update it first
    if (validation.data.explanation !== undefined) {
      existingQuestion.explanation = validation.data.explanation.trim();
      await existingQuestion.save();
    }

    try {
      const publishedQuestion = await QuestionSeoRepository.verifyAndPublishQuestion({
        questionId,
        verifiedOptionIndex: validation.data.verifiedOptionIndex,
        verificationSource: validation.data.verificationSource,
        reviewedBy: session.email,
        seoSlug: validation.data.seoSlug,
        seoTitle: validation.data.seoTitle,
        seoDescription: validation.data.seoDescription,
        examSource: validation.data.examSource,
        publishImmediately: validation.data.publishImmediately,
      });

      return successResponse(
        {
          question: publishedQuestion,
          message: "Question audited, verified, and published for SEO successfully.",
        },
        200
      );
    } catch (auditErr: any) {
      return errorResponse("VALIDATION_ERROR", auditErr.message || "Question verification failed", 422);
    }
  } catch (err: any) {
    console.error("Question verification error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to verify question", 500);
  }
}

/**
 * DELETE /api/quizzes/:id/questions/:questionId/verify
 * Unpublishes question and reverts SEO status back to DRAFT.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Unauthorized: Admin session required", 401);
    }

    const { id: quizId, questionId } = params;
    if (!mongoose.Types.ObjectId.isValid(quizId) || !mongoose.Types.ObjectId.isValid(questionId)) {
      return errorResponse("VALIDATION_ERROR", "Invalid quiz or question identifier", 400);
    }

    await connectToDatabase();

    const question = await QuizQuestion.findById(questionId);
    if (!question) {
      return errorResponse("NOT_FOUND", "Question not found", 404);
    }

    question.seoStatus = "DRAFT";
    question.isAnswerVerified = false;
    await question.save();

    return successResponse(
      {
        questionId,
        seoStatus: "DRAFT",
        isAnswerVerified: false,
        message: "Question SEO status reverted to DRAFT.",
      },
      200
    );
  } catch (err: any) {
    console.error("Revert question SEO error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to revert question SEO status", 500);
  }
}
