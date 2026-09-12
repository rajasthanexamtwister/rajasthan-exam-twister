/**
 * scripts/import-local-quizzes.ts
 *
 * Official CLI tool for batch-importing AI-generated Quiz JSON files from a local directory.
 *
 * How it works:
 *   1. Scans the specified folder recursively for .json files (ignoring 'imported/' and 'duplicate/' subfolders).
 *   2. Validates each file against the canonical `QuizImportJSONSchema` (server/validation/quiz.ts).
 *   3. Computes boundary content-fingerprint (SHA-256 of first 50 + last 50 question/option lines).
 *   4. Performs duplicate check against MongoDB (by contentFingerprint OR slug OR title).
 *   5. In LIVE mode: calls `QuizService.importQuizJson()` to create Quiz + QuizQuestions in DRAFT status.
 *   6. On SUCCESS (Live mode): moves the file into `<folder>/imported/` (non-destructive move, never delete).
 *   7. On DUPLICATE (Live mode): moves the file into `<folder>/duplicate/` (non-destructive move, never delete).
 *   8. On VALIDATION FAILURE: leaves the file in place in the source folder for manual review.
 *   9. In DRY RUN mode (--dry-run): validates & checks duplicates, prints full report, but makes NO DB writes and moves NO files.
 *
 * Usage:
 *   npx tsx scripts/import-local-quizzes.ts <folder-path> [--dry-run]
 *   npm run quizzes:import -- <folder-path> [--dry-run]
 *
 * Examples:
 *   npx tsx scripts/import-local-quizzes.ts ./quiz-json-inbox --dry-run
 *   npx tsx scripts/import-local-quizzes.ts ./quiz-json-inbox
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { connectToDatabase } from "../server/lib/mongodb";
import { QuizService, computeQuizContentFingerprint } from "../server/services/quiz-service";
import { QuizImportJSONSchema, sanitizePlainText } from "../server/validation/quiz";
import { Quiz } from "../server/models/Quiz";
import { slugify } from "../server/lib/slugify";

export interface FileImportResult {
  filePath: string;
  fileName: string;
  status: "SUCCESS" | "DUPLICATE" | "FAILED";
  quizId?: string;
  quizTitle?: string;
  slug?: string;
  questionCount?: number;
  contentFingerprint?: string;
  reason?: string;
  destinationPath?: string;
}

export interface BatchQuizImportSummary {
  dryRun: boolean;
  totalFiles: number;
  successCount: number;
  duplicateCount: number;
  failedCount: number;
  results: FileImportResult[];
}

/**
 * Core recursive file scanner (skips 'imported', 'duplicate', '.git', 'node_modules', '.next')
 */
export function collectJsonFiles(dir: string, baseDir: string = dir): string[] {
  const jsonFiles: string[] = [];
  if (!fs.existsSync(dir)) return jsonFiles;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip archive/internal folders
      if (
        entry.name === "imported" ||
        entry.name === "duplicate" ||
        entry.name === "node_modules" ||
        entry.name === ".git" ||
        entry.name === ".next"
      ) {
        continue;
      }
      jsonFiles.push(...collectJsonFiles(fullPath, baseDir));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".json")) {
      jsonFiles.push(fullPath);
    }
  }

  return jsonFiles;
}

/**
 * Move file safely to <baseDir>/<subFolder>/<relativePath>
 */
export function moveFileToFolder(
  sourceFilePath: string,
  baseDir: string,
  subFolder: "imported" | "duplicate"
): string {
  const relativePath = path.relative(baseDir, sourceFilePath);
  const targetDir = path.join(baseDir, subFolder, path.dirname(relativePath));

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  let targetFilePath = path.join(targetDir, path.basename(sourceFilePath));

  // If a file with the same name already exists in target folder, append a timestamp
  if (fs.existsSync(targetFilePath)) {
    const ext = path.extname(sourceFilePath);
    const baseName = path.basename(sourceFilePath, ext);
    targetFilePath = path.join(targetDir, `${baseName}-${Date.now()}${ext}`);
  }

  fs.renameSync(sourceFilePath, targetFilePath);
  return targetFilePath;
}

/**
 * Main import processor for a directory
 */
