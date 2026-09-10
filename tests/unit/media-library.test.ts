import { describe, it, expect, vi, beforeEach } from "vitest";
import { MediaService } from "@/server/services/media-service";
import { MediaRepository } from "@/server/repositories/media";
import { UpdateMediaSchema, MediaQuerySchema } from "@/server/validation/media";
import { IMedia } from "@/server/models/Media";

describe("Media Library & Asset Management (Batch 5)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("1. Delete blocked when media is referenced by a Blog cover image", async () => {
    vi.spyOn(MediaRepository, "countReferences").mockResolvedValueOnce({
      inUse: true,
      totalCount: 1,
      blogCoverCount: 1,
      noteImageCount: 0,
      notePdfCount: 0,
    });

    const result = await MediaService.deleteMedia("65f1234567890abcdef12301");
    expect(result.success).toBe(false);
    expect(result.status).toBe(409);
    expect(result.error).toContain("1 blog cover image(s)");
  });

  it("2. Delete blocked when media is referenced by a Note image or Note PDF", async () => {
    // Case A: Note image reference
    vi.spyOn(MediaRepository, "countReferences").mockResolvedValueOnce({
      inUse: true,
      totalCount: 2,
      blogCoverCount: 0,
      noteImageCount: 2,
      notePdfCount: 0,
    });

    const noteImgResult = await MediaService.deleteMedia("65f1234567890abcdef12302");
    expect(noteImgResult.success).toBe(false);
    expect(noteImgResult.status).toBe(409);
    expect(noteImgResult.error).toContain("2 note infographic image(s)");

    // Case B: Note PDF reference
    vi.spyOn(MediaRepository, "countReferences").mockResolvedValueOnce({
      inUse: true,
      totalCount: 1,
      blogCoverCount: 0,
      noteImageCount: 0,
      notePdfCount: 1,
    });

    const notePdfResult = await MediaService.deleteMedia("65f1234567890abcdef12303");
    expect(notePdfResult.success).toBe(false);
    expect(notePdfResult.status).toBe(409);
    expect(notePdfResult.error).toContain("1 note PDF handbook(s)");
  });

  it("3. Delete succeeds when media is unreferenced", async () => {
    vi.spyOn(MediaRepository, "countReferences").mockResolvedValueOnce({
      inUse: false,
      totalCount: 0,
      blogCoverCount: 0,
      noteImageCount: 0,
      notePdfCount: 0,
    });
    vi.spyOn(MediaRepository, "delete").mockResolvedValueOnce(true);

    const result = await MediaService.deleteMedia("65f1234567890abcdef12304");
    expect(result.success).toBe(true);
    expect(result.status).toBe(200);
  });

  it("4. Alt text and caption update persists correctly", async () => {
    const existing = {
      _id: "65f1234567890abcdef12305" as unknown,
      url: "/uploads/rajasthan_map.png",
      altText: "Old Alt Text",
      caption: "Old Caption",
    };

    vi.spyOn(MediaRepository, "findById").mockResolvedValueOnce(existing as unknown as IMedia);
    const updateSpy = vi.spyOn(MediaRepository, "update").mockResolvedValueOnce({
      ...existing,
      altText: "New High-Yield Rajasthan Map 2026",
      caption: "Figure 1: District Boundaries",
    } as unknown as IMedia);

    const validation = UpdateMediaSchema.safeParse({
      altText: "New High-Yield Rajasthan Map 2026",
      caption: "Figure 1: District Boundaries",
    });
    expect(validation.success).toBe(true);

    const result = await MediaService.updateMedia("65f1234567890abcdef12305", validation.data!);
    expect(result.success).toBe(true);
    expect(result.media?.altText).toBe("New High-Yield Rajasthan Map 2026");
    expect(updateSpy).toHaveBeenCalledWith("65f1234567890abcdef12305", {
      altText: "New High-Yield Rajasthan Map 2026",
      caption: "Figure 1: District Boundaries",
    });
  });

  it("5. Reusing an existing image across two different Notes: both notes reference the same Media ID safely", () => {
    const sharedMediaId = "65f1234567890abcdef12399";

    const note1 = {
      title: "Rajasthan Geography Chapter 1",
      imageIds: [sharedMediaId, "65f1234567890abcdef12311"],
    };

    const note2 = {
      title: "Rajasthan Art & Architecture Overview",
      imageIds: ["65f1234567890abcdef12322", sharedMediaId],
    };

    expect(note1.imageIds).toContain(sharedMediaId);
    expect(note2.imageIds).toContain(sharedMediaId);
    expect(note1.imageIds[0]).toBe(sharedMediaId);
    expect(note2.imageIds[1]).toBe(sharedMediaId);
  });

  it("6. Search and filter query schema validates correctly", () => {
    const validQuery = MediaQuerySchema.safeParse({
      q: "Aravalli Range",
      mimeType: "images",
      page: "2",
      pageSize: "18",
    });

    expect(validQuery.success).toBe(true);
    if (validQuery.success) {
      expect(validQuery.data.page).toBe(2);
      expect(validQuery.data.pageSize).toBe(18);
      expect(validQuery.data.q).toBe("Aravalli Range");
      expect(validQuery.data.mimeType).toBe("images");
    }
  });
});
