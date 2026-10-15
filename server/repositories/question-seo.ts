import mongoose from "mongoose";
import { connectToDatabase } from "@/server/lib/mongodb";
import { QuizQuestion, IQuizQuestion } from "@/server/models/QuizQuestion";
import { Quiz, IQuiz } from "@/server/models/Quiz";
import "@/server/models/Category";

export interface PublicSeoQuestionDetail {
  id: string;
  order: number;
  questionText: string;
  questionTextEn?: string;
  options: string[];
  optionsEn?: string[];
  correctOptionIndex: number;
  explanation: string;
  marks: number;
  negativeMarks: number;
  seoSlug: string;
  seoTitle?: string;
  seoDescription?: string;
  verificationSource?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  examSource?: string;
  updatedAt: Date;
  quiz: {
    id: string;
    title: string;
    slug: string;
    subject?: string;
    examTags: string[];
    difficulty?: string;
  };
}

export interface VerifyQuestionInput {
  questionId: string;
  verifiedOptionIndex: number;
  verificationSource: string;
  reviewedBy: string;
  seoSlug: string;
  seoTitle?: string;
  seoDescription?: string;
  examSource?: string;
  explanation?: string;
  publishImmediately?: boolean;
}

export class QuestionSeoRepository {
  /**
   * Retrieves a single published, manually reviewed question by its unique SEO slug.
   * Returns null if question is draft, unverified, archived, or if parent quiz is unpublished.
   */
  static async getPublishedQuestionBySlug(seoSlug: string): Promise<PublicSeoQuestionDetail | null> {
    await connectToDatabase();

    if (!seoSlug || typeof seoSlug !== "string") return null;

    const normalizedSlug = seoSlug.trim().toLowerCase();

    const question = await QuizQuestion.findOne({
      seoSlug: normalizedSlug,
      seoStatus: "PUBLISHED",
      isAnswerVerified: true,
    })
      .populate<{ quizId: IQuiz }>("quizId")
      .exec();

    if (!question || !question.quizId) {
      return null;
    }

    const parentQuiz = question.quizId as IQuiz;

    // Isolate questions whose parent quiz is not published
    if (parentQuiz.status !== "PUBLISHED") {
      return null;
    }

    // Require non-empty explanation to avoid thin-content indexing
    const cleanExplanation = (question.explanation || "").trim();
    if (!cleanExplanation) {
      return null;
    }

    // Require valid verifiedOptionIndex that matches correctOptionIndex
    if (
      question.verifiedOptionIndex === undefined ||
      question.verifiedOptionIndex === null ||
      question.verifiedOptionIndex !== question.correctOptionIndex
    ) {
      return null;
    }

    return {
      id: question._id.toString(),
      order: question.order,
      questionText: question.questionText,
      questionTextEn: question.questionTextEn || undefined,
      options: [...question.options],
      optionsEn: question.optionsEn && question.optionsEn.length > 0 ? [...question.optionsEn] : undefined,
      correctOptionIndex: question.correctOptionIndex,
      explanation: cleanExplanation,
      marks: question.marks ?? parentQuiz.defaultMarks ?? 2,
      negativeMarks: question.negativeMarks ?? parentQuiz.defaultNegativeMarks ?? 0,
      seoSlug: question.seoSlug || normalizedSlug,
      seoTitle: question.seoTitle || undefined,
      seoDescription: question.seoDescription || undefined,
      verificationSource: question.verificationSource || undefined,
      reviewedBy: question.reviewedBy || undefined,
      reviewedAt: question.reviewedAt || undefined,
      examSource: question.examSource || undefined,
      updatedAt: question.updatedAt || new Date(),
      quiz: {
        id: parentQuiz._id.toString(),
        title: parentQuiz.title,
        slug: parentQuiz.slug,
        subject: parentQuiz.subject,
        examTags: parentQuiz.examTags || [],
        difficulty: parentQuiz.difficulty,
      },
    };
  }

