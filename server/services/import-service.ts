import crypto from "crypto";
import * as cheerio from "cheerio";
import mongoose from "mongoose";
import { ImportJobRepository } from "@/server/repositories/import-job";
import { ImportLogRepository } from "@/server/repositories/import-log";
import { NoteRepository } from "@/server/repositories/note";
import { MediaRepository } from "@/server/repositories/media";
import { getMediaStorageProvider } from "@/server/lib/media-storage";
import { validateUploadedFile } from "@/server/lib/media-validation";
import { sanitizeContentHtml } from "@/server/lib/sanitize";
import { slugify, generateUniqueSlug } from "@/server/lib/slugify";
import { IImportJob } from "@/server/models/ImportJob";
import { IImportLog, ImportLogResult } from "@/server/models/ImportLog";

export interface UploadedHtmlFile {
  name: string;
  content: string | Buffer;
}

export interface UploadedLooseImage {
  name: string;
  buffer: Buffer;
  mimeType?: string;
}

export interface ImportOptions {
  dryRun?: boolean;
}

export interface ImportFileResult {
  fileName: string;
  result: ImportLogResult;
  reason?: string;
  title?: string;
  slug?: string;
  createdNoteId?: string;
}

export interface ImportBatchSummary {
  jobId: string;
  totalFiles: number;
  successCount: number;
  duplicateCount: number;
  failedCount: number;
  isDryRun: boolean;
  results: ImportFileResult[];
}

export class ImportService {
  static async listJobs(page: number = 1, pageSize: number = 20) {
    return ImportJobRepository.list(page, pageSize);
  }

  static async getJobDetails(jobId: string) {
    const job = await ImportJobRepository.findById(jobId);
    if (!job) return null;
    const logs = await ImportLogRepository.listByJobId(jobId);
    return { job, logs };
  }

  static async rollbackJob(jobId: string): Promise<{ success: boolean; deletedCount: number; error?: string }> {
    const job = await ImportJobRepository.findById(jobId);
    if (!job) {
      return { success: false, deletedCount: 0, error: "Import job not found" };
    }

    const deletedCount = await NoteRepository.deleteUntouchedDraftsByJobId(jobId);
    return { success: true, deletedCount };
  }

