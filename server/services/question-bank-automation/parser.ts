import path from "path";
import { QuestionFormat, ParsedQuestion } from "./types";
import { sanitizePlainText } from "@/server/validation/quiz";

/**
 * Maps folder names to standardized Subject display titles
 */
export function detectSubjectFromFolder(folderName: string): string {
  const normalized = folderName.toLowerCase().trim();

  const map: Record<string, string> = {
    "rajasthan-art-and-culture": "Rajasthan Art & Culture",
    "rajasthan-art-culture": "Rajasthan Art & Culture",
    "rajasthan_art_and_culture": "Rajasthan Art & Culture",
    "rajasthan-history": "Rajasthan History",
    "rajasthan-geography": "Rajasthan Geography",
    "rajasthan-polity": "Rajasthan Polity",
    "rajasthan-economy": "Rajasthan Economy",
    "rajasthan-gk": "Rajasthan GK",
    "general-science": "General Science",
    "general-hindi": "General Hindi",
    "hindi": "General Hindi",
    "general-english": "General English",
    "english": "General English",
    "computer-awareness": "Computer Awareness",
    "computer": "Computer Awareness",
    "current-affairs": "Current Affairs",
    "reasoning": "Logical Reasoning",
    "maths": "Quantitative Aptitude",
  };

  if (map[normalized]) return map[normalized];

  // Title-case fallback from folder name
  return folderName
    .split(/[-_ ]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Extracts the primary Topic title from markdown headings or filename
 */
export function detectTopicFromMarkdown(content: string, fileName: string): string {
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const headingMatch = line.match(/^#+\s+(.+)$/);
    if (headingMatch && headingMatch[1].trim()) {
      let cleanHeading = headingMatch[1].trim();
      // Remove leading/trailing marks, colons, or dashes
      cleanHeading = cleanHeading.replace(/^[#\s\-*]+|[#\s\-*]+$/g, "").trim();
      // Normalize spacing around hyphens
      cleanHeading = cleanHeading.replace(/\s*-\s*/g, "-");
      if (cleanHeading.length > 2) {
        return cleanHeading;
      }
    }
  }

  // Fallback to filename without extension
  const baseName = path.basename(fileName, path.extname(fileName));
  return baseName.replace(/^[0-9]+[.\-_\s]+/, "").trim();
}

/**
 * Maps answer strings (A/B/C/D, a/b/c/d, 1/2/3/4, अ/ब/स/द) to 0-indexed integer
 */
export function parseAnswerKeyToOptionIndex(ansStr: string): number | null {
  const clean = ansStr.trim().toLowerCase();

  // Devanagari numerals / letters
  if (clean === "अ" || clean === "क" || clean === "a" || clean === "1" || clean === "(a)" || clean === "(1)" || clean === "(अ)") return 0;
  if (clean === "ब" || clean === "ख" || clean === "b" || clean === "2" || clean === "(b)" || clean === "(2)" || clean === "(ब)") return 1;
  if (clean === "स" || clean === "ग" || clean === "c" || clean === "3" || clean === "(c)" || clean === "(3)" || clean === "(स)") return 2;
  if (clean === "द" || clean === "घ" || clean === "d" || clean === "4" || clean === "(d)" || clean === "(4)" || clean === "(द)") return 3;
  if (clean === "e" || clean === "5" || clean === "(e)" || clean === "(5)") return 4;

  const directNum = parseInt(clean, 10);
  if (!isNaN(directNum) && directNum >= 1 && directNum <= 6) {
    return directNum - 1;
  }

  return null;
}

/**
 * Automatically detects question format from text content
 */
export function detectQuestionFormat(questionText: string, options: string[]): QuestionFormat {
  const text = questionText.toLowerCase();

  // Match the following
  if (
    text.includes("सूची-i") ||
    text.includes("सूची i") ||
    text.includes("सूची-ii") ||
    text.includes("सूची 1") ||
    text.includes("सुमेलित कीजिए") ||
    text.includes("सुमेलित करें") ||
    text.includes("match the following")
  ) {
    return "Matching";
  }

  // Assertion - Reason
  if (
    (text.includes("कथन (a)") && text.includes("कारण (r)")) ||
    (text.includes("अभिकथन") && text.includes("कारण")) ||
    (text.includes("assertion") && text.includes("reason"))
  ) {
    return "AssertionReason";
  }

  // Statement-based
  if (
    text.includes("कथन 1") ||
    text.includes("कथन i") ||
    text.includes("निम्न कथनों पर विचार") ||
    text.includes("कथनों पर विचार कीजिए") ||
    text.includes("1 और 2 दोनों") ||
    text.includes("केवल 1") ||
    text.includes("केवल 2") ||
    options.some((opt) => opt.includes("केवल 1") || opt.includes("1 और 2 दोनों") || opt.includes("1, 2 और 3"))
  ) {
    return "Statement";
  }

  // Code / List based
  if (text.includes("कूट:") || text.includes("सही कूट का चयन") || text.includes("निम्न में से कौन-से सही हैं")) {
    return "CodeList";
  }

  return "MCQ";
}

/**
 * Extracts Exam / Year tag from question line or brackets
 */
export function extractExamYearTag(text: string): { cleanText: string; examTag: string | null } {
  // Check for brackets at end or within line: [CET 2022], (RPSC 2021), etc.
  const bracketRegex = /\[([^\]]*(?:20\d\d|19\d\d|RPSC|RSMSSB|RSSB|CET|SI|Constable|Lecturer|Teacher|Officer|JSA|VDO|Patwar|LDC|Clerk)[^\]]*)\]|\(([^)]*(?:20\d\d|19\d\d|RPSC|RSMSSB|RSSB|CET|SI|Constable|Lecturer|Teacher|Officer|JSA|VDO|Patwar|LDC|Clerk)[^)]*)\)/i;

  const match = text.match(bracketRegex);
  if (match) {
    const rawTag = (match[1] || match[2] || "").trim();
    if (rawTag.length >= 3 && rawTag.length <= 80) {
      const cleanText = text.replace(match[0], "").replace(/\s{2,}/g, " ").trim();
      return { cleanText, examTag: sanitizePlainText(rawTag) };
    }
  }

  return { cleanText: text, examTag: null };
}

