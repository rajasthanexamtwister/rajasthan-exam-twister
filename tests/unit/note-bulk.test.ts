import { describe, it, expect, vi, beforeEach } from "vitest";
import { BulkNoteActionSchema } from "@/server/validation/note";
import { NoteService } from "@/server/services/note-service";
import { NoteRepository } from "@/server/repositories/note";
import mongoose from "mongoose";

describe("Bulk Note Publish & Unpublish Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Validation - BulkNoteActionSchema", () => {
    it("should accept valid array of 1 to 200 ObjectIds", () => {
      const validIds = [
        new mongoose.Types.ObjectId().toString(),
        new mongoose.Types.ObjectId().toString(),
      ];

      const result = BulkNoteActionSchema.safeParse({ noteIds: validIds });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.noteIds).toEqual(validIds);
      }
    });

    it("should reject empty noteIds array", () => {
      const result = BulkNoteActionSchema.safeParse({ noteIds: [] });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("At least one note ID is required");
      }
    });

    it("should reject noteIds array exceeding 200 items", () => {
      const tooManyIds = Array.from({ length: 201 }, () =>
        new mongoose.Types.ObjectId().toString()
      );

      const result = BulkNoteActionSchema.safeParse({ noteIds: tooManyIds });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Cannot process more than 200 notes");
      }
    });

    it("should reject invalid ObjectId hex strings", () => {
      const result = BulkNoteActionSchema.safeParse({
        noteIds: ["invalid-hex-id-123"],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Invalid note ID format");
      }
    });
  });

  describe("Service - bulkPublishNotes partial success & skipped report", () => {
    it("should publish valid notes and report skipped notes with reasons without failing the entire batch", async () => {
      const validTextNoteId = new mongoose.Types.ObjectId().toString();
      const validImageNoteId = new mongoose.Types.ObjectId().toString();
      const emptyNoteId = new mongoose.Types.ObjectId().toString();
      const notFoundNoteId = new mongoose.Types.ObjectId().toString();

      vi.spyOn(NoteRepository, "findById").mockImplementation(async (id: string) => {
        if (id === validTextNoteId) {
          return {
            _id: validTextNoteId,
            title: "Valid Text Note",
            content: "<p>Important facts for RPSC RAS</p>",
            imageIds: [],
            status: "DRAFT",
          } as any;
        }
        if (id === validImageNoteId) {
          return {
            _id: validImageNoteId,
            title: "Valid Image Note",
            content: "",
            imageIds: [new mongoose.Types.ObjectId()],
            status: "DRAFT",
          } as any;
        }
        if (id === emptyNoteId) {
          return {
            _id: emptyNoteId,
            title: "Empty Incomplete Note",
            content: "   ",
            imageIds: [],
            status: "DRAFT",
          } as any;
        }
        return null;
      });

      vi.spyOn(NoteRepository, "update").mockImplementation(async (id: string, updateData: any) => {
        return {
          _id: id,
          status: updateData.status || "PUBLISHED",
          publishedAt: updateData.publishedAt || new Date(),
        } as any;
      });

      const result = await NoteService.bulkPublishNotes([
        validTextNoteId,
        validImageNoteId,
        emptyNoteId,
        notFoundNoteId,
      ]);

      expect(result.totalRequested).toBe(4);
      expect(result.publishedCount).toBe(2);
      expect(result.skippedCount).toBe(2);
      expect(result.published).toEqual([validTextNoteId, validImageNoteId]);

      expect(result.skipped).toHaveLength(2);
      expect(result.skipped[0]).toEqual({
        id: emptyNoteId,
        title: "Empty Incomplete Note",
        reason: "Note requires either text content or at least one image to be published",
      });
      expect(result.skipped[1]).toEqual({
        id: notFoundNoteId,
        title: undefined,
        reason: "Note not found",
      });
    });
  });

  describe("Service - bulkUnpublishNotes", () => {
    it("should set all selected notes back to DRAFT status", async () => {
      const noteId1 = new mongoose.Types.ObjectId().toString();
      const noteId2 = new mongoose.Types.ObjectId().toString();

      vi.spyOn(NoteRepository, "findById").mockImplementation(async (id: string) => {
        return {
          _id: id,
          title: "Published Note",
          content: "<p>Content</p>",
          status: "PUBLISHED",
        } as any;
      });

      const updateSpy = vi.spyOn(NoteRepository, "update").mockImplementation(async (id: string, updateData: any) => {
        return {
          _id: id,
          ...updateData,
        } as any;
      });

      const result = await NoteService.bulkUnpublishNotes([noteId1, noteId2]);

      expect(result.success).toBe(true);
      expect(result.unpublishedCount).toBe(2);
      expect(result.unpublished).toEqual([noteId1, noteId2]);
      expect(updateSpy).toHaveBeenCalledTimes(2);
      expect(updateSpy).toHaveBeenCalledWith(noteId1, { status: "DRAFT" });
      expect(updateSpy).toHaveBeenCalledWith(noteId2, { status: "DRAFT" });
    });
  });
});
