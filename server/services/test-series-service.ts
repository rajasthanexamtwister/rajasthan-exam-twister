import { connectToDatabase } from "@/server/lib/mongodb";
import { TestSeries, ITestSeries } from "@/server/models/TestSeries";
import { Quiz } from "@/server/models/Quiz";
import { QuizQuestion } from "@/server/models/QuizQuestion";
import { TestSeriesRepository } from "@/server/repositories/test-series";

export interface PublicTestSeriesItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  targetExam: string;
  examCategorySlug: string;
  totalTestsCount: number;
  freeTestsCount: number;
  totalQuestionsCount: number;
  language: string;
  enrolledCount: number;
  rating: number;
  features: string[];
}

export interface PublicTestSeriesDetail extends PublicTestSeriesItem {
  quizzes: {
    quizId: string;
    title: string;
    slug: string;
    testType: string;
    order: number;
    isFreeDemo: boolean;
    durationMinutes: number;
    totalQuestions: number;
    totalMarks: number;
    difficulty?: string;
  }[];
}

export class TestSeriesService {
  /**
   * Seed default flagship Rajasthan Exam test series if none exist
   */
  static async ensureDefaultSeries(): Promise<void> {
    await connectToDatabase();
    const count = await TestSeries.countDocuments({ status: "PUBLISHED" });
    if (count > 0) return;

    // Find available published quizzes to link
    const publishedQuizzes = await Quiz.find({ status: "PUBLISHED" }).limit(10).lean();

    const sampleSeries = [
      {
        title: "RAS / RTS 2026 Prelims Mega Mock Test Series",
        slug: "ras-pre-2026-mega-mock-test-series",
        description:
          "Comprehensive full-length 150-question mock test papers strictly based on RPSC RAS syllabus with authentic negative marking and All-Rajasthan Rank Predictor.",
        targetExam: "RAS / RTS Prelims (RPSC)",
        examCategorySlug: "ras",
        features: [
          "15 Full-Length Mock Papers (150 Questions Each)",
          "Bilingual Hindi & English Exam Interface",
          "All-Rajasthan Rank & Percentile Cutoff Scorecard",
          "Subject-wise Strength & Weakness Analysis",
        ],
        totalTestsCount: 15,
        freeTestsCount: 2,
        totalQuestionsCount: 2250,
        language: "Hindi & English (Bilingual)",
        enrolledCount: 3420,
        rating: 4.9,
        status: "PUBLISHED",
        quizzes: publishedQuizzes.slice(0, 5).map((q, idx) => ({
          quizId: q._id,
          title: `RAS Prelims Full Mock Test #${idx + 1}`,
          testType: "FULL_MOCK" as const,
          order: idx + 1,
          isFreeDemo: idx === 0, // First test is 100% Free Demo
          durationMinutes: 180,
          totalQuestions: 150,
          totalMarks: 200,
        })),
      },
      {
        title: "REET 2026 Level-1 & Level-2 Complete Model Paper Series",
        slug: "reet-2026-complete-model-paper-series",
        description:
          "Targeted model test series covering Child Pedagogy, Rajasthan Culture, Language 1 & 2, and Subject GK for 3rd Grade Teacher selection.",
        targetExam: "REET / 3rd Grade Teacher",
        examCategorySlug: "reet",
        features: [
          "10 Full Model Papers + 15 Subject Drills",
          "Authentic Pedagogy & Teaching Method Questions",
          "Instant Solution Keys with Detailed Devanagari Explanations",
          "Personal Revision Notebook Bookmark Support",
        ],
        totalTestsCount: 25,
        freeTestsCount: 3,
        totalQuestionsCount: 2500,
        language: "Hindi & English (Bilingual)",
        enrolledCount: 5120,
        rating: 4.8,
        status: "PUBLISHED",
        quizzes: publishedQuizzes.slice(0, 4).map((q, idx) => ({
          quizId: q._id,
          title: `REET Full Model Test #${idx + 1}`,
          testType: "FULL_MOCK" as const,
          order: idx + 1,
          isFreeDemo: idx === 0,
          durationMinutes: 150,
          totalQuestions: 150,
          totalMarks: 150,
        })),
      },
      {
        title: "Rajasthan CET 2026 (Graduate & 10+2) Speed Test Series",
        slug: "rajasthan-cet-2026-speed-test-series",
        description:
          "High-speed test series designed for Rajasthan Common Eligibility Test (CET) with state history, current affairs, computer, and general science.",
        targetExam: "Rajasthan CET (10+2 & Graduate)",
        examCategorySlug: "cet",
        features: [
          "12 Full-Length Mock Tests + Daily Current Affairs Drills",
          "Accuracy & Negative Marking Tracker",
          "AI Weak-Topic Booster Practice Integration",
          "Mobile-Optimized Fast Test Player",
        ],
        totalTestsCount: 12,
        freeTestsCount: 2,
        totalQuestionsCount: 1800,
        language: "Hindi & English (Bilingual)",
        enrolledCount: 4890,
        rating: 4.9,
        status: "PUBLISHED",
        quizzes: publishedQuizzes.slice(0, 4).map((q, idx) => ({
          quizId: q._id,
          title: `CET Full Length Mock Test #${idx + 1}`,
          testType: "FULL_MOCK" as const,
          order: idx + 1,
          isFreeDemo: idx === 0,
          durationMinutes: 180,
          totalQuestions: 150,
          totalMarks: 300,
        })),
      },
      {
        title: "Rajasthan Police Constable & SI Booster Test Series",
        slug: "rajasthan-police-constable-si-booster-series",
        description:
          "Rigorous mock tests for Rajasthan Police SI & Constable exams covering Women & Child Crime Laws, State GK, Reasoning & General Science.",
        targetExam: "Rajasthan Police Constable & SI",
        examCategorySlug: "rajasthan-police",
        features: [
          "10 Full SI Papers + 10 Constable Model Papers",
          "Special Focus on IPC, Women & Child Safety Laws",
          "Live Leaderboard Rank & Speed Analysis",
          "100% Free Demo Mock Included",
        ],
        totalTestsCount: 20,
        freeTestsCount: 2,
        totalQuestionsCount: 2000,
        language: "Hindi & English",
        enrolledCount: 3870,
        rating: 4.8,
        status: "PUBLISHED",
        quizzes: publishedQuizzes.slice(0, 3).map((q, idx) => ({
          quizId: q._id,
          title: `Police SI / Constable Model Paper #${idx + 1}`,
          testType: "FULL_MOCK" as const,
          order: idx + 1,
          isFreeDemo: idx === 0,
          durationMinutes: 120,
          totalQuestions: 100,
          totalMarks: 200,
        })),
      },
      {
        title: "Rajasthan Computer Instructor (BCI / SCI) Mock Test Series 2026",
        slug: "bci-sci-computer-instructor-test-series",
        description:
          "Full-length exam-oriented mock tests and previous year question papers for RSMSSB Basic & Senior Computer Instructor (BCI/SCI) Paper-1 and Paper-2.",
        targetExam: "Computer Instructor (BCI / SCI)",
        examCategorySlug: "bci",
        features: [
          "Complete Coverage of Paper-1 (General Ability) and Paper-2 (Computer Science)",
          "Strict negative marking (1/3rd) as per RSMSSB pattern",
          "Detailed Hindi & English technical explanations",
          "Instant All-Rajasthan Rank and Performance Analysis",
        ],
        totalTestsCount: 4,
        freeTestsCount: 1,
        totalQuestionsCount: 400,
        language: "Hindi & English (Bilingual)",
        enrolledCount: 2640,
        rating: 4.9,
        status: "PUBLISHED",
        quizzes: publishedQuizzes.slice(0, 2).map((q, idx) => ({
          quizId: q._id,
          title: `Computer Instructor Model Paper #${idx + 1}`,
          testType: "FULL_MOCK" as const,
          order: idx + 1,
          isFreeDemo: idx === 0,
          durationMinutes: 120,
          totalQuestions: 100,
          totalMarks: 100,
        })),
      },
    ];

    try {
      await TestSeries.insertMany(sampleSeries);
    } catch (err) {
      console.error("Failed to seed default test series:", err);
    }
  }

