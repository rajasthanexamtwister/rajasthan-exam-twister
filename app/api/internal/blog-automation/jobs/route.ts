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

// POST /api/internal/blog-automation/jobs - Ingest generated AI article from rajasthan_exam_blogs
export async function POST(request: NextRequest) {
  try {
    if (!verifyInternalAuth(request)) {
      return errorResponse("UNAUTHORIZED", "Unauthorized: Valid internal API key required", 401);
    }

    await connectToDatabase();
    const body = await request.json();

    const result = await BlogAutomationService.processIncomingAiArticle(body, "AI_Engine");

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          errorCode: result.errorCode,
          error: result.error,
        },
        { status: 422 }
      );
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error("Internal Blog Automation Ingestion Error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to process AI article payload", 500);
  }
}

// GET /api/internal/blog-automation/jobs - Query recent jobs
export async function GET(request: NextRequest) {
  try {
    if (!verifyInternalAuth(request)) {
      return errorResponse("UNAUTHORIZED", "Unauthorized: Valid internal API key required", 401);
    }

    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);

    const result = await BlogAutomationService.listQueue({ page, limit });
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error("Internal Blog Automation Listing Error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to list automation jobs", 500);
  }
}
