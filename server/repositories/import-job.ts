import mongoose from "mongoose";
import { connectToDatabase } from "@/server/lib/mongodb";
import { ImportJob, IImportJob, ImportJobStatus } from "@/server/models/ImportJob";

export class ImportJobRepository {
  static async create(data: Partial<IImportJob>): Promise<IImportJob> {
    await connectToDatabase();
    return ImportJob.create(data);
  }

  static async findById(id: string): Promise<IImportJob | null> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return ImportJob.findById(id);
  }

  static async list(page: number = 1, pageSize: number = 20) {
    await connectToDatabase();
    const skip = (page - 1) * pageSize;
    const [jobs, total] = await Promise.all([
      ImportJob.find().sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
      ImportJob.countDocuments(),
    ]);

    return {
      jobs,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  static async update(id: string, data: Partial<IImportJob>): Promise<IImportJob | null> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return ImportJob.findByIdAndUpdate(id, { $set: data }, { new: true });
  }

  static async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const res = await ImportJob.findByIdAndDelete(id);
    return !!res;
  }
}