  /**
   * List published test series with optional category filter
   */
  static async listTestSeries(categorySlug?: string): Promise<PublicTestSeriesItem[]> {
    await this.ensureDefaultSeries();
    const seriesList = await TestSeriesRepository.listPublished({
      examCategorySlug: categorySlug,
    });

    return seriesList.map((item) => ({
      id: item._id.toString(),
      title: item.title,
      slug: item.slug,
      description: item.description,
      targetExam: item.targetExam,
      examCategorySlug: item.examCategorySlug,
      totalTestsCount: item.totalTestsCount || (item.quizzes?.length ?? 10),
      freeTestsCount: item.freeTestsCount || 1,
      totalQuestionsCount: item.totalQuestionsCount || 1500,
      language: item.language,
      enrolledCount: item.enrolledCount,
      rating: item.rating,
      features: item.features,
    }));
  }

  /**
   * Get single test series detail by slug
   */
  static async getTestSeriesBySlug(slug: string): Promise<PublicTestSeriesDetail | null> {
    await this.ensureDefaultSeries();
    const series = await TestSeriesRepository.findBySlug(slug);
    if (!series) return null;

    return {
      id: series._id.toString(),
      title: series.title,
      slug: series.slug,
      description: series.description,
      targetExam: series.targetExam,
      examCategorySlug: series.examCategorySlug,
      totalTestsCount: series.totalTestsCount || (series.quizzes?.length ?? 10),
      freeTestsCount: series.freeTestsCount || 1,
      totalQuestionsCount: series.totalQuestionsCount || 1500,
      language: series.language,
      enrolledCount: series.enrolledCount,
      rating: series.rating,
      features: series.features,
      quizzes: (series.quizzes || []).map((q: any) => {
        const quizRef = q.quizId;
        return {
          quizId: quizRef?._id ? quizRef._id.toString() : (q.quizId?.toString() || ""),
          title: q.title || quizRef?.title || "Mock Test",
          slug: quizRef?.slug || series.slug,
          testType: q.testType || "FULL_MOCK",
          order: q.order || 1,
          isFreeDemo: Boolean(q.isFreeDemo),
          durationMinutes: q.durationMinutes || 60,
          totalQuestions: q.totalQuestions || quizRef?.questionCount || 50,
          totalMarks: q.totalMarks || (q.totalQuestions ? q.totalQuestions * 2 : 100),
          difficulty: quizRef?.difficulty || "medium",
        };
      }),
    };
  }
}
