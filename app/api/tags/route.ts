import { NextRequest, NextResponse } from "next/server";
import { TagService } from "@/server/services/tag-service";
import { TagSchema } from "@/server/validation/taxonomy";
import { getSessionFromRequest } from "@/server/lib/token";
import { errorResponse } from "@/server/lib/api-response";

export const dynamic = "force-dynamic";

// GET /api/tags - Public list
export async function GET() {
  try {
    const tags = await TagService.listTags();
    return NextResponse.json({ tags }, { status: 200 });
  } catch (err) {
    console.error("List tags error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to retrieve tags", 500);
  }
}

// POST /api/tags - Admin create
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

    const validation = TagSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse("VALIDATION_ERROR", "Validation failed", 400);
    }

    const result = await TagService.createTag(
      validation.data.name,
      validation.data.slug
    );

    if (!result.success || !result.tag) {
      return errorResponse("CONFLICT", result.error || "Failed to create tag", 409);
    }

    return NextResponse.json({ tag: result.tag }, { status: 201 });
  } catch (err) {
    console.error("Create tag error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to create tag", 500);
  }
}
