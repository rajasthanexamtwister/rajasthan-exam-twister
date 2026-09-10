import { NextRequest, NextResponse } from "next/server";
import { BlogService } from "@/server/services/blog-service";
import { getSessionFromRequest } from "@/server/lib/token";
import { errorResponse } from "@/server/lib/api-response";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

// POST /api/blogs/:id/unpublish - Unpublish blog (Admin only)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Unauthorized: Admin session required", 401);
    }

    const result = await BlogService.unpublishBlog(params.id);
    if (!result.success) {
      return errorResponse("VALIDATION_ERROR", result.error || "Failed to unpublish blog", 400);
    }

    return NextResponse.json({ message: "Blog unpublished successfully", blog: result.blog }, { status: 200 });
  } catch (err) {
    console.error("Unpublish blog API error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to unpublish blog", 500);
  }
}