  static async processBatch(
    htmlFiles: UploadedHtmlFile[],
    looseImages: UploadedLooseImage[] = [],
    options: ImportOptions = {}
  ): Promise<ImportBatchSummary> {
    const isDryRun = !!options.dryRun;

    // Create tracking job document in database
    const job = await ImportJobRepository.create({
      totalFiles: htmlFiles.length,
      successCount: 0,
      duplicateCount: 0,
      failedCount: 0,
      isDryRun,
      status: "RUNNING",
    });

    const jobId = job._id.toString();
    const results: ImportFileResult[] = [];
    const logsToPersist: Array<Partial<IImportLog>> = [];

    // Map loose images by filename (case-insensitive and basename lookup)
    const imageMap = new Map<string, UploadedLooseImage>();
    for (const img of looseImages) {
      const baseName = img.name.split("/").pop()?.split("\\").pop() || img.name;
      imageMap.set(baseName.toLowerCase(), img);
      imageMap.set(img.name.toLowerCase(), img);
    }

    let successCount = 0;
    let duplicateCount = 0;
    let failedCount = 0;

    for (const file of htmlFiles) {
      try {
        const rawHtml = Buffer.isBuffer(file.content)
          ? file.content.toString("utf-8")
          : String(file.content);

        const fileResult = await this.processSingleHtml(
          file.name,
          rawHtml,
          imageMap,
          job._id,
          isDryRun
        );

        results.push(fileResult);

        if (fileResult.result === "SUCCESS") {
          successCount++;
        } else if (fileResult.result === "DUPLICATE") {
          duplicateCount++;
        } else {
          failedCount++;
        }

        logsToPersist.push({
          importJobId: job._id,
          fileName: file.name,
          result: fileResult.result,
          reason: fileResult.reason,
          createdNoteId: fileResult.createdNoteId
            ? new mongoose.Types.ObjectId(fileResult.createdNoteId)
            : undefined,
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to parse HTML file";
        failedCount++;
        results.push({
          fileName: file.name,
          result: "FAILED",
          reason: errorMsg,
        });

        logsToPersist.push({
          importJobId: job._id,
          fileName: file.name,
          result: "FAILED",
          reason: errorMsg,
        });
      }
    }

    // Persist logs in database if not dry run (or persist dry run report logs)
    await ImportLogRepository.createMany(logsToPersist);

    // Update job status & counts
    await ImportJobRepository.update(jobId, {
      totalFiles: htmlFiles.length,
      successCount,
      duplicateCount,
      failedCount,
      status: "COMPLETED",
      completedAt: new Date(),
    });

    return {
      jobId,
      totalFiles: htmlFiles.length,
      successCount,
      duplicateCount,
      failedCount,
      isDryRun,
      results,
    };
  }

  private static async processSingleHtml(
    fileName: string,
    rawHtml: string,
    imageMap: Map<string, UploadedLooseImage>,
    importJobId: mongoose.Types.ObjectId,
    isDryRun: boolean
  ): Promise<ImportFileResult> {
    const $ = cheerio.load(rawHtml);

    // 1. Title Detection Priority: <title> -> first <h1> -> filename fallback
    let detectedTitle = "";
    const titleTagText = $("title").first().text().trim();
    const firstH1Text = $("h1").first().text().trim();

    if (titleTagText) {
      detectedTitle = titleTagText;
    } else if (firstH1Text) {
      detectedTitle = firstH1Text;
    } else {
      const cleanName = fileName.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ").trim();
      detectedTitle = cleanName
        ? cleanName.charAt(0).toUpperCase() + cleanName.slice(1)
        : "Untitled Imported Note";
    }

    // If first <h1> was used for title, remove it from body so it doesn't duplicate
    if (firstH1Text && !titleTagText) {
      $("h1").first().remove();
    }

    // 2. Extract Body Content Block
    const bodyContent = $("body").length ? $("body").html() || "" : $.html();

    // 3. Image Processing
    const attachedMediaIds: mongoose.Types.ObjectId[] = [];
    const missingImages: string[] = [];

    const $body = cheerio.load(bodyContent);

    // Process all <img> tags
    const imgElements = $body("img").toArray();

    for (let i = 0; i < imgElements.length; i++) {
      const img = $body(imgElements[i]);
      const src = img.attr("src")?.trim() || "";

      if (!src) continue;

      // Handle javascript: URI
      if (src.toLowerCase().startsWith("javascript:")) {
        img.remove();
        continue;
      }

      // Placeholder alt text derivation
      const altText =
        img.attr("alt")?.trim() ||
        `${detectedTitle} Infographic Diagram ${i + 1}`;

      // A. Base64 / data: URI
      if (src.startsWith("data:")) {
        try {
          const matches = src.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const declaredMime = matches[1];
            const buffer = Buffer.from(matches[2], "base64");

            const validation = validateUploadedFile(buffer, declaredMime);
            if (!validation.valid || !validation.detectedMime) {
              missingImages.push(`Invalid image data URI: ${validation.error || "unsupported format"}`);
              continue;
            }

            if (!isDryRun) {
              const storage = getMediaStorageProvider();
              const ext = validation.detectedMime.split("/")[1] || "png";
              const imgFileName = `imported-${Date.now()}-${i}.${ext}`;
              const uploadRes = await storage.upload(buffer, imgFileName, validation.detectedMime);

              const mediaDoc = await MediaRepository.create({
                url: uploadRes.url,
                altText,
                fileSize: uploadRes.fileSize,
                mimeType: validation.detectedMime,
              });

              attachedMediaIds.push(mediaDoc._id);
              img.attr("src", uploadRes.url);
              img.attr("alt", altText);
            }
          }
        } catch (err) {
          missingImages.push(`Failed to parse base64 image ${i + 1}`);
        }
      }
      // B. Relative path / loose file image
      else if (!src.startsWith("http://") && !src.startsWith("https://")) {
        const baseName = src.split("/").pop()?.split("\\").pop() || src;
        const matchedImage = imageMap.get(baseName.toLowerCase());

        if (matchedImage) {
          const validation = validateUploadedFile(
            matchedImage.buffer,
            matchedImage.mimeType || "image/jpeg"
          );

          if (!validation.valid || !validation.detectedMime) {
            missingImages.push(`Corrupt image file '${baseName}': ${validation.error}`);
            continue;
          }

          if (!isDryRun) {
            const storage = getMediaStorageProvider();
            const uploadRes = await storage.upload(
              matchedImage.buffer,
              matchedImage.name,
              validation.detectedMime
            );

            const mediaDoc = await MediaRepository.create({
              url: uploadRes.url,
              altText,
              fileSize: uploadRes.fileSize,
              mimeType: validation.detectedMime,
            });

            attachedMediaIds.push(mediaDoc._id);
            img.attr("src", uploadRes.url);
            img.attr("alt", altText);
          }
        } else {
          // Unresolvable relative image: must NOT drop silently
          missingImages.push(`image not found: ${baseName}`);
        }
      }
    }

    // If missing referenced images are detected, fail with exact reason
    if (missingImages.length > 0) {
      return {
        fileName,
        result: "FAILED",
        reason: missingImages.join("; "),
        title: detectedTitle,
      };
    }

    // 4. Sanitize extracted HTML using existing sanitize-html configuration
    // (Strips <script>, <style>, <iframe>, <object>, <embed>, inline style attributes, demotes <h1> to <h2>)
    const rawSanitizedBody = $body("body").length ? $body("body").html() || "" : $body.html();
    const sanitizedContent = sanitizeContentHtml(rawSanitizedBody, { demoteH1: true });

    // 5. Compute content hash (SHA-256)
    const contentHash = crypto
      .createHash("sha256")
      .update(sanitizedContent.trim())
      .digest("hex");

    // 6. Duplicate Detection Checks
    const baseSlug = slugify(detectedTitle);

    // Check 1: Slug collision
    const isSlugTaken = await NoteRepository.isSlugTaken(baseSlug);
    if (isSlugTaken) {
      return {
        fileName,
        result: "DUPLICATE",
        reason: `Duplicate slug detected: ${baseSlug}`,
        title: detectedTitle,
        slug: baseSlug,
      };
    }

    // Check 2: Content hash match
    const existingHash = await NoteRepository.findByContentHash(contentHash);
    if (existingHash) {
      return {
        fileName,
        result: "DUPLICATE",
        reason: "Duplicate content detected (matching content hash)",
        title: detectedTitle,
        slug: baseSlug,
      };
    }

    // 7. If Dry Run: report what WOULD happen
    if (isDryRun) {
      return {
        fileName,
        result: "SUCCESS",
        title: detectedTitle,
        slug: baseSlug,
      };
    }

    // 8. Create Note as DRAFT
    const uniqueSlug = await generateUniqueSlug(detectedTitle, async (s) => {
      return NoteRepository.isSlugTaken(s);
    });

    const note = await NoteRepository.create({
      title: detectedTitle,
      slug: uniqueSlug,
      content: sanitizedContent,
      imageIds: attachedMediaIds,
      status: "DRAFT",
      contentHash,
      importJobId,
      isEditedSinceImport: false,
    });

    return {
      fileName,
      result: "SUCCESS",
      title: detectedTitle,
      slug: uniqueSlug,
      createdNoteId: note._id.toString(),
    };
  }
}
