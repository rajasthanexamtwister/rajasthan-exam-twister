import { NextRequest, NextResponse } from "next/server";
import { MediaService } from "@/server/services/media-service";
import { MediaRepository } from "@/server/repositories/media";
import { UpdateMediaSchema } from "@/server/validation/media";
import { getSessionFromRequest } from "@/server/lib/token";
import { errorResponse } from "@/server/lib/api-response";

export const dynamic = "force-dynamic";

interface RouteProps {
  params: {
    id: string;
  };
}

// GET /api/media/:id - Retrieve single media doc + reference info
export async function GET(request: NextRequest, { params }: RouteProps) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Unauthorized: Admin session required", 401);
    }

    const media = await MediaService.getMediaById(params.id);
    if (!media) {
      return errorResponse("NOT_FOUND", "Media item not found", 404);
    }

    const refs = await MediaRepository.countReferences(params.id);
    return NextResponse.json({ media, references: refs }, { status: 200 });
  } catch (err) {
    console.error("Get media API error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to retrieve media item", 500);
  }
}

// PATCH /api/media/:id - Update altText / caption
export async function PATCH(request: NextRequest, { params }: RouteProps) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Unauthorized: Admin session required", 401);
    }

    const body = await request.json();
    const validation = UpdateMediaSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        validation.error.errors[0]?.message || "Invalid update data",
        400
      );
    }

    const result = await MediaService.updateMedia(params.id, validation.data);
    if (!result.success || !result.media) {
      return errorResponse("VALIDATION_ERROR", result.error || "Failed to update media", 400);
    }

    return NextResponse.json({ media: result.media }, { status: 200 });
  } catch (err) {
    console.error("Update media API error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to update media item", 500);
  }
}

// DELETE /api/media/:id - Delete media (blocked with 409 if referenced)
export async function DELETE(request: NextRequest, { params }: RouteProps) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Unauthorized: Admin session required", 401);
    }

    const result = await MediaService.deleteMedia(params.id);
    if (!result.success) {
      return errorResponse("VALIDATION_ERROR", result.error || "Failed to delete media", result.status || 400);
    }

    return NextResponse.json(
      { success: true, message: "Media item deleted successfully." },
      { status: 200 }
    );
  } catch (err) {
    console.error("Delete media API error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to delete media item", 500);
  }
}