  /**
   * Lists published question slugs for sitemap inclusion.
   * Strictly filters out drafts, unverified questions, and thin content without explanations.
   */
  static async listPublishedQuestionSlugs(): Promise<Array<{ seoSlug: string; updatedAt: Date }>> {
    await connectToDatabase();

    const questions = await QuizQuestion.find({
      seoStatus: "PUBLISHED",
      isAnswerVerified: true,
      seoSlug: { $exists: true, $ne: "" },
      explanation: { $exists: true, $ne: "" },
    })
      .select("seoSlug updatedAt quizId verifiedOptionIndex correctOptionIndex explanation")
      .populate<{ quizId: IQuiz }>("quizId", "status")
      .lean()
      .exec();

    const eligibleSlugs: Array<{ seoSlug: string; updatedAt: Date }> = [];

    for (const q of questions) {
      const parent = q.quizId as unknown as { status?: string } | undefined;
      const cleanExplanation = (q.explanation || "").trim();
      const isOptionValid =
        q.verifiedOptionIndex !== undefined &&
        q.verifiedOptionIndex !== null &&
        q.verifiedOptionIndex === q.correctOptionIndex;

      if (
        parent &&
        parent.status === "PUBLISHED" &&
        q.seoSlug &&
        cleanExplanation.length > 0 &&
        isOptionValid
      ) {
        eligibleSlugs.push({
          seoSlug: q.seoSlug,
          updatedAt: (q as any).updatedAt || new Date(),
        });
      }
    }

    return eligibleSlugs;
  }

  /**
   * Retrieves sibling published questions from the same quiz for internal linking
   */
  static async getRelatedPublishedQuestions(
    quizId: string,
    currentQuestionId: string,
    limit: number = 4
  ): Promise<Array<{ seoSlug: string; questionText: string; order: number }>> {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(quizId)) return [];

    const questions = await QuizQuestion.find({
      quizId: new mongoose.Types.ObjectId(quizId),
      _id: { $ne: new mongoose.Types.ObjectId(currentQuestionId) },
      seoStatus: "PUBLISHED",
      isAnswerVerified: true,
      seoSlug: { $exists: true, $ne: "" },
    })
      .select("seoSlug questionText order")
      .sort({ order: 1 })
      .limit(limit)
      .lean()
      .exec();

    return questions.map((q) => ({
      seoSlug: q.seoSlug!,
      questionText: q.questionText,
      order: q.order,
    }));
  }

  /**
   * Auditable verification and publishing of an individual question.
   * Enforces that verifiedOptionIndex matches correctOptionIndex to prevent answer mapping errors.
   */
  static async verifyAndPublishQuestion(input: VerifyQuestionInput): Promise<IQuizQuestion> {
    await connectToDatabase();

    const question = await QuizQuestion.findById(input.questionId);
    if (!question) {
      throw new Error(`Question not found with ID: ${input.questionId}`);
    }

    // Safety constraint: Verified option must strictly match correctOptionIndex
    if (input.verifiedOptionIndex !== question.correctOptionIndex) {
      throw new Error(
        `Answer mapping audit failed: verifiedOptionIndex (${input.verifiedOptionIndex}) does not match existing correctOptionIndex (${question.correctOptionIndex}). Manual review required.`
      );
    }

    if (input.explanation !== undefined) {
      const cleanExpl = input.explanation.trim();
      if (cleanExpl.length > 0) {
        question.explanation = cleanExpl;
      }
    }

    // Quality constraint: Explanation must not be empty for SEO publishing
    if (!question.explanation || question.explanation.trim().length === 0) {
      throw new Error("Cannot publish question for SEO without an authentic explanation.");
    }

    const cleanSlug = input.seoSlug.trim().toLowerCase();
    if (!cleanSlug) {
      throw new Error("A valid unique seoSlug is required for publishing.");
    }

    // Check slug collision
    const existing = await QuizQuestion.findOne({ seoSlug: cleanSlug, _id: { $ne: question._id } });
    if (existing) {
      throw new Error(`seoSlug "${cleanSlug}" is already taken by question ID ${existing._id}.`);
    }

    question.seoStatus = input.publishImmediately === false ? "DRAFT" : "PUBLISHED";
    question.isAnswerVerified = true;
    question.verifiedOptionIndex = input.verifiedOptionIndex;
    question.verificationSource = input.verificationSource.trim();
    question.reviewedBy = input.reviewedBy.trim();
    question.reviewedAt = new Date();
    question.seoSlug = cleanSlug;
    if (input.seoTitle) question.seoTitle = input.seoTitle.trim();
    if (input.seoDescription) question.seoDescription = input.seoDescription.trim();
    if (input.examSource) question.examSource = input.examSource.trim();

    await question.save();
    return question;
  }
}
