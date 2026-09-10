import mongoose from "mongoose";
import { NoteRepository, NoteFilterOptions } from "@/server/repositories/note";
import { sanitizeContentHtml } from "@/server/lib/sanitize";
import { generateUniqueSlug } from "@/server/lib/slugify";
import { CreateNoteInput, UpdateNoteInput } from "@/server/validation/note";
import { INote } from "@/server/models/Note";

export class NoteService {
  static async getNoteById(id: string): Promise<INote | null> {
    return NoteRepository.findById(id);
  }

  static async getNoteBySlug(slug: string, isAdmin: boolean = false): Promise<INote | null> {
    const note = await NoteRepository.findBySlug(slug);
    if (!note) return null;

    if (!isAdmin && note.status !== "PUBLISHED") {
      return null;
    }

    return note;
  }

  static async listNotes(options: NoteFilterOptions = {}, isAdmin: boolean = false) {
    return NoteRepository.list(options, isAdmin);
  }

  static async createNote(input: CreateNoteInput): Promise<INote> {
    const sanitizedHtml = input.content ? sanitizeContentHtml(input.content) : "";

    const slug = await generateUniqueSlug(input.title, async (s) => {
      return NoteRepository.isSlugTaken(s);
    });

    const noteData: Partial<INote> = {
      title: input.title.trim(),
      slug,
      subject: input.subject?.trim(),
      content: sanitizedHtml,
      categoryId: input.categoryId ? new mongoose.Types.ObjectId(input.categoryId) : undefined,
      tagIds: input.tagIds?.map((t) => new mongoose.Types.ObjectId(t)) || [],
      imageIds: input.imageIds?.map((img) => new mongoose.Types.ObjectId(img)) || [],
      pdfMediaId: input.pdfMediaId ? new mongoose.Types.ObjectId(input.pdfMediaId) : undefined,
      source: input.source?.trim(),
      status: "DRAFT",
    };

    return NoteRepository.create(noteData);
  }

  static async updateNote(id: string, input: UpdateNoteInput): Promise<INote | null> {
    const existing = await NoteRepository.findById(id);
    if (!existing) return null;

    const updateData: Record<string, unknown> = {};

    if (input.title !== undefined) {
      updateData.title = input.title.trim();

      // Slugs are immutable after first publish per SEO.md
      if (!existing.publishedAt) {
        updateData.slug = await generateUniqueSlug(
          input.title,
          async (s) => NoteRepository.isSlugTaken(s, id),
          existing.slug
        );
      }
    }

    if (input.content !== undefined) {
      updateData.content = sanitizeContentHtml(input.content);
    }

    if (input.subject !== undefined) updateData.subject = input.subject?.trim();
    if (input.categoryId !== undefined) {
      updateData.categoryId = input.categoryId
        ? new mongoose.Types.ObjectId(input.categoryId)
        : null;
    }
    if (input.tagIds !== undefined) {
      updateData.tagIds = input.tagIds.map((t) => new mongoose.Types.ObjectId(t));
    }
    if (input.imageIds !== undefined) {
      // Preserves explicit order from request array
      updateData.imageIds = input.imageIds.map((img) => new mongoose.Types.ObjectId(img));
    }
    if (input.pdfMediaId !== undefined) {
      updateData.pdfMediaId = input.pdfMediaId
        ? new mongoose.Types.ObjectId(input.pdfMediaId)
        : null;
    }
    if (input.source !== undefined) updateData.source = input.source?.trim();

    if (existing.importJobId) {
      updateData.isEditedSinceImport = true;
    }

    return NoteRepository.update(id, updateData as Partial<INote>);
  }

  static async publishNote(id: string): Promise<{ success: boolean; note?: INote; error?: string }> {
    const note = await NoteRepository.findById(id);
    if (!note) {
      return { success: false, error: "Note not found" };
    }

    const textContent = note.content ? note.content.replace(/<[^>]*>/g, "").trim() : "";
    const hasImages = Array.isArray(note.imageIds) && note.imageIds.length > 0;

    // Image-only notes rule: Requires text content OR at least one image
    if (!textContent && !hasImages) {
      return {
        success: false,
        error: "Note requires either text content or at least one image to be published",
      };
    }

    const updated = await NoteRepository.update(id, {
      status: "PUBLISHED",
      publishedAt: note.publishedAt || new Date(),
    });

    return { success: true, note: updated || undefined };
  }

  static async unpublishNote(id: string): Promise<{ success: boolean; note?: INote; error?: string }> {
    const note = await NoteRepository.findById(id);
    if (!note) {
      return { success: false, error: "Note not found" };
    }

    const updated = await NoteRepository.update(id, {
      status: "DRAFT",
    });

    return { success: true, note: updated || undefined };
  }

  static async deleteNote(id: string, confirm: boolean): Promise<{ success: boolean; error?: string; status: number }> {
    if (!confirm) {
      return {
        success: false,
        error: "Confirmation required to delete note (?confirm=true)",
        status: 409,
      };
    }

    const deleted = await NoteRepository.delete(id);
    if (!deleted) {
      return { success: false, error: "Note not found", status: 404 };
    }

    return { success: true, status: 200 };
  }

  static async getStats() {
    return NoteRepository.countByStatus();
  }
}