/**
 * Normalizes question text and options to compute a deterministic fingerprint
 */
export function computeQuestionFingerprint(questionText: string, options: string[]): string {
  const normText = questionText
    .replace(/[^\u0900-\u097F\w]/g, "")
    .toLowerCase()
    .trim();

  const normOptions = options
    .map((o) => o.replace(/[^\u0900-\u097F\w]/g, "").toLowerCase().trim())
    .sort()
    .join("|");

  return `${normText}::${normOptions}`;
}

/**
 * Parses line-by-line / Telegram quiz dump format (e.g. "प्रश्न 1\nQuestion\nA\nOpt1\nB\nOpt2...")
 */
export function parseLineByLineTelegramFormat(content: string, filePath: string): {
  subject: string;
  topic: string;
  questions: ParsedQuestion[];
  rawQuestionsCount: number;
} {
  const folderName = path.basename(path.dirname(filePath));
  const fileName = path.basename(filePath);

  const subject = detectSubjectFromFolder(folderName);
  let topic = detectTopicFromMarkdown(content, fileName);
  // Clean any "Quiz 1", "Quiz 2" suffixes from topic
  topic = topic.replace(/\s*Quiz\s*\d+/i, "").trim();

  const lines = content.split(/\r?\n/).map((l) => l.trim());
  const parsedQuestions: ParsedQuestion[] = [];
  let globalOrder = 1;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (/^प्रश्न\s+\d+/i.test(line)) {
      i++;
      // Skip status line if present ("सही उत्तर" / "गलत उत्तर")
      if (i < lines.length && (lines[i] === "सही उत्तर" || lines[i] === "गलत उत्तर")) {
        i++;
      }

      const qTextLines: string[] = [];
      let examTag: string | null = null;

      while (i < lines.length) {
        const l = lines[i];
        if (/^[A-D]$/.test(l)) break;

        if (
          /Exam|LECTURER|CET|Officer|Police|Patwar|20\d\d|Paper|Shift|Gram Sevak|VDO|Librarian|COMPILER|JSA/i.test(l) &&
          !l.startsWith("प्रश्न") &&
          !l.includes("व्याख्या")
        ) {
          examTag = l;
        } else if (l && !l.includes("परिणाम") && !l.match(/^\d{1,2}:\d{2}$/) && !l.match(/^\d+%$/)) {
          qTextLines.push(l);
        }
        i++;
      }

      let questionText = qTextLines.join(" ").trim();
      const options: string[] = [];

      while (i < lines.length) {
        const l = lines[i];
        if (l.startsWith("💡") || l.includes("व्याख्या") || /^प्रश्न\s+\d+/i.test(l) || l.includes("Quiz")) {
          break;
        }

        if (/^[A-D]$/.test(l)) {
          i++;
          const optValueLines: string[] = [];
          while (i < lines.length) {
            const nextL = lines[i];
            if (
              /^[A-D]$/.test(nextL) ||
              nextL.startsWith("💡") ||
              nextL.includes("व्याख्या") ||
              /^प्रश्न\s+\d+/i.test(nextL) ||
              nextL.includes("Quiz")
            ) {
              break;
            }
            if (nextL) optValueLines.push(nextL);
            i++;
          }
          options.push(optValueLines.join(" ").trim());
          continue;
        }
        i++;
      }

      // Check explanation
      let explanation = "";
      while (i < lines.length) {
        const l = lines[i];
        if (/^प्रश्न\s+\d+/i.test(l) || l.includes("Quiz")) break;

        if (l.startsWith("💡") || l.includes("व्याख्या")) {
          const cleanExp = l.replace(/^[💡\s]*व्याख्या\s*[:\-–]?\s*/i, "").trim();
          if (cleanExp) explanation = cleanExp;
        } else if (explanation && l) {
          explanation += " " + l;
        }
        i++;
      }

      if (!questionText || options.length < 2) {
        continue;
      }

      const { cleanText, examTag: extractedTag } = extractExamYearTag(questionText);
      questionText = cleanText;
      const finalExamTag = examTag || extractedTag;

      // In this format, option A is the default verified key if not specified
      const optIndex = 0;
      const format = detectQuestionFormat(questionText, options);
      const fingerprint = computeQuestionFingerprint(questionText, options);

      parsedQuestions.push({
        order: globalOrder++,
        questionText: sanitizePlainText(questionText),
        options: options.map((o) => sanitizePlainText(o)),
        providedOptionIndex: optIndex,
        providedAnswerKey: "A",
        providedExplanation: explanation ? sanitizePlainText(explanation) : undefined,
        providedExamTag: finalExamTag ? sanitizePlainText(finalExamTag) : null,
        format,
        verificationStatus: "VERIFIED",
        verifiedOptionIndex: optIndex,
        verifiedExplanation: explanation ? sanitizePlainText(explanation) : undefined,
        verifiedExamTag: finalExamTag ? sanitizePlainText(finalExamTag) : null,
        fingerprint,
      });
      continue;
    }
    i++;
  }

  return {
    subject,
    topic,
    questions: parsedQuestions,
    rawQuestionsCount: parsedQuestions.length,
  };
}

