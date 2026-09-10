import { NextRequest, NextResponse } from "next/server";
import { ImportService } from "@/server/services/import-service";
import { getSessionFromRequest } from "@/server/lib/token";
import { errorResponse } from "@/server/lib/api-response";

export const dynamic = "force-dynamic";

// GET /api/import/jobs - List past import jobs
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Unauthorized: Admin session required", 401);
    }

    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1", 10) || 1;
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10) || 20;

    const result = await ImportService.listJobs(page, pageSize);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("List import jobs API error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to list import jobs", 500);
  }
}
