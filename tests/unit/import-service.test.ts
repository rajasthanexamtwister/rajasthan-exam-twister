import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import { ImportService } from "@/server/services/import-service";
import { ImportJobRepository } from "@/server/repositories/import-job";
import { ImportLogRepository } from "@/server/repositories/import-log";
import { NoteRepository } from "@/server/repositories/note";
import { MediaRepository } from "@/server/repositories/media";
import { INote } from "@/server/models/Note";
import { IImportJob } from "@/server/models/ImportJob";
import { IMedia } from "@/server/models/Media";

const FIXTURES_DIR = path.join(process.cwd(), "tests", "fixtures");

describe("Content Import Engine & HTML Parser (Batch 4)", () => {
  const cleanHtml = fs.readFileSync(path.join(FIXTURES_DIR, "clean-note.html"), "utf-8");
  const maliciousHtml = fs.readFileSync(path.join(FIXTURES_DIR, "malicious-note.html"), "utf-8");
  const relativeImagesHtml = fs.readFileSync(path.join(FIXTURES_DIR, "relative-images.html"), "utf-8");

  beforeEach(() => {
    vi.restoreAllMocks();

    // Default mock for creating ImportJob
    vi.spyOn(ImportJobRepository, "create").mockResolvedValue({
      _id: "65f1234567890abcdef12399" as unknown,
      status: "RUNNING",
      totalFiles: 1,
    } as unknown as IImportJob);

    vi.spyOn(ImportJobRepository, "update").mockResolvedValue({} as unknown as IImportJob);
    vi.spyOn(ImportLogRepository, "createMany").mockResolvedValue([]);
  });

  it("1. Malicious HTML stripping: scripts, iframes, onerror, style attributes, and javascript: URLs are stripped from stored note content", async () => {
    vi.spyOn(NoteRepository, "isSlugTaken").mockResolvedValue(false);
    vi.spyOn(NoteRepository, "findByContentHash").mockResolvedValue(null);

    let savedNotePayload: Partial<INote> | null = null;
    vi.spyOn(NoteRepository, "create").mockImplementationOnce(async (data) => {
      savedNotePayload = data;
      return {
        _id: "65f1234567890abcdef12301" as unknown,
        ...data,
      } as unknown as INote;
    });

    const summary = await ImportService.processBatch(
      [{ name: "malicious-note.html", content: maliciousHtml }],
      [],
      { dryRun: false }
    );

    expect(summary.successCount).toBe(1);
    expect(savedNotePayload).not.toBeNull();

    const storedContent = (savedNotePayload as unknown as { content: string }).content;

    // Verify malicious artifacts are stripped
    expect(storedContent).not.toContain("<script");
    expect(storedContent).not.toContain("window.stealAdminToken");
    expect(storedContent).not.toContain("onerror");
    expect(storedContent).not.toContain("<iframe");
    expect(storedContent).not.toContain("<object");
    expect(storedContent).not.toContain("<embed");
    expect(storedContent).not.toContain("javascript:alert");
    expect(storedContent).not.toContain("style=");
    expect(storedContent).not.toContain("font-size: 50px");

    // Verify h1 in body was demoted to h2 per SEO.md
    expect(storedContent).not.toContain("<h1>Safe Looking Heading</h1>");
    expect(storedContent).toContain("<h2>Safe Looking Heading</h2>");
  });

  it("2. Title detection priority: <title> tag takes precedence, then <h1>, then filename fallback", async () => {
    vi.spyOn(NoteRepository, "isSlugTaken").mockResolvedValue(false);
    vi.spyOn(NoteRepository, "findByContentHash").mockResolvedValue(null);

    const createdTitles: string[] = [];
    vi.spyOn(NoteRepository, "create").mockImplementation(async (data) => {
      createdTitles.push(data.title || "");
      return { _id: "65f1234567890abcdef12302" as unknown, ...data } as unknown as INote;
    });

    // A. Title from <title>
    await ImportService.processBatch(
      [{ name: "file1.html", content: "<html><head><title>Tag Title</title></head><body><h1>H1 Title</h1></body></html>" }],
      [],
      { dryRun: false }
    );
    expect(createdTitles[0]).toBe("Tag Title");

    // B. Title from <h1> when no <title>
    await ImportService.processBatch(
      [{ name: "file2.html", content: "<html><body><h1>First Heading Title</h1><p>Text</p></body></html>" }],
      [],
      { dryRun: false }
    );
    expect(createdTitles[1]).toBe("First Heading Title");

    // C. Title from filename fallback when neither exists
    await ImportService.processBatch(
      [{ name: "rajasthan-art-and-culture-notes.html", content: "<html><body><p>Only body text</p></body></html>" }],
      [],
      { dryRun: false }
    );
    expect(createdTitles[2]).toBe("Rajasthan art and culture notes");
  });

  it("3. Duplicate detection: detects slug collision and content hash match", async () => {
    // Check A: Slug collision
    vi.spyOn(NoteRepository, "isSlugTaken").mockResolvedValueOnce(true);

    const slugCollisionSummary = await ImportService.processBatch(
      [{ name: "clean-note.html", content: cleanHtml }],
      [],
      { dryRun: false }
    );
    expect(slugCollisionSummary.duplicateCount).toBe(1);
    expect(slugCollisionSummary.results[0].result).toBe("DUPLICATE");
    expect(slugCollisionSummary.results[0].reason).toContain("Duplicate slug detected");

    // Check B: Exact content hash match
    vi.spyOn(NoteRepository, "isSlugTaken").mockResolvedValueOnce(false);
    vi.spyOn(NoteRepository, "findByContentHash").mockResolvedValueOnce({
      _id: "65f1234567890abcdef12303" as unknown,
      title: "Existing Geography Note",
    } as unknown as INote);

    const hashMatchSummary = await ImportService.processBatch(
      [{ name: "clean-note.html", content: cleanHtml }],
      [],
      { dryRun: false }
    );
    expect(hashMatchSummary.duplicateCount).toBe(1);
    expect(hashMatchSummary.results[0].result).toBe("DUPLICATE");
    expect(hashMatchSummary.results[0].reason).toContain("matching content hash");
  });

  it("4. Missing referenced image: fails import with specific human-readable reason ('image not found: <filename>')", async () => {
    vi.spyOn(NoteRepository, "isSlugTaken").mockResolvedValue(false);
    vi.spyOn(NoteRepository, "findByContentHash").mockResolvedValue(null);

    // No loose images provided alongside relative-images.html
    const summary = await ImportService.processBatch(
      [{ name: "relative-images.html", content: relativeImagesHtml }],
      [],
      { dryRun: false }
    );

    expect(summary.failedCount).toBe(1);
    expect(summary.results[0].result).toBe("FAILED");
    expect(summary.results[0].reason).toContain("image not found: chittorgarh_map.png");
  });

  it("5. Resolvable relative image: successfully matched by filename, uploaded to Media Library, and attached to Note", async () => {
    vi.spyOn(NoteRepository, "isSlugTaken").mockResolvedValue(false);
    vi.spyOn(NoteRepository, "findByContentHash").mockResolvedValue(null);

    // Valid 1x1 PNG header
    const validPngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
    ]);

    vi.spyOn(MediaRepository, "create").mockResolvedValueOnce({
      _id: "65f1234567890abcdef12388" as unknown,
      url: "/uploads/chittorgarh_map.png",
      altText: "Chittorgarh Fort Layout",
    } as unknown as IMedia);

    let savedNote: Partial<INote> | null = null;
    vi.spyOn(NoteRepository, "create").mockImplementationOnce(async (data) => {
      savedNote = data;
      return { _id: "65f1234567890abcdef12304" as unknown, ...data } as unknown as INote;
    });

    const summary = await ImportService.processBatch(
      [{ name: "relative-images.html", content: relativeImagesHtml }],
      [{ name: "chittorgarh_map.png", buffer: validPngBuffer, mimeType: "image/png" }],
      { dryRun: false }
    );

    expect(summary.successCount).toBe(1);
    expect(savedNote).not.toBeNull();
    expect((savedNote as unknown as { imageIds: string[] }).imageIds).toHaveLength(1);
  });

  it("6. Dry run vs. Real run: Dry run does not write to NoteRepository, real run writes Note as DRAFT", async () => {
    vi.spyOn(NoteRepository, "isSlugTaken").mockResolvedValue(false);
    vi.spyOn(NoteRepository, "findByContentHash").mockResolvedValue(null);
    const noteCreateSpy = vi.spyOn(NoteRepository, "create");

    // Dry Run
    const dryRunSummary = await ImportService.processBatch(
      [{ name: "clean-note.html", content: cleanHtml }],
      [],
      { dryRun: true }
    );
    expect(dryRunSummary.isDryRun).toBe(true);
    expect(dryRunSummary.successCount).toBe(1);
    expect(noteCreateSpy).not.toHaveBeenCalled();

    // Real Run
    noteCreateSpy.mockResolvedValueOnce({
      _id: "65f1234567890abcdef12305" as unknown,
      status: "DRAFT",
    } as unknown as INote);

    const realSummary = await ImportService.processBatch(
      [{ name: "clean-note.html", content: cleanHtml }],
      [],
      { dryRun: false }
    );
    expect(realSummary.isDryRun).toBe(false);
    expect(realSummary.successCount).toBe(1);
    expect(noteCreateSpy).toHaveBeenCalledTimes(1);
    expect(noteCreateSpy.mock.calls[0][0].status).toBe("DRAFT");
  });

  it("7. Rollback strategy: only cascades to delete untouched draft notes", async () => {
    vi.spyOn(ImportJobRepository, "findById").mockResolvedValueOnce({
      _id: "65f1234567890abcdef12399" as unknown,
      status: "COMPLETED",
    } as unknown as IImportJob);

    const deleteSpy = vi.spyOn(NoteRepository, "deleteUntouchedDraftsByJobId").mockResolvedValueOnce(3);

    const rollbackResult = await ImportService.rollbackJob("65f1234567890abcdef12399");
    expect(rollbackResult.success).toBe(true);
    expect(rollbackResult.deletedCount).toBe(3);
    expect(deleteSpy).toHaveBeenCalledWith("65f1234567890abcdef12399");
  });

  it("8. Real non-synthetic legacy HTML import: parses actual repo legacy notes in dry run mode", async () => {
    vi.spyOn(NoteRepository, "isSlugTaken").mockResolvedValue(false);
    vi.spyOn(NoteRepository, "findByContentHash").mockResolvedValue(null);

    const realNotePath = path.join(process.cwd(), "notes", "gk", "art-culture", "rajasthan-nritya-master-handbook.html");
    const realContent = fs.readFileSync(realNotePath, "utf-8");

    const summary = await ImportService.processBatch(
      [{ name: "rajasthan-nritya-master-handbook.html", content: realContent }],
      [],
      { dryRun: true }
    );

    expect(summary.totalFiles).toBe(1);
    expect(summary.successCount).toBe(1);
    expect(summary.failedCount).toBe(0);
    expect(summary.isDryRun).toBe(true);
    expect(summary.results[0].result).toBe("SUCCESS");
    expect(summary.results[0].title).toBe("राजस्थान में नृत्य — Master Revision Handbook");
  });
});

