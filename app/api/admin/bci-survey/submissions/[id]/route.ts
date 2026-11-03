import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/server/lib/token";
import { updateSubmissionAdminStatus } from "@/server/services/bci-survey-service";
import { errorResponse, successResponse } from "@/server/lib/api-response";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Admin authorization required", 401);
    }

    const { id } = params;
    const body = await request.json();
    const { status, adminNotes } = body;

    if (!["pending", "approved", "flagged", "excluded", "duplicate"].includes(status)) {
      return errorResponse("VALIDATION_ERROR", "Invalid admin status", 400);
    }

    const updated = await updateSubmissionAdminStatus(
      id,
      status,
      adminNotes,
      session.email
    );

    return successResponse({
      id: updated._id.toString(),
      adminStatus: updated.adminStatus,
      isValid: updated.isValid,
      isDuplicate: updated.isDuplicate,
      message: "Submission status updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating submission status:", error);
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to update", 500);
  }
}
