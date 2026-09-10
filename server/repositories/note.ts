import mongoose from "mongoose";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Note, INote } from "@/server/models/Note";
import { ContentStatus } from "@/server/models/Blog";
import "@/server/models/Category";
import "@/server/models/Tag";
import "@/server/models/Media";

export interface NoteFilterOptions {
  status?: ContentStatus | "ALL";
  subject?: string;
  categoryId?: string;
  categorySlug?: string;
  tagId?: string;
  tagSlug?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export class NoteRepository {
  static async findById(id: string): Promise<INote | null> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    return Note.findById(id)
      .populate("categoryId", "name slug")
      .populate("tagIds", "name slug")
      .populate("imageIds", "url altText caption width height fileSize")
      .populate("pdfMediaId", "url altText caption fileSize");
  }

  static async findBySlug(slug: string): Promise<INote | null> {
    await connectToDatabase();
    return Note.findOne({ slug })
      .populate("categoryId", "name slug")
      .populate("tagIds", "name slug")
      .populate("imageIds", "url altText caption width height fileSize")
      .populate("pdfMediaId", "url altText caption fileSize");
  }

  static async isSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
    await connectToDatabase();
    const query: Record<string, unknown> = { slug };
    if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
      query._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
    }
    const count = await Note.countDocuments(query);
    return count > 0;
  }

  static async findByContentHash(contentHash: string): Promise<INote | null> {
    await connectToDatabase();
    return Note.findOne({ contentHash });
  }

  static async deleteUntouchedDraftsByJobId(jobId: string): Promise<number> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(jobId)) return 0;
    const res = await Note.deleteMany({
      importJobId: new mongoose.Types.ObjectId(jobId),
      status: "DRAFT",
      isEditedSinceImport: { $ne: true },
    });
    return res.deletedCount || 0;
  }

  static async list(options: NoteFilterOptions = {}, isAdmin: boolean = false) {
    await connectToDatabase();
    const {
      status,
      subject,
      categoryId,
      categorySlug,
      tagId,
      tagSlug,
      search,
      page = 1,
      pageSize = 12,
    } = options;

    const filter: Record<string, unknown> = {};

    if (!isAdmin) {
      filter.status = "PUBLISHED";
    } else if (status && status !== "ALL") {
      filter.status = status;
    }

    if (subject && subject.trim()) {
      filter.subject = subject.trim();
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
          return { notes: [], pagination: { total: 0, page, pageSize, totalPages: 0 } };
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
          return { notes: [], pagination: { total: 0, page, pageSize, totalPages: 0 } };
        }
      }
    }

    if (search && search.trim()) {
      filter.$text = { $search: search.trim() };
    }

    const skip = (page - 1) * pageSize;

    const [notes, total] = await Promise.all([
      Note.find(filter)
        .populate("categoryId", "name slug")
        .populate("tagIds", "name slug")
        .populate("imageIds", "url altText")
        .populate("pdfMediaId", "url fileSize")
        .sort(filter.status === "PUBLISHED" ? { publishedAt: -1, createdAt: -1 } : { updatedAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      Note.countDocuments(filter),
    ]);

    return {
      notes,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  static async create(data: Partial<INote>): Promise<INote> {
    await connectToDatabase();
    return Note.create(data);
  }

  static async update(id: string, data: Partial<INote>): Promise<INote | null> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    return Note.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true })
      .populate("categoryId", "name slug")
      .populate("tagIds", "name slug")
      .populate("imageIds", "url altText caption width height fileSize")
      .populate("pdfMediaId", "url altText caption fileSize");
  }

  static async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const res = await Note.findByIdAndDelete(id);
    return !!res;
  }

  static async countByStatus() {
    await connectToDatabase();
    const [total, published, drafts, archived] = await Promise.all([
      Note.countDocuments(),
      Note.countDocuments({ status: "PUBLISHED" }),
      Note.countDocuments({ status: "DRAFT" }),
      Note.countDocuments({ status: "ARCHIVED" }),
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

    return Note.find({
      status: "PUBLISHED",
      categoryId: catId,
      _id: { $ne: exclId },
    })
      .populate("categoryId", "name slug")
      .populate("imageIds", "url altText")
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(limit)
      .lean();
  }
}

