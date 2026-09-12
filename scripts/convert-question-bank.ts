/**
 * scripts/convert-question-bank.ts
 *
 * Automated Adapter Converter for legacy/raw Question Bank JSON files.
 *
 * Converts varied raw question bank formats (top-level arrays, object options,
 * prefixed options, letter answer keys, bilingual Hindi-first text, JS-commented JSON)
 * into standard `QuizImportJSONSchema` compliant files ready for `scripts/import-local-quizzes.ts`.
 *
 * Safety Rules:
 *   - 100% NON-DESTRUCTIVE: Never touches MongoDB, never modifies source files.
 *   - Strict Answer Key Mapping: If correctOptionIndex cannot be resolved unambiguously,
 *     the specific question is EXCLUDED (not guessed) and logged.
 *   - Clean Output: Converted files are saved to `./quiz-json-inbox/` (or custom destination).
 *
 * Usage:
 *   npx tsx scripts/convert-question-bank.ts [source-folder] [destination-folder]
 *
 * Example:
 *   npx tsx scripts/convert-question-bank.ts ./question-bank ./quiz-json-inbox
 */

import fs from "fs";
import path from "path";
import { QuizImportJSONSchema, sanitizePlainText, QuizImportJSON, QuizImportQuestion } from "../server/validation/quiz";

export interface QuestionConversionIssue {
  questionIndex: number;
  questionId?: string;
  reason: string;
}

export interface FileConversionResult {
  sourceRelPath: string;
  sourceFullPath: string;
  destinationPath?: string;
  status: "CONVERTED" | "SKIPPED";
  quizTitle?: string;
  totalQuestionsInSource: number;
  convertedQuestionsCount: number;
  excludedQuestionsCount: number;
  neededCommentStripping: boolean;
  issues: QuestionConversionIssue[];
  skipReason?: string;
}

export interface BankConversionSummary {
  sourceFolder: string;
  destinationFolder: string;
  totalFilesScanned: number;
  convertedFilesCount: number;
  skippedFilesCount: number;
  totalQuestionsConverted: number;
  totalQuestionsExcluded: number;
  commentStrippedFilesCount: number;
  results: FileConversionResult[];
}

/**
 * Strips comments and JS wrappers from raw content
 */
