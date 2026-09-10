import { describe, it, expect, beforeEach, vi } from "vitest";
import mongoose from "mongoose";
import { BoosterService } from "@/server/services/booster-service";
import { AnalyticsService } from "@/server/services/analytics-service";
import { NotebookService } from "@/server/services/notebook-service";
import { Quiz } from "@/server/models/Quiz";
import { QuizQuestion } from "@/server/models/QuizQuestion";
import { QuizAttempt } from "@/server/models/QuizAttempt";
import * as mongodbModule from "@/server/lib/mongodb";

describe("Sub-Batch 13E: BoosterService - Booster Test Generation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(mongodbModule, "connectToDatabase").mockResolvedValue({} as any);
  });

  const studentAId = new mongoose.Types.ObjectId().toString();
  const studentBId = new mongoose.Types.ObjectId().toString();

  it("should throw error if studentId is invalid", async () => {
    await expect(BoosterService.generateBoosterTest("invalid-id")).rejects.toThrow(
      "Invalid student ID"
    );
  });

  it("should generate a persisted booster quiz prioritizing weak subjects and past wrong questions", async () => {
    // 1. Mock weak topics for Student A
    vi.spyOn(AnalyticsService, "getStudentWeakTopics").mockResolvedValueOnce([
      {
        topic: "Rajasthan Geography",
        totalAttempts: 2,
        questionsAttempted: 10,
        correctCount: 2,
        incorrectCount: 8,
        unattemptedCount: 0,
        accuracyPercentage: 20,
        status: "CRITICAL",
      },
      {
        topic: "Rajasthan History",
        totalAttempts: 2,
        questionsAttempted: 10,
        correctCount: 4,
        incorrectCount: 6,
        unattemptedCount: 0,
        accuracyPercentage: 40,
        status: "CRITICAL",
      },
    ]);

    // 2. Mock wrong questions from NotebookService
    vi.spyOn(NotebookService, "getStudentWrongQuestions").mockResolvedValueOnce([
      {
        questionId: new mongoose.Types.ObjectId().toString(),
        questionText: "What is the highest peak of Aravalli?",
        options: ["Guru Shikhar", "Ser", "Dilwara", "Taragarh"],
        correctOptionIndex: 0,
        explanation: "Guru Shikhar is 1722 meters.",
        marks: 1,
        negativeMarks: 0,
        quizId: new mongoose.Types.ObjectId().toString(),
        quizTitle: "Aravalli Range Test",
        quizSlug: "aravalli-range-test",
        subject: "Rajasthan Geography",
        isBookmarked: false,
      },
    ]);

    const mockQuiz1Id = new mongoose.Types.ObjectId();

    // 3. Mock Quiz.find for subject quizzes
    vi.spyOn(Quiz, "find").mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([{ _id: mockQuiz1Id }]),
      }),
    } as any);

    // 4. Mock student attempts
    vi.spyOn(QuizAttempt, "find").mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([]),
      }),
    } as any);

    // 5. Mock QuizQuestion.find for unattempted questions
    const mockUnattempted = Array.from({ length: 19 }, (_, i) => ({
      _id: new mongoose.Types.ObjectId(),
      questionText: `Geography Question ${i + 1}`,
      options: ["A", "B", "C", "D"],
      correctOptionIndex: 0,
      explanation: `Explanation ${i + 1}`,
      marks: 1,
      negativeMarks: 0,
    }));

    vi.spyOn(QuizQuestion, "find").mockReturnValue({
      lean: vi.fn().mockResolvedValue(mockUnattempted),
    } as any);

    // 6. Mock Quiz.create and QuizQuestion.insertMany
    const createdQuizId = new mongoose.Types.ObjectId();
    vi.spyOn(Quiz, "create").mockResolvedValueOnce({
      _id: createdQuizId,
      title: "Personalized Booster: Rajasthan Geography & Rajasthan History",
      slug: `booster-${studentAId.slice(-6)}-123456`,
      status: "PUBLISHED",
    } as any);

    let insertedQuestions: any[] = [];
    vi.spyOn(QuizQuestion, "insertMany").mockImplementationOnce((docs: any) => {
      insertedQuestions = docs;
      return Promise.resolve(docs) as any;
    });

    const result = await BoosterService.generateBoosterTest(studentAId);

    expect(result.quizId).toBe(createdQuizId.toString());
    expect(result.title).toContain("Personalized Booster");
    expect(result.topics).toEqual(["Rajasthan Geography", "Rajasthan History"]);
    expect(result.totalQuestions).toBe(20); // 1 wrong + 19 unattempted
    expect(insertedQuestions.length).toBe(20);
    expect(insertedQuestions[0].questionText).toBe("What is the highest peak of Aravalli?");
  });

  it("should isolate booster generation: student A's weak topics and wrong questions are never mixed with student B", async () => {
    let capturedWeakTopicStudentId = "";
    let capturedWrongQuestionsStudentId = "";

    vi.spyOn(AnalyticsService, "getStudentWeakTopics").mockImplementationOnce((id: string) => {
      capturedWeakTopicStudentId = id;
      return Promise.resolve([]);
    });

    vi.spyOn(NotebookService, "getStudentWrongQuestions").mockImplementationOnce((id: string) => {
      capturedWrongQuestionsStudentId = id;
      return Promise.resolve([]);
    });

    vi.spyOn(Quiz, "find").mockReturnValue({
      select: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([{ subject: "General Studies" }]),
        }),
        lean: vi.fn().mockResolvedValue([{ _id: new mongoose.Types.ObjectId() }]),
      }),
    } as any);

    vi.spyOn(QuizAttempt, "find").mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([]),
      }),
    } as any);

    vi.spyOn(QuizQuestion, "find").mockReturnValue({
      lean: vi.fn().mockResolvedValue([
        {
          _id: new mongoose.Types.ObjectId(),
          questionText: "Sample Question",
          options: ["A", "B", "C", "D"],
          correctOptionIndex: 0,
        },
      ]),
    } as any);

    vi.spyOn(Quiz, "create").mockResolvedValueOnce({
      _id: new mongoose.Types.ObjectId(),
      slug: "booster-slug",
      title: "Booster",
    } as any);

    vi.spyOn(QuizQuestion, "insertMany").mockResolvedValueOnce([] as any);

    await BoosterService.generateBoosterTest(studentAId);

    expect(capturedWeakTopicStudentId).toBe(studentAId);
    expect(capturedWeakTopicStudentId).not.toBe(studentBId);
    expect(capturedWrongQuestionsStudentId).toBe(studentAId);
    expect(capturedWrongQuestionsStudentId).not.toBe(studentBId);
  });
});
