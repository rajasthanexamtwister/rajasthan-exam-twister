import { NextRequest, NextResponse } from "next/server";
import { BlogService } from "@/server/services/blog-service";
import { getSessionFromRequest } from "@/server/lib/token";
import { errorResponse } from "@/server/lib/api-response";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    slug: string;
  };
}

// GET /api/blogs/slug/:slug - Public detail, 404 if not published unless admin
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(request);
    const isAdmin = !!session;

    const blog = await BlogService.getBlogBySlug(params.slug, isAdmin);
    if (!blog) {
      return errorResponse("NOT_FOUND", "Blog not found", 404);
    }

    return NextResponse.json({ blog }, { status: 200 });
  } catch (err) {
    console.error("Get blog by slug API error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to retrieve blog", 500);
  }
}
