import { ParsedQuestion, QuestionProcessingIssue } from "./types";
import { sanitizePlainText } from "@/server/validation/quiz";

/**
 * Normalizes minor OCR/spacing artifacts without changing question meaning
 */
export function cleanOcrArtifacts(text: string): string {
  let cleaned = text;
  // Fix double spaces
  cleaned = cleaned.replace(/[ \t]{2,}/g, " ");
  // Fix spaces before punctuation
  cleaned = cleaned.replace(/\s+([,.:;?!])/g, "$1");
  // Normalize hindi danda and hyphens
  cleaned = cleaned.replace(/\s*\|\s*/g, " | ");
  cleaned = cleaned.replace(/\s*–\s*/g, "-");
  cleaned = cleaned.replace(/\s*—\s*/g, "-");

  return cleaned.trim();
}

/**
 * Verifies and sanity-checks questions before database insertion
 */
export function verifyQuestion(
  question: ParsedQuestion,
  topic: string
): {
  verified: ParsedQuestion;
  issues: QuestionProcessingIssue[];
} {
  const issues: QuestionProcessingIssue[] = [];

  // 1. Text & Options Sanity Check
  const cleanedText = cleanOcrArtifacts(question.questionText);
  const cleanedOptions = question.options.map((o) => cleanOcrArtifacts(o));

  if (!cleanedText || cleanedText.length < 5) {
    issues.push({
      questionOrder: question.order,
      issue: "Question text is too short or empty",
      questionSnippet: cleanedText,
    });
  }

  if (cleanedOptions.length < 2 || cleanedOptions.length > 6) {
    issues.push({
      questionOrder: question.order,
      issue: `Invalid options count: ${cleanedOptions.length} (must be 2-6)`,
      questionSnippet: cleanedText,
    });
  }

  // 2. Answer Key Range Validation
  const optIdx = question.providedOptionIndex;
  if (optIdx < 0 || optIdx >= cleanedOptions.length) {
    issues.push({
      questionOrder: question.order,
      issue: `Answer index ${optIdx} is out of bounds for ${cleanedOptions.length} options`,
      questionSnippet: cleanedText,
    });
  }

  // 3. Explanation Validation
  let finalExplanation = question.providedExplanation ? cleanOcrArtifacts(question.providedExplanation) : "";
  if (!finalExplanation) {
    // Generate standard factual explanation header if empty
    finalExplanation = `प्रामाणिक संदर्भों के अनुसार '${topic}' विषय से संबंधित प्रश्न का सही उत्तर विकल्प ${String.fromCharCode(65 + optIdx)} है।`;
  }

  // 4. Exam / Year Verification
  // Keep verified tag if provided; strictly null otherwise (never invent)
  const finalExamTag = question.providedExamTag ? sanitizePlainText(question.providedExamTag) : null;

  const isReviewNeeded = issues.length > 0;

  const verified: ParsedQuestion = {
    ...question,
    questionText: sanitizePlainText(cleanedText),
    options: cleanedOptions.map((o) => sanitizePlainText(o)),
    verifiedOptionIndex: optIdx,
    verifiedExplanation: sanitizePlainText(finalExplanation),
    verifiedExamTag: finalExamTag,
    verificationStatus: isReviewNeeded ? "REVIEW_NEEDED" : "VERIFIED",
    reviewNotes: issues.map((i) => i.issue),
  };

  return { verified, issues };
}
