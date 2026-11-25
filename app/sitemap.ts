import { MetadataRoute } from "next";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Blog } from "@/server/models/Blog";
import { Note } from "@/server/models/Note";
import { Quiz } from "@/server/models/Quiz";
import { getSiteUrl } from "@/server/lib/seo";

export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  // Static routes (Only public, indexable production pages)
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/blogs`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/notes`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/quizzes`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/test-series`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/leaderboard`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/books`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/disclaimer`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  try {
    await Promise.race([
      connectToDatabase(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("DB timeout")), 2500)),
    ]);

    // Query PUBLISHED blogs only
    const publishedBlogs = await Blog.find(
      { status: "PUBLISHED" },
      "slug updatedAt publishedAt"
    ).lean();

    const blogRoutes: MetadataRoute.Sitemap = publishedBlogs.map((b) => {
      const doc = b as unknown as { slug: string; updatedAt?: Date; publishedAt?: Date };
      return {
        url: `${siteUrl}/blogs/${doc.slug}`,
        lastModified: doc.updatedAt || doc.publishedAt || new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      };
    });

    // Query PUBLISHED notes only
    const publishedNotes = await Note.find(
      { status: "PUBLISHED" },
      "slug updatedAt publishedAt"
    ).lean();

    const noteRoutes: MetadataRoute.Sitemap = publishedNotes.map((n) => {
      const doc = n as unknown as { slug: string; updatedAt?: Date; publishedAt?: Date };
      return {
        url: `${siteUrl}/notes/${doc.slug}`,
        lastModified: doc.updatedAt || doc.publishedAt || new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      };
    });

    // Query PUBLISHED public quizzes only (exclude personalized booster tests and developer test quizzes)
    const publishedQuizzes = await Quiz.find(
      {
        status: "PUBLISHED",
        isPersonalizedBooster: { $ne: true },
        slug: { $not: /^booster-|alternative-name-but-same-questions/i },
        title: { $not: /alternative-name-but-same-questions|^\[?test\]?/i },
      },
      "slug updatedAt publishedAt"
    ).lean();

    const quizRoutes: MetadataRoute.Sitemap = publishedQuizzes.map((q) => {
      const doc = q as unknown as { slug: string; updatedAt?: Date; publishedAt?: Date };
      return {
        url: `${siteUrl}/quizzes/${doc.slug}`,
        lastModified: doc.updatedAt || doc.publishedAt || new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      };
    });

    // Query PUBLISHED test series only
    const { TestSeries } = await import("@/server/models/TestSeries");
    const publishedTestSeries = await TestSeries.find(
      { status: "PUBLISHED" },
      "slug updatedAt publishedAt"
    ).lean();

    const testSeriesRoutes: MetadataRoute.Sitemap = publishedTestSeries.map((ts) => {
      const doc = ts as unknown as { slug: string; updatedAt?: Date; publishedAt?: Date };
      return {
        url: `${siteUrl}/test-series/${doc.slug}`,
        lastModified: doc.updatedAt || doc.publishedAt || new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      };
    });

    // Query published SEO questions
    const { QuestionSeoRepository } = await import("@/server/repositories/question-seo");
    const publishedQuestions = await QuestionSeoRepository.listPublishedQuestionSlugs().catch(() => []);
    const questionRoutes: MetadataRoute.Sitemap = publishedQuestions.map((q) => ({
      url: `${siteUrl}/questions/${q.seoSlug}`,
      lastModified: q.updatedAt || new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    }));

    return [
      ...staticRoutes,
      ...blogRoutes,
      ...noteRoutes,
      ...quizRoutes,
      ...testSeriesRoutes,
      ...questionRoutes,
    ];
  } catch (err) {
    console.error("Error generating sitemap:", err);
    return staticRoutes;
  }
}