export async function importQuizzesFromDirectory(
  targetFolder: string,
  options: { dryRun?: boolean } = { dryRun: false }
): Promise<BatchQuizImportSummary> {
  const isDryRun = !!options.dryRun;
  const resolvedDir = path.resolve(process.cwd(), targetFolder);

  if (!fs.existsSync(resolvedDir)) {
    throw new Error(`Target directory does not exist: ${resolvedDir}`);
  }

  const stat = fs.statSync(resolvedDir);
  if (!stat.isDirectory()) {
    throw new Error(`Target path is not a directory: ${resolvedDir}`);
  }

  const filePaths = collectJsonFiles(resolvedDir, resolvedDir);

  const summary: BatchQuizImportSummary = {
    dryRun: isDryRun,
    totalFiles: filePaths.length,
    successCount: 0,
    duplicateCount: 0,
    failedCount: 0,
    results: [],
  };

  if (filePaths.length === 0) {
    return summary;
  }

  // Set of fingerprints and slugs seen in current batch (to catch duplicates within the same batch)
  const batchFingerprints = new Set<string>();
  const batchSlugs = new Set<string>();

  for (const filePath of filePaths) {
    const relPath = path.relative(resolvedDir, filePath);

    let rawContent: string;
    try {
      rawContent = fs.readFileSync(filePath, "utf-8");
    } catch (readErr: any) {
      summary.failedCount++;
      summary.results.push({
        filePath,
        fileName: relPath,
        status: "FAILED",
        reason: `Failed to read file: ${readErr.message}`,
      });
      continue;
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawContent);
    } catch (jsonErr: any) {
      summary.failedCount++;
      summary.results.push({
        filePath,
        fileName: relPath,
        status: "FAILED",
        reason: `Invalid JSON syntax: ${jsonErr.message}`,
      });
      continue;
    }

    // 1. Validate using canonical QuizImportJSONSchema
    const validation = QuizImportJSONSchema.safeParse(parsedJson);
    if (!validation.success) {
      const issueMessages = validation.error.issues
        .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
        .join("; ");

      summary.failedCount++;
      summary.results.push({
        filePath,
        fileName: relPath,
        status: "FAILED",
        reason: `Schema validation error: ${issueMessages}`,
      });
      continue;
    }

    const validData = validation.data;
    const cleanTitle = sanitizePlainText(validData.quizTitle);
    const candidateSlug = slugify(cleanTitle);
    const contentFingerprint = computeQuizContentFingerprint(validData.questions);

    // 2. Intra-batch duplicate check
    if (batchFingerprints.has(contentFingerprint) || batchSlugs.has(candidateSlug)) {
      summary.duplicateCount++;
      let destPath: string | undefined;
      if (!isDryRun) {
        destPath = moveFileToFolder(filePath, resolvedDir, "duplicate");
      }
      summary.results.push({
        filePath,
        fileName: relPath,
        status: "DUPLICATE",
        quizTitle: cleanTitle,
        slug: candidateSlug,
        contentFingerprint,
        destinationPath: destPath,
        reason: `Duplicate of another quiz in the same import batch (by ${
          batchFingerprints.has(contentFingerprint) ? "content fingerprint" : "slug"
        })`,
      });
      continue;
    }

    // 3. Database duplicate check (boundary fingerprint OR slug OR title)
    try {
      const existingQuiz = await Quiz.findOne({
        $or: [
          { contentFingerprint },
          { slug: candidateSlug },
          { title: { $regex: new RegExp(`^${cleanTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } },
        ],
      }).lean();

      if (existingQuiz) {
        summary.duplicateCount++;
        let destPath: string | undefined;
        if (!isDryRun) {
          destPath = moveFileToFolder(filePath, resolvedDir, "duplicate");
        }

        const isFingerprintMatch = existingQuiz.contentFingerprint === contentFingerprint;
        summary.results.push({
          filePath,
          fileName: relPath,
          status: "DUPLICATE",
          quizTitle: cleanTitle,
          slug: existingQuiz.slug,
          quizId: existingQuiz._id.toString(),
          contentFingerprint,
          destinationPath: destPath,
          reason: isFingerprintMatch
            ? `Duplicate content fingerprint match with existing Quiz "${existingQuiz.title}" (ID: ${existingQuiz._id})`
            : `Duplicate slug/title match with existing Quiz "${existingQuiz.title}" (ID: ${existingQuiz._id}, Slug: ${existingQuiz.slug})`,
        });
        continue;
      }
    } catch (dbCheckErr: any) {
      summary.failedCount++;
      summary.results.push({
        filePath,
        fileName: relPath,
        status: "FAILED",
        reason: `Database duplicate check error: ${dbCheckErr.message}`,
      });
      continue;
    }

    // Record in batch cache
    batchFingerprints.add(contentFingerprint);
    batchSlugs.add(candidateSlug);

    // 4. Import / Dry-run behavior
    if (isDryRun) {
      summary.successCount++;
      summary.results.push({
        filePath,
        fileName: relPath,
        status: "SUCCESS",
        quizTitle: cleanTitle,
        slug: candidateSlug,
        contentFingerprint,
        questionCount: validData.questions.length,
      });
    } else {
      try {
        const importResult = await QuizService.importQuizJson(validData);
        const destPath = moveFileToFolder(filePath, resolvedDir, "imported");

        summary.successCount++;
        summary.results.push({
          filePath,
          fileName: relPath,
          status: "SUCCESS",
          quizId: importResult.quiz._id.toString(),
          quizTitle: importResult.quiz.title,
          slug: importResult.quiz.slug,
          questionCount: importResult.questionCount,
          contentFingerprint,
          destinationPath: destPath,
        });
      } catch (importErr: any) {
        summary.failedCount++;
        summary.results.push({
          filePath,
          fileName: relPath,
          status: "FAILED",
          reason: `Quiz creation error: ${importErr.message}`,
        });
      }
    }
  }

  return summary;
}

/**
 * CLI Runner
 */
async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run") || args.includes("-d");
  const folderArgs = args.filter((a) => a !== "--dry-run" && a !== "-d" && a !== "--help" && a !== "-h");
  const targetArg = folderArgs[0];

  if (!targetArg || args.includes("--help") || args.includes("-h")) {
    console.log("==========================================================");
    console.log(" Rajasthan Exam Twister — Bulk Quiz JSON Importer");
    console.log("==========================================================");
    console.log("Usage:");
    console.log("  npx tsx scripts/import-local-quizzes.ts <folder-path> [--dry-run]");
    console.log("  npm run quizzes:import -- <folder-path> [--dry-run]");
    console.log("");
    console.log("Flags:");
    console.log("  --dry-run, -d   Run scan, validation & duplicate check without modifying DB or moving files");
    console.log("");
    console.log("Examples:");
    console.log("  npx tsx scripts/import-local-quizzes.ts ./quiz-json-inbox --dry-run");
    console.log("  npx tsx scripts/import-local-quizzes.ts ./quiz-json-inbox");
    console.log("==========================================================");
    process.exit(targetArg ? 0 : 1);
  }

  const targetFolder = path.resolve(process.cwd(), targetArg);

  console.log("==========================================================");
  console.log(" Rajasthan Exam Twister — Bulk Quiz JSON Importer");
  console.log("==========================================================");
  if (isDryRun) {
    console.log("🔍 MODE: [DRY RUN] — No changes will be made to MongoDB and no files will be moved.");
  } else {
    console.log("⚡ MODE: [LIVE EXECUTION] — Valid files will be imported as DRAFT and moved to /imported.");
    console.log("💡 TIP:  Run with --dry-run first if testing this folder for the first time.");
  }
  console.log(`📂 Folder: ${targetFolder}`);
  console.log("==========================================================\n");

  console.log("🔌 Connecting to MongoDB...");
  await connectToDatabase();
  console.log("✅ Connected successfully to MongoDB.\n");

  console.log(`🔍 Scanning for .json quiz files in: ${targetFolder}`);
  const summary = await importQuizzesFromDirectory(targetFolder, { dryRun: isDryRun });

  console.log("\n==========================================================");
  console.log(
    isDryRun
      ? "                 DRY RUN AUDIT SUMMARY (NO CHANGES)       "
      : "                 LIVE IMPORT AUDIT SUMMARY                "
  );
  console.log("==========================================================");
  console.log(`Total JSON Files Found:   ${summary.totalFiles}`);
  console.log(
    `Valid / Ready to Import:  ${summary.successCount} ${
      isDryRun ? "(Simulated DRAFTs - not written)" : "(Created as DRAFT)"
    }`
  );
  console.log(`Duplicates Detected:      ${summary.duplicateCount} ${isDryRun ? "" : "(Moved to /duplicate)"}`);
  console.log(`Failed / Invalid:         ${summary.failedCount} (Left in source folder)`);
  console.log("==========================================================\n");

  if (summary.successCount > 0) {
    console.log(
      isDryRun
        ? "✅ Valid Quizzes (Dry Run - would be imported & moved to /imported):"
        : "✅ Successfully Imported Quizzes (Moved to /imported):"
    );
    summary.results
      .filter((r) => r.status === "SUCCESS")
      .forEach((r) => {
        console.log(`  • [${r.fileName}] -> "${r.quizTitle}" (${r.questionCount} questions)`);
        console.log(`    Slug: ${r.slug} | Fingerprint: ${r.contentFingerprint?.substring(0, 16)}...`);
        if (r.quizId) console.log(`    Quiz ID: ${r.quizId}`);
        if (r.destinationPath) console.log(`    Moved to: ${r.destinationPath}`);
      });
    console.log("");
  }

  if (summary.duplicateCount > 0) {
    console.log(
      isDryRun
        ? "⚠️  Duplicates Detected (Dry Run - would be moved to /duplicate):"
        : "⚠️  Duplicates Handled (Moved to /duplicate):"
    );
    summary.results
      .filter((r) => r.status === "DUPLICATE")
      .forEach((r) => {
        console.log(`  • [${r.fileName}] -> ${r.reason}`);
        if (r.destinationPath) console.log(`    Moved to: ${r.destinationPath}`);
      });
    console.log("");
  }

  if (summary.failedCount > 0) {
    console.log("❌ Failed / Invalid Files (Left in source folder for review):");
    summary.results
      .filter((r) => r.status === "FAILED")
      .forEach((r) => {
        console.log(`  • [${r.fileName}] -> ${r.reason}`);
      });
    console.log("");
  }
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/import-local-quizzes.ts")) {
  main()
    .then(() => {
      console.log("Local quiz import process finished.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Fatal error during local quiz import:", err);
      process.exit(1);
    });
}
