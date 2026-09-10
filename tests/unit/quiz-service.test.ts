import { describe, it, expect, vi, beforeEach } from "vitest";
import { QuizService } from "@/server/services/quiz-service";
import { QuizRepository } from "@/server/repositories/quiz";
import { QuizQuestionRepository } from "@/server/repositories/quiz-question";
import { QuizAttemptRepository } from "@/server/repositories/quiz-attempt";
import { IQuiz } from "@/server/models/Quiz";
import { IQuizQuestion } from "@/server/models/QuizQuestion";
import { IQuizAttempt } from "@/server/models/QuizAttempt";

describe("QuizService Logic & Scoring Security", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Security: Answer & Explanation Isolation (getPublicQuizBySlug)", () => {
    it("never includes correctOptionIndex or explanation in public quiz questions", async () => {
      const mockQuiz = {
        _id: "65f111111111111111111111" as unknown,
        title: "Rajasthan Polity Mock 1",
        slug: "rajasthan-polity-mock-1",
        subject: "Polity",
        status: "PUBLISHED",
        defaultMarks: 1,
        defaultNegativeMarks: 0.33,
        shuffleQuestions: false,
      } as unknown as IQuiz;

      const mockQuestions = [
        {
          _id: "65f222222222222222222221" as unknown,
          order: 1,
          questionText: "Who appoints the Governor of Rajasthan?",
          options: ["President", "Chief Minister", "Chief Justice", "Speaker"],
          correctOptionIndex: 0,
          explanation: "The President appoints the Governor under Article 155 of the Indian Constitution.",
          marks: 1,
          negativeMarks: 0.33,
        },
        {
          _id: "65f222222222222222222222" as unknown,
          order: 2,
          questionText: "How many assembly seats are there in Rajasthan?",
          options: ["180", "190", "200", "220"],
          correctOptionIndex: 2,
          explanation: "There are 200 Legislative Assembly seats in Rajasthan.",
          marks: 1,
          negativeMarks: 0.33,
        },
      ] as unknown as IQuizQuestion[];

      vi.spyOn(QuizRepository, "findBySlug").mockResolvedValueOnce(mockQuiz);
      vi.spyOn(QuizQuestionRepository, "findByQuizId").mockResolvedValueOnce(mockQuestions);

      const publicQuiz = await QuizService.getPublicQuizBySlug("rajasthan-polity-mock-1");

      expect(publicQuiz).not.toBeNull();
      expect(publicQuiz?.title).toBe("Rajasthan Polity Mock 1");
      expect(publicQuiz?.questions).toHaveLength(2);

      // Verify that correctOptionIndex and explanation are NOT present in any question object
      for (const q of publicQuiz!.questions) {
        expect((q as unknown as Record<string, unknown>).correctOptionIndex).toBeUndefined();
        expect((q as unknown as Record<string, unknown>).explanation).toBeUndefined();
        expect(q).toHaveProperty("id");
        expect(q).toHaveProperty("questionText");
        expect(q).toHaveProperty("options");
      }
    });

    it("returns null if the requested quiz is in DRAFT status for public view", async () => {
      const mockDraftQuiz = {
        _id: "65f111111111111111111111" as unknown,
        title: "Unpublished Draft Quiz",
        slug: "unpublished-draft-quiz",
        status: "DRAFT",
      } as unknown as IQuiz;

      vi.spyOn(QuizRepository, "findBySlug").mockResolvedValueOnce(mockDraftQuiz);

      const result = await QuizService.getPublicQuizBySlug("unpublished-draft-quiz");
      expect(result).toBeNull();
    });
  });

  describe("Authoritative Server-Side Scoring (evaluateAttempt)", () => {
    it("accurately computes score with mixed correct, wrong (negative marked), and unattempted answers", async () => {
      const mockQuiz = {
        _id: "65f111111111111111111111" as unknown,
        title: "CET Practice Mock 2026",
        slug: "cet-practice-mock-2026",
        defaultMarks: 1,
        defaultNegativeMarks: 0.33,
      } as unknown as IQuiz;

      const mockQuestions = [
        {
          _id: "65f222222222222222222221" as unknown,
          order: 1,
          questionText: "Question 1 (Correct Answer will be chosen: opt 0)",
          options: ["A", "B", "C", "D"],
          correctOptionIndex: 0,
          explanation: "Explanation 1",
          marks: 1,
          negativeMarks: 0.33,
        },
        {
          _id: "65f222222222222222222222" as unknown,
          order: 2,
          questionText: "Question 2 (Wrong Answer will be chosen: opt 1 vs correct 3)",
          options: ["A", "B", "C", "D"],
          correctOptionIndex: 3,
          explanation: "Explanation 2",
          marks: 1,
          negativeMarks: 0.33,
        },
        {
          _id: "65f222222222222222222223" as unknown,
          order: 3,
          questionText: "Question 3 (Unattempted / skipped)",
          options: ["A", "B", "C", "D"],
          correctOptionIndex: 1,
          explanation: "Explanation 3",
          marks: 2,
          negativeMarks: 0.66,
        },
      ] as unknown as IQuizQuestion[];

      vi.spyOn(QuizRepository, "findById").mockResolvedValueOnce(mockQuiz);
      vi.spyOn(QuizQuestionRepository, "findByQuizId").mockResolvedValueOnce(mockQuestions);
      vi.spyOn(QuizAttemptRepository, "create").mockImplementationOnce((data) => {
        return Promise.resolve({
          _id: "65f333333333333333333331" as unknown,
          ...data,
          submittedAt: new Date(),
        } as unknown as IQuizAttempt);
      });

      // User submits: Q1 = 0 (correct, +1), Q2 = 1 (incorrect, -0.33), Q3 = null (skipped, 0)
      const attemptResult = await QuizService.evaluateAttempt("65f111111111111111111111", {
        answers: [
          { questionId: "65f222222222222222222221", selectedOptionIndex: 0 },
          { questionId: "65f222222222222222222222", selectedOptionIndex: 1 },
          { questionId: "65f222222222222222222223", selectedOptionIndex: null },
        ],
      });

      expect(attemptResult).not.toBeNull();
      // Total score = +1 - 0.33 + 0 = 0.67
      expect(attemptResult?.score).toBe(0.67);
      // Total possible = 1 + 1 + 2 = 4
      expect(attemptResult?.totalPossibleScore).toBe(4);
      expect(attemptResult?.correctCount).toBe(1);
      expect(attemptResult?.incorrectCount).toBe(1);
      expect(attemptResult?.unattemptedCount).toBe(1);
      expect(attemptResult?.totalQuestions).toBe(3);

      // Verify breakdown items
      expect(attemptResult?.breakdown[0].isCorrect).toBe(true);
      expect(attemptResult?.breakdown[0].marksAwarded).toBe(1);

      expect(attemptResult?.breakdown[1].isCorrect).toBe(false);
      expect(attemptResult?.breakdown[1].marksAwarded).toBe(-0.33);

      expect(attemptResult?.breakdown[2].isUnattempted).toBe(true);
      expect(attemptResult?.breakdown[2].marksAwarded).toBe(0);
    });

    it("respects per-question mark and negative mark overrides", async () => {
      const mockQuiz = {
        _id: "65f111111111111111111111" as unknown,
        title: "RAS Overrides Test",
        defaultMarks: 1,
        defaultNegativeMarks: 0,
      } as unknown as IQuiz;

      const mockQuestions = [
        {
          _id: "65f222222222222222222221" as unknown,
          order: 1,
          questionText: "High value RAS question",
          options: ["A", "B"],
          correctOptionIndex: 0,
          marks: 5, // custom +5
          negativeMarks: 1.5, // custom -1.5
        },
      ] as unknown as IQuizQuestion[];

      vi.spyOn(QuizRepository, "findById").mockResolvedValueOnce(mockQuiz);
      vi.spyOn(QuizQuestionRepository, "findByQuizId").mockResolvedValueOnce(mockQuestions);
      vi.spyOn(QuizAttemptRepository, "create").mockImplementationOnce((data) => {
        return Promise.resolve({
          _id: "65f333333333333333333332" as unknown,
          ...data,
          submittedAt: new Date(),
        } as unknown as IQuizAttempt);
      });

      // User selects wrong answer (option 1)
      const attemptResult = await QuizService.evaluateAttempt("65f111111111111111111111", {
        answers: [{ questionId: "65f222222222222222222221", selectedOptionIndex: 1 }],
      });

      expect(attemptResult?.score).toBe(-1.5);
      expect(attemptResult?.totalPossibleScore).toBe(5);
      expect(attemptResult?.incorrectCount).toBe(1);
    });
  });
});
