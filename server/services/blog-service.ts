import mongoose from "mongoose";
import { BlogRepository, BlogFilterOptions } from "@/server/repositories/blog";
import { sanitizeContentHtml, calculateReadingTime } from "@/server/lib/sanitize";
import { generateUniqueSlug } from "@/server/lib/slugify";
import { CreateBlogInput, UpdateBlogInput } from "@/server/validation/blog";
import { IBlog } from "@/server/models/Blog";

export class BlogService {
  static async getBlogById(id: string): Promise<IBlog | null> {
    return BlogRepository.findById(id);
  }

  static async getBlogBySlug(slug: string, isAdmin: boolean = false): Promise<IBlog | null> {
    const blog = await BlogRepository.findBySlug(slug);
    if (!blog) return null;

    if (!isAdmin && blog.status !== "PUBLISHED") {
      return null;
    }

    return blog;
  }

  static async listBlogs(options: BlogFilterOptions = {}, isAdmin: boolean = false) {
    return BlogRepository.list(options, isAdmin);
  }

  static async createBlog(input: CreateBlogInput): Promise<IBlog> {
    const sanitizedHtml = sanitizeContentHtml(input.content);
    const readingTime = calculateReadingTime(sanitizedHtml);

    const slug = await generateUniqueSlug(input.title, async (s) => {
      return BlogRepository.isSlugTaken(s);
    });

    const blogData: Partial<IBlog> = {
      title: input.title.trim(),
      slug,
      excerpt: input.excerpt?.trim(),
      content: sanitizedHtml,
      coverImageId: input.coverImageId ? new mongoose.Types.ObjectId(input.coverImageId) : undefined,
      categoryId: input.categoryId ? new mongoose.Types.ObjectId(input.categoryId) : undefined,
      tagIds: input.tagIds?.map((t) => new mongoose.Types.ObjectId(t)) || [],
      status: "DRAFT",
      metaTitle: input.metaTitle?.trim(),
      metaDescription: input.metaDescription?.trim(),
      canonicalUrl: input.canonicalUrl || undefined,
      readingTime,
      featured: input.featured ?? false,
      author: input.author?.trim() || "Admin",
    };

    return BlogRepository.create(blogData);
  }

  static async updateBlog(id: string, input: UpdateBlogInput): Promise<IBlog | null> {
    const existing = await BlogRepository.findById(id);
    if (!existing) return null;

    const updateData: Record<string, unknown> = {};

    if (input.title !== undefined) {
      updateData.title = input.title.trim();

      // Slugs are immutable after first publish per SEO.md
      // If blog was never published (no publishedAt date), update slug on title change
      if (!existing.publishedAt) {
        updateData.slug = await generateUniqueSlug(
          input.title,
          async (s) => BlogRepository.isSlugTaken(s, id),
          existing.slug
        );
      }
    }

    if (input.content !== undefined) {
      const sanitized = sanitizeContentHtml(input.content);
      updateData.content = sanitized;
      updateData.readingTime = calculateReadingTime(sanitized);
    }

    if (input.excerpt !== undefined) updateData.excerpt = input.excerpt?.trim();
    if (input.coverImageId !== undefined) {
      updateData.coverImageId = input.coverImageId
        ? new mongoose.Types.ObjectId(input.coverImageId)
        : null;
    }
    if (input.categoryId !== undefined) {
      updateData.categoryId = input.categoryId
        ? new mongoose.Types.ObjectId(input.categoryId)
        : null;
    }
    if (input.tagIds !== undefined) {
      updateData.tagIds = input.tagIds.map((t) => new mongoose.Types.ObjectId(t));
    }
    if (input.metaTitle !== undefined) updateData.metaTitle = input.metaTitle?.trim();
    if (input.metaDescription !== undefined) updateData.metaDescription = input.metaDescription?.trim();
    if (input.canonicalUrl !== undefined) updateData.canonicalUrl = input.canonicalUrl;
    if (input.featured !== undefined) updateData.featured = input.featured;
    if (input.author !== undefined) updateData.author = input.author?.trim();

    return BlogRepository.update(id, updateData as Partial<IBlog>);
  }

  static async publishBlog(id: string): Promise<{ success: boolean; blog?: IBlog; error?: string }> {
    const blog = await BlogRepository.findById(id);
    if (!blog) {
      return { success: false, error: "Blog not found" };
    }

    const textContent = blog.content ? blog.content.replace(/<[^>]*>/g, "").trim() : "";
    if (!textContent) {
      return { success: false, error: "Cannot publish a blog with empty content" };
    }

    const updated = await BlogRepository.update(id, {
      status: "PUBLISHED",
      publishedAt: blog.publishedAt || new Date(),
    });

    return { success: true, blog: updated || undefined };
  }

  static async unpublishBlog(id: string): Promise<{ success: boolean; blog?: IBlog; error?: string }> {
    const blog = await BlogRepository.findById(id);
    if (!blog) {
      return { success: false, error: "Blog not found" };
    }

    const updated = await BlogRepository.update(id, {
      status: "DRAFT",
    });

    return { success: true, blog: updated || undefined };
  }

  static async deleteBlog(id: string, confirm: boolean): Promise<{ success: boolean; error?: string; status: number }> {
    if (!confirm) {
      return {
        success: false,
        error: "Confirmation required to delete blog (?confirm=true)",
        status: 409,
      };
    }

    const deleted = await BlogRepository.delete(id);
    if (!deleted) {
      return { success: false, error: "Blog not found", status: 404 };
    }

    return { success: true, status: 200 };
  }

  static async getStats() {
    return BlogRepository.countByStatus();
  }
}
