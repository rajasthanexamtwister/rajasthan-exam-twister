import mongoose from "mongoose";
import { connectToDatabase } from "@/server/lib/mongodb";
import { ImportLog, IImportLog, ImportLogResult } from "@/server/models/ImportLog";

export class ImportLogRepository {
  static async create(data: Partial<IImportLog>): Promise<IImportLog> {
    await connectToDatabase();
    return ImportLog.create(data);
  }

  static async createMany(logs: Array<Partial<IImportLog>>): Promise<IImportLog[]> {
    await connectToDatabase();
    if (!logs.length) return [];
    const created = await ImportLog.insertMany(logs);
    return created as unknown as IImportLog[];
  }

  static async listByJobId(jobId: string): Promise<IImportLog[]> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(jobId)) return [];
    return ImportLog.find({ importJobId: new mongoose.Types.ObjectId(jobId) })
      .populate("createdNoteId", "title slug status")
      .sort({ createdAt: 1 })
      .exec();
  }

  static async deleteByJobId(jobId: string): Promise<number> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(jobId)) return 0;
    const res = await ImportLog.deleteMany({ importJobId: new mongoose.Types.ObjectId(jobId) });
    return res.deletedCount || 0;
  }
}
