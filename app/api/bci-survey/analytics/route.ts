import { NextRequest } from "next/server";
import { getPublicAnalytics } from "@/server/services/bci-survey-service";
import { errorResponse, successResponse } from "@/server/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const area = searchParams.get("area") || "ALL";
    const category = searchParams.get("category") || "ALL";
    const gender = searchParams.get("gender") || "ALL";
    const marksSource = searchParams.get("marksSource") || "ALL";

    const data = await getPublicAnalytics({
      area,
      category,
      gender,
      marksSource,
    });

    return successResponse(data);
  } catch (error: any) {
    console.error("Error retrieving public analytics:", error);
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to load analytics", 500);
  }
}