export function stripCommentsAndJsWrappers(raw: string): string {
  let text = raw;

  // Strip single line comments: // ...
  text = text.replace(/^\s*\/\/.*$/gm, "");

  // Strip multi-line comments: /* ... */
  text = text.replace(/\/\*[\s\S]*?\*\//g, "");

  // Strip leading variable assignments like: const questions = [...];
  text = text.replace(/^\s*(?:const|let|var|module\.exports)\s*[a-zA-Z0-9_$]*\s*=\s*/, "");

  // Strip trailing exports / statements
  text = text.replace(/module\.exports\s*=\s*[a-zA-Z0-9_$]+;?/g, "");

  // Strip trailing semicolon
  text = text.trim().replace(/;$/, "");

  return text;
}

/**
 * Tolerant parser supporting standard JSON and JS object literal files
 */
export function parseJsonTolerant(rawContent: string): { data: any; hadCommentsOrJs: boolean } {
  try {
    const data = JSON.parse(rawContent);
    return { data, hadCommentsOrJs: false };
  } catch (initialErr) {
    // Attempt evaluation with Node module / variable sandbox
    try {
      const moduleObj = { exports: {} as any };
      const fn = new Function("module", "exports", `${rawContent};\nreturn module.exports && (Array.isArray(module.exports) || Object.keys(module.exports).length > 0) ? module.exports : (typeof questions !== 'undefined' ? questions : null);`);
      const evaluated = fn(moduleObj, moduleObj.exports);
      if (evaluated && (Array.isArray(evaluated) || typeof evaluated === "object")) {
        return { data: evaluated, hadCommentsOrJs: true };
      }
    } catch {
      // Fall through to regex cleanup
    }

    const cleaned = stripCommentsAndJsWrappers(rawContent);

    try {
      const data = JSON.parse(cleaned);
      return { data, hadCommentsOrJs: true };
    } catch {
      try {
        const fn = new Function(`"use strict"; return (${cleaned});`);
        const data = fn();
        return { data, hadCommentsOrJs: true };
      } catch (evalErr: any) {
        throw new Error(`Failed to parse file as JSON/JS: ${evalErr.message || initialErr}`);
      }
    }
  }
}

/**
 * Clean option string: remove HTML, strip prefixes like (a), A., 1., (iv)
 */
export function cleanOptionText(rawText: string): string {
  if (!rawText) return "";
  const sanitized = sanitizePlainText(rawText);
  // Strip leading option prefixes like "(a) ", "(A) ", "A. ", "1. ", "a) ", "(1) "
  return sanitized.replace(/^[\(\[]?([a-eA-E0-9]|[ivxIVX]+)[\)\]\.\:\-\s]+\s*/, "").trim();
}

/**
 * Extract question text prioritizing Hindi / Devanagari per project conventions
 */
export function extractQuestionText(rawQ: any): string {
  // 1. Direct Hindi fields
  if (rawQ.question_hindi && typeof rawQ.question_hindi === "string" && rawQ.question_hindi.trim()) {
    return sanitizePlainText(rawQ.question_hindi);
  }
  if (rawQ.question_hi && typeof rawQ.question_hi === "string" && rawQ.question_hi.trim()) {
    return sanitizePlainText(rawQ.question_hi);
  }
  if (rawQ.hindi && typeof rawQ.hindi === "string" && rawQ.hindi.trim()) {
    return sanitizePlainText(rawQ.hindi);
  }

  // 2. Generic question field (might be bilingual split by \n)
  if (rawQ.question && typeof rawQ.question === "string" && rawQ.question.trim()) {
    const lines = rawQ.question
      .split("\n")
      .map((l: string) => l.trim())
      .filter(Boolean);

    // Look for lines with Devanagari characters
    const hindiLines = lines.filter((l: string) => /[\u0900-\u097F]/.test(l));
    if (hindiLines.length > 0) {
      return sanitizePlainText(hindiLines.join(" "));
    }
    return sanitizePlainText(lines.join(" "));
  }

  // 3. English fields
  if (rawQ.question_english && typeof rawQ.question_english === "string" && rawQ.question_english.trim()) {
    return sanitizePlainText(rawQ.question_english);
  }
  if (rawQ.question_en && typeof rawQ.question_en === "string" && rawQ.question_en.trim()) {
    return sanitizePlainText(rawQ.question_en);
  }
  if (rawQ.questionText && typeof rawQ.questionText === "string" && rawQ.questionText.trim()) {
    return sanitizePlainText(rawQ.questionText);
  }

  return "";
}

/**
 * Resolve correctOptionIndex from varied answer key formats
 */
export function resolveCorrectOptionIndex(
  rawAns: unknown,
  cleanOptions: string[],
  rawOptionsList: any[]
): number | null {
  if (rawAns === undefined || rawAns === null) return null;

  // 1. Numeric check
  if (typeof rawAns === "number" && Number.isInteger(rawAns)) {
    if (rawAns >= 0 && rawAns < cleanOptions.length) return rawAns;
    // 1-based index (1, 2, 3, 4)
    if (rawAns >= 1 && rawAns <= cleanOptions.length) return rawAns - 1;
  }

  const ansStr = String(rawAns).trim();
  if (!ansStr) return null;

  // 2. Letter/number mapping: "A", "b", "(a)", "1", "D.", "(3)"
  const directMatch = ansStr.match(/^\(?([a-eA-E1-5])\)?[\.\:\s]*$/);
  if (directMatch) {
    const char = directMatch[1].toUpperCase();
    const map: Record<string, number> = {
      A: 0,
      "1": 0,
      B: 1,
      "2": 1,
      C: 2,
      "3": 2,
      D: 3,
      "4": 3,
      E: 4,
      "5": 4,
    };
    const idx = map[char];
    if (idx !== undefined) {
      return idx < cleanOptions.length ? idx : null;
    }
  }

  // 3. Prefixed string: "(b) Implementation", "B. Implementation"
  const prefixMatch = ansStr.match(/^[\(\[]?([a-eA-E1-5])[\)\]\.\:\-\s]+\s*(.*)$/);
  if (prefixMatch) {
    const char = prefixMatch[1].toUpperCase();
    const map: Record<string, number> = {
      A: 0,
      "1": 0,
      B: 1,
      "2": 1,
      C: 2,
      "3": 2,
      D: 3,
      "4": 3,
      E: 4,
      "5": 4,
    };
    const idx = map[char];
    if (idx !== undefined) {
      return idx < cleanOptions.length ? idx : null;
    }
  }

  // 4. Match against rawOptions object id (e.g. { id: "A", text: "..." })
  for (let i = 0; i < rawOptionsList.length; i++) {
    const rawOpt = rawOptionsList[i];
    if (typeof rawOpt === "object" && rawOpt !== null) {
      const optId = String(rawOpt.id || "").trim().toUpperCase();
      if (optId && optId === ansStr.toUpperCase()) {
        return i;
      }
    }
  }

  // 5. Match against clean option text
  const normAns = ansStr.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, "");
  if (normAns) {
    for (let i = 0; i < cleanOptions.length; i++) {
      const normOpt = cleanOptions[i].toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, "");
      if (normOpt && (normOpt === normAns || (normAns.length >= 4 && (normOpt.includes(normAns) || normAns.includes(normOpt))))) {
        return i;
      }
    }
  }

  return null;
}

