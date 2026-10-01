import { NextRequest, NextResponse } from "next/server";
import { BlogAutomationService } from "@/server/services/blog-automation/service";
import { QueueFilterQuerySchema } from "@/server/validation/blog-automation";
import { getSessionFromRequest } from "@/server/lib/token";
import { errorResponse } from "@/server/lib/api-response";
import { connectToDatabase } from "@/server/lib/mongodb";

export const dynamic = "force-dynamic";

// GET /api/admin/blog-automation/queue - List queue items and summary statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Admin session required", 401);
    }

    await connectToDatabase();
    const { searchParams } = new URL(request.url);

    const queryParams = {
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
      scheduleStatus: searchParams.get("scheduleStatus") || undefined,
      generationStatus: searchParams.get("generationStatus") || undefined,
      articleType: searchParams.get("articleType") || undefined,
      search: searchParams.get("search") || undefined,
      requiresApproval: searchParams.get("requiresApproval") || undefined,
    };

    const parsed = QueueFilterQuerySchema.safeParse(queryParams);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid queue query parameters", 400);
    }

    const [queueData, stats] = await Promise.all([
      BlogAutomationService.listQueue(parsed.data),
      BlogAutomationService.getDashboardStats(),
    ]);

    return NextResponse.json({ ...queueData, stats }, { status: 200 });
  } catch (err: any) {
    console.error("Admin Blog Automation Queue List Error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to retrieve queue items", 500);
  }
}
