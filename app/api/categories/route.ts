import { NextRequest, NextResponse } from "next/server";
import { CategoryService } from "@/server/services/category-service";
import { CategorySchema } from "@/server/validation/taxonomy";
import { getSessionFromRequest } from "@/server/lib/token";
import { errorResponse } from "@/server/lib/api-response";

export const dynamic = "force-dynamic";

// GET /api/categories - Public list
export async function GET() {
  try {
    const categories = await CategoryService.listCategories();
    return NextResponse.json({ categories }, { status: 200 });
  } catch (err) {
    console.error("List categories error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to retrieve categories", 500);
  }
}

// POST /api/categories - Admin create
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

    const validation = CategorySchema.safeParse(body);
    if (!validation.success) {
      return errorResponse("VALIDATION_ERROR", "Validation failed", 400);
    }

    const result = await CategoryService.createCategory(
      validation.data.name,
      validation.data.slug
    );

    if (!result.success || !result.category) {
      return errorResponse("CONFLICT", result.error || "Failed to create category", 409);
    }

    return NextResponse.json({ category: result.category }, { status: 201 });
  } catch (err) {
    console.error("Create category error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to create category", 500);
  }
}
