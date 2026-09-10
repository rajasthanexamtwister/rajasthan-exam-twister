import { NextRequest, NextResponse } from "next/server";
import { CategoryService } from "@/server/services/category-service";
import { CategorySchema } from "@/server/validation/taxonomy";
import { getSessionFromRequest } from "@/server/lib/token";
import { errorResponse } from "@/server/lib/api-response";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

// PATCH /api/categories/:id - Admin update
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

    const validation = CategorySchema.partial().safeParse(body);
    if (!validation.success) {
      return errorResponse("VALIDATION_ERROR", "Validation failed", 400);
    }

    const result = await CategoryService.updateCategory(
      params.id,
      validation.data.name,
      validation.data.slug
    );

    if (!result.success || !result.category) {
      return errorResponse("NOT_FOUND", result.error || "Category not found", 404);
    }

    return NextResponse.json({ category: result.category }, { status: 200 });
  } catch (err) {
    console.error("Update category error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to update category", 500);
  }
}

// DELETE /api/categories/:id - Admin delete (blocked if in use -> 409)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Unauthorized: Admin session required", 401);
    }

    const result = await CategoryService.deleteCategory(params.id);

    if (!result.success) {
      if (result.status === 409) {
        return errorResponse("CONFLICT", result.error || "Category in use", 409);
      }
      return errorResponse("NOT_FOUND", result.error || "Category not found", result.status || 404);
    }

    return NextResponse.json({ message: "Category deleted successfully" }, { status: 200 });
  } catch (err) {
    console.error("Delete category error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to delete category", 500);
  }
}
