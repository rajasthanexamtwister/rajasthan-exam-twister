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
  ];

  try {
    await connectToDatabase();

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

    // Query PUBLISHED quizzes only
    const publishedQuizzes = await Quiz.find(
      { status: "PUBLISHED" },
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

    return [...staticRoutes, ...blogRoutes, ...noteRoutes, ...quizRoutes];
  } catch (err) {
    console.error("Error generating sitemap:", err);
    return staticRoutes;
  }
}
