import { NextRequest } from "next/server";
import { getCandidateReport } from "@/server/services/bci-survey-service";
import { errorResponse, successResponse } from "@/server/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return errorResponse("VALIDATION_ERROR", "Submission ID is required", 400);
    }

    const report = await getCandidateReport(id);
    if (!report) {
      return errorResponse("NOT_FOUND", "Submission not found", 404);
    }

    return successResponse(report);
  } catch (error: any) {
    console.error("Error retrieving BCI report:", error);
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to load report", 500);
  }
}
