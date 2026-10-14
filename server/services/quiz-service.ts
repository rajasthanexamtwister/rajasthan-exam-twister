import mongoose from "mongoose";
import { QuizRepository, QuizFilterOptions, PaginatedQuizzes } from "@/server/repositories/quiz";
import { QuizQuestionRepository } from "@/server/repositories/quiz-question";
import { QuizAttemptRepository } from "@/server/repositories/quiz-attempt";
import { IQuiz } from "@/server/models/Quiz";
import { IQuizQuestion } from "@/server/models/QuizQuestion";
import { IQuizAttempt, QuizAttempt } from "@/server/models/QuizAttempt";
import {
  QuizImportJSON,
  QuizImportJSONSchema,
  sanitizePlainText,
  UpdateQuizSettingsInput,
  UpdateQuizSettingsSchema,
  UpdateQuizQuestionInput,
  UpdateQuizQuestionSchema,
  SubmitQuizAttemptInput,
} from "@/server/validation/quiz";

import { QuizDifficulty, Quiz } from "@/server/models/Quiz";

import crypto from "crypto";

export interface PublicQuizQuestion {
  id: string;
  order: number;
  questionText: string;
  questionTextEn?: string;
  options: string[];
  optionsEn?: string[];
  marks?: number;
  negativeMarks?: number;
}

/**
 * Computes a boundary fingerprint (SHA-256) of the first 50 lines and last 50 lines
 * of deterministic question content (questionText + options).
 */
export function computeQuizContentFingerprint(
  questions: { questionText: string; options: string[] }[]
): string {
  const lines: string[] = [];
  for (const q of questions) {
    lines.push(sanitizePlainText(q.questionText));
    for (const opt of q.options) {
      lines.push(sanitizePlainText(opt));
    }
  }

  let sampledLines: string[];
  if (lines.length <= 100) {
    sampledLines = lines;
  } else {
    const first50 = lines.slice(0, 50);
    const last50 = lines.slice(-50);
    sampledLines = [...first50, ...last50];
  }

  const contentToHash = sampledLines.join("\n");
  return crypto.createHash("sha256").update(contentToHash, "utf-8").digest("hex");
}

export interface PublicQuizOptions {
  limit?: number;
  part?: number;
  skip?: number;
  studentId?: string;
  excludeQuestionIds?: string[];
  includeCompleted?: boolean;
}

export interface PublicQuizDetail {
  id: string;
  title: string;
  slug: string;
  subject?: string;
  examTags: string[];
  difficulty: QuizDifficulty;
  attemptCount: number;
  category?: { name: string; slug: string } | null;
  timeLimitSeconds?: number | null;
  defaultMarks: number;
  defaultNegativeMarks: number;
  maxAttempts?: number | null;
  questionCount: number;
  totalBankQuestions: number;
  completedQuestionsCount: number;
  pendingQuestionsCount: number;
  isTopicCompleted: boolean;
  questions: PublicQuizQuestion[];
}

export interface AttemptQuestionBreakdown {
  questionId: string;
  order: number;
  questionText: string;
  questionTextEn?: string;
  options: string[];
  optionsEn?: string[];
  selectedOptionIndex: number | null;
  correctOptionIndex: number;
  explanation: string;
  isCorrect: boolean;
  isUnattempted: boolean;
  marksAwarded: number;
}

export interface AttemptResult {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  score: number;
  totalPossibleScore: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  totalQuestions: number;
  breakdown: AttemptQuestionBreakdown[];
  submittedAt: Date;
}

