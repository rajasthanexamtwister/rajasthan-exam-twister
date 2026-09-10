import mongoose from "mongoose";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Category, ICategory } from "@/server/models/Category";
import { Blog } from "@/server/models/Blog";
import { Note } from "@/server/models/Note";

export class CategoryRepository {
  static async list(): Promise<ICategory[]> {
    await connectToDatabase();
    return Category.find().sort({ name: 1 }).exec();
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
