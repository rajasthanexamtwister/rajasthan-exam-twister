import { NextRequest, NextResponse } from "next/server";
import { NoteService } from "@/server/services/note-service";
import { UpdateNoteSchema } from "@/server/validation/note";
import { getSessionFromRequest } from "@/server/lib/token";
import { errorResponse } from "@/server/lib/api-response";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/notes/:id - Get note by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(request);
    const isAdmin = !!session;

    const note = await NoteService.getNoteById(params.id);
    if (!note) {
      return errorResponse("NOT_FOUND", "Note not found", 404);
    }

    if (!isAdmin && note.status !== "PUBLISHED") {
      return errorResponse("NOT_FOUND", "Note not found", 404);
    }

    return NextResponse.json({ note }, { status: 200 });
  } catch (err) {
    console.error("Get note by ID error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to retrieve note", 500);
  }
}

// PATCH /api/notes/:id - Update note (Admin only)
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

    const validation = UpdateNoteSchema.safeParse(body);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        fieldErrors[issue.path.join(".")] = issue.message;
      }
      return errorResponse("VALIDATION_ERROR", "Validation failed", 400, fieldErrors);
    }

    const updatedNote = await NoteService.updateNote(params.id, validation.data);
    if (!updatedNote) {
      return errorResponse("NOT_FOUND", "Note not found", 404);
    }

    return NextResponse.json({ note: updatedNote }, { status: 200 });
  } catch (err) {
    console.error("Update note error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to update note", 500);
  }
}

// DELETE /api/notes/:id - Delete note (Admin only, requires ?confirm=true)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Unauthorized: Admin session required", 401);
    }

    const confirm = request.nextUrl.searchParams.get("confirm") === "true";
    const result = await NoteService.deleteNote(params.id, confirm);

    if (!result.success) {
      if (result.status === 409) {
        return errorResponse("CONFLICT", result.error || "Confirmation required", 409);
      }
      return errorResponse("NOT_FOUND", result.error || "Note not found", result.status || 404);
    }

    return NextResponse.json({ message: "Note deleted successfully" }, { status: 200 });
  } catch (err) {
    console.error("Delete note error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to delete note", 500);
  }
}
