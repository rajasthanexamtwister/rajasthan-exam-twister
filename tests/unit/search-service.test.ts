import { describe, it, expect, vi, beforeEach } from "vitest";
import { SearchService } from "@/server/services/search-service";
import { Blog } from "@/server/models/Blog";
import { Note } from "@/server/models/Note";
import mongoose from "mongoose";

// Mock mongodb connection
vi.mock("@/server/lib/mongodb", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

// Mock Blog and Note models
vi.mock("@/server/models/Blog", () => ({
  Blog: {
    find: vi.fn(),
  },
}));

vi.mock("@/server/models/Note", () => ({
  Note: {
    find: vi.fn(),
  },
}));

vi.mock("@/server/models/Category", () => ({}));
vi.mock("@/server/models/Tag", () => ({}));
vi.mock("@/server/models/Media", () => ({}));

describe("SearchService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw an error for empty or whitespace-only search query", async () => {
    await expect(SearchService.search("")).rejects.toThrow("Search query cannot be empty");
    await expect(SearchService.search("   ")).rejects.toThrow("Search query cannot be empty");
  });

  it("should query strictly PUBLISHED content with $text search on both Blog and Note", async () => {
    const mockBlogQuery = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([
        {
          _id: new mongoose.Types.ObjectId(),
          title: "Rajasthan History & Heritage",
          slug: "rajasthan-history-heritage",
          excerpt: "Guide to Forts of Rajasthan",
          content: "<p>Detailed study of Kumbhalgarh and Mehrangarh.</p>",
          score: 2.5,
          publishedAt: new Date("2026-03-01T10:00:00.000Z"),
          readingTime: 5,
          categoryId: { name: "History", slug: "history" },
          tagIds: [{ name: "RAS", slug: "ras" }],
          coverImageId: { url: "/uploads/fort.jpg" },
        },
      ]),
    };

    const mockNoteQuery = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([
        {
          _id: new mongoose.Types.ObjectId(),
          title: "Rajasthan Forts Revision Notes",
          slug: "rajasthan-forts-revision-notes",
          subject: "Art & Culture",
          content: "<p>Summary of Hill Forts of Rajasthan.</p>",
          score: 3.2,
          publishedAt: new Date("2026-03-02T10:00:00.000Z"),
          categoryId: { name: "Art & Culture", slug: "art-culture" },
          tagIds: [{ name: "Forts", slug: "forts" }],
          imageIds: [{ url: "/uploads/fort-map.png" }],
          pdfMediaId: { url: "/uploads/forts.pdf" },
        },
      ]),
    };

    (Blog.find as any).mockReturnValue(mockBlogQuery);
    (Note.find as any).mockReturnValue(mockNoteQuery);

    const result = await SearchService.search("Rajasthan Forts", { page: 1, pageSize: 10 });

    // Assert that both queries searched PUBLISHED status only
    expect(Blog.find).toHaveBeenCalledWith(
      { status: "PUBLISHED", $text: { $search: "Rajasthan Forts" } },
      { score: { $meta: "textScore" } }
    );
    expect(Note.find).toHaveBeenCalledWith(
      { status: "PUBLISHED", $text: { $search: "Rajasthan Forts" } },
      { score: { $meta: "textScore" } }
    );

    // Verify response structure
    expect(result.query).toBe("Rajasthan Forts");
    expect(result.total).toBe(2);
    expect(result.blogsCount).toBe(1);
    expect(result.notesCount).toBe(1);
    expect(result.results.length).toBe(2);

    // The note has higher score (3.2 vs 2.5), so it must be ranked first
    expect(result.results[0].type).toBe("note");
    expect(result.results[0].title).toBe("Rajasthan Forts Revision Notes");
    expect(result.results[0].score).toBe(3.2);
    expect(result.results[0].hasPdf).toBe(true);
    expect(result.results[0].imageCount).toBe(1);

    expect(result.results[1].type).toBe("blog");
    expect(result.results[1].title).toBe("Rajasthan History & Heritage");
    expect(result.results[1].score).toBe(2.5);
    expect(result.results[1].coverImageUrl).toBe("/uploads/fort.jpg");
  });

  it("should rank by publishedAt descending when text scores are tied", async () => {
    const mockBlogQuery = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([
        {
          _id: new mongoose.Types.ObjectId(),
          title: "Older Blog Post",
          slug: "older-blog-post",
          content: "<p>Content</p>",
          score: 1.5,
          publishedAt: new Date("2026-01-01T00:00:00.000Z"),
          tagIds: [],
        },
      ]),
    };

    const mockNoteQuery = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([
        {
          _id: new mongoose.Types.ObjectId(),
          title: "Newer Note",
          slug: "newer-note",
          content: "<p>Content</p>",
          score: 1.5, // Tied score
          publishedAt: new Date("2026-02-01T00:00:00.000Z"),
          tagIds: [],
        },
      ]),
    };

    (Blog.find as any).mockReturnValue(mockBlogQuery);
    (Note.find as any).mockReturnValue(mockNoteQuery);

    const result = await SearchService.search("exam", { page: 1, pageSize: 10 });

    expect(result.results.length).toBe(2);
    // Newer note should come first because of date tie-breaker
    expect(result.results[0].title).toBe("Newer Note");
    expect(result.results[1].title).toBe("Older Blog Post");
  });

  it("should handle pagination correctly", async () => {
    const createMockBlog = (index: number) => ({
      _id: new mongoose.Types.ObjectId(),
      title: `Blog Item ${index}`,
      slug: `blog-item-${index}`,
      content: "<p>Content</p>",
      score: 1.0,
      publishedAt: new Date(`2026-01-0${index}T00:00:00.000Z`),
      tagIds: [],
    });

    const mockBlogQuery = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([
        createMockBlog(1),
        createMockBlog(2),
        createMockBlog(3),
      ]),
    };

    const mockNoteQuery = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([]),
    };

    (Blog.find as any).mockReturnValue(mockBlogQuery);
    (Note.find as any).mockReturnValue(mockNoteQuery);

    const page1 = await SearchService.search("test", { page: 1, pageSize: 2 });
    expect(page1.results.length).toBe(2);
    expect(page1.pagination.totalPages).toBe(2);

    const page2 = await SearchService.search("test", { page: 2, pageSize: 2 });
    expect(page2.results.length).toBe(1);
  });

  it("should never return DRAFT or ARCHIVED items from search", async () => {
    // Verify that the Mongo query strictly filters status === "PUBLISHED"
    const mockBlogQuery = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([]),
    };
    (Blog.find as any).mockReturnValue(mockBlogQuery);
    (Note.find as any).mockReturnValue(mockBlogQuery);

    await SearchService.search("Rajasthan", { page: 1, pageSize: 10 });

    const blogFilter = (Blog.find as any).mock.calls[0][0];
    const noteFilter = (Note.find as any).mock.calls[0][0];

    expect(blogFilter.status).toBe("PUBLISHED");
    expect(noteFilter.status).toBe("PUBLISHED");
  });
});
