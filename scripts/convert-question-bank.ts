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
 * Clean option string: remove HTML, strip option bullet prefixes (e.g. "(a) Internal", "A. Option")
 * Safely protects:
 * - Multi-statement combinations: "(1) and (2)", "(a), (b) and (c)", "(i) and (ii)"
 * - Assertion-Reason statements: "(A) is false but (R) is true", "(A) और (B) दोनों सही हैं"
 * - Quantities & file extensions: "1 Gbps", ".docx", "-3/5"
 */
export function cleanOptionText(rawText: string, optionId?: string): string {
  if (!rawText) return "";
  const sanitized = sanitizePlainText(rawText);
  let text = sanitized.trim();

  // 1. Guard against compound/multi-statement options:
  // e.g. "(1) and (2)", "(a), (b)", "(1) & (2)", "(A) और (B)", "(c) and (d) only"
  if (/^[\(\[]?[0-9a-eA-EivxIVX]+[\)\]]?\s*(?:,|\band\b|\bor\b|&|\+|\bतथा\b|\bऔर\b|\bव\b|\bएवं\b|\bदोनों\b|\bonly\b)/i.test(text)) {
    return text;
  }

  // 2. Guard against Assertion-Reason or relational expressions:
  // e.g. "(A) is true", "(A) is not correct", "(A) सत्य है", "(A) सही है", "(A) represents"
  if (/^[\(\[]?[0-9a-eA-EivxIVX]+[\)\]]?\s*(?:is\b|are\b|was\b|were\b|सत्य\b|असत्य\b|सही\b|गलत\b|represents?\b|means?\b|denotes?\b)/i.test(text)) {
    return text;
  }

  // 3. Guard against multiple parenthesized references in the same option:
  // e.g. "(A) ... (R)", "(1) ... (2)", "(a) ... (b)"
  if (/^[\(\[][0-9a-eA-EivxIVX]+[\)\]].*[\(\[][0-9a-eA-EivxIVXRr]+[\)\]]/.test(text)) {
    return text;
  }

  // 4. If optionId is provided (e.g. "A", "B", "1"), strip bullet only if text starts with that explicit bullet label
  if (optionId !== undefined && optionId !== null && String(optionId).trim()) {
    const escapedId = String(optionId).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const idRegex = new RegExp(`^(?:${escapedId}[\\.\\:\\-\\)]|\\(${escapedId}\\))\\s+`, "i");
    if (idRegex.test(text)) {
      const candidate = text.replace(idRegex, "").trim();
      if (candidate && candidate.length > 0) {
        return candidate;
      }
    }
    return text;
  }

  // 5. If no optionId (e.g. raw string in array), strip standard option bullets like "A. ", "B) ", "(A) ", "(a) "
  const prefixMatch = text.match(/^(?:[A-Ea-e1-5][\.\:\-\)]|\([A-Ea-e1-5]\))\s+(.*)$/);
  if (prefixMatch) {
    const rest = prefixMatch[1].trim();
    if (rest.length > 0) {
      return rest;
    }
  }

  return text;
}

/**
 * Extract question text and optional English question text
 */
export function extractBilingualQuestionText(rawQ: any): { questionText: string; questionTextEn?: string } {
  let questionText = "";
  let questionTextEn: string | undefined = undefined;

  // 1. Check direct Hindi fields
  const rawHindi = rawQ.question_hindi || rawQ.question_hi || rawQ.hindi;
  if (rawHindi && typeof rawHindi === "string" && rawHindi.trim()) {
    questionText = sanitizePlainText(rawHindi);
  }

  // 2. Check direct English fields
  const rawEnglish = rawQ.question_english || rawQ.question_en || rawQ.english || rawQ.en;
  let candidateEn = "";
  if (rawEnglish && typeof rawEnglish === "string" && rawEnglish.trim()) {
    candidateEn = sanitizePlainText(rawEnglish);
  }

  // 3. If primary Hindi was not found in specific field, check generic question field
  if (!questionText && rawQ.question && typeof rawQ.question === "string" && rawQ.question.trim()) {
    const lines = rawQ.question
      .split("\n")
      .map((l: string) => l.trim())
      .filter(Boolean);

    const hindiLines = lines.filter((l: string) => /[\u0900-\u097F]/.test(l));
    const latinLines = lines.filter((l: string) => /[a-zA-Z]/.test(l) && !/[\u0900-\u097F]/.test(l));

    if (hindiLines.length > 0) {
      questionText = sanitizePlainText(hindiLines.join(" "));
    } else {
      questionText = sanitizePlainText(lines.join(" "));
    }

    if (!candidateEn && latinLines.length > 0) {
      candidateEn = sanitizePlainText(latinLines.join(" "));
    }
  }

  // 4. Fallback to English/generic if questionText is still empty
  if (!questionText) {
    if (candidateEn) {
      questionText = candidateEn;
    } else if (rawQ.questionText && typeof rawQ.questionText === "string" && rawQ.questionText.trim()) {
      questionText = sanitizePlainText(rawQ.questionText);
    }
  }

  // 5. Populate questionTextEn only if it differs from questionText
  if (candidateEn && candidateEn.toLowerCase() !== questionText.toLowerCase()) {
    questionTextEn = candidateEn;
  }

  return { questionText, questionTextEn };
}

