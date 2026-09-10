/**
 * pre-import-scan.ts
 *
 * Local CLI pre-flight check before uploading legacy .html notes.
 * Scans ALL .html files in a given folder, checks each against the
 * real DB for slug/content-hash duplicates, and flags empty files.
 *
 * Uses the EXACT same title detection, sanitize, and hash logic as
 * the real import pipeline -- apples-to-apples comparison.
 *
 * Usage:
 *   npx tsx scripts/pre-import-scan.ts <folder-path>
 *   npx tsx scripts/pre-import-scan.ts ./my-notes
 *
 * Output:
 *   - Console summary table
 *   - scripts/pre-import-scan-report.json (full per-file detail)
 *
 * Requires DATABASE_URL in .env (loaded automatically via dotenv).
 */

import path from "path";
import fs from "fs";
import crypto from "crypto";
import * as cheerio from "cheerio";
import slugifyFn from "slugify";
import sanitizeHtml from "sanitize-html";
import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment (.env at project root)
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not set in .env -- aborting.");
  process.exit(1);
}

// Types

type ScanStatus = "NEW" | "LIKELY_DUPLICATE" | "EMPTY";

interface FileScanResult {
  filename: string;
  relativePath: string;
  detectedTitle: string;
  slug: string;
  contentHash: string;
  status: ScanStatus;
  reason: string;
}

// Reuse exact title detection from import-service.ts (lines 189-201)

function detectTitle(
  fileName: string,
  $: cheerio.CheerioAPI
): { title: string; shouldRemoveH1: boolean } {
  const titleTagText = $("title").first().text().trim();
  const firstH1Text = $("h1").first().text().trim();

  if (titleTagText) {
    return { title: titleTagText, shouldRemoveH1: false };
  }
  if (firstH1Text) {
    return { title: firstH1Text, shouldRemoveH1: true };
  }

  const cleanName = path
    .basename(fileName, path.extname(fileName))
    .replace(/[-_]+/g, " ")
    .trim();
  const title = cleanName
    ? cleanName.charAt(0).toUpperCase() + cleanName.slice(1)
    : "Untitled Imported Note";
  return { title, shouldRemoveH1: false };
}

// Reuse exact sanitize config from server/lib/sanitize.ts

const ALLOWED_TAGS = [
  "h1","h2","h3","h4","h5","h6","blockquote","p","a","ul","ol","li",
  "b","i","strong","em","strike","code","hr","br","div","table","thead",
  "tbody","tr","th","td","pre","img","span",
];

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions["allowedAttributes"] = {
  a: ["href", "name", "target", "rel"],
  img: ["src", "alt", "title", "width", "height", "loading", "class"],
  table: ["class", "border"],
  th: ["colspan", "rowspan", "scope", "class"],
  td: ["colspan", "rowspan", "class"],
  span: ["class"],
  div: ["class"],
  code: ["class"],
  pre: ["class"],
};

function sanitizeContentHtml(rawHtml: string): string {
  if (!rawHtml) return "";
  return sanitizeHtml(rawHtml, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ["http", "https", "mailto", "tel", "data"],
    transformTags: {
      // same as real pipeline: demote h1->h2, add rel to links
      h1: "h2",
      a: (tagName: string, attribs: Record<string, string>) => ({
        tagName: "a",
        attribs: { ...attribs, rel: "noopener noreferrer" },
      }),
    },
    exclusiveFilter: (frame: sanitizeHtml.IFrame) =>
      ["script", "style", "iframe", "object", "embed"].includes(frame.tag),
  });
}

// Reuse exact slugify from server/lib/slugify.ts

function slugify(text: string): string {
  if (!text) return "untitled";
  const slug = slugifyFn(text, { lower: true, strict: true, trim: true });
  return slug || "untitled";
}

// Mongoose Note model (minimal -- just the two fields we check)

const NoteSchema = new mongoose.Schema(
  { slug: String, contentHash: String },
  { collection: "notes" }
);
const Note =
  (mongoose.models["ScanNote"] as mongoose.Model<any>) ||
  mongoose.model("ScanNote", NoteSchema);

async function isSlugTaken(slug: string): Promise<boolean> {
  const count = await Note.countDocuments({ slug });
  return count > 0;
}

async function findByContentHash(hash: string): Promise<boolean> {
  const count = await Note.countDocuments({ contentHash: hash });
  return count > 0;
}


// Recursive .html file collector

function collectHtmlFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectHtmlFiles(fullPath));
    } else if (
      entry.isFile() &&
      entry.name.toLowerCase().endsWith(".html")
    ) {
      results.push(fullPath);
    }
  }
  return results;
}

// Main

