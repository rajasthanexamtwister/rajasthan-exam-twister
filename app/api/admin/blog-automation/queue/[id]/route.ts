import { NextRequest, NextResponse } from "next/server";
import { BlogAutomationService } from "@/server/services/blog-automation/service";
import { UpdateQueueItemInputSchema } from "@/server/validation/blog-automation";
import { getSessionFromRequest } from "@/server/lib/token";
import { errorResponse } from "@/server/lib/api-response";
import { connectToDatabase } from "@/server/lib/mongodb";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/admin/blog-automation/queue/:id - Get queue item detail and research audit
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Admin session required", 401);
    }

    await connectToDatabase();
    const data = await BlogAutomationService.getQueueItem(params.id);

    if (!data || !data.job) {
      return errorResponse("NOT_FOUND", "Queue item not found", 404);
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    console.error("Admin Blog Automation Queue Item Get Error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to retrieve queue item", 500);
  }
}

// PATCH /api/admin/blog-automation/queue/:id - Update queue item status or schedule
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Admin session required", 401);
    }

    await connectToDatabase();
    const body = await request.json().catch(() => ({}));

    const parsed = UpdateQueueItemInputSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid update payload", 400);
    }

    const result = await BlogAutomationService.updateQueueItem(
      params.id,
      parsed.data,
      session.email || "Admin"
    );

    if (!result.success) {
      return errorResponse("VALIDATION_ERROR", result.error || "Failed to update queue item", 400);
    }

    return NextResponse.json({ message: "Queue item updated", job: result.job }, { status: 200 });
  } catch (err: any) {
    console.error("Admin Blog Automation Queue Item Update Error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to update queue item", 500);
  }
}
