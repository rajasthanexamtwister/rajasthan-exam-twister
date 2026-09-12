/**
 * scripts/import-local-quizzes.ts
 *
 * Official CLI tool for batch-importing AI-generated Quiz JSON files from a local directory.
 *
 * How it works:
 *   1. Scans the specified folder recursively for .json files (ignoring 'imported/' subfolders).
 *   2. Validates each file against the canonical `QuizImportJSONSchema` (server/validation/quiz.ts).
 *   3. Checks for duplicates against MongoDB by slug/title.
 *   4. Calls `QuizService.importQuizJson()` to create Quiz + QuizQuestions in DRAFT status.
 *   5. On SUCCESS only: moves the file into `<folder>/imported/` (non-destructive move, never delete).
 *   6. On VALIDATION FAILURE or DUPLICATE: leaves the file in place and reports the reason.
 *   7. Prints a detailed audit summary at the end.
 *
 * Usage:
 *   npm run quizzes:import <folder-path>
 *   or: npx tsx scripts/import-local-quizzes.ts <folder-path>
 *
 * Example:
 *   npx tsx scripts/import-local-quizzes.ts ./quiz-json-inbox
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { connectToDatabase } from "../server/lib/mongodb";
import { QuizService } from "../server/services/quiz-service";
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
  reason?: string;
  destinationPath?: string;
}

export interface BatchQuizImportSummary {
  totalFiles: number;
  successCount: number;
  duplicateCount: number;
  failedCount: number;
  results: FileImportResult[];
}

/**
 * Core recursive file scanner (skips 'imported', '.git', 'node_modules')
 */
export function collectJsonFiles(dir: string, baseDir: string = dir): string[] {
  const jsonFiles: string[] = [];
  if (!fs.existsSync(dir)) return jsonFiles;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip imported archive folder and standard internal folders
      if (entry.name === "imported" || entry.name === "node_modules" || entry.name === ".git" || entry.name === ".next") {
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
 * Move file safely to <baseDir>/imported/<relativePath>
 */
export function moveFileToImported(sourceFilePath: string, baseDir: string): string {
  const relativePath = path.relative(baseDir, sourceFilePath);
  const targetDir = path.join(baseDir, "imported", path.dirname(relativePath));
  
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  let targetFilePath = path.join(targetDir, path.basename(sourceFilePath));

  // If a file with the same name already exists in imported/, append a timestamp
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
  options: { moveOnSuccess?: boolean } = { moveOnSuccess: true }
): Promise<BatchQuizImportSummary> {
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
    totalFiles: filePaths.length,
    successCount: 0,
    duplicateCount: 0,
    failedCount: 0,
    results: [],
  };

  if (filePaths.length === 0) {
    return summary;
  }

  for (const filePath of filePaths) {
    const fileName = path.basename(filePath);
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

    // 2. Duplicate check against existing Quiz in MongoDB
    try {
      const existingQuiz = await Quiz.findOne({
        $or: [
          { slug: candidateSlug },
          { title: { $regex: new RegExp(`^${cleanTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } },
        ],
      }).lean();

      if (existingQuiz) {
        summary.duplicateCount++;
        summary.results.push({
          filePath,
          fileName: relPath,
          status: "DUPLICATE",
          quizTitle: cleanTitle,
          slug: existingQuiz.slug,
          quizId: existingQuiz._id.toString(),
          reason: `Quiz with matching title/slug already exists (ID: ${existingQuiz._id}, Slug: ${existingQuiz.slug})`,
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

    // 3. Create Quiz + QuizQuestions using canonical QuizService
    try {
      const importResult = await QuizService.importQuizJson(validData);

      let destPath: string | undefined;
      if (options.moveOnSuccess !== false) {
        destPath = moveFileToImported(filePath, resolvedDir);
      }

      summary.successCount++;
      summary.results.push({
        filePath,
        fileName: relPath,
        status: "SUCCESS",
        quizId: importResult.quiz._id.toString(),
        quizTitle: importResult.quiz.title,
        slug: importResult.quiz.slug,
        questionCount: importResult.questionCount,
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

  return summary;
}

/**
 * CLI Runner
 */
async function main() {
  const targetArg = process.argv[2];

  if (!targetArg || targetArg === "--help" || targetArg === "-h") {
    console.log("==========================================================");
    console.log(" Rajasthan Exam Twister — Bulk Quiz JSON Importer");
    console.log("==========================================================");
    console.log("Usage:");
    console.log("  npx tsx scripts/import-local-quizzes.ts <folder-path>");
    console.log("  npm run quizzes:import -- <folder-path>");
    console.log("");
    console.log("Example:");
    console.log("  npx tsx scripts/import-local-quizzes.ts ./quiz-json-inbox");
    console.log("  npx tsx scripts/import-local-quizzes.ts ./question-bank");
    console.log("==========================================================");
    process.exit(targetArg ? 0 : 1);
  }

  const targetFolder = path.resolve(process.cwd(), targetArg);
  console.log(`\n📂 Target directory: ${targetFolder}`);

  console.log("🔌 Connecting to MongoDB...");
  await connectToDatabase();
  console.log("✅ Connected successfully to MongoDB.\n");

  console.log(`🔍 Scanning for .json quiz files in: ${targetFolder}`);
  const summary = await importQuizzesFromDirectory(targetFolder, { moveOnSuccess: true });

  console.log("\n==========================================================");
  console.log("                 IMPORT AUDIT SUMMARY                     ");
  console.log("==========================================================");
  console.log(`Total JSON Files Found:   ${summary.totalFiles}`);
  console.log(`Successfully Imported:    ${summary.successCount} (Created as DRAFT)`);
  console.log(`Duplicates Skipped:       ${summary.duplicateCount}`);
  console.log(`Failed / Invalid:         ${summary.failedCount}`);
  console.log("==========================================================\n");

  if (summary.successCount > 0) {
    console.log("✅ Successfully Imported Quizzes (moved to /imported):");
    summary.results
      .filter((r) => r.status === "SUCCESS")
      .forEach((r) => {
        console.log(`  • [${r.fileName}] -> "${r.quizTitle}" (${r.questionCount} questions)`);
        console.log(`    Slug: ${r.slug} | Quiz ID: ${r.quizId}`);
        if (r.destinationPath) {
          console.log(`    Moved to: ${r.destinationPath}`);
        }
      });
    console.log("");
  }

  if (summary.duplicateCount > 0) {
    console.log("⚠️  Duplicates Skipped (left in source folder):");
    summary.results
      .filter((r) => r.status === "DUPLICATE")
      .forEach((r) => {
        console.log(`  • [${r.fileName}] -> ${r.reason}`);
      });
    console.log("");
  }

  if (summary.failedCount > 0) {
    console.log("❌ Failed Files (left in source folder for review):");
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
