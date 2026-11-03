import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/server/lib/token";
import { getAdminSubmissions } from "@/server/services/bci-survey-service";
import { errorResponse, successResponse } from "@/server/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Admin authorization required", 401);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
    const status = searchParams.get("status") || "ALL";
    const area = searchParams.get("area") || "ALL";
    const category = searchParams.get("category") || "ALL";
    const search = searchParams.get("search") || undefined;

    const data = await getAdminSubmissions({
      page,
      pageSize,
      status,
      area,
      category,
      search,
    });

    return successResponse(data);
  } catch (error: any) {
    console.error("Error retrieving admin submissions:", error);
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to retrieve", 500);
  }
}