/**
 * Derive clean quiz title from file and folder names
 */
export function deriveQuizTitle(relPath: string, rootData: any): string {
  // If root metadata has a specific source exam / database name
  if (rootData?.metadata?.source_exam && typeof rootData.metadata.source_exam === "string") {
    return sanitizePlainText(rootData.metadata.source_exam);
  }
  if (rootData?.source_chapter && typeof rootData.source_chapter === "string") {
    return sanitizePlainText(rootData.source_chapter);
  }

  const baseName = path.basename(relPath, ".json");
  const folderName = path.dirname(relPath).replace(/\\/g, "/");

  // Format baseName e.g. "dbms-architecture" -> "DBMS Architecture"
  const formatted = baseName
    .replace(/[-_]+/g, " ")
    .replace(/\b([a-z])/g, (_, char) => char.toUpperCase())
    .replace(/Dbms/g, "DBMS")
    .replace(/Rsmssb/g, "RSMSSB")
    .replace(/Rpsc/g, "RPSC")
    .replace(/Bci/g, "BCI")
    .replace(/Gk/g, "GK")
    .replace(/Ms Access/g, "MS Access")
    .replace(/Ms Powerpoint/g, "MS PowerPoint")
    .trim();

  if (folderName && folderName !== ".") {
    const folderFormatted = folderName.toUpperCase();
    if (!formatted.toUpperCase().includes(folderFormatted)) {
      return `${folderFormatted} - ${formatted}`;
    }
  }

  return formatted || "Rajasthan Exam Mock Quiz";
}

/**
 * Infer Subject and ExamTags based on folder and filename
 */
export function inferSubjectAndTags(relPath: string, rootData: any): { subject: string; examTags: string[] } {
  const norm = relPath.toLowerCase().replace(/\\/g, "/");

  if (norm.includes("dbms")) {
    return {
      subject: "DBMS",
      examTags: ["BCI", "Computer Science", "Information Assistant"],
    };
  }

  if (norm.includes("ms-office")) {
    return {
      subject: "MS Office",
      examTags: ["BCI", "Information Assistant", "CET", "Patwar"],
    };
  }

  if (norm.includes("papers")) {
    if (norm.includes("rpsc")) {
      return {
        subject: "General Knowledge",
        examTags: ["RPSC", "2nd Grade"],
      };
    }
    if (norm.includes("forest-guard")) {
      return {
        subject: "General Knowledge",
        examTags: ["RSSB", "Forest Guard"],
      };
    }
    return {
      subject: "Computer Science / GK",
      examTags: ["RSMSSB", "BCI", "Rajasthan Exams"],
    };
  }

  if (norm.includes("system-analysis")) {
    return {
      subject: "System Analysis & Design",
      examTags: ["BCI", "Computer Science"],
    };
  }

  return {
    subject: "General Studies",
    examTags: ["Rajasthan Exams"],
  };
}

