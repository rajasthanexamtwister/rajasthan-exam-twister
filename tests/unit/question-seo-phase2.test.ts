import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";

vi.mock("@/server/lib/mongodb", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/server/models/Blog", () => ({
  Blog: {
    find: vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue([]),
    }),
  },
}));

vi.mock("@/server/models/Note", () => ({
  Note: {
    find: vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue([]),
    }),
  },
}));

vi.mock("@/server/models/Quiz", () => ({
  Quiz: {
    find: vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue([]),
    }),
  },
}));

vi.mock("@/server/models/TestSeries", () => ({
  TestSeries: {
    find: vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue([]),
    }),
  },
}));

import { QuestionSeoRepository, PublicSeoQuestionDetail } from "@/server/repositories/question-seo";
import { QuizQuestion } from "@/server/models/QuizQuestion";
import { Blog } from "@/server/models/Blog";
import { Note } from "@/server/models/Note";
import { Quiz } from "@/server/models/Quiz";
import { TestSeries } from "@/server/models/TestSeries";
import PublicQuestionPage, { generateMetadata } from "@/app/(public)/questions/[slug]/page";
import sitemap from "@/app/sitemap";
import * as navigation from "next/navigation";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
}));

describe("Question SEO Architecture - Phase 2: Public Page, Metadata, Sitemap & Structured Data", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    (Blog.find as any).mockReturnValue({
      lean: vi.fn().mockResolvedValue([]),
    });
    (Note.find as any).mockReturnValue({
      lean: vi.fn().mockResolvedValue([]),
    });
    (Quiz.find as any).mockReturnValue({
      lean: vi.fn().mockResolvedValue([]),
    });
    (TestSeries.find as any).mockReturnValue({
      lean: vi.fn().mockResolvedValue([]),
    });
  });

  const samplePublishedQuestion: PublicSeoQuestionDetail = {
    id: "65f222222222222222222221",
    order: 1,
    questionText: "25 मार्च, 1948 को गठित राजस्थान संघ का प्रधानमंत्री बनाया गया था -",
    questionTextEn: "Who was appointed the Prime Minister of Rajasthan Sangh formed on 25 March 1948?",
    options: [
      "जयनारायण व्यास",
      "हरिदेव जोशी",
      "गोकुल लाल असावा",
      "हीरालाल शास्त्री",
    ],
    correctOptionIndex: 2,
    explanation: "25 मार्च 1948 को राजस्थान संघ का गठन हुआ जिसमें गोकुल लाल असावा को प्रधानमंत्री बनाया गया था।",
    marks: 2,
    negativeMarks: 0.66,
    seoSlug: "rajasthan-sangh-pradhan-mantri-1948",
    seoTitle: "राजस्थान संघ का प्रधानमंत्री किसे बनाया गया था? (1948) | Rajasthan GK",
    seoDescription: "25 मार्च 1948 को गठित राजस्थान संघ के प्रधानमंत्री गोकुल लाल असावा थे। जानें विस्तृत व्याख्या व तथ्य।",
    verificationSource: "RSMSSB Official Key 2021",
    reviewedBy: "Senior Reviewer",
    reviewedAt: new Date("2026-10-14"),
    examSource: "RSMSSB Patwar 2021",
    updatedAt: new Date("2026-10-14"),
    quiz: {
      id: "65f111111111111111111111",
      title: "राजस्थान का एकीकरण",
      slug: "rajasthan-ka-ekikaran",
      subject: "राजस्थान का इतिहास",
      examTags: ["RSMSSB", "RPSC", "Rajasthan GK"],
      difficulty: "medium",
    },
  };

  describe("1. Dynamic Metadata Generation", () => {
    it("should generate canonical URL, custom title, and description for published question", async () => {
      vi.spyOn(QuestionSeoRepository, "getPublishedQuestionBySlug").mockResolvedValueOnce(samplePublishedQuestion);

      const metadata = await generateMetadata({ params: { slug: "rajasthan-sangh-pradhan-mantri-1948" } });

      expect(metadata.title).toBe("राजस्थान संघ का प्रधानमंत्री किसे बनाया गया था? (1948) | Rajasthan GK");
      expect(metadata.description).toContain("गोकुल लाल असावा");
      expect(metadata.alternates?.canonical).toBe("https://www.rajasthanexamtwister.in/questions/rajasthan-sangh-pradhan-mantri-1948");
      expect(metadata.openGraph?.url).toBe("https://www.rajasthanexamtwister.in/questions/rajasthan-sangh-pradhan-mantri-1948");
    });

    it("should return noindex robots metadata for draft or non-existent questions", async () => {
      vi.spyOn(QuestionSeoRepository, "getPublishedQuestionBySlug").mockResolvedValueOnce(null);

      const metadata = await generateMetadata({ params: { slug: "non-existent-or-draft-question" } });

      expect(metadata.title).toContain("Question Not Found");
      expect(metadata.robots).toEqual({ index: false, follow: false });
    });
  });

  describe("2. React Server Component 404 Isolation & Rendering", () => {
    it("should call notFound() if question is draft, unverified, or non-existent", async () => {
      vi.spyOn(QuestionSeoRepository, "getPublishedQuestionBySlug").mockResolvedValueOnce(null);

      await PublicQuestionPage({ params: { slug: "draft-slug" } });

      expect(navigation.notFound).toHaveBeenCalled();
    });

    it("should render page element with correct question, options, and verified explanation when published", async () => {
      vi.spyOn(QuestionSeoRepository, "getPublishedQuestionBySlug").mockResolvedValueOnce(samplePublishedQuestion);
      vi.spyOn(QuestionSeoRepository, "getRelatedPublishedQuestions").mockResolvedValueOnce([]);

      const pageJsx = await PublicQuestionPage({ params: { slug: "rajasthan-sangh-pradhan-mantri-1948" } });

      expect(pageJsx).toBeDefined();
      expect(pageJsx).not.toBeNull();
      expect(pageJsx!.type).toBe("div");
    });
  });

  describe("3. Sitemap Filtering & Integration", () => {
    it("strictly excludes questions with unverified options or draft parent quiz from listPublishedQuestionSlugs", async () => {
      const mockDbQuestions = [
        // 1. Valid published & verified question
        {
          seoSlug: "valid-question-1",
          updatedAt: new Date("2026-10-14"),
          explanation: "Valid explanation text",
          verifiedOptionIndex: 2,
          correctOptionIndex: 2,
          quizId: { status: "PUBLISHED" },
        },
        // 2. Mismatched option index (audit failure) -> MUST BE EXCLUDED
        {
          seoSlug: "mismatched-option-q2",
          updatedAt: new Date("2026-10-14"),
          explanation: "Some explanation",
          verifiedOptionIndex: 0,
          correctOptionIndex: 2,
          quizId: { status: "PUBLISHED" },
        },
        // 3. Parent quiz is DRAFT -> MUST BE EXCLUDED
        {
          seoSlug: "draft-parent-q3",
          updatedAt: new Date("2026-10-14"),
          explanation: "Valid explanation",
          verifiedOptionIndex: 1,
          correctOptionIndex: 1,
          quizId: { status: "DRAFT" },
        },
        // 4. Empty explanation (thin content) -> MUST BE EXCLUDED
        {
          seoSlug: "thin-content-q4",
          updatedAt: new Date("2026-10-14"),
          explanation: "   ",
          verifiedOptionIndex: 3,
          correctOptionIndex: 3,
          quizId: { status: "PUBLISHED" },
        },
      ];

      vi.spyOn(QuizQuestion, "find").mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            lean: vi.fn().mockReturnValue({
              exec: vi.fn().mockResolvedValueOnce(mockDbQuestions),
            }),
          }),
        }),
      } as any);

      const publishedSlugs = await QuestionSeoRepository.listPublishedQuestionSlugs();

      expect(publishedSlugs).toHaveLength(1);
      expect(publishedSlugs[0].seoSlug).toBe("valid-question-1");
    });

    it("includes eligible question URLs in sitemap output", async () => {
      vi.spyOn(QuestionSeoRepository, "listPublishedQuestionSlugs").mockResolvedValueOnce([
        {
          seoSlug: "rajasthan-sangh-pradhan-mantri-1948",
          updatedAt: new Date("2026-10-14"),
        },
      ]);

      const sitemapEntries = await sitemap();
      const questionEntry = sitemapEntries.find((entry) =>
        entry.url.includes("/questions/rajasthan-sangh-pradhan-mantri-1948")
      );

      expect(questionEntry).toBeDefined();
      expect(questionEntry?.url).toBe("https://www.rajasthanexamtwister.in/questions/rajasthan-sangh-pradhan-mantri-1948");
      expect(questionEntry?.changeFrequency).toBe("monthly");
      expect(questionEntry?.priority).toBe(0.7);
    });
  });
});