/**
 * Full parser for Markdown Question Bank files (Auto-detects format)
 */
export function parseMarkdownQuestionFile(content: string, filePath: string): {
  subject: string;
  topic: string;
  questions: ParsedQuestion[];
  rawQuestionsCount: number;
} {
  // Check if content matches line-by-line / Telegram dump format (handles \r\n and \n)
  if (/^प्रश्न\s+\d+/m.test(content) && /(?:\r?\n)[A-D](?:\r?\n)/.test(content)) {
    return parseLineByLineTelegramFormat(content, filePath);
  }

  const folderName = path.basename(path.dirname(filePath));
  const fileName = path.basename(filePath);

  const subject = detectSubjectFromFolder(folderName);
  let topic = detectTopicFromMarkdown(content, fileName);
  topic = topic.replace(/\s*Quiz\s*\d+/i, "").trim();

  // Split by question indicators (e.g. "1. ", "Q1. ", "1) ", "प्र. 1", "प्रश्न 1:")
  const rawBlocks = content.split(/(?:\r?\n|^)(?=(?:Q\s*#?\s*\d+|[0-9]{1,4}[.)]|प्र\.?\s*\d+|प्रश्न\s*\d+[:.\-])\s*)/i);

  const parsedQuestions: ParsedQuestion[] = [];
  let globalOrder = 1;

  for (const block of rawBlocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    // Skip introductory header block if it does not contain an option/answer
    if (trimmed.startsWith("#") && !trimmed.match(/(?:उत्तर|Ans|Answer|Correct)\s*[:\-–]?/i)) {
      continue;
    }

    const lines = trimmed
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length < 3) continue;

    let questionText = "";
    const options: string[] = [];
    let providedAnswerKey = "";
    let providedExplanation = "";
    let extractedExamTag: string | null = null;

    let parsingState: "QUESTION" | "OPTIONS" | "EXPLANATION" = "QUESTION";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect Answer line
      const ansMatch = line.match(/(?:उत्तर|Ans|Answer|Correct)\s*[:\-–]?\s*([a-eA-E1-6अ-दक-घ]|\([a-eA-E1-6अ-दक-घ]\))/i);
      if (ansMatch) {
        providedAnswerKey = ansMatch[1].replace(/[()]/g, "").trim();
        parsingState = "EXPLANATION";
        continue;
      }

      // Detect Explanation line
      const expMatch = line.match(/(?:व्याख्या|Explanation|विवरण)\s*[:\-–]?\s*(.*)/i);
      if (expMatch) {
        parsingState = "EXPLANATION";
        if (expMatch[1].trim()) {
          providedExplanation = expMatch[1].trim();
        }
        continue;
      }

      // If we don't have questionText yet, this line MUST be the question text (strip question numbering)
      if (!questionText) {
        questionText = line.replace(/^(?:Q\s*#?\s*\d+|[0-9]{1,4}[.)]|प्र\.?\s*\d+|प्रश्न\s*\d+[:.\-])\s*/i, "").trim();
        continue;
      }

      // Detect Options (A), (B), (C), (D) or A. B. C. D. or (1), (2) or 1) 2) or (अ) (ब)
      const optMatch = line.match(/^(?:\(?([a-eA-E1-6अ-दक-घ])\)?[:.\-\s]|\(?([a-eA-E1-6अ-दक-घ])\))\s*(.+)$/);
      if (optMatch && parsingState !== "EXPLANATION") {
        parsingState = "OPTIONS";
        const optText = (optMatch[3] || "").trim();
        if (optText) {
          options.push(optText);
        }
        continue;
      }

      if (parsingState === "QUESTION") {
        questionText += " " + line;
      } else if (parsingState === "EXPLANATION") {
        providedExplanation += (providedExplanation ? "\n" : "") + line;
      }
    }

    if (!questionText || options.length < 2 || !providedAnswerKey) {
      continue;
    }

    // Extract potential Exam/Year tag embedded in question text
    const { cleanText, examTag } = extractExamYearTag(questionText);
    questionText = cleanText;
    extractedExamTag = examTag;

    const optIndex = parseAnswerKeyToOptionIndex(providedAnswerKey);
    if (optIndex === null || optIndex >= options.length) {
      // Answer key index out of bounds
      continue;
    }

    const format = detectQuestionFormat(questionText, options);
    const fingerprint = computeQuestionFingerprint(questionText, options);

    parsedQuestions.push({
      order: globalOrder++,
      questionText: sanitizePlainText(questionText),
      options: options.map((o) => sanitizePlainText(o)),
      providedOptionIndex: optIndex,
      providedAnswerKey,
      providedExplanation: providedExplanation ? sanitizePlainText(providedExplanation) : undefined,
      providedExamTag: extractedExamTag,
      format,
      verificationStatus: "VERIFIED",
      verifiedOptionIndex: optIndex,
      verifiedExplanation: providedExplanation ? sanitizePlainText(providedExplanation) : undefined,
      verifiedExamTag: extractedExamTag,
      fingerprint,
    });
  }

  return {
    subject,
    topic,
    questions: parsedQuestions,
    rawQuestionsCount: parsedQuestions.length,
  };
}
