import mongoose from "mongoose";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Tag, ITag } from "@/server/models/Tag";
import { Blog } from "@/server/models/Blog";
import { Note } from "@/server/models/Note";

export class TagRepository {
  static async list(): Promise<ITag[]> {
    await connectToDatabase();
    return Tag.find().sort({ name: 1 }).exec();
  }

  static async findById(id: string): Promise<ITag | null> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Tag.findById(id);
  }

  static async findBySlug(slug: string): Promise<ITag | null> {
    await connectToDatabase();
    return Tag.findOne({ slug });
  }

  static async create(data: { name: string; slug: string }): Promise<ITag> {
    await connectToDatabase();
    return Tag.create(data);
  }

  static async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const objectId = new mongoose.Types.ObjectId(id);

    // Detach tag from all Blogs and Notes first
    await Promise.all([
      Blog.updateMany({ tagIds: objectId }, { $pull: { tagIds: objectId } }),
      Note.updateMany({ tagIds: objectId }, { $pull: { tagIds: objectId } }),
    ]);

    const res = await Tag.findByIdAndDelete(id);
    return !!res;
  }
}
