import { NextRequest, NextResponse } from "next/server";
import { BlogService } from "@/server/services/blog-service";
import { UpdateBlogSchema } from "@/server/validation/blog";
import { getSessionFromRequest } from "@/server/lib/token";
import { errorResponse } from "@/server/lib/api-response";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/blogs/:id - Get blog by ID (Admin or Public if published)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(request);
    const isAdmin = !!session;

    const blog = await BlogService.getBlogById(params.id);
    if (!blog) {
      return errorResponse("NOT_FOUND", "Blog not found", 404);
    }

    if (!isAdmin && blog.status !== "PUBLISHED") {
      return errorResponse("NOT_FOUND", "Blog not found", 404);
    }

    return NextResponse.json({ blog }, { status: 200 });
  } catch (err) {
    console.error("Get blog by ID API error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to retrieve blog", 500);
  }
}

// PATCH /api/blogs/:id - Update blog (Admin only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Unauthorized: Admin session required", 401);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse("VALIDATION_ERROR", "Invalid JSON payload", 400);
    }

    const validation = UpdateBlogSchema.safeParse(body);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        fieldErrors[issue.path.join(".")] = issue.message;
      }
      return errorResponse("VALIDATION_ERROR", "Validation failed", 400, fieldErrors);
    }

    const updatedBlog = await BlogService.updateBlog(params.id, validation.data);
    if (!updatedBlog) {
      return errorResponse("NOT_FOUND", "Blog not found", 404);
    }

    return NextResponse.json({ blog: updatedBlog }, { status: 200 });
  } catch (err) {
    console.error("Update blog API error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to update blog", 500);
  }
}

// DELETE /api/blogs/:id - Hard delete blog (Admin only, requires ?confirm=true)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Unauthorized: Admin session required", 401);
    }

    const confirm = request.nextUrl.searchParams.get("confirm") === "true";
    const result = await BlogService.deleteBlog(params.id, confirm);

    if (!result.success) {
      if (result.status === 409) {
        return errorResponse("CONFLICT", result.error || "Confirmation required", 409);
      }
      return errorResponse("NOT_FOUND", result.error || "Blog not found", result.status || 404);
    }

    return NextResponse.json({ message: "Blog deleted successfully" }, { status: 200 });
  } catch (err) {
    console.error("Delete blog API error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to delete blog", 500);
  }
}
