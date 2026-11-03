import { NextRequest } from "next/server";
import {
  getSubmissionByEditToken,
  updateSubmissionViaToken,
} from "@/server/services/bci-survey-service";
import { errorResponse, successResponse } from "@/server/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return errorResponse("VALIDATION_ERROR", "Edit token is required", 400);
    }

    const sub = await getSubmissionByEditToken(token);
    if (!sub) {
      return errorResponse("NOT_FOUND", "No submission found for this edit token", 404);
    }

    return successResponse({
      id: sub._id.toString(),
      area: sub.area,
      category: sub.category,
      gender: sub.gender,
      paper1Marks: sub.paper1Marks,
      paper2Marks: sub.paper2Marks,
      totalMarks: sub.totalMarks,
      marksSource: sub.marksSource,
      district: sub.district,
      shift: sub.shift,
      candidateName: sub.candidateName,
      qualificationStatus: sub.qualificationStatus,
    });
  } catch (error: any) {
    console.error("Error retrieving submission by token:", error);
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to retrieve", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, ...updates } = body;

    if (!token) {
      return errorResponse("VALIDATION_ERROR", "Edit token is required", 400);
    }

    const updated = await updateSubmissionViaToken(token, updates);
    return successResponse({
      id: updated._id.toString(),
      totalMarks: updated.totalMarks,
      qualificationStatus: updated.qualificationStatus,
      message: "Submission updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating submission by token:", error);
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to update", 500);
  }
}
