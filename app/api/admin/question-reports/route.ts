import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/server/lib/mongodb";
import { getSessionFromRequest } from "@/server/lib/token";
import { QuestionIssueReport } from "@/server/models/QuestionIssueReport";
import { errorResponse, successResponse } from "@/server/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Admin authorization required", 401);
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "ALL";
    const category = searchParams.get("category");
    const quizId = searchParams.get("quizId");
    const questionId = searchParams.get("questionId");
    const search = searchParams.get("search")?.trim();
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));

    const filter: any = {};

    if (status !== "ALL") {
      filter.status = status;
    }

    if (category && category !== "ALL") {
      filter.reason = category;
    }

    if (quizId && mongoose.Types.ObjectId.isValid(quizId)) {
      filter.quizId = new mongoose.Types.ObjectId(quizId);
    }

    if (questionId && mongoose.Types.ObjectId.isValid(questionId)) {
      filter.questionId = new mongoose.Types.ObjectId(questionId);
    }

    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) {
        filter.createdAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      filter.$or = [
        { description: searchRegex },
        { studentEmail: searchRegex },
        { studentName: searchRegex },
        { quizSlug: searchRegex },
        { reasonLabel: searchRegex },
      ];
    }

    const skip = (page - 1) * pageSize;

    const [reports, total, pendingCount, underReviewCount, resolvedCount, rejectedCount] =
      await Promise.all([
        QuestionIssueReport.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(pageSize)
          .populate("quizId", "title slug subject difficulty")
          .populate(
            "questionId",
            "questionText options correctOptionIndex explanation order seoStatus isAnswerVerified"
          )
          .lean(),
        QuestionIssueReport.countDocuments(filter),
        QuestionIssueReport.countDocuments({ status: "PENDING" }),
        QuestionIssueReport.countDocuments({ status: "UNDER_REVIEW" }),
        QuestionIssueReport.countDocuments({ status: "RESOLVED" }),
        QuestionIssueReport.countDocuments({ status: "REJECTED" }),
      ]);

    return successResponse({
      reports,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
      counts: {
        pending: pendingCount,
        underReview: underReviewCount,
        resolved: resolvedCount,
        rejected: rejectedCount,
        total: pendingCount + underReviewCount + resolvedCount + rejectedCount,
      },
    });
  } catch (error: any) {
    console.error("Admin question reports fetch error:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to retrieve question reports", 500);
  }
}
