import { describe, it, expect, beforeEach, vi } from "vitest";
import mongoose from "mongoose";
import { QuizService } from "@/server/services/quiz-service";
import { Quiz } from "@/server/models/Quiz";
import { QuizQuestion } from "@/server/models/QuizQuestion";
import { QuizAttempt } from "@/server/models/QuizAttempt";
import { QuizAttemptRepository } from "@/server/repositories/quiz-attempt";

vi.mock("@/server/lib/mongodb", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

describe("Topic Question Bank & Dynamic Practice Sessions", () => {
  const mockQuizId = new mongoose.Types.ObjectId();
  const mockStudentId = new mongoose.Types.ObjectId();

  const createMockQuestions = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      _id: new mongoose.Types.ObjectId(),
      quizId: mockQuizId,
      order: i + 1,
      questionText: `Topic Question ${i + 1}`,
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctOptionIndex: 0,
      explanation: `Explanation for question ${i + 1}`,
      marks: 1,
      negativeMarks: 0.33,
    }));
  };

  const mockQuestions = createMockQuestions(35);

  const mockQuizDoc = {
    _id: mockQuizId,
    title: "राजस्थान में रीति-रिवाज एवं प्रथाएं",
    slug: "rajasthan-me-reeti-riwaj-avam-prathayein",
    subject: "Rajasthan Art & Culture",
    examTags: ["CET 2022", "RPSC"],
    difficulty: "medium" as const,
    attemptCount: 15,
    status: "PUBLISHED",
    shuffleQuestions: false,
    defaultMarks: 1,
    defaultNegativeMarks: 0.33,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns sliced 10 questions and bank statistics when limit=10 is provided", async () => {
    vi.spyOn(Quiz, "findOne").mockReturnValue({
      populate: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockQuizDoc),
      }),
    } as any);

    vi.spyOn(QuizQuestion, "find").mockReturnValue({
      sort: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockQuestions),
      }),
    } as any);

    const result = await QuizService.getPublicQuizBySlug(
      "rajasthan-me-reeti-riwaj-avam-prathayein",
      { limit: 10 }
    );

    expect(result).not.toBeNull();
    expect(result?.questions.length).toBe(10);
    expect(result?.totalBankQuestions).toBe(35);
    expect(result?.pendingQuestionsCount).toBe(35);
    expect(result?.completedQuestionsCount).toBe(0);
    expect(result?.isTopicCompleted).toBe(false);
    expect(result?.questions[0].order).toBe(1);
    expect(result?.questions[9].order).toBe(10);
  });

  it("filters out previously attempted questions for a student and serves the next pending batch", async () => {
    vi.spyOn(Quiz, "findOne").mockReturnValue({
      populate: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockQuizDoc),
      }),
    } as any);

    vi.spyOn(QuizQuestion, "find").mockReturnValue({
      sort: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockQuestions),
      }),
    } as any);

    // Simulate student having previously attempted questions 1..10
    const pastAttemptAnswers = mockQuestions.slice(0, 10).map((q) => ({
      questionId: q._id,
      selectedOptionIndex: 0,
    }));

    vi.spyOn(QuizAttempt, "find").mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([{ answers: pastAttemptAnswers }]),
      }),
    } as any);

    const result = await QuizService.getPublicQuizBySlug(
      "rajasthan-me-reeti-riwaj-avam-prathayein",
      { limit: 10, studentId: mockStudentId.toString() }
    );

    expect(result).not.toBeNull();
    expect(result?.questions.length).toBe(10);
    expect(result?.totalBankQuestions).toBe(35);
    expect(result?.completedQuestionsCount).toBe(10);
    expect(result?.pendingQuestionsCount).toBe(25);
    expect(result?.isTopicCompleted).toBe(false);
    // Next batch should start from question 11
    expect(result?.questions[0].order).toBe(11);
    expect(result?.questions[9].order).toBe(20);
  });

  it("supports excludeQuestionIds for guest/anonymous users", async () => {
    vi.spyOn(Quiz, "findOne").mockReturnValue({
      populate: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockQuizDoc),
      }),
    } as any);

    vi.spyOn(QuizQuestion, "find").mockReturnValue({
      sort: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockQuestions),
      }),
    } as any);

    const guestDoneIds = mockQuestions.slice(0, 20).map((q) => q._id.toString());

    const result = await QuizService.getPublicQuizBySlug(
      "rajasthan-me-reeti-riwaj-avam-prathayein",
      { limit: 10, excludeQuestionIds: guestDoneIds }
    );

    expect(result).not.toBeNull();
    expect(result?.questions.length).toBe(10);
    expect(result?.completedQuestionsCount).toBe(20);
    expect(result?.pendingQuestionsCount).toBe(15);
    expect(result?.questions[0].order).toBe(21);
  });

  it("correctly evaluates an attempt containing a 10-question session subset of the bank", async () => {
    vi.spyOn(Quiz, "findById").mockReturnValue({
      populate: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockQuizDoc),
      }),
    } as any);

    vi.spyOn(QuizQuestion, "find").mockReturnValue({
      sort: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockQuestions),
      }),
    } as any);

    vi.spyOn(Quiz, "findByIdAndUpdate").mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockQuizDoc),
    } as any);

    vi.spyOn(QuizAttemptRepository, "create").mockResolvedValue({
      _id: new mongoose.Types.ObjectId(),
      quizId: mockQuizId,
      studentId: mockStudentId,
      answers: [],
      score: 7.34,
      totalPossibleScore: 10,
      correctCount: 8,
      incorrectCount: 2,
      unattemptedCount: 0,
      submittedAt: new Date(),
    } as any);

    // Student submits answers for 10 questions (8 correct, 2 incorrect)
    const sessionSubset = mockQuestions.slice(0, 10);
    const answers = sessionSubset.map((q, idx) => ({
      questionId: q._id.toString(),
      selectedOptionIndex: idx < 8 ? 0 : 1, // first 8 correct, last 2 incorrect
    }));

    const result = await QuizService.evaluateAttempt(
      mockQuizId.toString(),
      {
        answers,
        startedAt: new Date().toISOString(),
        isPracticeMode: false,
      },
      mockStudentId.toString()
    );

    expect(result).not.toBeNull();
    expect(result?.totalQuestions).toBe(10);
    expect(result?.correctCount).toBe(8);
    expect(result?.incorrectCount).toBe(2);
    expect(result?.totalPossibleScore).toBe(10);
    expect(result?.score).toBe(8 - 2 * 0.33); // 7.34
    expect(result?.breakdown.length).toBe(10);
  });

  it("getNextQuizInSeries identifies remaining pending questions in the current topic bank", async () => {
    vi.spyOn(Quiz, "findById").mockReturnValue({
      populate: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockQuizDoc),
      }),
    } as any);

    vi.spyOn(QuizQuestion, "find").mockReturnValue({
      sort: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockQuestions),
      }),
    } as any);

    // Student has completed 10 questions out of 35
    const pastAttemptAnswers = mockQuestions.slice(0, 10).map((q) => ({
      questionId: q._id,
      selectedOptionIndex: 0,
    }));

    vi.spyOn(QuizAttempt, "find").mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([{ answers: pastAttemptAnswers }]),
      }),
    } as any);

    const nextQuiz = await QuizService.getNextQuizInSeries(
      mockQuizId.toString(),
      mockStudentId.toString()
    );

    expect(nextQuiz).not.toBeNull();
    expect(nextQuiz?.isSameTopicNextBatch).toBe(true);
    expect(nextQuiz?.pendingQuestionsCount).toBe(25);
    expect(nextQuiz?.slug).toBe(mockQuizDoc.slug);
  });
});
