import { NextRequest, NextResponse } from "next/server";
import { NoteService } from "@/server/services/note-service";
import { getSessionFromRequest } from "@/server/lib/token";
import { errorResponse } from "@/server/lib/api-response";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

// POST /api/notes/:id/publish - Publish note
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Unauthorized: Admin session required", 401);
    }

    const result = await NoteService.publishNote(params.id);
    if (!result.success) {
      return errorResponse("VALIDATION_ERROR", result.error || "Failed to publish note", 400);
    }

    return NextResponse.json({ message: "Note published successfully", note: result.note }, { status: 200 });
  } catch (err) {
    console.error("Publish note error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to publish note", 500);
  }
}