/**
 * Extract question text prioritizing Hindi / Devanagari per project conventions
 */
export function extractQuestionText(rawQ: any): string {
  return extractBilingualQuestionText(rawQ).questionText;
}

/**
 * Extract options and optional English options
 */
export function extractBilingualOptions(rawOptionsList: any[]): { options: string[]; optionsEn?: string[] } {
  const fallbackOptions: string[] = [];
  const cleanHindiOptions: string[] = [];
  const candidateOptionsEn: (string | null)[] = [];

  for (let i = 0; i < rawOptionsList.length; i++) {
    const rawOpt = rawOptionsList[i];
    const optId = typeof rawOpt === "object" && rawOpt !== null ? (rawOpt.id !== undefined && rawOpt.id !== null ? String(rawOpt.id) : undefined) : undefined;

    let rawOptStr = "";
    if (typeof rawOpt === "object" && rawOpt !== null) {
      const hiField = rawOpt.hi || rawOpt.hindi || rawOpt.text_hi;
      const enField = rawOpt.en || rawOpt.english || rawOpt.text_en || rawOpt.title_en;

      if (hiField || enField) {
        const cleanHi = cleanOptionText(String(hiField || ""), optId);
        const cleanEn = enField ? sanitizePlainText(String(enField)) : "";

        fallbackOptions.push(cleanHi || cleanOptionText(String(enField), optId) || `Option ${i + 1}`);
        cleanHindiOptions.push(cleanHi || `Option ${i + 1}`);
        if (cleanEn && cleanEn.toLowerCase() !== cleanHi.toLowerCase()) {
          candidateOptionsEn.push(cleanEn);
        } else {
          candidateOptionsEn.push(null);
        }
        continue;
      }

      rawOptStr = String(rawOpt.text || rawOpt.title || "");
    } else if (typeof rawOpt === "string") {
      rawOptStr = rawOpt;
    }

    if (rawOptStr) {
      const rawCleaned = cleanOptionText(rawOptStr, optId);
      fallbackOptions.push(rawCleaned || `Option ${i + 1}`);

      // Check slash-separated bilingual string (on last slash)
      const lastSlash = rawOptStr.lastIndexOf("/");
      if (lastSlash > 0 && lastSlash < rawOptStr.length - 1) {
        const part1 = rawOptStr.slice(0, lastSlash).trim();
        const part2 = rawOptStr.slice(lastSlash + 1).trim();

        const isDevanagari = (s: string) => /[\u0900-\u097F]/.test(s);
        const isLatin = (s: string) => /[a-zA-Z]/.test(s) && !/[\u0900-\u097F]/.test(s);

        if (isDevanagari(part1) && isLatin(part2)) {
          const cleanHi = cleanOptionText(part1, optId);
          const cleanEn = sanitizePlainText(part2);
          if (cleanHi && cleanEn) {
            cleanHindiOptions.push(cleanHi);
            candidateOptionsEn.push(cleanEn);
            continue;
          }
        } else if (isLatin(part1) && isDevanagari(part2)) {
          const cleanHi = cleanOptionText(part2, optId);
          const cleanEn = sanitizePlainText(part1);
          if (cleanHi && cleanEn) {
            cleanHindiOptions.push(cleanHi);
            candidateOptionsEn.push(cleanEn);
            continue;
          }
        }
      }

      cleanHindiOptions.push(rawCleaned || `Option ${i + 1}`);
      candidateOptionsEn.push(null);
    } else {
      fallbackOptions.push(`Option ${i + 1}`);
      cleanHindiOptions.push(`Option ${i + 1}`);
      candidateOptionsEn.push(null);
    }
  }

  // If EVERY option in the question has a valid English string, return split options & optionsEn
  if (
    candidateOptionsEn.length === cleanHindiOptions.length &&
    candidateOptionsEn.every((o) => typeof o === "string" && o.length > 0)
  ) {
    return {
      options: cleanHindiOptions,
      optionsEn: candidateOptionsEn as string[],
    };
  }

  // Otherwise, conservative fallback: leave options as fallbackOptions and optionsEn as undefined
  return {
    options: fallbackOptions,
    optionsEn: undefined,
  };
}

