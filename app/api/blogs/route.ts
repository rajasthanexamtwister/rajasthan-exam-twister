import { NextRequest, NextResponse } from "next/server";
import { BlogService } from "@/server/services/blog-service";
import { CreateBlogSchema, BlogQuerySchema } from "@/server/validation/blog";
import { getSessionFromRequest } from "@/server/lib/token";
import { errorResponse } from "@/server/lib/api-response";
import { ContentStatus } from "@/server/models/Blog";

export const dynamic = "force-dynamic";

// GET /api/blogs - List blogs (Public / Admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const session = await getSessionFromRequest(request);
    const isAdmin = !!session;

    const queryValidation = BlogQuerySchema.safeParse({
      status: searchParams.get("status") || undefined,
      category: searchParams.get("category") || undefined,
      tag: searchParams.get("tag") || undefined,
      page: searchParams.get("page") || undefined,
      pageSize: searchParams.get("pageSize") || undefined,
      search: searchParams.get("search") || searchParams.get("q") || undefined,
    });

    if (!queryValidation.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid query parameters", 400);
    }

    const { status, category, tag, page, pageSize, search } = queryValidation.data;

    const result = await BlogService.listBlogs(
      {
        status: status as ContentStatus | "ALL",
        categoryId: category,
        tagId: tag,
        page,
        pageSize,
        search,
      },
      isAdmin
    );

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("List blogs API error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to retrieve blogs", 500);
  }
}

// POST /api/blogs - Create blog (Admin only)
export async function POST(request: NextRequest) {
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

    const validation = CreateBlogSchema.safeParse(body);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        fieldErrors[issue.path.join(".")] = issue.message;
      }
      return errorResponse("VALIDATION_ERROR", "Validation failed", 400, fieldErrors);
    }

    const createdBlog = await BlogService.createBlog(validation.data);
    return NextResponse.json({ blog: createdBlog }, { status: 201 });
  } catch (err) {
    console.error("Create blog API error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to create blog", 500);
  }
}