/**
 * Convert a single raw question into standard QuizImportQuestion format
 */
export function convertSingleQuestion(
  rawQ: any,
  qIndex: number
): { question?: QuizImportQuestion; issue?: QuestionConversionIssue } {
  const questionId = rawQ.id ? String(rawQ.id) : `Q${qIndex + 1}`;

  // 1. Extract question text
  const questionText = extractQuestionText(rawQ);
  if (!questionText) {
    return {
      issue: {
        questionIndex: qIndex,
        questionId,
        reason: "Missing or empty question text (no Hindi or English question found)",
      },
    };
  }

  // 2. Extract options
  const rawOptionsList = rawQ.options || rawQ["options "] || rawQ.choices || rawQ.answers;
  if (!Array.isArray(rawOptionsList) || rawOptionsList.length < 2) {
    return {
      issue: {
        questionIndex: qIndex,
        questionId,
        reason: `Invalid options array (found ${Array.isArray(rawOptionsList) ? rawOptionsList.length : 0}, minimum 2 required)`,
      },
    };
  }

  if (rawOptionsList.length > 6) {
    return {
      issue: {
        questionIndex: qIndex,
        questionId,
        reason: `Too many options (found ${rawOptionsList.length}, maximum 6 allowed)`,
      },
    };
  }

  const cleanOptions: string[] = [];
  for (let i = 0; i < rawOptionsList.length; i++) {
    const rawOpt = rawOptionsList[i];
    let optStr = "";
    if (typeof rawOpt === "string") {
      optStr = cleanOptionText(rawOpt);
    } else if (typeof rawOpt === "object" && rawOpt !== null) {
      const txt = rawOpt.hi || rawOpt.text || rawOpt.en || rawOpt.title || "";
      optStr = cleanOptionText(String(txt));
    }
    if (!optStr) {
      optStr = `Option ${i + 1}`;
    }
    cleanOptions.push(optStr);
  }

  // 3. Resolve correctOptionIndex
  const rawAns = rawQ.correct_answer ?? rawQ.correctAnswer ?? rawQ.book_answer ?? rawQ.answer ?? rawQ.correct_option;
  const correctOptionIndex = resolveCorrectOptionIndex(rawAns, cleanOptions, rawOptionsList);

  if (correctOptionIndex === null || correctOptionIndex === undefined) {
    return {
      issue: {
        questionIndex: qIndex,
        questionId,
        reason: `Unresolved correct_answer key: '${rawAns}' could not be mapped to any of the ${cleanOptions.length} options`,
      },
    };
  }

  // 4. Explanation
  const rawExplanation =
    rawQ.explanation ||
    rawQ.technical_proof ||
    rawQ.one_line_fact ||
    rawQ.revision_fact ||
    rawQ.one_line_revision ||
    "";
  const cleanExplanation = rawExplanation ? sanitizePlainText(String(rawExplanation)) : "";

  return {
    question: {
      questionText,
      options: cleanOptions,
      correctOptionIndex,
      explanation: cleanExplanation,
      marks: typeof rawQ.marks === "number" && rawQ.marks > 0 ? rawQ.marks : 1,
      negativeMarks: typeof rawQ.negativeMarks === "number" && rawQ.negativeMarks >= 0 ? rawQ.negativeMarks : 0.33,
    },
  };
}

/**
 * Main function: Convert all question bank files in source directory
 */
