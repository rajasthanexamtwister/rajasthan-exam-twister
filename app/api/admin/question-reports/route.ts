import { NextRequest, NextResponse } from "next/server";
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
    const quizId = searchParams.get("quizId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));

    const filter: any = {};
    if (status !== "ALL") {
      filter.status = status;
    }
    if (quizId && mongoose.Types.ObjectId.isValid(quizId)) {
      filter.quizId = new mongoose.Types.ObjectId(quizId);
    }

    const skip = (page - 1) * pageSize;

    const [reports, total] = await Promise.all([
      QuestionIssueReport.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate("quizId", "title slug")
        .populate("questionId", "questionText order correctOptionIndex")
        .lean(),
      QuestionIssueReport.countDocuments(filter),
    ]);

    return successResponse({
      reports,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error: any) {
    console.error("Admin question reports fetch error:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to retrieve question reports", 500);
  }
}
