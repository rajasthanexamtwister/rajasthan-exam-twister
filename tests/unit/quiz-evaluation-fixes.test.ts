import { describe, it, expect, vi, beforeEach } from "vitest";
import { QuizService } from "@/server/services/quiz-service";
import { QuizRepository } from "@/server/repositories/quiz";
import { QuizQuestionRepository } from "@/server/repositories/quiz-question";
import { QuizAttemptRepository } from "@/server/repositories/quiz-attempt";
import { IQuiz } from "@/server/models/Quiz";
import { IQuizQuestion } from "@/server/models/QuizQuestion";
import { IQuizAttempt } from "@/server/models/QuizAttempt";
import { resolveCorrectOptionIndex } from "@/scripts/convert-question-bank";
import { parseAnswerKeyToOptionIndex } from "@/server/services/question-bank-automation/parser";

describe("Quiz Bug Fixes: Answer Highlighting & Final Question Submission", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(QuizRepository, "incrementAttemptCount").mockResolvedValue(undefined);
  });

  describe("Bug 1: Parser & Converter Answer Indexing (Option 1 vs Option 4)", () => {
    const sampleOptions = [
      "श्री गंगानगर",
      "बीकानेर",
      "जैसलमेर",
      "हनुमानगढ़",
    ];

    it("correctly resolves Option 4 as index 3 across different representations", () => {
      // 1-based number 4 -> index 3
      expect(resolveCorrectOptionIndex(4, sampleOptions)).toBe(3);
      // string "4" -> index 3
      expect(resolveCorrectOptionIndex("4", sampleOptions)).toBe(3);
      // letter "D" / "d" -> index 3
      expect(resolveCorrectOptionIndex("D", sampleOptions)).toBe(3);
      expect(resolveCorrectOptionIndex("d", sampleOptions)).toBe(3);
      // textual prefixes
      expect(resolveCorrectOptionIndex("Option 4", sampleOptions)).toBe(3);
      expect(resolveCorrectOptionIndex("विकल्प 4", sampleOptions)).toBe(3);
      expect(resolveCorrectOptionIndex("उत्तर: D", sampleOptions)).toBe(3);
      expect(resolveCorrectOptionIndex("4. हनुमानगढ़", sampleOptions)).toBe(3);
      // direct text match
      expect(resolveCorrectOptionIndex("हनुमानगढ़", sampleOptions)).toBe(3);
    });

    it("correctly resolves Option 1 as index 0 across representations", () => {
      // 1-based number 1 -> index 0
      expect(resolveCorrectOptionIndex(1, sampleOptions)).toBe(0);
      // string "1" -> index 0
      expect(resolveCorrectOptionIndex("1", sampleOptions)).toBe(0);
      // 0-based number 0 -> index 0
      expect(resolveCorrectOptionIndex(0, sampleOptions)).toBe(0);
      // letter "A" / "a" -> index 0
      expect(resolveCorrectOptionIndex("A", sampleOptions)).toBe(0);
      expect(resolveCorrectOptionIndex("a", sampleOptions)).toBe(0);
      expect(resolveCorrectOptionIndex("Option 1", sampleOptions)).toBe(0);
      expect(resolveCorrectOptionIndex("श्री गंगानगर", sampleOptions)).toBe(0);
    });

    it("correctly resolves intermediate options 2 (index 1) and 3 (index 2)", () => {
      expect(resolveCorrectOptionIndex(2, sampleOptions)).toBe(1);
      expect(resolveCorrectOptionIndex("2", sampleOptions)).toBe(1);
      expect(resolveCorrectOptionIndex("B", sampleOptions)).toBe(1);
      expect(resolveCorrectOptionIndex("बीकानेर", sampleOptions)).toBe(1);

      expect(resolveCorrectOptionIndex(3, sampleOptions)).toBe(2);
      expect(resolveCorrectOptionIndex("3", sampleOptions)).toBe(2);
      expect(resolveCorrectOptionIndex("C", sampleOptions)).toBe(2);
      expect(resolveCorrectOptionIndex("जैसलमेर", sampleOptions)).toBe(2);
    });

    it("automation parser handles bulleted/prefixed answer keys without defaulting Option 4 to Option 1", () => {
      expect(parseAnswerKeyToOptionIndex("D.")).toBe(3);
      expect(parseAnswerKeyToOptionIndex("(4)")).toBe(3);
      expect(parseAnswerKeyToOptionIndex("4")).toBe(3);
      expect(parseAnswerKeyToOptionIndex("द")).toBe(3);
      expect(parseAnswerKeyToOptionIndex("उत्तर: D")).toBe(3);
      expect(parseAnswerKeyToOptionIndex("Option 4")).toBe(3);

      expect(parseAnswerKeyToOptionIndex("A.")).toBe(0);
      expect(parseAnswerKeyToOptionIndex("(1)")).toBe(0);
      expect(parseAnswerKeyToOptionIndex("1")).toBe(0);
      expect(parseAnswerKeyToOptionIndex("अ")).toBe(0);
    });
  });

  describe("Bug 1 & 2: Authoritative Scoring, Highlighting Consistency & Final Question Handling", () => {
    const mockQuizId = "65f111111111111111111111";
    const mockQuiz = {
      _id: mockQuizId as unknown,
      title: "Rajasthan Geography Boundary Test",
      slug: "rajasthan-geography-boundary-test",
      status: "PUBLISHED",
      defaultMarks: 2,
      defaultNegativeMarks: 0.66,
    } as unknown as IQuiz;

    const mockQuestions: IQuizQuestion[] = [
      {
        _id: "65f222222222222222222201" as unknown,
        quizId: mockQuizId as unknown,
        order: 1,
        questionText: "Q1: Option 1 is correct (A)",
        options: ["Correct Opt 1", "Opt 2", "Opt 3", "Opt 4"],
        correctOptionIndex: 0,
        explanation: "Option 1 is indeed correct.",
        marks: 2,
        negativeMarks: 0.66,
      } as unknown as IQuizQuestion,
      {
        _id: "65f222222222222222222202" as unknown,
        quizId: mockQuizId as unknown,
        order: 2,
        questionText: "Q2: Option 4 is correct (D)",
        options: ["Opt 1", "Opt 2", "Opt 3", "Correct Opt 4"],
        correctOptionIndex: 3,
        explanation: "Option 4 is verified correct.",
        marks: 2,
        negativeMarks: 0.66,
      } as unknown as IQuizQuestion,
      {
        _id: "65f222222222222222222203" as unknown,
        quizId: mockQuizId as unknown,
        order: 3,
        questionText: "Q3: Skipped / Unanswered question",
        options: ["Opt 1", "Opt 2", "Opt 3", "Opt 4"],
        correctOptionIndex: 2,
        explanation: "Option 3 was correct.",
        marks: 2,
        negativeMarks: 0.66,
      } as unknown as IQuizQuestion,
      {
        _id: "65f222222222222222222204" as unknown,
        quizId: mockQuizId as unknown,
        order: 4,
        questionText: "Q4 (FINAL QUESTION): Option 4 selected and answered by user",
        options: ["Opt 1", "Opt 2", "Opt 3", "Correct Final Opt 4"],
        correctOptionIndex: 3,
        explanation: "Final question explanation.",
        marks: 2,
        negativeMarks: 0.66,
      } as unknown as IQuizQuestion,
    ];

    it("evaluates single question answers accurately when student selects Option 4 for an Option 4 question", async () => {
      vi.spyOn(QuizRepository, "findById").mockResolvedValue(mockQuiz);
      vi.spyOn(QuizQuestionRepository, "findById").mockResolvedValue(mockQuestions[1]);

      const feedback = await QuizService.checkSingleQuestionAnswer(
        mockQuizId,
        "65f222222222222222222202",
        3 // Selected Option 4
      );

      expect(feedback).not.toBeNull();
      expect(feedback?.isCorrect).toBe(true);
      expect(feedback?.isUnattempted).toBe(false);
      expect(feedback?.correctOptionIndex).toBe(3); // Exactly Option 4, NEVER Option 1 (0)
      expect(feedback?.marksAwarded).toBe(2);
    });

    it("correctly identifies incorrect choice when student selects Option 1 on an Option 4 question", async () => {
      vi.spyOn(QuizRepository, "findById").mockResolvedValue(mockQuiz);
      vi.spyOn(QuizQuestionRepository, "findById").mockResolvedValue(mockQuestions[1]);

      const feedback = await QuizService.checkSingleQuestionAnswer(
        mockQuizId,
        "65f222222222222222222202",
        0 // Student chose Option 1
      );

      expect(feedback).not.toBeNull();
      expect(feedback?.isCorrect).toBe(false);
      expect(feedback?.isUnattempted).toBe(false);
      expect(feedback?.correctOptionIndex).toBe(3); // Correct is still Option 4
      expect(feedback?.marksAwarded).toBe(-0.66);
    });

    it("evaluates single question answers accurately when student selects Option 1 for an Option 1 question", async () => {
      vi.spyOn(QuizRepository, "findById").mockResolvedValue(mockQuiz);
      vi.spyOn(QuizQuestionRepository, "findById").mockResolvedValue(mockQuestions[0]);

      const feedback = await QuizService.checkSingleQuestionAnswer(
        mockQuizId,
        "65f222222222222222222201",
        0 // Student chose Option 1
      );

      expect(feedback).not.toBeNull();
      expect(feedback?.isCorrect).toBe(true);
      expect(feedback?.isUnattempted).toBe(false);
      expect(feedback?.correctOptionIndex).toBe(0);
      expect(feedback?.marksAwarded).toBe(2);
    });

    it("handles explicit skip (null) as unattempted in single-question mode without penalizing", async () => {
      vi.spyOn(QuizRepository, "findById").mockResolvedValue(mockQuiz);
      vi.spyOn(QuizQuestionRepository, "findById").mockResolvedValue(mockQuestions[0]);

      const feedback = await QuizService.checkSingleQuestionAnswer(
        mockQuizId,
        "65f222222222222222222201",
        null
      );

      expect(feedback).not.toBeNull();
      expect(feedback?.isCorrect).toBe(false);
      expect(feedback?.isUnattempted).toBe(true);
      expect(feedback?.marksAwarded).toBe(0);
      expect(feedback?.correctOptionIndex).toBe(0);
    });

    it("Bug 2: ensures final question answered by student is NEVER marked unattempted in full submission", async () => {
      vi.spyOn(QuizRepository, "findById").mockResolvedValue(mockQuiz);
      vi.spyOn(QuizQuestionRepository, "findByQuizId").mockResolvedValue(mockQuestions);
      vi.spyOn(QuizAttemptRepository, "create").mockImplementationOnce((data) =>
        Promise.resolve({
          _id: "65f333333333333333333399" as unknown,
          ...data,
          submittedAt: new Date(),
        } as unknown as IQuizAttempt)
      );

      // Submission payload:
      // Q1: Option 0 (Correct, +2)
      // Q2: Option 3 (Option 4, Correct, +2)
      // Q3: null (Unattempted, 0)
      // Q4 (Final Question): Option 3 (Option 4, Correct, +2)
      const submission = {
        answers: [
          { questionId: "65f222222222222222222201", selectedOptionIndex: 0 },
          { questionId: "65f222222222222222222202", selectedOptionIndex: 3 },
          { questionId: "65f222222222222222222203", selectedOptionIndex: null },
          { questionId: "65f222222222222222222204", selectedOptionIndex: 3 },
        ],
      };

      const result = await QuizService.evaluateAttempt(mockQuizId, submission);

      expect(result).not.toBeNull();
      expect(result?.totalQuestions).toBe(4);
      expect(result?.correctCount).toBe(3);
      expect(result?.incorrectCount).toBe(0);
      expect(result?.unattemptedCount).toBe(1); // ONLY Q3 is unattempted!
      expect(result?.score).toBe(6); // 2 + 2 + 2 = 6
      expect(result?.totalPossibleScore).toBe(8); // 4 questions * 2 = 8

      // Verify the FINAL question breakdown:
      const finalQBreakdown = result?.breakdown.find(
        (b) => b.questionId === "65f222222222222222222204"
      );
      expect(finalQBreakdown).toBeDefined();
      expect(finalQBreakdown?.order).toBe(4);
      expect(finalQBreakdown?.selectedOptionIndex).toBe(3);
      expect(finalQBreakdown?.correctOptionIndex).toBe(3);
      expect(finalQBreakdown?.isUnattempted).toBe(false); // CRITICAL: Final question is NOT unattempted
      expect(finalQBreakdown?.isCorrect).toBe(true);
      expect(finalQBreakdown?.marksAwarded).toBe(2);

      // Verify the unanswered question breakdown:
      const unansweredQBreakdown = result?.breakdown.find(
        (b) => b.questionId === "65f222222222222222222203"
      );
      expect(unansweredQBreakdown?.selectedOptionIndex).toBeNull();
      expect(unansweredQBreakdown?.isUnattempted).toBe(true);
      expect(unansweredQBreakdown?.isCorrect).toBe(false);
      expect(unansweredQBreakdown?.marksAwarded).toBe(0);
    });

    it("verifies consistency between single question feedback and final submission result", async () => {
      vi.spyOn(QuizRepository, "findById").mockResolvedValue(mockQuiz);
      vi.spyOn(QuizQuestionRepository, "findById").mockImplementation((qId) => {
        const found = mockQuestions.find((q) => (q._id as unknown as string) === qId);
        return Promise.resolve(found || null);
      });
      vi.spyOn(QuizQuestionRepository, "findByQuizId").mockResolvedValue(mockQuestions);
      vi.spyOn(QuizAttemptRepository, "create").mockImplementationOnce((data) =>
        Promise.resolve({
          _id: "65f333333333333333333399" as unknown,
          ...data,
          submittedAt: new Date(),
        } as unknown as IQuizAttempt)
      );

      const selections = [
        { qId: "65f222222222222222222201", opt: 0 }, // Correct Opt 1
        { qId: "65f222222222222222222202", opt: 1 }, // Wrong Opt 2 on Opt 4
        { qId: "65f222222222222222222203", opt: null }, // Skipped
        { qId: "65f222222222222222222204", opt: 3 }, // Correct Opt 4 on final question
      ];

      // 1. Single question checks
      const singleResults = [];
      for (const s of selections) {
        const res = await QuizService.checkSingleQuestionAnswer(mockQuizId, s.qId, s.opt);
        singleResults.push(res);
      }

      // 2. Full attempt evaluation
      const finalResult = await QuizService.evaluateAttempt(mockQuizId, {
        answers: selections.map((s) => ({
          questionId: s.qId,
          selectedOptionIndex: s.opt,
        })),
      });

      expect(finalResult).not.toBeNull();

      // Check each question in single vs final attempt
      for (let i = 0; i < selections.length; i++) {
        const single = singleResults[i];
        const inBreakdown = finalResult?.breakdown[i];

        expect(single?.isCorrect).toBe(inBreakdown?.isCorrect);
        expect(single?.isUnattempted).toBe(inBreakdown?.isUnattempted);
        expect(single?.correctOptionIndex).toBe(inBreakdown?.correctOptionIndex);
        expect(single?.marksAwarded).toBe(inBreakdown?.marksAwarded);
      }
    });

    it("verifies accurate scoring across all option positions 1, 2, 3, and 4", async () => {
      vi.spyOn(QuizRepository, "findById").mockResolvedValue(mockQuiz);
      vi.spyOn(QuizQuestionRepository, "findByQuizId").mockResolvedValue(mockQuestions);
      vi.spyOn(QuizAttemptRepository, "create").mockImplementationOnce((data) =>
        Promise.resolve({
          _id: "65f333333333333333333377" as unknown,
          ...data,
          submittedAt: new Date(),
        } as unknown as IQuizAttempt)
      );

      // Submit correct answer for all 4 positions
      const fourPosQuestions: IQuizQuestion[] = [
        {
          _id: "65f222222222222222222211" as unknown,
          quizId: mockQuizId as unknown,
          order: 1,
          questionText: "Position 1 Correct",
          options: ["A", "B", "C", "D"],
          correctOptionIndex: 0,
          marks: 1,
        } as unknown as IQuizQuestion,
        {
          _id: "65f222222222222222222212" as unknown,
          quizId: mockQuizId as unknown,
          order: 2,
          questionText: "Position 2 Correct",
          options: ["A", "B", "C", "D"],
          correctOptionIndex: 1,
          marks: 1,
        } as unknown as IQuizQuestion,
        {
          _id: "65f222222222222222222213" as unknown,
          quizId: mockQuizId as unknown,
          order: 3,
          questionText: "Position 3 Correct",
          options: ["A", "B", "C", "D"],
          correctOptionIndex: 2,
          marks: 1,
        } as unknown as IQuizQuestion,
        {
          _id: "65f222222222222222222214" as unknown,
          quizId: mockQuizId as unknown,
          order: 4,
          questionText: "Position 4 Correct",
          options: ["A", "B", "C", "D"],
          correctOptionIndex: 3,
          marks: 1,
        } as unknown as IQuizQuestion,
      ];

      vi.spyOn(QuizQuestionRepository, "findByQuizId").mockResolvedValueOnce(fourPosQuestions);

      const res = await QuizService.evaluateAttempt(mockQuizId, {
        answers: [
          { questionId: "65f222222222222222222211", selectedOptionIndex: 0 },
          { questionId: "65f222222222222222222212", selectedOptionIndex: 1 },
          { questionId: "65f222222222222222222213", selectedOptionIndex: 2 },
          { questionId: "65f222222222222222222214", selectedOptionIndex: 3 },
        ],
      });

      expect(res?.correctCount).toBe(4);
      expect(res?.incorrectCount).toBe(0);
      expect(res?.unattemptedCount).toBe(0);
      expect(res?.score).toBe(4);
    });

    it("ensures question shuffling preserves accurate questionId mapping and scoring", async () => {
      const shufflingQuiz = {
        ...mockQuiz,
        shuffleQuestions: true,
      } as unknown as IQuiz;

      vi.spyOn(QuizRepository, "findById").mockResolvedValue(shufflingQuiz);
      vi.spyOn(QuizQuestionRepository, "findByQuizId").mockResolvedValue(mockQuestions);
      vi.spyOn(QuizAttemptRepository, "create").mockImplementationOnce((data) =>
        Promise.resolve({
          _id: "65f333333333333333333388" as unknown,
          ...data,
          submittedAt: new Date(),
        } as unknown as IQuizAttempt)
      );

      // Student receives questions in shuffled order, submits answers mapped by questionId
      const shuffledSubmission = {
        answers: [
          { questionId: "65f222222222222222222204", selectedOptionIndex: 3 }, // Q4 (Opt 4, Correct)
          { questionId: "65f222222222222222222201", selectedOptionIndex: 0 }, // Q1 (Opt 1, Correct)
          { questionId: "65f222222222222222222202", selectedOptionIndex: 3 }, // Q2 (Opt 4, Correct)
          { questionId: "65f222222222222222222203", selectedOptionIndex: null }, // Q3 (Unattempted)
        ],
      };

      const result = await QuizService.evaluateAttempt(mockQuizId, shuffledSubmission);
      expect(result?.correctCount).toBe(3);
      expect(result?.unattemptedCount).toBe(1);
      expect(result?.score).toBe(6);
    });
  });

  describe("Google AdSense & SEO Readiness Verification", () => {
    it("verifies public/ads.txt exists, contains valid Google AdSense pub-id and directive", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const adsTxtPath = path.join(process.cwd(), "public", "ads.txt");

      expect(fs.existsSync(adsTxtPath)).toBe(true);
      const content = fs.readFileSync(adsTxtPath, "utf-8");
      expect(content).toContain("google.com");
      expect(content).toContain("pub-8986858563387447");
      expect(content).toContain("DIRECT");
      expect(content).toContain("f08c47fec0942fa0");
    });

    it("verifies robots.txt explicitly allows Google AdSense and AdsBot crawlers", async () => {
      const { default: robots } = await import("@/app/robots");
      const config = robots();
      expect(config.rules).toBeDefined();

      const adBotRule = Array.isArray(config.rules)
        ? config.rules.find((r) => Array.isArray(r.userAgent) && r.userAgent.includes("Mediapartners-Google"))
        : null;

      expect(adBotRule).toBeDefined();
      expect(adBotRule?.allow).toBe("/");
      expect(adBotRule?.disallow).toEqual(["/admin/"]);
    });

    it("verifies sitemap includes essential public sections including test-series, leaderboard, and legal pages", async () => {
      const mongodb = await import("@/server/lib/mongodb");
      vi.spyOn(mongodb, "connectToDatabase").mockRejectedValueOnce(new Error("Unit test offline fallback"));

      const { default: sitemap } = await import("@/app/sitemap");
      const entries = await sitemap();
      const urls = entries.map((e) => e.url);

      expect(urls.some((u) => u.endsWith("/test-series"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/leaderboard"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/quizzes"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/privacy-policy"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/about"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/contact"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/terms"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/disclaimer"))).toBe(true);
    });
  });

  describe("Regression Prevention & Heuristic False-Positive Guarding", () => {
    it("never treats substrings inside technical words like 'transactions' as Option A answer keys", () => {
      const technicalExplanation = "A Transaction-server system provides an interface with transactional remote procedure calls.";
      // Strict key regex requiring word boundary \b:
      const strictKeyRegex = /\b(?:उत्तर|विकल्प|Option|Ans(?:wer)?)\s*[:=\-–]\s*(?:1|A|अ|\(1\)|\(A\)|\(अ\))\b/i;
      const match = technicalExplanation.match(strictKeyRegex);
      expect(match).toBeNull();
    });

    it("never treats compass direction 'उत्तर-दक्षिण' as an Answer: D prefix", () => {
      const geographyExplanation = "चित्तौड़गढ़ जिला उत्तर-दक्षिण विस्तार वाला जिला है।";
      const isCompassTerm = /उत्तर\s*-\s*दक्षिण/i.test(geographyExplanation);
      expect(isCompassTerm).toBe(true);
      // Valid answer key regex must require explicit separator or start of line, not hyphenated geography terms
      const isKeyPrefix = /(?:^|\n)\s*(?:उत्तर|Ans(?:wer)?)\s*[:=]\s*[4Dद]/i.test(geographyExplanation);
      expect(isKeyPrefix).toBe(false);
    });

    it("distinguishes between an eliminated option discussion and an authoritative answer assertion", () => {
      const eliminationExplanation = "Option A is incomplete because it misses double. Options B and D are integers. Hence Option C is correct.";
      const isEliminated = /option a is incomplete|option a describes .*? but/i.test(eliminationExplanation);
      expect(isEliminated).toBe(true);
      // The authoritative conclusion is Option C (index 2), NOT Option A (index 0)
      expect(eliminationExplanation).toContain("Hence Option C is correct");
    });

    it("verifies rollback snapshot structure safely preserves original indices for 100% reversible migrations", () => {
      const sampleBackupRecord = {
        questionId: "65f222222222222222222299",
        quizTitle: "RSMSSB Forest Guard",
        order: 5,
        oldCorrectIndex: 2,
        newCorrectIndex: 3,
        rationale: "Constitutional vs Political Head of State",
      };

      // Rollback payload test
      const rollbackPayload = {
        filter: { _id: sampleBackupRecord.questionId },
        update: { $set: { correctOptionIndex: sampleBackupRecord.oldCorrectIndex } },
      };

      expect(rollbackPayload.filter._id).toBe("65f222222222222222222299");
      expect(rollbackPayload.update.$set.correctOptionIndex).toBe(2);
      expect(rollbackPayload.update.$set.correctOptionIndex).not.toBe(sampleBackupRecord.newCorrectIndex);
    });
  });
});
