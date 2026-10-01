import { NextRequest, NextResponse } from "next/server";
import { BlogAutomationService } from "@/server/services/blog-automation/service";
import { DiscoverTopicsInputSchema } from "@/server/validation/blog-automation";
import { getSessionFromRequest } from "@/server/lib/token";
import { errorResponse } from "@/server/lib/api-response";
import { connectToDatabase } from "@/server/lib/mongodb";

export const dynamic = "force-dynamic";

// POST /api/admin/blog-automation/discover - Discover candidate topics
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Admin session required", 401);
    }

    await connectToDatabase();
    const body = await request.json().catch(() => ({}));

    const parsed = DiscoverTopicsInputSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid topic discovery input", 400);
    }

    const topics = await BlogAutomationService.discoverTopics(parsed.data);
    return NextResponse.json({ success: true, topics }, { status: 200 });
  } catch (err: any) {
    console.error("Admin Blog Automation Discover Error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to discover topics", 500);
  }
}
