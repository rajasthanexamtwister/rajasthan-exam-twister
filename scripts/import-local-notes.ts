/**
 * scripts/import-local-notes.ts
 *
 * Official CLI tool for batch-importing legacy .html notes from a local directory.
 *
 * How it works:
 *   1. Scans specified directory (default: notes/) recursively for .html files.
 *   2. Filters out redirect stubs (e.g. meta refresh files).
 *   3. Calls canonical `ImportService.processBatch(htmlFiles, [], { dryRun })`.
 *   4. Runs content through `server/lib/sanitize.ts` (sanitizeContentHtml).
 *   5. Creates an official `ImportJob` and granular `ImportLog` records for audit & rollback.
 *   6. Creates all valid notes in `DRAFT` status with `importJobId` attached.
 *
 * Usage:
 *   npm run notes:import                                      (scans default notes/ directory)
 *   npm run notes:import -- ./_legacy_archive/notes            (scans specific directory)
 *   npm run notes:import -- ./_legacy_archive/notes --dry-run  (dry run — no DB writes)
 *   or: npx tsx scripts/import-local-notes.ts [folder] [--dry-run]
 *
 * Requirements:
 *   - DATABASE_URL in .env
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { connectToDatabase } from "../server/lib/mongodb";
import { ImportService, UploadedHtmlFile } from "../server/services/import-service";

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run") || args.includes("-d");
  const folderArg = args.find((a) => a !== "--dry-run" && a !== "-d");

  const notesDir = folderArg
    ? path.resolve(process.cwd(), folderArg)
    : path.join(process.cwd(), "notes");

  console.log("===========================================================");
  console.log(" Rajasthan Exam Twister — Bulk HTML Notes Importer");
  console.log("===========================================================");
  if (isDryRun) {
    console.log("🔍 MODE: [DRY RUN] — No changes will be made to MongoDB.");
  } else {
    console.log("⚡ MODE: [LIVE EXECUTION] — Valid notes will be created as DRAFT.");
  }
  console.log(`📂 Folder: ${notesDir}`);
  console.log("===========================================================\n");

  console.log("Connecting to MongoDB for Notes Import...");
  await connectToDatabase();
  console.log("Connected successfully.");

  if (!fs.existsSync(notesDir)) {
    console.error("Notes directory not found at:", notesDir);
    process.exit(1);
  }

  const htmlFiles: UploadedHtmlFile[] = [];

  function collectHtmlFiles(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        collectHtmlFiles(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".html")) {
        const content = fs.readFileSync(fullPath, "utf-8");
        // Skip tiny redirect stubs
        if (content.includes('http-equiv="refresh"') && content.length < 600) {
          console.log(`Skipping redirect stub: ${entry.name}`);
          continue;
        }
        htmlFiles.push({
          name: entry.name,
          content,
        });
      }
    }
  }

  collectHtmlFiles(notesDir);
  console.log(`Found ${htmlFiles.length} legacy HTML note files to import (${isDryRun ? "DRY RUN" : "LIVE"}).`);

  if (htmlFiles.length === 0) {
    console.log("No valid HTML files to import.");
    process.exit(0);
  }

  console.log(isDryRun ? "Performing dry-run validation..." : "Processing batch import (creating Drafts)...");
  const summary = await ImportService.processBatch(htmlFiles, [], { dryRun: isDryRun });

  console.log("\n--- Import Summary ---");
  console.log(`Job ID: ${summary.jobId}`);
  console.log(`Total Files: ${summary.totalFiles}`);
  console.log(`Successfully Imported (Drafts): ${summary.successCount}`);
  console.log(`Duplicates: ${summary.duplicateCount}`);
  console.log(`Failed: ${summary.failedCount}`);

  if (summary.failedCount > 0) {
    console.log("\nFailed files:");
    summary.results
      .filter((r) => r.result === "FAILED")
      .forEach((r) => console.log(` - ${r.fileName}: ${r.reason}`));
  }
}

main()
  .then(() => {
    console.log("\nLocal notes import completed successfully.");
    process.exit(0);
  })
  .catch((e) => {
    console.error("Error during notes import:", e);
    process.exit(1);
  });
