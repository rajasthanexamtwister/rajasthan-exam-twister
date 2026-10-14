import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/server/lib/mongodb";
import { getSessionFromRequest } from "@/server/lib/token";
import { QuestionIssueReport } from "@/server/models/QuestionIssueReport";
import { UpdateQuestionReportStatusSchema } from "@/server/validation/question-report";
import { errorResponse, successResponse } from "@/server/lib/api-response";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
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
      return errorResponse("VALIDATION_ERROR", "Invalid update payload", 400);
    }

    const { status, adminNotes } = validation.data;

    await connectToDatabase();

    const updateFields: any = { status };
    if (adminNotes !== undefined) {
      updateFields.adminNotes = adminNotes;
    }
    if (status === "RESOLVED" || status === "REJECTED") {
      updateFields.resolvedAt = new Date();
      updateFields.resolvedBy = session.email || (session as any).username || "Admin";
    }

    const updatedReport = await QuestionIssueReport.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    ).lean();

    if (!updatedReport) {
      return errorResponse("NOT_FOUND", "Question issue report not found", 404);
    }

    return successResponse(updatedReport);
  } catch (error: any) {
    console.error("Admin update question report error:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to update question issue report", 500);
  }
}
