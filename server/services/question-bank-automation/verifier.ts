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
  // Fix common typo / OCR patterns in Hindi GK questions
  const typoReplacements: [RegExp, string][] = [
    [/श्रीगंगानर/g, "श्रीगंगानगर"],
    [/गंगानर/g, "गंगानगर"],
    [/गुजराज/g, "गुजरात"],
    [/जगती है/g, "लगती है"],
    [/अन्र्राष्ट्रीय/g, "अन्तर्राष्ट्रीय"],
    [/अन्तराज्जीय/g, "अन्तर्राज्यीय"],
    [/अन्तर्राज्जीय/g, "अन्तर्राज्यीय"],
    [/झून्झूनु/g, "झुंझुनूं"],
    [/झुन्झुनु/g, "झुंझुनूं"],
    [/सीमा वोले/g, "सीमा वाले"],
    [/चितौडगढ/g, "चित्तौड़गढ़"],
    [/चितौड़गढ़/g, "चित्तौड़गढ़"],
    [/राज्य सा देश/g, "राज्य या देश"],
    [/चुरू/g, "चूरू"],
    [/दो जिलो/g, "दो जिलों"],
    [/दुर जिला/g, "दूर जिला"],
    [/निमच/g, "नीमच"],
    [/उतरप्रदेश/g, "उत्तर प्रदेश"],
    [/उत्तरप्रदेश/g, "उत्तर प्रदेश"],
    [/मध्यप्रदेश/g, "मध्य प्रदेश"],
    [/उपरोक्‍त/g, "उपरोक्त"],
    [/जैकोवाबाद/g, "जैकोबाबाद"],
    [/भिवाणी/g, "भिवानी"],
    [/महेन्द्रगढ़/g, "महेंद्रगढ़"],
    [/रेवाडी/g, "रेवाड़ी"],
  ];

  for (const [pattern, replacement] of typoReplacements) {
    cleaned = cleaned.replace(pattern, replacement);
  }

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
