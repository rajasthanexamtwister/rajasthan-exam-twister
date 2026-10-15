import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/server/lib/mongodb", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/server/lib/token", () => ({
  getSessionFromRequest: vi.fn(),
}));

import { getSessionFromRequest } from "@/server/lib/token";
import { POST, DELETE } from "@/app/api/quizzes/[id]/questions/[questionId]/verify/route";
import { QuizQuestion } from "@/server/models/QuizQuestion";
import { QuestionSeoRepository } from "@/server/repositories/question-seo";

describe("Auditable Admin Question SEO Verification API", () => {
  const quizId = "6acf7fe10b5a464f9e89845a";
  const questionId = "6acf7fe10b5a464f9e89845b";

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should reject requests without admin session with 401", async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost/api/quizzes/" + quizId + "/questions/" + questionId + "/verify", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const res = await POST(req, { params: { id: quizId, questionId } });
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.error.code).toBe("UNAUTHORIZED");
  });

  it("should reject invalid verification payload with 400", async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce({
      adminId: "admin-1",
      email: "editor@rajasthanexamtwister.in",
    });

    const req = new NextRequest("http://localhost/api/quizzes/" + quizId + "/questions/" + questionId + "/verify", {
      method: "POST",
      body: JSON.stringify({
        verifiedOptionIndex: "invalid", // should be number
      }),
    });

    const res = await POST(req, { params: { id: quizId, questionId } });
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error.code).toBe("VALIDATION_ERROR");
  });

  it("should reject verification when verifiedOptionIndex mismatches correctOptionIndex", async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce({
      adminId: "admin-1",
      email: "auditor@rajasthanexamtwister.in",
    });

    vi.spyOn(QuizQuestion, "findById").mockResolvedValueOnce({
      _id: questionId,
      quizId: { toString: () => quizId },
      correctOptionIndex: 2,
      explanation: "Valid explanation",
      save: vi.fn().mockResolvedValue(true),
    } as any);

    vi.spyOn(QuestionSeoRepository, "verifyAndPublishQuestion").mockRejectedValueOnce(
      new Error("Answer mapping audit failed: verifiedOptionIndex (1) does not match existing correctOptionIndex (2).")
    );

    const req = new NextRequest("http://localhost/api/quizzes/" + quizId + "/questions/" + questionId + "/verify", {
      method: "POST",
      body: JSON.stringify({
        verifiedOptionIndex: 1, // Mismatched!
        verificationSource: "RPSC RAS Pre 2021 Official Key Q42",
        seoSlug: "test-question-slug",
      }),
    });

    const res = await POST(req, { params: { id: quizId, questionId } });
    expect(res.status).toBe(422);

    const json = await res.json();
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(json.error.message).toContain("Answer mapping audit failed");
  });

  it("should successfully verify and publish question when audit checks pass", async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce({
      adminId: "admin-1",
      email: "auditor@rajasthanexamtwister.in",
    });

    vi.spyOn(QuizQuestion, "findById").mockResolvedValueOnce({
      _id: questionId,
      quizId: { toString: () => quizId },
      correctOptionIndex: 1,
      explanation: "Valid explanation",
      save: vi.fn().mockResolvedValue(true),
    } as any);

    vi.spyOn(QuestionSeoRepository, "verifyAndPublishQuestion").mockResolvedValueOnce({
      _id: questionId,
      seoStatus: "PUBLISHED",
      isAnswerVerified: true,
      verifiedOptionIndex: 1,
      verificationSource: "RPSC RAS Pre 2021 Official Key Q42",
      reviewedBy: "auditor@rajasthanexamtwister.in",
      seoSlug: "hindi-varnamala-swar-sankhya",
    } as any);

    const req = new NextRequest("http://localhost/api/quizzes/" + quizId + "/questions/" + questionId + "/verify", {
      method: "POST",
      body: JSON.stringify({
        verifiedOptionIndex: 1,
        verificationSource: "RPSC RAS Pre 2021 Official Key Q42",
        seoSlug: "hindi-varnamala-swar-sankhya",
      }),
    });

    const res = await POST(req, { params: { id: quizId, questionId } });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.question.seoStatus).toBe("PUBLISHED");
    expect(json.question.isAnswerVerified).toBe(true);
    expect(json.question.reviewedBy).toBe("auditor@rajasthanexamtwister.in");
  });

  it("should keep question in DRAFT when publishImmediately is false", async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce({
      adminId: "admin-1",
      email: "auditor@rajasthanexamtwister.in",
    });

    vi.spyOn(QuizQuestion, "findById").mockResolvedValueOnce({
      _id: questionId,
      quizId: { toString: () => quizId },
      correctOptionIndex: 1,
      explanation: "Valid explanation",
      save: vi.fn().mockResolvedValue(true),
    } as any);

    vi.spyOn(QuestionSeoRepository, "verifyAndPublishQuestion").mockResolvedValueOnce({
      _id: questionId,
      seoStatus: "DRAFT",
      isAnswerVerified: true,
      verifiedOptionIndex: 1,
      verificationSource: "RPSC RAS Pre 2021 Official Key Q42",
      reviewedBy: "auditor@rajasthanexamtwister.in",
      seoSlug: "hindi-varnamala-swar-sankhya",
    } as any);

    const req = new NextRequest("http://localhost/api/quizzes/" + quizId + "/questions/" + questionId + "/verify", {
      method: "POST",
      body: JSON.stringify({
        verifiedOptionIndex: 1,
        verificationSource: "RPSC RAS Pre 2021 Official Key Q42",
        seoSlug: "hindi-varnamala-swar-sankhya",
        publishImmediately: false,
      }),
    });

    const res = await POST(req, { params: { id: quizId, questionId } });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.question.seoStatus).toBe("DRAFT");
    expect(json.question.isAnswerVerified).toBe(true);
  });

  it("should successfully revert question to DRAFT on DELETE", async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValueOnce({
      adminId: "admin-1",
      email: "auditor@rajasthanexamtwister.in",
    });

    const mockQuestion = {
      _id: questionId,
      seoStatus: "PUBLISHED",
      isAnswerVerified: true,
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(QuizQuestion, "findById").mockResolvedValueOnce(mockQuestion as any);

    const req = new NextRequest("http://localhost/api/quizzes/" + quizId + "/questions/" + questionId + "/verify", {
      method: "DELETE",
    });

    const res = await DELETE(req, { params: { id: quizId, questionId } });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.seoStatus).toBe("DRAFT");
    expect(json.isAnswerVerified).toBe(false);
    expect(mockQuestion.seoStatus).toBe("DRAFT");
  });
});
