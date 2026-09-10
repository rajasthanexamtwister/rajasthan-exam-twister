import { describe, it, expect, vi } from "vitest";
import { CreateNoteSchema, UpdateNoteSchema, NoteQuerySchema } from "@/server/validation/note";
import { NoteService } from "@/server/services/note-service";
import { NoteRepository } from "@/server/repositories/note";

describe("Note Validation & Service Logic", () => {
  it("should validate create note with only images and no body text (image-only note)", () => {
    const validImageOnlyData = {
      title: "Rajasthan Folk Dances Visual Map",
      subject: "Art & Culture",
      content: "",
      imageIds: ["65f1234567890abcdef12345", "65f1234567890abcdef12346"],
    };

    const result = CreateNoteSchema.safeParse(validImageOnlyData);
    expect(result.success).toBe(true);
  });

  it("should validate create note with text content and no images", () => {
    const validTextNoteData = {
      title: "1857 Revolution in Rajasthan Short Notes",
      subject: "History",
      content: "<h2>Key Centres</h2><p>Nasirabad, Neemuch, Erinpura, Kota.</p>",
    };

    const result = CreateNoteSchema.safeParse(validTextNoteData);
    expect(result.success).toBe(true);
  });

  it("should reject note creation with empty title", () => {
    const invalidData = {
      title: "   ",
      content: "Some notes",
    };

    const result = CreateNoteSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("should reject publish when note has NEITHER content nor images", async () => {
    vi.spyOn(NoteRepository, "findById").mockResolvedValueOnce({
      _id: "65f1234567890abcdef12345" as unknown,
      title: "Empty Note",
      content: "<p>   </p>",
      imageIds: [],
      status: "DRAFT",
    } as unknown as import("@/server/models/Note").INote);

    const result = await NoteService.publishNote("65f1234567890abcdef12345");
    expect(result.success).toBe(false);
    expect(result.error).toContain("requires either text content or at least one image");
  });

  it("should allow publish when note is IMAGE-ONLY (no text, has images)", async () => {
    const mockImageNote = {
      _id: "65f1234567890abcdef12345" as unknown,
      title: "Image Only Note",
      content: "",
      imageIds: ["65f1234567890abcdef12346" as unknown],
      status: "DRAFT",
    };

    vi.spyOn(NoteRepository, "findById").mockResolvedValueOnce(mockImageNote as unknown as import("@/server/models/Note").INote);
    vi.spyOn(NoteRepository, "update").mockResolvedValueOnce({
      ...mockImageNote,
      status: "PUBLISHED",
      publishedAt: new Date(),
    } as unknown as import("@/server/models/Note").INote);

    const result = await NoteService.publishNote("65f1234567890abcdef12345");
    expect(result.success).toBe(true);
    expect(result.note?.status).toBe("PUBLISHED");
  });

  it("should allow publish when note has text content and no images", async () => {
    const mockTextNote = {
      _id: "65f1234567890abcdef12345" as unknown,
      title: "Text Only Note",
      content: "<p>Important constitutional provisions for RPSC</p>",
      imageIds: [],
      status: "DRAFT",
    };

    vi.spyOn(NoteRepository, "findById").mockResolvedValueOnce(mockTextNote as unknown as import("@/server/models/Note").INote);
    vi.spyOn(NoteRepository, "update").mockResolvedValueOnce({
      ...mockTextNote,
      status: "PUBLISHED",
      publishedAt: new Date(),
    } as unknown as import("@/server/models/Note").INote);

    const result = await NoteService.publishNote("65f1234567890abcdef12345");
    expect(result.success).toBe(true);
    expect(result.note?.status).toBe("PUBLISHED");
  });

  it("should preserve reordered images array order upon update", async () => {
    const existing = {
      _id: "65f1234567890abcdef12345" as unknown,
      title: "Test Note",
      slug: "test-note",
      imageIds: ["img-1", "img-2", "img-3"],
    };

    vi.spyOn(NoteRepository, "findById").mockResolvedValueOnce(existing as unknown as import("@/server/models/Note").INote);
    const updateSpy = vi.spyOn(NoteRepository, "update").mockImplementationOnce(async (_id, data) => {
      return {
        ...existing,
        ...data,
      } as unknown as import("@/server/models/Note").INote;
    });

    const reorderedHexIds = [
      "65f1234567890abcdef12343",
      "65f1234567890abcdef12341",
      "65f1234567890abcdef12342",
    ];

    await NoteService.updateNote("65f1234567890abcdef12345", {
      imageIds: reorderedHexIds,
    });

    expect(updateSpy).toHaveBeenCalled();
    const passedData = updateSpy.mock.calls[0][1];
    expect(passedData.imageIds?.map((id: { toString(): string }) => id.toString())).toEqual(reorderedHexIds);
  });

  it("should require ?confirm=true to delete note, returning 409 otherwise", async () => {
    const unconfirmed = await NoteService.deleteNote("65f1234567890abcdef12345", false);
    expect(unconfirmed.success).toBe(false);
    expect(unconfirmed.status).toBe(409);

    vi.spyOn(NoteRepository, "delete").mockResolvedValueOnce(true);
    const confirmed = await NoteService.deleteNote("65f1234567890abcdef12345", true);
    expect(confirmed.success).toBe(true);
    expect(confirmed.status).toBe(200);
  });

  it("should support category and tag filtering by slug in listNotes", async () => {
    const listSpy = vi.spyOn(NoteRepository, "list").mockResolvedValueOnce({
      notes: [
        {
          _id: "65f1234567890abcdef12345",
          title: "Art & Culture Note",
          slug: "art-culture-note",
        } as any,
      ],
      pagination: { total: 1, page: 1, pageSize: 12, totalPages: 1 },
    });

    const result = await NoteService.listNotes({
      categorySlug: "art-and-culture",
      tagSlug: "folk-dance",
    });

    expect(listSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        categorySlug: "art-and-culture",
        tagSlug: "folk-dance",
      }),
      false
    );
    expect(result.notes.length).toBe(1);
  });
});
