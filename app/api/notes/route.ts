import { NextRequest, NextResponse } from "next/server";
import { NoteService } from "@/server/services/note-service";
import { CreateNoteSchema, NoteQuerySchema } from "@/server/validation/note";
import { getSessionFromRequest } from "@/server/lib/token";
import { errorResponse } from "@/server/lib/api-response";
import { ContentStatus } from "@/server/models/Blog";

export const dynamic = "force-dynamic";

// GET /api/notes - List notes (Public / Admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const session = await getSessionFromRequest(request);
    const isAdmin = !!session;

    const queryValidation = NoteQuerySchema.safeParse({
      status: searchParams.get("status") || undefined,
      subject: searchParams.get("subject") || undefined,
      category: searchParams.get("category") || undefined,
      tag: searchParams.get("tag") || undefined,
      page: searchParams.get("page") || undefined,
      pageSize: searchParams.get("pageSize") || undefined,
      search: searchParams.get("search") || searchParams.get("q") || undefined,
    });

    if (!queryValidation.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid query parameters", 400);
    }

    const { status, subject, category, tag, page, pageSize, search } = queryValidation.data;

    const result = await NoteService.listNotes(
      {
        status: status as ContentStatus | "ALL",
        subject,
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
    console.error("List notes API error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to retrieve notes", 500);
  }
}

// POST /api/notes - Create note (Admin only)
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

    const validation = CreateNoteSchema.safeParse(body);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        fieldErrors[issue.path.join(".")] = issue.message;
      }
      return errorResponse("VALIDATION_ERROR", "Validation failed", 400, fieldErrors);
    }

    const createdNote = await NoteService.createNote(validation.data);
    return NextResponse.json({ note: createdNote }, { status: 201 });
  } catch (err) {
    console.error("Create note API error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to create note", 500);
  }
}
