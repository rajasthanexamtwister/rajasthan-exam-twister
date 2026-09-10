import { describe, it, expect, vi } from "vitest";
import { CreateBlogSchema, UpdateBlogSchema, BlogQuerySchema } from "@/server/validation/blog";
import { BlogService } from "@/server/services/blog-service";
import { BlogRepository } from "@/server/repositories/blog";

describe("Blog Validation & Service Logic", () => {
  it("should validate valid create blog payload", () => {
    const validData = {
      title: "Complete Rajasthan Geography Handbook 2026",
      content: "<h2>Overview</h2><p>Here are the key physical divisions of Rajasthan.</p>",
      excerpt: "Comprehensive geography revision guide.",
      author: "Chirag Bhoi",
    };

    const result = CreateBlogSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should reject empty title or empty content in blog creation", () => {
    expect(CreateBlogSchema.safeParse({ title: "", content: "some text" }).success).toBe(false);
    expect(CreateBlogSchema.safeParse({ title: "Valid Title", content: "" }).success).toBe(false);
  });

  it("should reject publish when blog content is empty", async () => {
    vi.spyOn(BlogRepository, "findById").mockResolvedValueOnce({
      _id: "65f1234567890abcdef12345" as unknown,
      title: "Empty Blog",
      content: "<p>   </p>",
      status: "DRAFT",
    } as unknown as import("@/server/models/Blog").IBlog);

    const result = await BlogService.publishBlog("65f1234567890abcdef12345");
    expect(result.success).toBe(false);
    expect(result.error).toContain("empty content");
  });

  it("should successfully publish blog with valid content", async () => {
    const mockBlog = {
      _id: "65f1234567890abcdef12345" as unknown,
      title: "Valid Blog",
      content: "<p>Real exam notes content</p>",
      status: "DRAFT",
    };

    vi.spyOn(BlogRepository, "findById").mockResolvedValueOnce(mockBlog as unknown as import("@/server/models/Blog").IBlog);
    vi.spyOn(BlogRepository, "update").mockResolvedValueOnce({
      ...mockBlog,
      status: "PUBLISHED",
      publishedAt: new Date(),
    } as unknown as import("@/server/models/Blog").IBlog);

    const result = await BlogService.publishBlog("65f1234567890abcdef12345");
    expect(result.success).toBe(true);
    expect(result.blog?.status).toBe("PUBLISHED");
  });

  it("should unpublish blog back to DRAFT", async () => {
    const mockBlog = {
      _id: "65f1234567890abcdef12345" as unknown,
      title: "Published Blog",
      status: "PUBLISHED",
    };

    vi.spyOn(BlogRepository, "findById").mockResolvedValueOnce(mockBlog as unknown as import("@/server/models/Blog").IBlog);
    vi.spyOn(BlogRepository, "update").mockResolvedValueOnce({
      ...mockBlog,
      status: "DRAFT",
    } as unknown as import("@/server/models/Blog").IBlog);

    const result = await BlogService.unpublishBlog("65f1234567890abcdef12345");
    expect(result.success).toBe(true);
    expect(result.blog?.status).toBe("DRAFT");
  });

  it("should require ?confirm=true to delete blog, rejecting with 409 if false", async () => {
    const resultUnconfirmed = await BlogService.deleteBlog("65f1234567890abcdef12345", false);
    expect(resultUnconfirmed.success).toBe(false);
    expect(resultUnconfirmed.status).toBe(409);

    vi.spyOn(BlogRepository, "delete").mockResolvedValueOnce(true);
    const resultConfirmed = await BlogService.deleteBlog("65f1234567890abcdef12345", true);
    expect(resultConfirmed.success).toBe(true);
    expect(resultConfirmed.status).toBe(200);
  });

  it("should support category and tag filtering by slug in listBlogs", async () => {
    const listSpy = vi.spyOn(BlogRepository, "list").mockResolvedValueOnce({
      blogs: [
        {
          _id: "65f1234567890abcdef12345",
          title: "Rajasthan History Blog",
          slug: "rajasthan-history-blog",
        } as any,
      ],
      pagination: { total: 1, page: 1, pageSize: 10, totalPages: 1 },
    });

    const result = await BlogService.listBlogs({
      categorySlug: "rajasthan-history",
      tagSlug: "ras-exam",
    });

    expect(listSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        categorySlug: "rajasthan-history",
        tagSlug: "ras-exam",
      }),
      false
    );
    expect(result.blogs.length).toBe(1);
  });
});