export class QuizService {
  /**
   * Import a quiz from AI-generated JSON payload
   */
  static async importQuizJson(rawJson: unknown): Promise<{
    quiz: IQuiz;
    questionCount: number;
  }> {
    const validated = QuizImportJSONSchema.parse(rawJson);

    // Sanitize title and subject as plain text
    const cleanTitle = sanitizePlainText(validated.quizTitle);
    const cleanSubject = validated.subject ? sanitizePlainText(validated.subject) : undefined;
    const cleanExamTags = (validated.examTags || []).map((t) => sanitizePlainText(t)).filter(Boolean);
    const contentFingerprint = computeQuizContentFingerprint(validated.questions);

    // Create the Quiz in DRAFT status
    const quiz = await QuizRepository.create({
      title: cleanTitle,
      subject: cleanSubject,
      examTags: cleanExamTags,
      difficulty: validated.difficulty || "medium",
      contentFingerprint,
      status: "DRAFT",
      defaultMarks: 1,
      defaultNegativeMarks: 0,
    });

    // Prepare questions with plain-text sanitization
    const sanitizedQuestions = validated.questions.map((q, idx) => ({
      order: idx + 1,
      questionText: sanitizePlainText(q.questionText),
      questionTextEn: q.questionTextEn ? sanitizePlainText(q.questionTextEn) : undefined,
      options: q.options.map((opt) => sanitizePlainText(opt)),
      optionsEn: q.optionsEn ? q.optionsEn.map((opt) => sanitizePlainText(opt)) : undefined,
      correctOptionIndex: q.correctOptionIndex,
      explanation: q.explanation ? sanitizePlainText(q.explanation) : "",
      marks: q.marks,
      negativeMarks: q.negativeMarks,
    }));

    await QuizQuestionRepository.insertMany(quiz._id.toString(), sanitizedQuestions);

    return {
      quiz,
      questionCount: sanitizedQuestions.length,
    };
  }

  /**
   * List quizzes (public or admin)
   */
  static async listQuizzes(
    filters: QuizFilterOptions = {},
    isAdmin: boolean = false
  ): Promise<PaginatedQuizzes> {
    return QuizRepository.list(filters, isAdmin);
  }

  /**
   * Get distinct exam tags and published counts
   */
  static async listDistinctExams() {
    return QuizRepository.listDistinctExams();
  }

  /**
   * Get distinct subjects and published counts
   */
  static async listDistinctSubjects() {
    return QuizRepository.listDistinctSubjects();
  }

  /**
   * Get public quiz view by slug — NEVER exposes correctOptionIndex or explanation
   */
  static async getPublicQuizBySlug(
    slug: string,
    options?: PublicQuizOptions
  ): Promise<PublicQuizDetail | null> {
    const quiz = await QuizRepository.findBySlug(slug);
    if (!quiz || quiz.status !== "PUBLISHED") {
      return null;
    }

    const rawQuestions = await QuizQuestionRepository.findByQuizId(quiz._id.toString());
    const totalBankQuestions = rawQuestions.length;

    // Collect already attempted question IDs for this student / session
    const attemptedQuestionIds = new Set<string>();

    if (options?.studentId && mongoose.Types.ObjectId.isValid(options.studentId)) {
      const pastAttempts = await QuizAttempt.find({
        quizId: quiz._id,
        studentId: new mongoose.Types.ObjectId(options.studentId),
      })
        .select("answers.questionId")
        .lean();

      for (const attempt of pastAttempts) {
        for (const ans of attempt.answers || []) {
          if (ans.questionId) {
            attemptedQuestionIds.add(ans.questionId.toString());
          }
        }
      }
    }

    if (options?.excludeQuestionIds && Array.isArray(options.excludeQuestionIds)) {
      for (const id of options.excludeQuestionIds) {
        if (id) attemptedQuestionIds.add(id.toString());
      }
    }

    const rawQuestionIdsSet = new Set(rawQuestions.map((q) => q._id.toString()));
    const completedQuestionsCount = Array.from(attemptedQuestionIds).filter((id) =>
      rawQuestionIdsSet.has(id)
    ).length;

    // Determine pending questions
    const pendingQuestions = rawQuestions.filter((q) => !attemptedQuestionIds.has(q._id.toString()));
    const pendingQuestionsCount = pendingQuestions.length;
    const isTopicCompleted = pendingQuestionsCount === 0 && totalBankQuestions > 0;

    // Choose which subset of questions to return based on options.part / options.limit
    let targetQuestionPool: IQuizQuestion[] = [];
    if (options?.part && options.part > 0) {
      const limit = options.limit && options.limit > 0 ? options.limit : 20;
      const skip = (options.part - 1) * limit;
      targetQuestionPool = rawQuestions.slice(skip, skip + limit);
    } else if (options?.limit && options.limit > 0) {
      if (pendingQuestions.length > 0) {
        targetQuestionPool = pendingQuestions.slice(0, options.limit);
      } else {
        // If topic completed or options.includeCompleted, allow practicing whole bank
        targetQuestionPool = rawQuestions.slice(0, options.limit);
      }
    } else {
      targetQuestionPool = rawQuestions;
    }

    let questionsList = targetQuestionPool.map((q) => ({
      id: q._id.toString(),
      order: q.order,
      questionText: q.questionText,
      questionTextEn: q.questionTextEn || undefined,
      options: [...q.options],
      optionsEn: q.optionsEn && q.optionsEn.length > 0 ? [...q.optionsEn] : undefined,
      marks: q.marks ?? quiz.defaultMarks,
      negativeMarks: q.negativeMarks ?? quiz.defaultNegativeMarks,
    }));

    // Shuffle questions if enabled
    if (quiz.shuffleQuestions) {
      questionsList = [...questionsList].sort(() => Math.random() - 0.5);
    }

    const categoryObj = quiz.categoryId as unknown as { name?: string; slug?: string } | undefined;

    return {
      id: quiz._id.toString(),
      title: quiz.title,
      slug: quiz.slug,
      subject: quiz.subject,
      examTags: quiz.examTags || [],
      difficulty: quiz.difficulty || "medium",
      attemptCount: quiz.attemptCount || 0,
      category: categoryObj?.name ? { name: categoryObj.name, slug: categoryObj.slug || "" } : null,
      timeLimitSeconds: quiz.timeLimitSeconds,
      defaultMarks: quiz.defaultMarks,
      defaultNegativeMarks: quiz.defaultNegativeMarks,
      maxAttempts: quiz.maxAttempts,
      questionCount: questionsList.length,
      totalBankQuestions,
      completedQuestionsCount,
      pendingQuestionsCount,
      isTopicCompleted,
      questions: questionsList,
    };
  }

