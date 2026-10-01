import { NextRequest, NextResponse } from "next/server";
import { BlogAutomationService } from "@/server/services/blog-automation/service";
import { BatchScheduleInputSchema } from "@/server/validation/blog-automation";
import { getSessionFromRequest } from "@/server/lib/token";
import { errorResponse } from "@/server/lib/api-response";
import { connectToDatabase } from "@/server/lib/mongodb";

export const dynamic = "force-dynamic";

// POST /api/admin/blog-automation/schedule-batch - Batch schedule queue items
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Admin session required", 401);
    }

    await connectToDatabase();
    const body = await request.json().catch(() => ({}));

    const parsed = BatchScheduleInputSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid batch schedule input", 400);
    }

    const result = await BlogAutomationService.batchSchedule(
      parsed.data,
      session.email || "Admin"
    );

    if (!result.success) {
      return errorResponse("VALIDATION_ERROR", result.error || "Failed to batch schedule", 400);
    }

    return NextResponse.json(result.result, { status: 200 });
  } catch (err: any) {
    console.error("Admin Blog Automation Batch Schedule Error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to schedule batch", 500);
  }
}