export async function convertQuestionBankDirectory(
  sourceDir: string,
  destDir: string
): Promise<BankConversionSummary> {
  const resolvedSource = path.resolve(process.cwd(), sourceDir);
  const resolvedDest = path.resolve(process.cwd(), destDir);

  if (!fs.existsSync(resolvedSource)) {
    throw new Error(`Source directory does not exist: ${resolvedSource}`);
  }

  if (!fs.existsSync(resolvedDest)) {
    fs.mkdirSync(resolvedDest, { recursive: true });
  }

  // Collect all .json files recursively
  const jsonFiles: string[] = [];
  function scan(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "node_modules" && entry.name !== ".git" && entry.name !== "imported" && entry.name !== "duplicate") {
          scan(full);
        }
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".json")) {
        jsonFiles.push(full);
      }
    }
  }
  scan(resolvedSource);

  const summary: BankConversionSummary = {
    sourceFolder: resolvedSource,
    destinationFolder: resolvedDest,
    totalFilesScanned: jsonFiles.length,
    convertedFilesCount: 0,
    skippedFilesCount: 0,
    totalQuestionsConverted: 0,
    totalQuestionsExcluded: 0,
    commentStrippedFilesCount: 0,
    results: [],
  };

  for (const filePath of jsonFiles) {
    const relPath = path.relative(resolvedSource, filePath);

    let rawContent: string;
    try {
      rawContent = fs.readFileSync(filePath, "utf-8");
    } catch (readErr: any) {
      summary.skippedFilesCount++;
      summary.results.push({
        sourceRelPath: relPath,
        sourceFullPath: filePath,
        status: "SKIPPED",
        totalQuestionsInSource: 0,
        convertedQuestionsCount: 0,
        excludedQuestionsCount: 0,
        neededCommentStripping: false,
        issues: [],
        skipReason: `Failed to read file: ${readErr.message}`,
      });
      continue;
    }

    let parsedData: any;
    let hadCommentsOrJs = false;
    try {
      const parseRes = parseJsonTolerant(rawContent);
      parsedData = parseRes.data;
      hadCommentsOrJs = parseRes.hadCommentsOrJs;
      if (hadCommentsOrJs) {
        summary.commentStrippedFilesCount++;
      }
    } catch (parseErr: any) {
      summary.skippedFilesCount++;
      summary.results.push({
        sourceRelPath: relPath,
        sourceFullPath: filePath,
        status: "SKIPPED",
        totalQuestionsInSource: 0,
        convertedQuestionsCount: 0,
        excludedQuestionsCount: 0,
        neededCommentStripping: false,
        issues: [],
        skipReason: `JSON/JS Parse Failure: ${parseErr.message}`,
      });
      continue;
    }

    // Extract questions array
    let rawQuestions: any[] = [];
    if (Array.isArray(parsedData)) {
      rawQuestions = parsedData;
    } else if (parsedData && Array.isArray(parsedData.questions)) {
      rawQuestions = parsedData.questions;
    } else if (parsedData && Array.isArray(parsedData.items)) {
      rawQuestions = parsedData.items;
    }

    if (rawQuestions.length === 0) {
      summary.skippedFilesCount++;
      summary.results.push({
        sourceRelPath: relPath,
        sourceFullPath: filePath,
        status: "SKIPPED",
        totalQuestionsInSource: 0,
        convertedQuestionsCount: 0,
        excludedQuestionsCount: 0,
        neededCommentStripping: hadCommentsOrJs,
        issues: [],
        skipReason: "No question array found in file (metadata or syllabus file only)",
      });
      continue;
    }

    // Convert each question
    const convertedQuestions: QuizImportQuestion[] = [];
    const issues: QuestionConversionIssue[] = [];

    for (let i = 0; i < rawQuestions.length; i++) {
      const res = convertSingleQuestion(rawQuestions[i], i);
      if (res.question) {
        convertedQuestions.push(res.question);
      } else if (res.issue) {
        issues.push(res.issue);
      }
    }

    if (convertedQuestions.length === 0) {
      summary.skippedFilesCount++;
      summary.totalQuestionsExcluded += issues.length;
      summary.results.push({
        sourceRelPath: relPath,
        sourceFullPath: filePath,
        status: "SKIPPED",
        totalQuestionsInSource: rawQuestions.length,
        convertedQuestionsCount: 0,
        excludedQuestionsCount: issues.length,
        neededCommentStripping: hadCommentsOrJs,
        issues,
        skipReason: "All questions in file failed answer-key resolution or schema validation",
      });
      continue;
    }

    const title = deriveQuizTitle(relPath, parsedData);
    const { subject, examTags } = inferSubjectAndTags(relPath, parsedData);

    const safeSubfolder = path.dirname(relPath).replace(/[\\/]+/g, "__");
    const baseName = path.basename(relPath, ".json");

    // If questions exceed 300 (schema limit), chunk into Part 1, Part 2 (<=250 questions each)
    if (convertedQuestions.length > 300) {
      const CHUNK_SIZE = 250;
      const createdPartFiles: string[] = [];

      for (let offset = 0; offset < convertedQuestions.length; offset += CHUNK_SIZE) {
        const partIdx = Math.floor(offset / CHUNK_SIZE) + 1;
        const partQuestions = convertedQuestions.slice(offset, offset + CHUNK_SIZE);
        const partTitle = `${title} (Part ${partIdx})`;

        const partQuiz: QuizImportJSON = {
          quizTitle: partTitle,
          subject,
          examTags,
          difficulty: "medium",
          questions: partQuestions,
        };

        const validation = QuizImportJSONSchema.safeParse(partQuiz);
        if (!validation.success) continue;

        const outFileName =
          safeSubfolder && safeSubfolder !== "."
            ? `${safeSubfolder}__${baseName}-part-${partIdx}.json`
            : `${baseName}-part-${partIdx}.json`;
        const destFilePath = path.join(resolvedDest, outFileName);

        fs.writeFileSync(destFilePath, JSON.stringify(validation.data, null, 2), "utf-8");
        createdPartFiles.push(destFilePath);
      }

      summary.convertedFilesCount++;
      summary.totalQuestionsConverted += convertedQuestions.length;
      summary.totalQuestionsExcluded += issues.length;

      summary.results.push({
        sourceRelPath: relPath,
        sourceFullPath: filePath,
        destinationPath: createdPartFiles.join(", "),
        status: "CONVERTED",
        quizTitle: `${title} (Split into ${createdPartFiles.length} parts)`,
        totalQuestionsInSource: rawQuestions.length,
        convertedQuestionsCount: convertedQuestions.length,
        excludedQuestionsCount: issues.length,
        neededCommentStripping: hadCommentsOrJs,
        issues,
      });
      continue;
    }

    const convertedQuiz: QuizImportJSON = {
      quizTitle: title,
      subject,
      examTags,
      difficulty: "medium",
      questions: convertedQuestions,
    };

    // Validate with QuizImportJSONSchema
    const validation = QuizImportJSONSchema.safeParse(convertedQuiz);
    if (!validation.success) {
      const msg = validation.error.issues.map((iss) => `${iss.path.join(".")}: ${iss.message}`).join("; ");
      summary.skippedFilesCount++;
      summary.results.push({
        sourceRelPath: relPath,
        sourceFullPath: filePath,
        status: "SKIPPED",
        totalQuestionsInSource: rawQuestions.length,
        convertedQuestionsCount: 0,
        excludedQuestionsCount: rawQuestions.length,
        neededCommentStripping: hadCommentsOrJs,
        issues,
        skipReason: `QuizImportJSONSchema validation failed on converted document: ${msg}`,
      });
      continue;
    }

    // Format destination filename preserving subfolder name in prefix
    const outFileName = safeSubfolder && safeSubfolder !== "." ? `${safeSubfolder}__${baseName}.json` : `${baseName}.json`;
    const destFilePath = path.join(resolvedDest, outFileName);

    fs.writeFileSync(destFilePath, JSON.stringify(validation.data, null, 2), "utf-8");

    summary.convertedFilesCount++;
    summary.totalQuestionsConverted += convertedQuestions.length;
    summary.totalQuestionsExcluded += issues.length;

    summary.results.push({
      sourceRelPath: relPath,
      sourceFullPath: filePath,
      destinationPath: destFilePath,
      status: "CONVERTED",
      quizTitle: title,
      totalQuestionsInSource: rawQuestions.length,
      convertedQuestionsCount: convertedQuestions.length,
      excludedQuestionsCount: issues.length,
      neededCommentStripping: hadCommentsOrJs,
      issues,
    });
  }

  return summary;
}