  /**
   * Get full quiz for Admin (includes correctOptionIndex & explanation)
   */
  static async getAdminQuizById(id: string): Promise<{
    quiz: IQuiz;
    questions: IQuizQuestion[];
  } | null> {
    const quiz = await QuizRepository.findById(id);
    if (!quiz) return null;

    const questions = await QuizQuestionRepository.findByQuizId(id);

    return {
      quiz,
      questions,
    };
  }

  /**
   * Update quiz settings (Admin)
   */
  static async updateQuizSettings(
    id: string,
    input: UpdateQuizSettingsInput
  ): Promise<IQuiz | null> {
    const validated = UpdateQuizSettingsSchema.parse(input);

    const updatePayload: Record<string, unknown> = { ...validated };
    if (validated.title) {
      updatePayload.title = sanitizePlainText(validated.title);
    }
    if (validated.subject) {
      updatePayload.subject = sanitizePlainText(validated.subject);
    }
    if (validated.examTags) {
      updatePayload.examTags = validated.examTags.map((t) => sanitizePlainText(t)).filter(Boolean);
    }

    return QuizRepository.update(id, updatePayload);
  }

  /**
   * Update single question (inline typo/answer fix)
   */
  static async updateQuestion(
    questionId: string,
    input: UpdateQuizQuestionInput
  ): Promise<IQuizQuestion | null> {
    const validated = UpdateQuizQuestionSchema.parse(input);

    const updatePayload: Record<string, unknown> = { ...validated };
    if (validated.questionText) {
      updatePayload.questionText = sanitizePlainText(validated.questionText);
    }
    if (validated.questionTextEn) {
      updatePayload.questionTextEn = sanitizePlainText(validated.questionTextEn);
    }
    if (validated.options) {
      updatePayload.options = validated.options.map((opt) => sanitizePlainText(opt));
    }
    if (validated.optionsEn) {
      updatePayload.optionsEn = validated.optionsEn.map((opt) => sanitizePlainText(opt));
    }
    if (validated.explanation) {
      updatePayload.explanation = sanitizePlainText(validated.explanation);
    }

    return QuizQuestionRepository.updateQuestion(questionId, updatePayload);
  }

  /**
   * Publish quiz
   */
  static async publishQuiz(id: string): Promise<IQuiz | null> {
    return QuizRepository.update(id, {
      status: "PUBLISHED",
      publishedAt: new Date(),
    });
  }

  /**
   * Unpublish quiz (return to DRAFT)
   */
  static async unpublishQuiz(id: string): Promise<IQuiz | null> {
    return QuizRepository.update(id, {
      status: "DRAFT",
    });
  }

  /**
   * Delete quiz and all its associated questions and attempts
   */
  static async deleteQuiz(id: string): Promise<boolean> {
    return QuizRepository.delete(id);
  }

