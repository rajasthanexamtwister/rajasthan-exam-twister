import { describe, it, expect, beforeEach, vi } from "vitest";
import mongoose from "mongoose";
import { NotebookService } from "@/server/services/notebook-service";
import { QuizAttempt } from "@/server/models/QuizAttempt";
import { QuizQuestion } from "@/server/models/QuizQuestion";
import { Bookmark } from "@/server/models/Bookmark";
import * as mongodbModule from "@/server/lib/mongodb";

describe("Sub-Batch 13D: NotebookService - Wrong-Questions & Bookmarks", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(mongodbModule, "connectToDatabase").mockResolvedValue({} as any);
  });

  const studentAId = new mongoose.Types.ObjectId().toString();
  const studentBId = new mongoose.Types.ObjectId().toString();

  const mockQ1Id = new mongoose.Types.ObjectId();
  const mockQ2Id = new mongoose.Types.ObjectId();
  const mockQuizId = new mongoose.Types.ObjectId();

  it("should return empty array when studentId is invalid for wrong-questions or bookmarks", async () => {
    const wrongRes = await NotebookService.getStudentWrongQuestions("invalid-id");
    const bookRes = await NotebookService.getStudentBookmarks("invalid-id");

    expect(wrongRes).toEqual([]);
    expect(bookRes).toEqual([]);
  });

  it("should derive wrong questions on read from QuizAttempt.answers and correctOptionIndex", async () => {
    const mockAttempts = [
      {
        _id: new mongoose.Types.ObjectId(),
        studentId: new mongoose.Types.ObjectId(studentAId),
        quizId: {
          _id: mockQuizId,
          title: "Rajasthan Polity Test",
          slug: "rajasthan-polity-test",
          subject: "Polity",
        },
        answers: [
          {
            questionId: mockQ1Id,
            selectedOptionIndex: 1, // Student picked B (wrong)
          },
          {
            questionId: mockQ2Id,
            selectedOptionIndex: 0, // Student picked A (correct)
          },
        ],
        submittedAt: new Date("2026-03-01T10:00:00Z"),
      },
    ];

    const mockQuestions = [
      {
        _id: mockQ1Id,
        questionText: "Who is the executive head of the state?",
        options: ["Governor", "Chief Minister", "Chief Justice", "Speaker"],
        correctOptionIndex: 0, // Option A: Governor
        explanation: "Article 154 states executive power is vested in Governor.",
        marks: 1,
        negativeMarks: 0,
      },
      {
        _id: mockQ2Id,
        questionText: "How many members are in Rajasthan Vidhan Sabha?",
        options: ["200", "250", "160", "180"],
        correctOptionIndex: 0, // Option A: 200
        explanation: "Rajasthan Legislative Assembly has 200 seats.",
        marks: 1,
        negativeMarks: 0,
      },
    ];

    // Mock QuizAttempt.find
    vi.spyOn(QuizAttempt, "find").mockReturnValue({
      populate: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(mockAttempts),
        }),
      }),
    } as any);

    // Mock QuizQuestion.find
    vi.spyOn(QuizQuestion, "find").mockReturnValue({
      lean: vi.fn().mockResolvedValue(mockQuestions),
    } as any);

    // Mock Bookmark.find
    vi.spyOn(Bookmark, "find").mockReturnValue({
      lean: vi.fn().mockResolvedValue([]),
    } as any);

    const wrongList = await NotebookService.getStudentWrongQuestions(studentAId);

    // Only Q1 should be returned as wrong (student selected 1, correct was 0)
    expect(wrongList).toHaveLength(1);
    expect(wrongList[0].questionId).toBe(mockQ1Id.toString());
    expect(wrongList[0].questionText).toBe("Who is the executive head of the state?");
    expect(wrongList[0].userSelectedOptionIndex).toBe(1);
    expect(wrongList[0].correctOptionIndex).toBe(0);
    expect(wrongList[0].isBookmarked).toBe(false);
    expect(wrongList[0].quizTitle).toBe("Rajasthan Polity Test");
    expect(wrongList[0].subject).toBe("Polity");
  });

  it("should isolate wrong questions between different students (Student A vs Student B)", async () => {
    let capturedFilter: any = null;

    (vi.spyOn(QuizAttempt, "find") as any).mockImplementation((filter: any) => {
      capturedFilter = filter;
      return {
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as any;
    });

    await NotebookService.getStudentWrongQuestions(studentAId);

    expect(capturedFilter).toBeDefined();
    expect(capturedFilter.studentId).toEqual(new mongoose.Types.ObjectId(studentAId));
    expect(capturedFilter.studentId).not.toEqual(new mongoose.Types.ObjectId(studentBId));
  });

  it("should add and remove bookmarks and enforce student isolation", async () => {
    let upsertFilter: any = null;
    let deleteFilter: any = null;

    (vi.spyOn(Bookmark, "findOneAndUpdate") as any).mockImplementation((filter: any) => {
      upsertFilter = filter;
      return Promise.resolve({}) as any;
    });

    (vi.spyOn(Bookmark, "deleteOne") as any).mockImplementation((filter: any) => {
      deleteFilter = filter;
      return Promise.resolve({ deletedCount: 1 }) as any;
    });

    // Add bookmark
    const addRes = await NotebookService.addBookmark(studentAId, mockQ1Id.toString());
    expect(addRes).toBe(true);
    expect(upsertFilter.studentId).toEqual(new mongoose.Types.ObjectId(studentAId));
    expect(upsertFilter.questionId).toEqual(mockQ1Id);

    // Remove bookmark
    const delRes = await NotebookService.removeBookmark(studentAId, mockQ1Id.toString());
    expect(delRes).toBe(true);
    expect(deleteFilter.studentId).toEqual(new mongoose.Types.ObjectId(studentAId));
    expect(deleteFilter.questionId).toEqual(mockQ1Id);
  });

  it("should retrieve bookmarked questions with populated quiz details scoped to student", async () => {
    const mockBookmarks = [
      {
        _id: new mongoose.Types.ObjectId(),
        studentId: new mongoose.Types.ObjectId(studentAId),
        questionId: {
          _id: mockQ1Id,
          questionText: "Who is the executive head of the state?",
          options: ["Governor", "Chief Minister", "Chief Justice", "Speaker"],
          correctOptionIndex: 0,
          explanation: "Article 154 explanation",
          marks: 1,
          negativeMarks: 0,
          quizId: {
            _id: mockQuizId,
            title: "Rajasthan Polity Test",
            slug: "rajasthan-polity-test",
            subject: "Polity",
          },
        },
        createdAt: new Date("2026-03-02T12:00:00Z"),
      },
    ];

    let capturedBookmarkFilter: any = null;

    (vi.spyOn(Bookmark, "find") as any).mockImplementation((filter: any) => {
      capturedBookmarkFilter = filter;
      return {
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue(mockBookmarks),
          }),
        }),
      } as any;
    });

    const bookmarks = await NotebookService.getStudentBookmarks(studentAId);

    expect(capturedBookmarkFilter.studentId).toEqual(new mongoose.Types.ObjectId(studentAId));
    expect(bookmarks).toHaveLength(1);
    expect(bookmarks[0].questionId).toBe(mockQ1Id.toString());
    expect(bookmarks[0].questionText).toBe("Who is the executive head of the state?");
    expect(bookmarks[0].isBookmarked).toBe(true);
    expect(bookmarks[0].quizTitle).toBe("Rajasthan Polity Test");
  });
});
