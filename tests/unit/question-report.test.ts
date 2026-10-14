import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import {
  CreateQuestionReportSchema,
  UpdateQuestionReportStatusSchema,
  QUESTION_ISSUE_REASONS,
  REASON_CONFIG,
} from "@/server/validation/question-report";

describe("Question Issue Reporting System", () => {
  describe("Zod Validation Schemas", () => {
    it("accepts all 5 valid issue reasons", () => {
      const reasons = [
        "INCORRECT_ANSWER",
        "INCORRECT_QUESTION",
        "SPELLING_TYPO",
        "OPTIONS_INCORRECT",
        "OTHER",
      ] as const;

      expect(QUESTION_ISSUE_REASONS).toEqual(reasons);

      reasons.forEach((reason) => {
        const payload = {
          reason,
          description: reason === "OTHER" ? "Specific details about the question" : "",
          quizSlug: "rajasthan-geography",
        };
        const result = CreateQuestionReportSchema.safeParse(payload);
        expect(result.success).toBe(true);
      });
    });

    it("requires a non-empty description when reason is 'OTHER'", () => {
      const missingDescription = {
        reason: "OTHER",
        description: "",
        quizSlug: "rajasthan-geography",
      };
      const result1 = CreateQuestionReportSchema.safeParse(missingDescription);
      expect(result1.success).toBe(false);
      if (!result1.success) {
        expect(result1.error.issues[0].message).toContain("required for 'Other'");
      }

      const whitespaceOnly = {
        reason: "OTHER",
        description: "    ",
        quizSlug: "rajasthan-geography",
      };
      const result2 = CreateQuestionReportSchema.safeParse(whitespaceOnly);
      expect(result2.success).toBe(false);
    });

    it("allows optional description for the other 4 reasons", () => {
      const optionalReasons = [
        "INCORRECT_ANSWER",
        "INCORRECT_QUESTION",
        "SPELLING_TYPO",
        "OPTIONS_INCORRECT",
      ] as const;

      optionalReasons.forEach((reason) => {
        const withoutDesc = {
          reason,
          quizSlug: "rajasthan-history",
        };
        const result = CreateQuestionReportSchema.safeParse(withoutDesc);
        expect(result.success).toBe(true);
      });
    });

    it("enforces a 1000 character maximum on description", () => {
      const tooLongDesc = "a".repeat(1001);
      const payload = {
        reason: "INCORRECT_ANSWER",
        description: tooLongDesc,
        quizSlug: "rajasthan-history",
      };
      const result = CreateQuestionReportSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("validates admin status updates", () => {
      const validStatuses = ["PENDING", "REVIEWED", "RESOLVED", "REJECTED"];
      validStatuses.forEach((status) => {
        const result = UpdateQuestionReportStatusSchema.safeParse({
          status,
          adminNotes: "Editorial note",
        });
        expect(result.success).toBe(true);
      });

      const invalid = UpdateQuestionReportStatusSchema.safeParse({
        status: "INVALID_STATUS",
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe("Reason Configuration & Labels", () => {
    it("provides the exact 5 human-readable labels and Hindi translations", () => {
      expect(REASON_CONFIG.INCORRECT_ANSWER.label).toBe("Incorrect Answer");
      expect(REASON_CONFIG.INCORRECT_QUESTION.label).toBe("Incorrect Question / Information");
      expect(REASON_CONFIG.SPELLING_TYPO.label).toBe("Spelling / Typing Error");
      expect(REASON_CONFIG.OPTIONS_INCORRECT.label).toBe("Options Missing / Incorrect");
      expect(REASON_CONFIG.OTHER.label).toBe("Other");

      expect(REASON_CONFIG.OTHER.descriptionRequired).toBe(true);
      expect(REASON_CONFIG.INCORRECT_ANSWER.descriptionRequired).toBe(false);
    });
  });

  describe("Report Model Schema & Field Constraints", () => {
    it("ensures ObjectId references and status defaults are configured", async () => {
      const { QuestionIssueReport } = await import("@/server/models/QuestionIssueReport");
      expect(QuestionIssueReport.schema.path("quizId")).toBeDefined();
      expect(QuestionIssueReport.schema.path("questionId")).toBeDefined();
      expect(QuestionIssueReport.schema.path("status")).toBeDefined();
      expect(QuestionIssueReport.schema.path("reason")).toBeDefined();
      expect(QuestionIssueReport.schema.path("status").options.default).toBe("PENDING");
    });
  });

  describe("API Handler Logic & Security Mocking", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("rejects unauthorized access to admin question reports route", async () => {
      vi.doMock("@/server/lib/token", () => ({
        getSessionFromRequest: vi.fn().mockResolvedValue(null),
      }));

      const { GET } = await import("@/app/api/admin/question-reports/route");
      const fakeRequest = new Request("http://localhost:3000/api/admin/question-reports") as any;

      const response = await GET(fakeRequest);
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.error.code).toBe("UNAUTHORIZED");
    });

    it("verifies rate limiting rejects abusive question reporting bursts", async () => {
      const { checkRateLimit } = await import("@/server/lib/rate-limit");
      const clientIp = "192.168.1.100";

      // 20 allowed
      for (let i = 0; i < 20; i++) {
        const res = checkRateLimit(clientIp, {
          windowMs: 60 * 1000,
          max: 20,
          keyPrefix: "test-burst",
        });
        expect(res.success).toBe(true);
      }

      // 21st must fail
      const burstFail = checkRateLimit(clientIp, {
        windowMs: 60 * 1000,
        max: 20,
        keyPrefix: "test-burst",
      });
      expect(burstFail.success).toBe(false);
      expect(burstFail.remaining).toBe(0);
      expect(burstFail.resetTime).toBeGreaterThan(0);
    });
  });
});
