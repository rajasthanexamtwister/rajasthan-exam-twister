import { describe, it, expect, beforeEach, vi } from "vitest";
import mongoose from "mongoose";
import { Quiz } from "@/server/models/Quiz";
import { QuizAttempt } from "@/server/models/QuizAttempt";
import { QuizRepository } from "@/server/repositories/quiz";
import { QuizQuestionRepository } from "@/server/repositories/quiz-question";
import { QuizService } from "@/server/services/quiz-service";

describe("Batch 14 Discovery & Sub-Batch 13B Persisted Attempts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Quiz Model & Repository Discovery", () => {
    it("should instantiate a quiz with examTags, difficulty, and attemptCount", () => {
      const quiz = new Quiz({
        title: "Rajasthan CET 2026 GK Paper",
        slug: "rajasthan-cet-2026-gk-paper",
        subject: "Rajasthan GK",
        examTags: ["CET", "RSMSSB"],
        difficulty: "hard",
        attemptCount: 0,
        status: "DRAFT",
      });

      expect(quiz.examTags).toEqual(["CET", "RSMSSB"]);
      expect(quiz.difficulty).toBe("hard");
      expect(quiz.attemptCount).toBe(0);
    });

    it("should default difficulty to medium and attemptCount to 0", () => {
      const quiz = new Quiz({
        title: "REET Level 2 Pedagogy",
        slug: "reet-level-2-pedagogy",
        status: "PUBLISHED",
      });

      expect(quiz.difficulty).toBe("medium");
      expect(quiz.attemptCount).toBe(0);
      expect(quiz.examTags).toEqual([]);
    });
  });

  describe("Quiz Import Validation with Discovery Fields", () => {
    it("should parse and accept examTags and difficulty in import payload", async () => {
      const payload = {
        quizTitle: "RPSC RAS Prelims History Test",
        subject: "Rajasthan History",
        examTags: ["RPSC", "RAS"],
        difficulty: "hard",
        questions: [
          {
            questionText: "Where was the 1857 revolution in Rajasthan first triggered?",
            options: ["Naseerabad", "Neemuch", "Kota", "Erinpura"],
            correctOptionIndex: 0,
            explanation: "On 28 May 1857 in Naseerabad Cantonment.",
            marks: 2,
            negativeMarks: 0.66,
          },
        ],
      };

      const mockSavedQuiz = {
        _id: new mongoose.Types.ObjectId(),
        title: "RPSC RAS Prelims History Test",
        slug: "rpsc-ras-prelims-history-test",
        subject: "Rajasthan History",
        examTags: ["RPSC", "RAS"],
        difficulty: "hard",
        attemptCount: 0,
        status: "DRAFT",
      };

      vi.spyOn(QuizRepository, "create").mockResolvedValueOnce(mockSavedQuiz as any);
      vi.spyOn(QuizQuestionRepository, "insertMany").mockResolvedValueOnce([] as any);

      const result = await QuizService.importQuizJson(payload);
      expect(result.quiz.title).toBe("RPSC RAS Prelims History Test");
      expect(result.questionCount).toBe(1);
    });
  });

  describe("Sub-Batch 13B Student Attempt Persistence & Leaderboard", () => {
    it("should correctly record studentId in QuizAttempt model", () => {
      const studentId = new mongoose.Types.ObjectId();
      const quizId = new mongoose.Types.ObjectId();

      const attempt = new QuizAttempt({
        quizId,
        studentId,
        answers: [],
        score: 10,
        totalPossibleScore: 10,
        correctCount: 5,
        incorrectCount: 0,
        unattemptedCount: 0,
      });

      expect(attempt.studentId?.toString()).toBe(studentId.toString());
      expect(attempt.score).toBe(10);
    });

    it("should allow guest attempts with null studentId", () => {
      const quizId = new mongoose.Types.ObjectId();

      const attempt = new QuizAttempt({
        quizId,
        answers: [],
        score: 8,
        totalPossibleScore: 10,
        correctCount: 4,
        incorrectCount: 1,
        unattemptedCount: 0,
      });

      expect(attempt.studentId).toBeNull();
      expect(attempt.score).toBe(8);
    });
  });

  describe("Canonical Exam Normalization & Deduplication", () => {
    it("should normalize granular shifts and papers to canonical categories", async () => {
      const { normalizeToCanonicalExam, buildExamMatcherRegex } = await import("@/server/lib/exam-canonical");

      expect(normalizeToCanonicalExam("CET 2022 (Graduate) 07 January 2023 Shift-1").name).toBe(
        "CET (Common Eligibility Test)"
      );
      expect(normalizeToCanonicalExam("CET 2022 (12th Level) 04 February 2023 Shift-2").name).toBe(
        "CET (Common Eligibility Test)"
      );
      expect(normalizeToCanonicalExam("Rajasthan Police Constable Exam 2024 ( SHIFT - L1)").name).toBe(
        "Rajasthan Police (Constable / SI)"
      );
      expect(normalizeToCanonicalExam("Asstt. Agriculture Officer Exam 2015 Paper 1").name).toBe(
        "Agriculture Officer (AAO / AO)"
      );
      expect(normalizeToCanonicalExam("Sr. Teacher (Sec. Edu.) Comp. Exam-2024 (G.K. Group - A)").name).toBe(
        "RPSC 2nd Grade (Sr. Teacher)"
      );

      const cetRegex = buildExamMatcherRegex("cet");
      expect(cetRegex.test("CET 2022 (Graduate) 07 January 2023 Shift-1")).toBe(true);
      expect(cetRegex.test("Common Eligibility Test 2023")).toBe(true);
    });
  });
});
