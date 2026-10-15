import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import {
  CreateQuestionReportSchema,
  UpdateQuestionReportStatusSchema,
  CorrectQuestionSchema,
  QUESTION_ISSUE_REASONS,
  REASON_CONFIG,
} from "@/server/validation/question-report";

describe("Question Issue Reporting & Correction Workflow", () => {
  describe("Zod Validation Schemas", () => {
    it("accepts all 6 valid issue categories", () => {
      const reasons = [
        "INCORRECT_ANSWER",
        "INCORRECT_QUESTION",
        "OPTIONS_INCORRECT",
        "INCORRECT_EXPLANATION",
        "SPELLING_TYPO",
        "OTHER",
      ] as const;

      expect(QUESTION_ISSUE_REASONS).toEqual(reasons);

      reasons.forEach((reason) => {
        const payload = {
          reason,
          description: reason === "OTHER" ? "Specific details about the question error" : "",
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

    it("allows optional description for the other 5 reasons", () => {
      const optionalReasons = [
        "INCORRECT_ANSWER",
        "INCORRECT_QUESTION",
        "OPTIONS_INCORRECT",
        "INCORRECT_EXPLANATION",
        "SPELLING_TYPO",
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

    it("validates admin status updates including UNDER_REVIEW and evidence fields", () => {
      const validStatuses = ["PENDING", "UNDER_REVIEW", "RESOLVED", "REJECTED"];
      validStatuses.forEach((status) => {
        const result = UpdateQuestionReportStatusSchema.safeParse({
          status,
          adminNotes: "Internal discussion notes",
          assignedTo: "editor@rajasthanexamtwister.in",
          evidenceSource: "RSSB Official Key 2024",
          resolutionReason: "Question verified against official master paper",
          studentFeedback: "Thank you, this question has been audited.",
        });
        expect(result.success).toBe(true);
      });

      const invalid = UpdateQuestionReportStatusSchema.safeParse({
        status: "INVALID_STATUS",
      });
      expect(invalid.success).toBe(false);
    });

    it("validates safe question correction schema", () => {
      const validCorrection = {
        questionText: "राजस्थान का राज्य पक्षी कौन सा है?",
        options: ["मोर", "गोडावण", "तोता", "कोयल"],
        correctOptionIndex: 1,
        explanation: "गोडावण (Great Indian Bustard) राजस्थान का राज्य पक्षी है।",
        evidenceSource: "राजस्थान हिंदी ग्रंथ अकादमी - राजस्थान का भूगोल",
        changeReason: "टाइपिंग त्रुटि को ठीक किया गया और सही व्याख्या जोड़ी गई।",
        studentFeedback: "रिपोर्ट के आधार पर प्रश्न और उत्तर को संशोधित कर दिया गया है।",
      };

      const result = CorrectQuestionSchema.safeParse(validCorrection);
      expect(result.success).toBe(true);
    });

    it("rejects correction if correctOptionIndex is out of bounds", () => {
      const outOfBounds = {
        questionText: "राजस्थान का राज्य पक्षी कौन सा है?",
        options: ["मोर", "गोडावण"],
        correctOptionIndex: 5, // out of bounds
        evidenceSource: "Official Key",
        changeReason: "Correction",
      };

      const result = CorrectQuestionSchema.safeParse(outOfBounds);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("out of bounds");
      }
    });

    it("rejects correction if evidenceSource or changeReason is missing", () => {
      const missingEvidence = {
        questionText: "राजस्थान का राज्य पक्षी कौन सा है?",
        options: ["मोर", "गोडावण"],
        correctOptionIndex: 1,
        evidenceSource: "", // empty
        changeReason: "Reason",
      };

      const result = CorrectQuestionSchema.safeParse(missingEvidence);
      expect(result.success).toBe(false);
    });
  });

  describe("Reason Configuration & Labels", () => {
    it("provides the exact 6 human-readable labels and Hindi translations", () => {
      expect(REASON_CONFIG.INCORRECT_ANSWER.label).toBe("Incorrect Answer");
      expect(REASON_CONFIG.INCORRECT_QUESTION.label).toBe("Incorrect Question");
      expect(REASON_CONFIG.OPTIONS_INCORRECT.label).toBe("Wrong Options");
      expect(REASON_CONFIG.INCORRECT_EXPLANATION.label).toBe("Incorrect Explanation");
      expect(REASON_CONFIG.SPELLING_TYPO.label).toBe("Typo / Formatting");
      expect(REASON_CONFIG.OTHER.label).toBe("Other");

      expect(REASON_CONFIG.OTHER.descriptionRequired).toBe(true);
      expect(REASON_CONFIG.INCORRECT_ANSWER.descriptionRequired).toBe(false);
      expect(REASON_CONFIG.INCORRECT_EXPLANATION.descriptionRequired).toBe(false);
    });
  });

  describe("Report Model Schema & Field Constraints", () => {
    it("ensures ObjectId references, status defaults, and review fields are configured", async () => {
      const { QuestionIssueReport } = await import("@/server/models/QuestionIssueReport");
      expect(QuestionIssueReport.schema.path("quizId")).toBeDefined();
      expect(QuestionIssueReport.schema.path("questionId")).toBeDefined();
      expect(QuestionIssueReport.schema.path("status")).toBeDefined();
      expect(QuestionIssueReport.schema.path("reason")).toBeDefined();
      expect(QuestionIssueReport.schema.path("assignedTo")).toBeDefined();
      expect(QuestionIssueReport.schema.path("evidenceSource")).toBeDefined();
      expect(QuestionIssueReport.schema.path("studentFeedback")).toBeDefined();
      expect(QuestionIssueReport.schema.path("status").options.default).toBe("PENDING");
    });

    it("ensures QuizQuestion model contains auditTrail field", async () => {
      const { QuizQuestion } = await import("@/server/models/QuizQuestion");
      expect(QuizQuestion.schema.path("auditTrail")).toBeDefined();
      expect(QuizQuestion.schema.path("seoStatus")).toBeDefined();
      expect(QuizQuestion.schema.path("isAnswerVerified")).toBeDefined();
    });
  });

  describe("API Handler Logic & Security Mocking", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("rejects unauthorized access to admin question reports list route", async () => {
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

    it("rejects unauthorized access to admin question report detail route", async () => {
      vi.doMock("@/server/lib/token", () => ({
        getSessionFromRequest: vi.fn().mockResolvedValue(null),
      }));

      const { GET } = await import("@/app/api/admin/question-reports/[id]/route");
      const fakeRequest = new Request("http://localhost:3000/api/admin/question-reports/507f1f77bcf86cd799439011") as any;

      const response = await GET(fakeRequest, { params: { id: "507f1f77bcf86cd799439011" } });
      expect(response.status).toBe(401);
    });

    it("rejects unauthorized access to admin safe correction route", async () => {
      vi.doMock("@/server/lib/token", () => ({
        getSessionFromRequest: vi.fn().mockResolvedValue(null),
      }));

      const { POST } = await import("@/app/api/admin/question-reports/[id]/correct/route");
      const fakeRequest = new Request("http://localhost:3000/api/admin/question-reports/507f1f77bcf86cd799439011/correct", {
        method: "POST",
        body: JSON.stringify({}),
      }) as any;

      const response = await POST(fakeRequest, { params: { id: "507f1f77bcf86cd799439011" } });
      expect(response.status).toBe(401);
    });

    it("rejects unauthenticated access to student question reports route", async () => {
      vi.doMock("next-auth", () => ({
        getServerSession: vi.fn().mockResolvedValue(null),
      }));

      const { GET } = await import("@/app/api/student/question-reports/route");
      const fakeRequest = new Request("http://localhost:3000/api/student/question-reports") as any;

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
