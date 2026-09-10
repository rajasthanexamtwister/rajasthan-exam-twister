import { NextRequest, NextResponse } from "next/server";
import { TagService } from "@/server/services/tag-service";
import { getSessionFromRequest } from "@/server/lib/token";
import { errorResponse } from "@/server/lib/api-response";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

// DELETE /api/tags/:id - Admin delete (detaches from all content first)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Unauthorized: Admin session required", 401);
    }

    const result = await TagService.deleteTag(params.id);

    if (!result.success) {
      return errorResponse("NOT_FOUND", result.error || "Tag not found", result.status || 404);
    }

    return NextResponse.json({ message: "Tag deleted and detached from all content" }, { status: 200 });
  } catch (err) {
    console.error("Delete tag error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to delete tag", 500);
  }
}