/**
 * Resolve correctOptionIndex from varied answer key formats
 */
export function resolveCorrectOptionIndex(
  rawAns: unknown,
  cleanOptions: string[],
  rawOptionsList: any[] = []
): number | null {
  if (rawAns === undefined || rawAns === null) return null;

  const ansStr = String(rawAns).trim();
  if (!ansStr) return null;

  // 1. Match against rawOptions object id (e.g. { id: "A", text: "..." } or { id: 1, text: "..." })
  if (Array.isArray(rawOptionsList)) {
    for (let i = 0; i < rawOptionsList.length; i++) {
      const rawOpt = rawOptionsList[i];
      if (typeof rawOpt === "object" && rawOpt !== null) {
        const optId = String(rawOpt.id ?? "").trim().toUpperCase();
        if (optId && (optId === ansStr.toUpperCase() || optId === String(rawAns).toUpperCase())) {
          return i;
        }
      }
    }
  }

  // 2. Direct letter/number and prefixed mapping: "A", "b", "(a)", "1", "4", "D.", "(3)", "Option 4", "विकल्प 4", "Ans: D"
  const directMatch = ansStr.match(/^(?:option|विकल्प|उत्तर|ans(?:wer)?|q)?[\s:.\-–—]*[\(\[]?([a-eA-E1-5अ-दक-घ])[\)\]]?[\.\:\s]*$/i);
  if (directMatch) {
    const char = directMatch[1].toUpperCase();
    const map: Record<string, number> = {
      A: 0,
      "1": 0,
      "अ": 0,
      "क": 0,
      B: 1,
      "2": 1,
      "ब": 1,
      "ख": 1,
      C: 2,
      "3": 2,
      "स": 2,
      "ग": 2,
      D: 3,
      "4": 3,
      "द": 3,
      "घ": 3,
      E: 4,
      "5": 4,
    };
    const idx = map[char];
    if (idx !== undefined && idx < cleanOptions.length) {
      return idx;
    }
  }

  // 3. Prefixed string: "(b) Implementation", "B. Implementation", "Option 4 - Fourth Option"
  const prefixMatch = ansStr.match(/^(?:option|विकल्प|उत्तर|ans(?:wer)?)?[\s:.\-–—]*[\(\[]?([a-eA-E1-5अ-दक-घ])[\)\]\.\:\-\s]+\s*(.*)$/i);
  if (prefixMatch) {
    const char = prefixMatch[1].toUpperCase();
    const map: Record<string, number> = {
      A: 0,
      "1": 0,
      "अ": 0,
      "क": 0,
      B: 1,
      "2": 1,
      "ब": 1,
      "ख": 1,
      C: 2,
      "3": 2,
      "स": 2,
      "ग": 2,
      D: 3,
      "4": 3,
      "द": 3,
      "घ": 3,
      E: 4,
      "5": 4,
    };
    const idx = map[char];
    if (idx !== undefined && idx < cleanOptions.length) {
      return idx;
    }
  }

  // 4. Numeric check
  if (typeof rawAns === "number" && Number.isInteger(rawAns)) {
    // 0-based: 0 is always index 0
    if (rawAns === 0 && cleanOptions.length > 0) return 0;
    // 1-based index (1, 2, 3, 4) -> map 1 to 0, 4 to 3
    if (rawAns >= 1 && rawAns <= cleanOptions.length) return rawAns - 1;
    return null;
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
  const { questionText, questionTextEn } = extractBilingualQuestionText(rawQ);
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

  const { options: cleanOptions, optionsEn } = extractBilingualOptions(rawOptionsList);

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
      ...(questionTextEn ? { questionTextEn } : {}),
      options: cleanOptions,
      ...(optionsEn ? { optionsEn } : {}),
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