async function main() {
  const folderArg = process.argv[2];
  if (!folderArg) {
    console.error(
      "Usage: npx tsx scripts/pre-import-scan.ts <folder-path>"
    );
    process.exit(1);
  }

  const folderPath = path.resolve(folderArg);
  if (
    !fs.existsSync(folderPath) ||
    !fs.statSync(folderPath).isDirectory()
  ) {
    console.error("ERROR: Not a valid directory: " + folderPath);
    process.exit(1);
  }

  const maskedUrl = DATABASE_URL!.replace(/:\/\/[^@]+@/, "://<credentials>@");
  console.log("\n=== Rajasthan Exam Twister -- Pre-Import Scanner ===");
  console.log("  Folder : " + folderPath);
  console.log("  DB     : " + maskedUrl + "\n");

  // 1. Collect files
  console.log("Collecting .html files...");
  const allFiles = collectHtmlFiles(folderPath);
  if (allFiles.length === 0) {
    console.log("  No .html files found.");
    process.exit(0);
  }
  console.log("  Found " + allFiles.length + " .html file(s).\n");

  // 2. Connect to DB
  console.log("Connecting to database...");
  await mongoose.connect(DATABASE_URL!);
  console.log("  Connected.\n");

  // 3. Process every file
  const results: FileScanResult[] = [];
  const counts = { NEW: 0, LIKELY_DUPLICATE: 0, EMPTY: 0 };

  for (let i = 0; i < allFiles.length; i++) {
    const filePath = allFiles[i];
    const relativePath = path.relative(folderPath, filePath);
    const fileName = path.basename(filePath);

    process.stdout.write(
      "\r  Processing " + (i + 1) + "/" + allFiles.length + "..."
    );

    // Read
    let rawHtml: string;
    try {
      rawHtml = fs.readFileSync(filePath, "utf-8");
    } catch (err) {
      results.push({
        filename: fileName,
        relativePath,
        detectedTitle: "",
        slug: "",
        contentHash: "",
        status: "EMPTY",
        reason:
          "Could not read file: " +
          (err instanceof Error ? err.message : String(err)),
      });
      counts.EMPTY++;
      continue;
    }

    // Parse
    const $ = cheerio.load(rawHtml);
    const { title: detectedTitle, shouldRemoveH1 } = detectTitle(
      fileName,
      $
    );
    if (shouldRemoveH1) {
      $("h1").first().remove();
    }

    // Extract body
    const bodyContent = $("body").length
      ? $("body").html() || ""
      : $.html();

    // Sanitize (same pipeline)
    const sanitized = sanitizeContentHtml(bodyContent);

    // Empty check
    const plainText = sanitized
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (plainText.length < 20) {
      results.push({
        filename: fileName,
        relativePath,
        detectedTitle,
        slug: slugify(detectedTitle),
        contentHash: "",
        status: "EMPTY",
        reason:
          "Sanitized body has only " +
          plainText.length +
          " char(s) -- likely empty or broken",
      });
      counts.EMPTY++;
      continue;
    }

    // Hash (SHA-256 of trimmed sanitized body -- same as real pipeline)
    const contentHash = crypto
      .createHash("sha256")
      .update(sanitized.trim())
      .digest("hex");

    const baseSlug = slugify(detectedTitle);

    // DB: content hash check (catches identical re-exports)
    const hashExists = await findByContentHash(contentHash);
    if (hashExists) {
      results.push({
        filename: fileName,
        relativePath,
        detectedTitle,
        slug: baseSlug,
        contentHash,
        status: "LIKELY_DUPLICATE",
        reason:
          "Content hash matches an existing Note (identical content already imported)",
      });
      counts.LIKELY_DUPLICATE++;
      continue;
    }

    // DB: slug collision check (catches same-title files with minor content diffs)
    const slugTaken = await isSlugTaken(baseSlug);
    if (slugTaken) {
      results.push({
        filename: fileName,
        relativePath,
        detectedTitle,
        slug: baseSlug,
        contentHash,
        status: "LIKELY_DUPLICATE",
        reason: 'Slug "' + baseSlug + '" is already taken by an existing Note',
      });
      counts.LIKELY_DUPLICATE++;
      continue;
    }

    // All clear
    results.push({
      filename: fileName,
      relativePath,
      detectedTitle,
      slug: baseSlug,
      contentHash,
      status: "NEW",
      reason: "No slug or content hash collision found",
    });
    counts.NEW++;
  }

  process.stdout.write("\n");
  await mongoose.disconnect();

  // Console Summary
  const sep = "=".repeat(60);
  console.log("\n" + sep);
  console.log("  SCAN COMPLETE");
  console.log(sep);
  console.log("  Total scanned    : " + allFiles.length);
  console.log("  NEW              : " + counts.NEW);
  console.log("  LIKELY_DUPLICATE : " + counts.LIKELY_DUPLICATE);
  console.log("  EMPTY/BROKEN     : " + counts.EMPTY);
  console.log(sep);

  if (counts.LIKELY_DUPLICATE > 0) {
    console.log("\n[LIKELY_DUPLICATE] -- review before skipping:");
    results
      .filter((r) => r.status === "LIKELY_DUPLICATE")
      .forEach((r) => {
        console.log("  " + r.relativePath);
        console.log("    -> " + r.reason);
      });
  }

  if (counts.EMPTY > 0) {
    console.log("\n[EMPTY/BROKEN] -- fix or discard before importing:");
    results
      .filter((r) => r.status === "EMPTY")
      .forEach((r) => {
        console.log("  " + r.relativePath);
        console.log("    -> " + r.reason);
      });
  }

  const newFiles = results.filter((r) => r.status === "NEW");
  console.log(
    "\n[NEW] " + newFiles.length + " file(s) safe to import:"
  );
  newFiles.slice(0, 20).forEach((r) => {
    console.log('  ' + r.relativePath + '  ->  "' + r.detectedTitle + '"');
  });
  if (newFiles.length > 20) {
    console.log("  ... and " + (newFiles.length - 20) + " more (see full report)");
  }

  // JSON Report
  const reportPath = path.resolve(
    path.dirname(process.argv[1]),
    "pre-import-scan-report.json"
  );
  const report = {
    scannedAt: new Date().toISOString(),
    folder: folderPath,
    summary: {
      total: allFiles.length,
      new: counts.NEW,
      likelyDuplicate: counts.LIKELY_DUPLICATE,
      emptyOrBroken: counts.EMPTY,
    },
    files: results,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");
  console.log("\nFull report written to: " + reportPath + "\n");
}

main().catch((err) => {
  console.error("\nScan failed:", err);
  process.exit(1);
});