  /**
   * Authoritative server-side evaluation of an attempt
   */
  static async evaluateAttempt(
    quizId: string,
    input: SubmitQuizAttemptInput,
    studentId?: string
  ): Promise<AttemptResult | null> {
    const quiz = await QuizRepository.findById(quizId);
    if (!quiz) return null;

    const canonicalQuestions = await QuizQuestionRepository.findByQuizId(quizId);
    if (canonicalQuestions.length === 0) return null;

    // For dynamic practice sessions (e.g. 10 questions out of a 141-question topic bank),
    // evaluate against only the questions submitted in this session.
    const submittedQuestionIds = new Set(input.answers.map((a) => a.questionId));
    const sessionQuestions =
      submittedQuestionIds.size > 0 && submittedQuestionIds.size < canonicalQuestions.length
        ? canonicalQuestions.filter((q) => submittedQuestionIds.has(q._id.toString()))
        : canonicalQuestions;

    // Create a map of user answers by questionId
    const answerMap = new Map<string, number | null>();
    for (const ans of input.answers) {
      answerMap.set(ans.questionId, ans.selectedOptionIndex);
    }

    let score = 0;
    let totalPossibleScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;

    const breakdown: AttemptQuestionBreakdown[] = [];

    for (const q of sessionQuestions) {
      const qIdStr = q._id.toString();
      const userSelected = answerMap.has(qIdStr) ? answerMap.get(qIdStr)! : null;

      const qPositiveMarks = q.marks ?? quiz.defaultMarks ?? 1;
      const qNegativeMarks = input.isPracticeMode ? 0 : (q.negativeMarks ?? quiz.defaultNegativeMarks ?? 0);

      totalPossibleScore += qPositiveMarks;

      let isCorrect = false;
      let isUnattempted = false;
      let marksAwarded = 0;

      if (userSelected === null || userSelected === undefined) {
        // Unattempted
        isUnattempted = true;
        unattemptedCount++;
        marksAwarded = 0;
      } else if (
        q.correctOptionIndex !== null &&
        q.correctOptionIndex !== undefined &&
        Number(userSelected) === Number(q.correctOptionIndex)
      ) {
        // Correct
        isCorrect = true;
        correctCount++;
        marksAwarded = qPositiveMarks;
        score += qPositiveMarks;
      } else {
        // Incorrect
        incorrectCount++;
        marksAwarded = qNegativeMarks === 0 ? 0 : -qNegativeMarks;
        score -= qNegativeMarks;
      }

      breakdown.push({
        questionId: qIdStr,
        order: q.order,
        questionText: q.questionText,
        questionTextEn: q.questionTextEn || undefined,
        options: q.options,
        optionsEn: q.optionsEn && q.optionsEn.length > 0 ? q.optionsEn : undefined,
        selectedOptionIndex: userSelected,
        correctOptionIndex: q.correctOptionIndex,
        explanation: q.explanation || "",
        isCorrect,
        isUnattempted,
        marksAwarded: Math.round(marksAwarded * 100) / 100,
      });
    }

    // Round total scores to 2 decimal places
    const finalScore = Math.round(score * 100) / 100;
    const finalTotalPossible = Math.round(totalPossibleScore * 100) / 100;
    const percentage =
      finalTotalPossible > 0
        ? Math.round((Math.max(0, finalScore) / finalTotalPossible) * 10000) / 100
        : 0;

    // Atomically increment attemptCount on Quiz
    await QuizRepository.incrementAttemptCount(quizId);

    // Persist attempt
    const attempt = await QuizAttemptRepository.create({
      quizId,
      studentId,
      answers: input.answers.map((a) => ({
        questionId: a.questionId,
        selectedOptionIndex: a.selectedOptionIndex,
      })),
      score: finalScore,
      totalPossibleScore: finalTotalPossible,
      correctCount,
      incorrectCount,
      unattemptedCount,
      startedAt: input.startedAt ? new Date(input.startedAt) : undefined,
      submittedAt: new Date(),
    });

    return {
      attemptId: attempt._id.toString(),
      quizId: quiz._id.toString(),
      quizTitle: quiz.title,
      score: finalScore,
      totalPossibleScore: finalTotalPossible,
      percentage,
      correctCount,
      incorrectCount,
      unattemptedCount,
      totalQuestions: sessionQuestions.length,
      breakdown,
      submittedAt: attempt.submittedAt,
    };
  }

