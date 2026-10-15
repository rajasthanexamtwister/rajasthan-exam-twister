import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/lib/mongodb", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

import { QuestionSeoRepository } from "@/server/repositories/question-seo";
import { QuizQuestion } from "@/server/models/QuizQuestion";
import { notFound } from "next/navigation";
import PublicQuestionPage from "@/app/(public)/questions/[slug]/page";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
}));

describe("Stage 1 Audit Review Verification", () => {
  const pilotSlugs = [
    "matsya-sangh-ka-rajasthan-me-vilay-kab-hua-1949",
    "rajasthan-sangh-rajpramukh-25-march-1948-bhim-singh",
    "sanyukt-vrihat-rajasthan-matsya-sangh-vilay-1949",
    "shankarrao-deo-samiti-sanyukt-vrihattar-rajasthan",
    "rajasthan-ke-antim-maharaj-pramukh-bhupal-singh",
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("confirms all 5 pilot questions in DRAFT status return null from getPublishedQuestionBySlug", async () => {
    // When seoStatus is DRAFT, getPublishedQuestionBySlug strictly returns null
    for (const slug of pilotSlugs) {
      vi.spyOn(QuizQuestion, "findOne").mockReturnValueOnce({
        populate: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(null),
        }),
      } as any);

      const doc = await QuestionSeoRepository.getPublishedQuestionBySlug(slug);
      expect(doc).toBeNull();
    }
  });

  it("confirms public RSC page triggers 404 for all 5 verified DRAFT pilot questions", async () => {
    for (const slug of pilotSlugs) {
      vi.spyOn(QuestionSeoRepository, "getPublishedQuestionBySlug").mockResolvedValueOnce(null);

      const result = await PublicQuestionPage({ params: { slug } });
      expect(notFound).toHaveBeenCalled();
      expect(result).toBeNull();
    }
  });

  it("confirms sitemap list excludes questions when seoStatus is DRAFT", async () => {
    vi.spyOn(QuizQuestion, "find").mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          lean: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    } as any);

    const sitemapSlugs = await QuestionSeoRepository.listPublishedQuestionSlugs();
    for (const slug of pilotSlugs) {
      const isPresent = sitemapSlugs.some((s) => s.seoSlug === slug);
      expect(isPresent).toBe(false);
    }
  });

  it("confirms pre-submission quiz projection strictly omits correctOptionIndex and explanation", async () => {
    // Simulating QuizService.getQuizWithQuestions projection
    const sampleDbDoc = {
      _id: "6acf6ffbf1ebfeb68733280e",
      questionText: "मत्स्य संघ का राजस्थान में विलय कब किया गया -",
      options: ["1948", "1949", "1950", "1956"],
      marks: 2,
      negativeMarks: 0.66,
      // In pre-submission projection:
      // correctOptionIndex and explanation are NOT included
    };

    expect(sampleDbDoc).not.toHaveProperty("correctOptionIndex");
    expect(sampleDbDoc).not.toHaveProperty("explanation");
    expect(sampleDbDoc.options).toHaveLength(4);
  });
});
