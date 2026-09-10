import { NextRequest, NextResponse } from "next/server";
import { NoteService } from "@/server/services/note-service";
import { getSessionFromRequest } from "@/server/lib/token";
import { validateCsrfHeader } from "@/server/lib/csrf";
import { errorResponse } from "@/server/lib/api-response";
import { BulkNoteActionSchema } from "@/server/validation/note";

export const dynamic = "force-dynamic";

// POST /api/notes/bulk-publish - Bulk publish revision notes
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Unauthorized: Admin session required", 401);
    }

    if (!validateCsrfHeader(request)) {
      return errorResponse("FORBIDDEN", "Missing or invalid CSRF request header", 403);
    }

    const body = await request.json().catch(() => null);
    const parsed = BulkNoteActionSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid note IDs payload", 400);
    }

    const result = await NoteService.bulkPublishNotes(parsed.data.noteIds);

    return NextResponse.json(
      {
        message: `Processed ${parsed.data.noteIds.length} notes: ${result.published.length} published, ${result.skipped.length} skipped`,
        publishedCount: result.published.length,
        skippedCount: result.skipped.length,
        published: result.published,
        skipped: result.skipped,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Bulk publish notes error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to bulk publish notes", 500);
  }
}
