import { NextRequest, NextResponse } from "next/server";
import { BlogAutomationService } from "@/server/services/blog-automation/service";
import { errorResponse } from "@/server/lib/api-response";
import { connectToDatabase } from "@/server/lib/mongodb";

export const dynamic = "force-dynamic";

function verifyInternalAuth(request: NextRequest): boolean {
  const expectedKey =
    process.env.BLOG_AUTOMATION_INTERNAL_API_KEY ||
    process.env.BLOG_ENGINE_API_KEY ||
    "dev_internal_key";

  const apiKeyHeader = request.headers.get("x-internal-api-key");
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

  return apiKeyHeader === expectedKey || bearerToken === expectedKey;
}

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/internal/blog-automation/jobs/:id - Get job status and details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    if (!verifyInternalAuth(request)) {
      return errorResponse("UNAUTHORIZED", "Unauthorized: Valid internal API key required", 401);
    }

    await connectToDatabase();
    const data = await BlogAutomationService.getQueueItem(params.id);

    if (!data || !data.job) {
      return errorResponse("NOT_FOUND", "Job not found", 404);
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    console.error("Internal Blog Automation Job Get Error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to retrieve job details", 500);
  }
}
