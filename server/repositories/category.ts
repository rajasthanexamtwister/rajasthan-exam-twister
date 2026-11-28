import mongoose from "mongoose";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Category, ICategory } from "@/server/models/Category";
import { Blog } from "@/server/models/Blog";
import { Note } from "@/server/models/Note";

export interface PopulatedCategorySummary {
  _id: string;
  name: string;
  slug: string;
  blogCount: number;
  noteCount: number;
  href: string;
}

export class CategoryRepository {
  static async list(): Promise<ICategory[]> {
    await connectToDatabase();
    return Category.find().sort({ name: 1 }).exec();
  }

  /** Returns categories that have at least one published blog or note, with the best non-empty target URL. */
  static async listActiveWithCounts(): Promise<PopulatedCategorySummary[]> {
    await connectToDatabase();
    const [categories, blogAgg, noteAgg] = await Promise.all([
      Category.find().sort({ name: 1 }).lean(),
      Blog.aggregate([
        { $match: { status: "PUBLISHED", categoryId: { $ne: null } } },
        { $group: { _id: "$categoryId", count: { $sum: 1 } } },
      ]),
      Note.aggregate([
        { $match: { status: "PUBLISHED", categoryId: { $ne: null } } },
        { $group: { _id: "$categoryId", count: { $sum: 1 } } },
      ]),
    ]);

    const blogMap = new Map<string, number>(blogAgg.map((b) => [b._id.toString(), b.count]));
    const noteMap = new Map<string, number>(noteAgg.map((n) => [n._id.toString(), n.count]));

    return categories
      .map((cat) => {
        const id = cat._id.toString();
        const blogCount = blogMap.get(id) || 0;
        const noteCount = noteMap.get(id) || 0;
        const href = noteCount > 0 ? `/notes?category=${cat.slug}` : `/blogs?category=${cat.slug}`;
        return { _id: id, name: cat.name, slug: cat.slug, blogCount, noteCount, href };
      })
      .filter((c) => c.blogCount + c.noteCount > 0);
  }

  static async findById(id: string): Promise<ICategory | null> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Category.findById(id);
  }

  static async findBySlug(slug: string): Promise<ICategory | null> {
    await connectToDatabase();
    return Category.findOne({ slug });
  }

  static async create(data: { name: string; slug: string }): Promise<ICategory> {
    await connectToDatabase();
    return Category.create(data);
  }

  static async update(id: string, data: { name?: string; slug?: string }): Promise<ICategory | null> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Category.findByIdAndUpdate(id, { $set: data }, { new: true });
  }

  static async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const res = await Category.findByIdAndDelete(id);
    return !!res;
  }

  static async countReferences(id: string): Promise<{ blogCount: number; noteCount: number }> {
    await connectToDatabase();
    const objectId = new mongoose.Types.ObjectId(id);
    const [blogCount, noteCount] = await Promise.all([
      Blog.countDocuments({ categoryId: objectId }),
      Note.countDocuments({ categoryId: objectId }),
    ]);
    return { blogCount, noteCount };
  }
}
