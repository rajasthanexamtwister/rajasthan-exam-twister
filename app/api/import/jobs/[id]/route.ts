import { NextRequest, NextResponse } from "next/server";
import { ImportService } from "@/server/services/import-service";
import { getSessionFromRequest } from "@/server/lib/token";
import { errorResponse } from "@/server/lib/api-response";

export const dynamic = "force-dynamic";

interface RouteProps {
  params: {
    id: string;
  };
}

// GET /api/import/jobs/:id - Detailed logs for a specific job
export async function GET(request: NextRequest, { params }: RouteProps) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Unauthorized: Admin session required", 401);
    }

    const details = await ImportService.getJobDetails(params.id);
    if (!details) {
      return errorResponse("NOT_FOUND", "Import job not found", 404);
    }

    return NextResponse.json(details, { status: 200 });
  } catch (err) {
    console.error("Get import job details API error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to retrieve import job details", 500);
  }
}

// DELETE /api/import/jobs/:id - Rollback untouched DRAFT notes created by this job
export async function DELETE(request: NextRequest, { params }: RouteProps) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Unauthorized: Admin session required", 401);
    }

    const result = await ImportService.rollbackJob(params.id);
    if (!result.success) {
      return errorResponse("VALIDATION_ERROR", result.error || "Failed to rollback job", 400);
    }

    return NextResponse.json(
      {
        success: true,
        deletedCount: result.deletedCount,
        message: `Successfully rolled back ${result.deletedCount} unedited draft note(s).`,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Rollback import job API error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to execute import rollback", 500);
  }
}
