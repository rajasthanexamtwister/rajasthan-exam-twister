import mongoose from "mongoose";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Blog, IBlog, ContentStatus } from "@/server/models/Blog";
import "@/server/models/Category";
import "@/server/models/Tag";
import "@/server/models/Media";

export interface BlogFilterOptions {
  status?: ContentStatus | "ALL";
  categoryId?: string;
  categorySlug?: string;
  tagId?: string;
  tagSlug?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export class BlogRepository {
  static async findById(id: string): Promise<IBlog | null> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    return Blog.findById(id)
      .populate("categoryId", "name slug")
      .populate("tagIds", "name slug")
      .populate("coverImageId", "url altText caption");
  }

  static async findBySlug(slug: string): Promise<IBlog | null> {
    await connectToDatabase();
    return Blog.findOne({ slug })
      .populate("categoryId", "name slug")
      .populate("tagIds", "name slug")
      .populate("coverImageId", "url altText caption");
  }

  static async isSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
    await connectToDatabase();
    const query: Record<string, unknown> = { slug };
    if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
      query._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
    }
    const count = await Blog.countDocuments(query);
    return count > 0;
  }

  static async list(options: BlogFilterOptions = {}, isAdmin: boolean = false) {
    await connectToDatabase();
    const {
      status,
      categoryId,
      categorySlug,
      tagId,
      tagSlug,
      search,
      page = 1,
      pageSize = 10,
    } = options;

    const filter: Record<string, unknown> = {};

    // Status filtering
    if (!isAdmin) {
      filter.status = "PUBLISHED";
    } else if (status && status !== "ALL") {
      filter.status = status;
    }

    // Category filtering (supports both ObjectId and slug)
    const catQuery = categoryId || categorySlug;
    if (catQuery) {
      if (mongoose.Types.ObjectId.isValid(catQuery)) {
        filter.categoryId = new mongoose.Types.ObjectId(catQuery);
      } else {
        const cat = await mongoose.model("Category").findOne({ slug: catQuery.toLowerCase().trim() });
        if (cat) {
          filter.categoryId = cat._id;
        } else {
          return { blogs: [], pagination: { total: 0, page, pageSize, totalPages: 0 } };
        }
      }
    }

    // Tag filtering (supports both ObjectId and slug)
    const tQuery = tagId || tagSlug;
    if (tQuery) {
      if (mongoose.Types.ObjectId.isValid(tQuery)) {
        filter.tagIds = new mongoose.Types.ObjectId(tQuery);
      } else {
        const tagDoc = await mongoose.model("Tag").findOne({ slug: tQuery.toLowerCase().trim() });
        if (tagDoc) {
          filter.tagIds = tagDoc._id;
        } else {
          return { blogs: [], pagination: { total: 0, page, pageSize, totalPages: 0 } };
        }
      }
    }

    // Search query
    if (search && search.trim()) {
      filter.$text = { $search: search.trim() };
    }

    const skip = (page - 1) * pageSize;

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .populate("categoryId", "name slug")
        .populate("tagIds", "name slug")
        .populate("coverImageId", "url altText")
        .sort(filter.status === "PUBLISHED" ? { publishedAt: -1, createdAt: -1 } : { updatedAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      Blog.countDocuments(filter),
    ]);

    return {
      blogs,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  static async create(data: Partial<IBlog>): Promise<IBlog> {
    await connectToDatabase();
    return Blog.create(data);
  }

  static async update(id: string, data: Partial<IBlog>): Promise<IBlog | null> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    return Blog.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true })
      .populate("categoryId", "name slug")
      .populate("tagIds", "name slug")
      .populate("coverImageId", "url altText caption");
  }

  static async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(id)) return false;

    const res = await Blog.findByIdAndDelete(id);
    return !!res;
  }

  static async countByStatus() {
    await connectToDatabase();
    const [total, published, drafts, archived] = await Promise.all([
      Blog.countDocuments(),
      Blog.countDocuments({ status: "PUBLISHED" }),
      Blog.countDocuments({ status: "DRAFT" }),
      Blog.countDocuments({ status: "ARCHIVED" }),
    ]);

    return { total, published, drafts, archived };
  }

  static async findRelatedByCategory(
    categoryId: string | mongoose.Types.ObjectId,
    excludeId: string | mongoose.Types.ObjectId,
    limit: number = 3
  ): Promise<any[]> {
    await connectToDatabase();
    const catId = typeof categoryId === "string" ? new mongoose.Types.ObjectId(categoryId) : categoryId;
    const exclId = typeof excludeId === "string" ? new mongoose.Types.ObjectId(excludeId) : excludeId;

    return Blog.find({
      status: "PUBLISHED",
      categoryId: catId,
      _id: { $ne: exclId },
    })
      .populate("categoryId", "name slug")
      .populate("coverImageId", "url altText")
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(limit)
      .lean();
  }
}

