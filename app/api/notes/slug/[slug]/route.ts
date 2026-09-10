import { NextRequest, NextResponse } from "next/server";
import { NoteService } from "@/server/services/note-service";
import { getSessionFromRequest } from "@/server/lib/token";
import { errorResponse } from "@/server/lib/api-response";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    slug: string;
  };
}

// GET /api/notes/slug/:slug - Public note detail (404 if not published unless admin)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(request);
    const isAdmin = !!session;

    const note = await NoteService.getNoteBySlug(params.slug, isAdmin);
    if (!note) {
      return errorResponse("NOT_FOUND", "Note not found", 404);
    }

    return NextResponse.json({ note }, { status: 200 });
  } catch (err) {
    console.error("Get note by slug error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to retrieve note", 500);
  }
}
