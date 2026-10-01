import { NextRequest, NextResponse } from "next/server";
import { BlogAutomationService } from "@/server/services/blog-automation/service";
import { BatchGenerateInputSchema } from "@/server/validation/blog-automation";
import { getSessionFromRequest } from "@/server/lib/token";
import { errorResponse } from "@/server/lib/api-response";
import { connectToDatabase } from "@/server/lib/mongodb";

export const dynamic = "force-dynamic";

// POST /api/admin/blog-automation/generate - Generate single or batch AI articles
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Admin session required", 401);
    }

    await connectToDatabase();
    const body = await request.json().catch(() => ({}));

    const parsed = BatchGenerateInputSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid batch generation parameters", 400);
    }

    const result = await BlogAutomationService.generateBatch({
      ...parsed.data,
      requestedBy: session.email || "Admin",
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error("Admin Blog Automation Generate Error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to generate batch content", 500);
  }
}
