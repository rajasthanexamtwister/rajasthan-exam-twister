import mongoose from "mongoose";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Quiz } from "@/server/models/Quiz";
import { QuizQuestion } from "@/server/models/QuizQuestion";
import { slugify } from "@/server/lib/slugify";
import { ParsedQuestion } from "./types";
import { computeQuestionFingerprint } from "./parser";

export interface SeedingResult {
  topicQuizId: string;
  topicTitle: string;
  slug: string;
  importedCount: number;
  duplicateCount: number;
  totalNowInBank: number;
}

/**
 * Seeds verified questions into MongoDB under the authentic single Topic Question Bank
 */
export async function seedQuestionsToTopicBank(
  subject: string,
  topicTitle: string,
  questions: ParsedQuestion[]
): Promise<SeedingResult> {
  await connectToDatabase();

  const generatedSlug = slugify(topicTitle);

  // 1. Find or create the Topic Quiz
  let quiz = await Quiz.findOne({
    $or: [{ slug: generatedSlug }, { title: topicTitle }],
  });

  // Collect unique verified exam tags from new questions
  const newExamTags = questions
    .map((q) => q.verifiedExamTag)
    .filter((t): t is string => Boolean(t));

  if (!quiz) {
    quiz = new Quiz({
      title: topicTitle,
      slug: generatedSlug,
      subject,
      examTags: Array.from(new Set(newExamTags)),
      difficulty: "medium",
      attemptCount: 0,
      status: "DRAFT", // strictly DRAFT
      defaultMarks: 1,
      defaultNegativeMarks: 0.33,
    });
    await quiz.save();
  } else {
    // Merge any new exam tags into existing Quiz
    const existingTags = new Set(quiz.examTags || []);
    let tagsChanged = false;
    for (const tag of newExamTags) {
      if (!existingTags.has(tag)) {
        existingTags.add(tag);
        tagsChanged = true;
      }
    }
    if (tagsChanged) {
      quiz.examTags = Array.from(existingTags);
      await quiz.save();
    }
  }

  // 2. Fetch existing questions to detect and skip duplicates
  const existingQuestions = await QuizQuestion.find({ quizId: quiz._id }).lean();
  const existingFingerprints = new Set(
    existingQuestions.map((q) => computeQuestionFingerprint(q.questionText, q.options))
  );

  const nonDuplicateQuestions: ParsedQuestion[] = [];
  let duplicateCount = 0;

  for (const q of questions) {
    const fp = q.fingerprint || computeQuestionFingerprint(q.questionText, q.options);
    if (existingFingerprints.has(fp)) {
      duplicateCount++;
    } else {
      nonDuplicateQuestions.push(q);
      existingFingerprints.add(fp); // prevent in-file duplicates
    }
  }

  // 3. Insert non-duplicate questions with sequential order numbers
  let importedCount = 0;
  if (nonDuplicateQuestions.length > 0) {
    const currentOrderOffset = existingQuestions.length;

    const docsToInsert = nonDuplicateQuestions.map((q, idx) => ({
      quizId: quiz!._id,
      order: currentOrderOffset + idx + 1,
      questionText: q.questionText,
      questionTextEn: q.questionTextEn,
      options: q.options,
      optionsEn: q.optionsEn,
      correctOptionIndex: q.verifiedOptionIndex ?? q.providedOptionIndex,
      explanation: q.verifiedExplanation || q.providedExplanation || "",
      marks: 1,
      negativeMarks: 0.33,
    }));

    const insertedDocs = await QuizQuestion.insertMany(docsToInsert);
    importedCount = insertedDocs.length;
  }

  const totalNowInBank = existingQuestions.length + importedCount;

  return {
    topicQuizId: quiz._id.toString(),
    topicTitle: quiz.title,
    slug: quiz.slug,
    importedCount,
    duplicateCount,
    totalNowInBank,
  };
}
