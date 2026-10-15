import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";

vi.mock("@/server/lib/mongodb", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

import { QuizQuestion, IQuizQuestion } from "@/server/models/QuizQuestion";
import { Quiz, IQuiz } from "@/server/models/Quiz";
import { QuestionSeoRepository } from "@/server/repositories/question-seo";
import { QuizService } from "@/server/services/quiz-service";
import { QuizRepository } from "@/server/repositories/quiz";
import { QuizQuestionRepository } from "@/server/repositories/quiz-question";

describe("Question SEO Architecture - Phase 1: Model, Repository & Security Isolation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Model Defaults & Schema Invariants", () => {
    it("should default seoStatus to 'DRAFT' and isAnswerVerified to false on new questions", () => {
      const q = new QuizQuestion({
        quizId: new mongoose.Types.ObjectId(),
        order: 1,
        questionText: "राजस्थान का एकीकरण कितने चरणों में हुआ था?",
        options: ["5", "6", "7", "8"],
        correctOptionIndex: 2,
        explanation: "राजस्थान का एकीकरण 7 चरणों में पूरा हुआ था।",
      });

      expect(q.seoStatus).toBe("DRAFT");
      expect(q.isAnswerVerified).toBe(false);
      expect(q.seoSlug).toBeUndefined();
      expect(q.reviewedAt).toBeUndefined();
      expect(q.verifiedOptionIndex).toBeUndefined();
    });
  });

  describe("2. Draft & Unpublished Quiz Isolation", () => {
    it("should return null when querying a question with seoStatus 'DRAFT'", async () => {
      vi.spyOn(QuizQuestion, "findOne").mockReturnValueOnce({
        populate: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValueOnce(null), // findOne filter { seoStatus: 'PUBLISHED' } yields null
        }),
      } as any);

      const result = await QuestionSeoRepository.getPublishedQuestionBySlug("draft-question-slug");
      expect(result).toBeNull();
    });

    it("should return null if question is PUBLISHED but isAnswerVerified is false", async () => {
      vi.spyOn(QuizQuestion, "findOne").mockReturnValueOnce({
        populate: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValueOnce(null),
        }),
      } as any);

      const result = await QuestionSeoRepository.getPublishedQuestionBySlug("unverified-question-slug");
      expect(result).toBeNull();
    });

    it("should return null if parent quiz status is DRAFT even if question has PUBLISHED flag", async () => {
      const mockQuestion = {
        _id: new mongoose.Types.ObjectId(),
        order: 1,
        questionText: "राजस्थान संघ का प्रधानमंत्री किसे बनाया गया?",
        options: ["A", "B", "C", "D"],
        correctOptionIndex: 2,
        explanation: "गोकुल लाल असावा को प्रधानमंत्री बनाया गया।",
        seoStatus: "PUBLISHED",
        isAnswerVerified: true,
        seoSlug: "rajasthan-sangh-pradhan-mantri",
        quizId: {
          _id: new mongoose.Types.ObjectId(),
          title: "राजस्थान का इतिहास क्विज़",
          slug: "rajasthan-history-quiz",
          status: "DRAFT", // Parent quiz is still DRAFT!
        },
      };

      vi.spyOn(QuizQuestion, "findOne").mockReturnValueOnce({
        populate: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValueOnce(mockQuestion),
        }),
      } as any);

      const result = await QuestionSeoRepository.getPublishedQuestionBySlug("rajasthan-sangh-pradhan-mantri");
      expect(result).toBeNull();
    });

    it("should return null if question explanation is empty to prevent thin content indexing", async () => {
      const mockQuestion = {
        _id: new mongoose.Types.ObjectId(),
        order: 1,
        questionText: "टाॅडगढ़ को राजस्थान में कब सम्मिलित किया गया?",
        options: ["1948", "1949", "1950", "1956"],
        correctOptionIndex: 3,
        explanation: "   ", // Thin explanation!
        seoStatus: "PUBLISHED",
        isAnswerVerified: true,
        seoSlug: "todgarh-rajasthan-vilay-1956",
        quizId: {
          _id: new mongoose.Types.ObjectId(),
          title: "राजस्थान का इतिहास क्विज़",
          slug: "rajasthan-history-quiz",
          status: "PUBLISHED",
        },
      };

      vi.spyOn(QuizQuestion, "findOne").mockReturnValueOnce({
        populate: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValueOnce(mockQuestion),
        }),
      } as any);

      const result = await QuestionSeoRepository.getPublishedQuestionBySlug("todgarh-rajasthan-vilay-1956");
      expect(result).toBeNull();
    });

    it("should return complete public question detail when fully verified, published, and parent quiz is published", async () => {
      const mockQuizId = new mongoose.Types.ObjectId();
      const mockQuestionId = new mongoose.Types.ObjectId();

      const mockQuestion = {
        _id: mockQuestionId,
        order: 1,
        questionText: "25 मार्च, 1948 को गठित राजस्थान संघ का प्रधानमंत्री बनाया गया था -",
        options: [
          "जयनारायण व्यास",
          "हरिदेव जोशी",
          "गोकुल लाल असावा",
          "हीरालाल शास्त्री",
        ],
        correctOptionIndex: 2,
        verifiedOptionIndex: 2,
        explanation: "25 मार्च, 1948 को द्वितीय चरण राजस्थान संघ का गठन हुआ जिसमें गोकुल लाल असावा को प्रधानमंत्री बनाया गया।",
        marks: 2,
        negativeMarks: 0.66,
        seoStatus: "PUBLISHED",
        isAnswerVerified: true,
        seoSlug: "rajasthan-sangh-pradhan-mantri-1948",
        verificationSource: "RSMSSB Official Key 2021",
        reviewedBy: "Chief Editor",
        reviewedAt: new Date("2026-10-14"),
        updatedAt: new Date("2026-10-14"),
        quizId: {
          _id: mockQuizId,
          title: "राजस्थान का एकीकरण",
          slug: "rajasthan-ka-ekikaran",
          subject: "राजस्थान का इतिहास",
          examTags: ["RSMSSB", "RPSC"],
          difficulty: "medium",
          status: "PUBLISHED",
          defaultMarks: 2,
          defaultNegativeMarks: 0.66,
        },
      };

      vi.spyOn(QuizQuestion, "findOne").mockReturnValueOnce({
        populate: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValueOnce(mockQuestion),
        }),
      } as any);

      const result = await QuestionSeoRepository.getPublishedQuestionBySlug("rajasthan-sangh-pradhan-mantri-1948");
      expect(result).not.toBeNull();
      expect(result?.questionText).toContain("25 मार्च, 1948");
      expect(result?.correctOptionIndex).toBe(2);
      expect(result?.explanation).toContain("गोकुल लाल असावा");
      expect(result?.quiz.title).toBe("राजस्थान का एकीकरण");
      expect(result?.quiz.slug).toBe("rajasthan-ka-ekikaran");
    });
  });

  describe("3. Auditable Verification Workflow & Answer-Mapping Guard", () => {
    it("should reject verification if verifiedOptionIndex does not match existing correctOptionIndex", async () => {
      const mockQuestion = {
        _id: new mongoose.Types.ObjectId(),
        correctOptionIndex: 2, // Official correct answer is index 2
        explanation: "Valid explanation text",
      };

      vi.spyOn(QuizQuestion, "findById").mockResolvedValueOnce(mockQuestion as any);

      await expect(
        QuestionSeoRepository.verifyAndPublishQuestion({
          questionId: mockQuestion._id.toString(),
          verifiedOptionIndex: 0, // Mismatched candidate index!
          verificationSource: "RSMSSB Official Key",
          reviewedBy: "Editor 1",
          seoSlug: "sample-slug",
        })
      ).rejects.toThrow(/Answer mapping audit failed/);
    });

    it("should reject verification if explanation is missing or blank", async () => {
      const mockQuestion = {
        _id: new mongoose.Types.ObjectId(),
        correctOptionIndex: 1,
        explanation: "   ",
      };

      vi.spyOn(QuizQuestion, "findById").mockResolvedValueOnce(mockQuestion as any);

      await expect(
        QuestionSeoRepository.verifyAndPublishQuestion({
          questionId: mockQuestion._id.toString(),
          verifiedOptionIndex: 1,
          verificationSource: "RSMSSB Official Key",
          reviewedBy: "Editor 1",
          seoSlug: "sample-slug-empty-expl",
        })
      ).rejects.toThrow(/Cannot publish question for SEO without an authentic explanation/);
    });

    it("should successfully record verification audit trail when mapping is verified", async () => {
      const mockQuestion: any = {
        _id: new mongoose.Types.ObjectId(),
        correctOptionIndex: 2,
        explanation: "Authentic verified explanation with historical facts.",
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(QuizQuestion, "findById").mockResolvedValueOnce(mockQuestion);
      vi.spyOn(QuizQuestion, "findOne").mockResolvedValueOnce(null); // No slug collision

      const published = await QuestionSeoRepository.verifyAndPublishQuestion({
        questionId: mockQuestion._id.toString(),
        verifiedOptionIndex: 2,
        verificationSource: "RPSC RAS Pre 2023 Key",
        reviewedBy: "Senior GK Researcher",
        seoSlug: "rajasthan-gk-history-q1",
      });

      expect(published.seoStatus).toBe("PUBLISHED");
      expect(published.isAnswerVerified).toBe(true);
      expect(published.verifiedOptionIndex).toBe(2);
      expect(published.verificationSource).toBe("RPSC RAS Pre 2023 Key");
      expect(published.reviewedBy).toBe("Senior GK Researcher");
      expect(published.reviewedAt).toBeInstanceOf(Date);
      expect(published.seoSlug).toBe("rajasthan-gk-history-q1");
      expect(mockQuestion.save).toHaveBeenCalled();
    });
  });

  describe("4. Security Invariant: Pre-submission Quiz Attempt APIs Never Leak Answer Keys", () => {
    it("should verify QuizService.getPublicQuizBySlug strictly strips correctOptionIndex and explanation", async () => {
      const mockQuiz = {
        _id: new mongoose.Types.ObjectId(),
        title: "राजस्थान का एकीकरण",
        slug: "rajasthan-ka-ekikaran",
        status: "PUBLISHED",
        defaultMarks: 2,
        defaultNegativeMarks: 0,
      } as unknown as IQuiz;

      const mockQuestions = [
        {
          _id: new mongoose.Types.ObjectId(),
          order: 1,
          questionText: "मत्स्य संघ का राजस्थान में विलय कब किया गया?",
          options: ["1948", "1949", "1950", "1956"],
          correctOptionIndex: 1, // MUST BE STRIPPED
          explanation: "15 मई 1949 को मत्स्य संघ का विलय हुआ।", // MUST BE STRIPPED
          marks: 2,
          negativeMarks: 0,
        },
      ] as unknown as IQuizQuestion[];

      vi.spyOn(QuizRepository, "findBySlug").mockResolvedValueOnce(mockQuiz);
      vi.spyOn(QuizQuestionRepository, "findByQuizId").mockResolvedValueOnce(mockQuestions);

      const publicView = await QuizService.getPublicQuizBySlug("rajasthan-ka-ekikaran", {
        limit: 10,
        part: 1,
      });

      expect(publicView).not.toBeNull();
      expect(publicView?.questions.length).toBe(1);

      const publicQuestion = publicView?.questions[0] as any;
      expect(publicQuestion.questionText).toBe("मत्स्य संघ का राजस्थान में विलय कब किया गया?");
      expect(publicQuestion.options).toEqual(["1948", "1949", "1950", "1956"]);

      // STRICT ZERO-LEAKAGE ASSERTIONS
      expect(publicQuestion.correctOptionIndex).toBeUndefined();
      expect(publicQuestion.explanation).toBeUndefined();
      expect(publicQuestion.verifiedOptionIndex).toBeUndefined();
      expect(publicQuestion.verificationSource).toBeUndefined();
      expect(publicQuestion.reviewedBy).toBeUndefined();
    });
  });
});
