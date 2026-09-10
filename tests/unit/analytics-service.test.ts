import { describe, it, expect, beforeEach, vi } from "vitest";
import mongoose from "mongoose";
import { AnalyticsService } from "@/server/services/analytics-service";
import { QuizAttempt } from "@/server/models/QuizAttempt";
import * as mongodbModule from "@/server/lib/mongodb";

describe("Sub-Batch 13C: AnalyticsService - Weak-Topic Analysis", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(mongodbModule, "connectToDatabase").mockResolvedValue({} as any);
  });

  const studentAId = new mongoose.Types.ObjectId().toString();
  const studentBId = new mongoose.Types.ObjectId().toString();

  it("should return an empty array if studentId is empty or invalid", async () => {
    const resultInvalid = await AnalyticsService.getStudentWeakTopics("invalid-id", 5);
    const resultEmpty = await AnalyticsService.getStudentWeakTopics("", 5);

    expect(resultInvalid).toEqual([]);
    expect(resultEmpty).toEqual([]);
  });

  it("should filter out topics with fewer than 5 attempted questions (min sample size)", async () => {
    // Mock QuizAttempt.aggregate returning aggregated topic counts
    vi.spyOn(QuizAttempt, "aggregate").mockResolvedValueOnce([
      {
        _id: "Rajasthan History",
        totalAttempts: 1,
        correctCount: 2,
        incorrectCount: 1, // 3 questions attempted (< 5)
        unattemptedCount: 1,
      },
      {
        _id: "Rajasthan Geography",
        totalAttempts: 2,
        correctCount: 4,
        incorrectCount: 6, // 10 questions attempted (>= 5)
        unattemptedCount: 0,
      },
    ]);

    const result = await AnalyticsService.getStudentWeakTopics(studentAId, 5);

    expect(result).toHaveLength(1);
    expect(result[0].topic).toBe("Rajasthan Geography");
    expect(result[0].questionsAttempted).toBe(10);
    expect(result[0].correctCount).toBe(4);
    expect(result[0].incorrectCount).toBe(6);
    expect(result[0].accuracyPercentage).toBe(40);
    expect(result[0].status).toBe("CRITICAL");
  });

  it("should rank weak topics weakest-first (ascending accuracy %)", async () => {
    vi.spyOn(QuizAttempt, "aggregate").mockResolvedValueOnce([
      {
        _id: "Art & Culture",
        totalAttempts: 3,
        correctCount: 8,
        incorrectCount: 2, // 10 questions, 80% accuracy -> PROFICIENT
        unattemptedCount: 0,
      },
      {
        _id: "Current Affairs",
        totalAttempts: 2,
        correctCount: 2,
        incorrectCount: 8, // 10 questions, 20% accuracy -> CRITICAL
        unattemptedCount: 0,
      },
      {
        _id: "General Science",
        totalAttempts: 2,
        correctCount: 6,
        incorrectCount: 4, // 10 questions, 60% accuracy -> NEEDS_IMPROVEMENT
        unattemptedCount: 0,
      },
    ]);

    const result = await AnalyticsService.getStudentWeakTopics(studentAId, 5);

    expect(result).toHaveLength(3);
    // Rank 1: Weakest (Current Affairs - 20%)
    expect(result[0].topic).toBe("Current Affairs");
    expect(result[0].accuracyPercentage).toBe(20);
    expect(result[0].status).toBe("CRITICAL");

    // Rank 2: Moderate (General Science - 60%)
    expect(result[1].topic).toBe("General Science");
    expect(result[1].accuracyPercentage).toBe(60);
    expect(result[1].status).toBe("NEEDS_IMPROVEMENT");

    // Rank 3: Strongest (Art & Culture - 80%)
    expect(result[2].topic).toBe("Art & Culture");
    expect(result[2].accuracyPercentage).toBe(80);
    expect(result[2].status).toBe("PROFICIENT");
  });

  it("should strictly scope aggregation pipeline to the authenticated studentId", async () => {
    let capturedPipeline: any[] = [];
    (vi.spyOn(QuizAttempt, "aggregate") as any).mockImplementation(async (pipeline: any) => {
      capturedPipeline = pipeline;
      return [];
    });

    await AnalyticsService.getStudentWeakTopics(studentAId, 5);

    expect(capturedPipeline).toBeDefined();
    expect(capturedPipeline.length).toBeGreaterThan(0);
    const matchStage = capturedPipeline[0].$match;
    expect(matchStage.studentId).toEqual(new mongoose.Types.ObjectId(studentAId));
    expect(matchStage.studentId).not.toEqual(new mongoose.Types.ObjectId(studentBId));
  });

  it("should handle custom minSampleSize parameter", async () => {
    vi.spyOn(QuizAttempt, "aggregate").mockResolvedValueOnce([
      {
        _id: "Computer Fundamentals",
        totalAttempts: 1,
        correctCount: 2,
        incorrectCount: 1, // 3 questions attempted
        unattemptedCount: 0,
      },
    ]);

    // With default minSampleSize 5 -> filtered out
    const resDefault = await AnalyticsService.getStudentWeakTopics(studentAId, 5);
    expect(resDefault).toEqual([]);

    vi.spyOn(QuizAttempt, "aggregate").mockResolvedValueOnce([
      {
        _id: "Computer Fundamentals",
        totalAttempts: 1,
        correctCount: 2,
        incorrectCount: 1, // 3 questions attempted
        unattemptedCount: 0,
      },
    ]);

    // With custom minSampleSize 3 -> included
    const resCustom = await AnalyticsService.getStudentWeakTopics(studentAId, 3);
    expect(resCustom).toHaveLength(1);
    expect(resCustom[0].topic).toBe("Computer Fundamentals");
    expect(resCustom[0].accuracyPercentage).toBe(66.67);
  });
});