  /**
   * Evaluates a single question answer securely upon selection in single-question mode
   */
  static async checkSingleQuestionAnswer(
    quizId: string,
    questionId: string,
    selectedOptionIndex: number | null,
    isPracticeMode: boolean = false
  ): Promise<{
    isCorrect: boolean;
    isUnattempted: boolean;
    correctOptionIndex: number;
    explanation: string;
    marksAwarded: number;
  } | null> {
    const quiz = await QuizRepository.findById(quizId);
    if (!quiz || quiz.status !== "PUBLISHED") return null;

    const question = await QuizQuestionRepository.findById(questionId);
    if (!question || question.quizId.toString() !== quiz._id.toString()) return null;

    const isUnattempted = selectedOptionIndex === null || selectedOptionIndex === undefined;
    const isCorrect =
      !isUnattempted &&
      question.correctOptionIndex !== null &&
      question.correctOptionIndex !== undefined &&
      Number(selectedOptionIndex) === Number(question.correctOptionIndex);

    const qMarks = question.marks ?? quiz.defaultMarks;
    const qNegative = question.negativeMarks ?? quiz.defaultNegativeMarks;

    let marksAwarded = 0;
    if (isCorrect) {
      marksAwarded = qMarks;
    } else if (!isUnattempted) {
      marksAwarded = isPracticeMode || qNegative === 0 ? 0 : -qNegative;
    }

    return {
      isCorrect,
      isUnattempted,
      correctOptionIndex: question.correctOptionIndex,
      explanation: question.explanation || "",
      marksAwarded: Math.round(marksAwarded * 100) / 100,
    };
  }

  /**
   * Determines the next published quiz in the same topic/series/subject
   */
  static async getNextQuizInSeries(
    currentQuizId: string,
    studentId?: string,
    excludeQuestionIds?: string[]
  ): Promise<{
    id: string;
    title: string;
    slug: string;
    subject?: string;
    isSameTopicNextBatch?: boolean;
    pendingQuestionsCount?: number;
  } | null> {
    const currentQuiz = await QuizRepository.findById(currentQuizId);
    if (!currentQuiz || currentQuiz.status !== "PUBLISHED") return null;

    // Check if the current topic question bank still has pending questions
    const rawQuestions = await QuizQuestionRepository.findByQuizId(currentQuizId);
    const attemptedIds = new Set<string>();

    if (studentId && mongoose.Types.ObjectId.isValid(studentId)) {
      const pastAttempts = await QuizAttempt.find({
        quizId: currentQuiz._id,
        studentId: new mongoose.Types.ObjectId(studentId),
      })
        .select("answers.questionId")
        .lean();

      for (const attempt of pastAttempts) {
        for (const ans of attempt.answers || []) {
          if (ans.questionId) {
            attemptedIds.add(ans.questionId.toString());
          }
        }
      }
    }

    if (excludeQuestionIds && Array.isArray(excludeQuestionIds)) {
      for (const id of excludeQuestionIds) {
        if (id) attemptedIds.add(id.toString());
      }
    }

    const pendingCount = rawQuestions.filter((q) => !attemptedIds.has(q._id.toString())).length;

    // If current topic bank has remaining pending questions, return same quiz for next batch
    if (pendingCount > 0 && rawQuestions.length > 10) {
      return {
        id: currentQuiz._id.toString(),
        title: currentQuiz.title,
        slug: currentQuiz.slug,
        subject: currentQuiz.subject || undefined,
        isSameTopicNextBatch: true,
        pendingQuestionsCount: pendingCount,
      };
    }

    const query: any = {
      status: "PUBLISHED",
      _id: { $ne: currentQuiz._id },
    };

    // Filter by subject, category, or examTags
    const conditions: any[] = [];
    if (currentQuiz.subject) {
      conditions.push({ subject: currentQuiz.subject });
    }
    if (currentQuiz.categoryId) {
      conditions.push({ categoryId: currentQuiz.categoryId });
    }
    if (currentQuiz.examTags && currentQuiz.examTags.length > 0) {
      conditions.push({ examTags: { $in: currentQuiz.examTags } });
    }

    if (conditions.length > 0) {
      query.$or = conditions;
    }

    // Try finding next quiz created after current quiz
    let nextQuiz = await Quiz.findOne({
      ...query,
      createdAt: { $gt: currentQuiz.createdAt },
    })
      .sort({ createdAt: 1 })
      .lean()
      .exec();

    // Fallback: get first quiz in series
    if (!nextQuiz) {
      nextQuiz = await Quiz.findOne(query)
        .sort({ createdAt: 1 })
        .lean()
        .exec();
    }

    if (!nextQuiz) return null;

    return {
      id: nextQuiz._id.toString(),
      title: nextQuiz.title,
      slug: nextQuiz.slug,
      subject: nextQuiz.subject || undefined,
      isSameTopicNextBatch: false,
    };
  }
}

