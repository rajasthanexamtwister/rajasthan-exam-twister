import { NextRequest, NextResponse } from "next/server";
import { BlogAutomationService } from "@/server/services/blog-automation/service";
import { getSessionFromRequest } from "@/server/lib/token";
import { errorResponse } from "@/server/lib/api-response";
import { connectToDatabase } from "@/server/lib/mongodb";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

// POST /api/admin/blog-automation/queue/:id/publish - Manually publish queue item
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Admin session required", 401);
    }

    await connectToDatabase();
    const result = await BlogAutomationService.publishManually(
      params.id,
      session.email || "Admin"
    );

    if (!result.success) {
      return errorResponse("VALIDATION_ERROR", result.error || "Failed to publish item", 400);
    }

    return NextResponse.json(
      { message: "Article published successfully", blogId: result.blogId },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Admin Blog Automation Publish Error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to publish queue item", 500);
  }
}