/**
 * CLI Runner
 */
async function main() {
  const args = process.argv.slice(2);
  const sourceArg = args[0] || "./question-bank";
  const destArg = args[1] || "./quiz-json-inbox";

  console.log("==========================================================");
  console.log(" Rajasthan Exam Twister — Question Bank Adapter Converter ");
  console.log("==========================================================");
  console.log(`📂 Source:      ${path.resolve(process.cwd(), sourceArg)}`);
  console.log(`📁 Destination: ${path.resolve(process.cwd(), destArg)}`);
  console.log("🔒 Non-destructive: DB untouched, source files untouched.");
  console.log("==========================================================\n");

  const summary = await convertQuestionBankDirectory(sourceArg, destArg);

  console.log("==========================================================");
  console.log("                 CONVERSION AUDIT REPORT                  ");
  console.log("==========================================================");
  console.log(`Scanned ${summary.totalFilesScanned} files in ${sourceArg}\n`);

  for (const r of summary.results) {
    if (r.status === "CONVERTED") {
      const commentTag = r.neededCommentStripping ? " [⚠️ Comment/JS Stripped]" : "";
      const exclTag = r.excludedQuestionsCount > 0 ? ` (${r.excludedQuestionsCount} excluded)` : "";
      console.log(`✅ CONVERTED: [${r.sourceRelPath}] -> "${r.quizTitle}"`);
      console.log(`   Questions: ${r.convertedQuestionsCount} converted${exclTag}${commentTag}`);
      console.log(`   Output:    ${r.destinationPath}`);
      if (r.issues.length > 0) {
        console.log(`   Excluded Questions Details:`);
        r.issues.forEach((iss) => {
          console.log(`     - ${iss.questionId} (Index ${iss.questionIndex}): ${iss.reason}`);
        });
      }
      console.log("");
    } else {
      console.log(`❌ SKIPPED:   [${r.sourceRelPath}]`);
      console.log(`   Reason:    ${r.skipReason}`);
      if (r.issues.length > 0) {
        console.log(`   Issues (${r.issues.length}):`);
        r.issues.slice(0, 3).forEach((iss) => {
          console.log(`     - ${iss.questionId}: ${iss.reason}`);
        });
      }
      console.log("");
    }
  }

  console.log("==========================================================");
  console.log("                 GLOBAL CONVERSION SUMMARY                ");
  console.log("==========================================================");
  console.log(`✅ ${summary.convertedFilesCount} files converted → ${destArg}/ (total ${summary.totalQuestionsConverted} questions, ${summary.totalQuestionsExcluded} excluded)`);
  if (summary.commentStrippedFilesCount > 0) {
    console.log(`⚠️  ${summary.commentStrippedFilesCount} file(s) needed comment/JS stripping (flagged for manual glance)`);
  }
  if (summary.skippedFilesCount > 0) {
    console.log(`❌ ${summary.skippedFilesCount} file(s) skipped (metadata only, or no resolved answer keys)`);
  }
  console.log("==========================================================\n");
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/convert-question-bank.ts")) {
  main()
    .then(() => {
      console.log("Question bank conversion finished.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Fatal error during question bank conversion:", err);
      process.exit(1);
    });
}
