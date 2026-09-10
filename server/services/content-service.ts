import { BlogRepository } from "@/server/repositories/blog";

export interface PublishedContent {
  id: string;
  type: "blog" | "note";
  title: string;
  slug: string;
  plainSummary: string;
  url: string;
  images: string[];
  tags: string[];
  publishedAt: Date | null;
}

export class ContentService {
  static async getPublishedBlog(slug: string): Promise<PublishedContent | null> {
    const blog = await BlogRepository.findBySlug(slug);
    if (!blog || blog.status !== "PUBLISHED") {
      return null;
    }

    const plainText = blog.content ? blog.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() : "";
    const plainSummary = blog.excerpt || plainText.slice(0, 160);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const coverMedia = blog.coverImageId as unknown as { url?: string };
    const images = coverMedia?.url ? [coverMedia.url] : [];

    const tagDocs = blog.tagIds as unknown as Array<{ name?: string }>;
    const tags = tagDocs?.map((t) => t.name || "").filter(Boolean) || [];

    return {
      id: blog._id.toString(),
      type: "blog",
      title: blog.title,
      slug: blog.slug,
      plainSummary,
      url: `${siteUrl}/blogs/${blog.slug}`,
      images,
      tags,
      publishedAt: blog.publishedAt || null,
    };
  }

  static async listRecentPublished(limit: number = 10): Promise<PublishedContent[]> {
    const { blogs } = await BlogRepository.list({ pageSize: limit }, false);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    return blogs.map((blog) => {
      const plainText = blog.content ? blog.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() : "";
      const plainSummary = blog.excerpt || plainText.slice(0, 160);
      const coverMedia = blog.coverImageId as unknown as { url?: string };
      const images = coverMedia?.url ? [coverMedia.url] : [];
      const tagDocs = blog.tagIds as unknown as Array<{ name?: string }>;
      const tags = tagDocs?.map((t) => t.name || "").filter(Boolean) || [];

      return {
        id: blog._id.toString(),
        type: "blog",
        title: blog.title,
        slug: blog.slug,
        plainSummary,
        url: `${siteUrl}/blogs/${blog.slug}`,
        images,
        tags,
        publishedAt: blog.publishedAt || null,
      };
    });
  }
}
