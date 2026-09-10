import mongoose from "mongoose";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Media, IMedia } from "@/server/models/Media";
import { Blog } from "@/server/models/Blog";
import { Note } from "@/server/models/Note";

export interface MediaFilterOptions {
  search?: string;
  mimeType?: string;
  page?: number;
  pageSize?: number;
}

export interface MediaReferences {
  inUse: boolean;
  totalCount: number;
  blogCoverCount: number;
  noteImageCount: number;
  notePdfCount: number;
}

export class MediaRepository {
  static async findById(id: string): Promise<IMedia | null> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Media.findById(id);
  }

  static async create(data: Partial<IMedia>): Promise<IMedia> {
    await connectToDatabase();
    return Media.create(data);
  }

  static async update(id: string, data: Partial<IMedia>): Promise<IMedia | null> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Media.findByIdAndUpdate(id, { $set: data }, { new: true });
  }

  static async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const res = await Media.findByIdAndDelete(id);
    return !!res;
  }

  static async countReferences(id: string): Promise<MediaReferences> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return {
        inUse: false,
        totalCount: 0,
        blogCoverCount: 0,
        noteImageCount: 0,
        notePdfCount: 0,
      };
    }

    const objectId = new mongoose.Types.ObjectId(id);

    const [blogCoverCount, noteImageCount, notePdfCount] = await Promise.all([
      Blog.countDocuments({ coverImageId: objectId }),
      Note.countDocuments({ imageIds: objectId }),
      Note.countDocuments({ pdfMediaId: objectId }),
    ]);

    const totalCount = blogCoverCount + noteImageCount + notePdfCount;

    return {
      inUse: totalCount > 0,
      totalCount,
      blogCoverCount,
      noteImageCount,
      notePdfCount,
    };
  }

  static async isMediaInUse(id: string): Promise<{ inUse: boolean; blogCount: number; noteCount: number }> {
    const refs = await this.countReferences(id);
    return {
      inUse: refs.inUse,
      blogCount: refs.blogCoverCount,
      noteCount: refs.noteImageCount + refs.notePdfCount,
    };
  }

  static async list(options: MediaFilterOptions = {}) {
    await connectToDatabase();
    const { search, mimeType, page = 1, pageSize = 24 } = options;

    const filter: Record<string, unknown> = {};

    if (mimeType && mimeType !== "ALL") {
      if (mimeType.toLowerCase() === "image" || mimeType.toLowerCase() === "images") {
        filter.mimeType = { $regex: /^image\//i };
      } else if (mimeType.toLowerCase() === "pdf" || mimeType.toLowerCase() === "pdfs") {
        filter.mimeType = "application/pdf";
      } else {
        filter.mimeType = mimeType;
      }
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ altText: regex }, { caption: regex }, { url: regex }];
    }

    const skip = (page - 1) * pageSize;

    const [media, total] = await Promise.all([
      Media.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
      Media.countDocuments(filter),
    ]);

    return {
      media,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
}
