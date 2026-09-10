import { connectToDatabase } from "@/server/lib/mongodb";
import { Blog, IBlog } from "@/server/models/Blog";
import { Note, INote } from "@/server/models/Note";
import "@/server/models/Category";
import "@/server/models/Tag";
import "@/server/models/Media";

export interface SearchResultItem {
  type: "blog" | "note";
  id: string;
  title: string;
  description: string;
  slug: string;
  score: number;
  publishedAt?: string;
  readingTime?: number;
  subject?: string;
  category?: { name: string; slug: string };
  tags: Array<{ name: string; slug: string }>;
  imageCount?: number;
  hasPdf?: boolean;
  coverImageUrl?: string;
}

export interface SearchOptions {
  page?: number;
  pageSize?: number;
}

export interface SearchResponse {
  query: string;
  total: number;
  results: SearchResultItem[];
  blogsCount: number;
  notesCount: number;
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export class SearchService {
  static async search(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
    const trimmed = query.trim();
    if (!trimmed) {
      throw new Error("Search query cannot be empty");
    }

    await connectToDatabase();

    const page = options.page && options.page > 0 ? options.page : 1;
    const pageSize = options.pageSize && options.pageSize > 0 ? options.pageSize : 20;

    // Run parallel MongoDB native $text search on PUBLISHED blogs and notes only
    const [blogs, notes] = await Promise.all([
      Blog.find(
        { status: "PUBLISHED", $text: { $search: trimmed } },
        { score: { $meta: "textScore" } }
      )
        .populate("categoryId", "name slug")
        .populate("tagIds", "name slug")
        .populate("coverImageId", "url altText")
        .sort({ score: { $meta: "textScore" }, publishedAt: -1 })
        .lean(),
      Note.find(
        { status: "PUBLISHED", $text: { $search: trimmed } },
        { score: { $meta: "textScore" } }
      )
        .populate("categoryId", "name slug")
        .populate("tagIds", "name slug")
        .populate("imageIds", "url altText")
        .populate("pdfMediaId", "url fileSize")
        .sort({ score: { $meta: "textScore" }, publishedAt: -1 })
        .lean(),
    ]);

    // Map Blog documents into unified search items
    const blogResults: SearchResultItem[] = blogs.map((b) => {
      const doc = b as unknown as {
        _id: { toString(): string };
        title: string;
        slug: string;
        excerpt?: string;
        content?: string;
        score?: number;
        publishedAt?: Date;
        readingTime?: number;
        categoryId?: { name: string; slug: string };
        tagIds?: Array<{ name: string; slug: string }>;
        coverImageId?: { url: string };
      };

      const plainText = doc.content ? doc.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() : "";
      const description = doc.excerpt || plainText.slice(0, 160) || "Read full article...";

      return {
        type: "blog",
        id: doc._id.toString(),
        title: doc.title,
        description,
        slug: doc.slug,
        score: doc.score || 1,
        publishedAt: doc.publishedAt?.toISOString(),
        readingTime: doc.readingTime || 1,
        category: doc.categoryId ? { name: doc.categoryId.name, slug: doc.categoryId.slug } : undefined,
        tags: Array.isArray(doc.tagIds)
          ? doc.tagIds.map((t) => ({ name: t.name, slug: t.slug }))
          : [],
        coverImageUrl: doc.coverImageId?.url,
      };
    });

    // Map Note documents into unified search items
    const noteResults: SearchResultItem[] = notes.map((n) => {
      const doc = n as unknown as {
        _id: { toString(): string };
        title: string;
        slug: string;
        subject?: string;
        content?: string;
        score?: number;
        publishedAt?: Date;
        categoryId?: { name: string; slug: string };
        tagIds?: Array<{ name: string; slug: string }>;
        imageIds?: unknown[];
        pdfMediaId?: unknown;
      };

      const plainText = doc.content ? doc.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() : "";
      const description = doc.subject
        ? `[${doc.subject}] ${plainText.slice(0, 140) || "Revision handbook and infographic diagrams."}`
        : plainText.slice(0, 160) || "Revision handbook and infographic diagrams.";

      return {
        type: "note",
        id: doc._id.toString(),
        title: doc.title,
        description,
        slug: doc.slug,
        score: doc.score || 1,
        publishedAt: doc.publishedAt?.toISOString(),
        subject: doc.subject,
        category: doc.categoryId ? { name: doc.categoryId.name, slug: doc.categoryId.slug } : undefined,
        tags: Array.isArray(doc.tagIds)
          ? doc.tagIds.map((t) => ({ name: t.name, slug: t.slug }))
          : [],
        imageCount: Array.isArray(doc.imageIds) ? doc.imageIds.length : 0,
        hasPdf: !!doc.pdfMediaId,
      };
    });

    // Combined unified list, sorted by $text score descending, with publishedAt fallback
    const combined = [...blogResults, ...noteResults].sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      const timeA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const timeB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return timeB - timeA;
    });

    const total = combined.length;
    const skip = (page - 1) * pageSize;
    const paginatedResults = combined.slice(skip, skip + pageSize);

    return {
      query: trimmed,
      total,
      results: paginatedResults,
      blogsCount: blogResults.length,
      notesCount: noteResults.length,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  }
}
