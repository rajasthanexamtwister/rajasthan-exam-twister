import mongoose, { Schema, Document, Model } from "mongoose";

export type ImportJobStatus = "RUNNING" | "COMPLETED" | "FAILED";

export interface IImportJob extends Document {
  _id: mongoose.Types.ObjectId;
  status: ImportJobStatus;
  totalFiles: number;
  successCount: number;
  duplicateCount: number;
  failedCount: number;
  isDryRun: boolean;
  createdAt: Date;
  completedAt?: Date;
}

const ImportJobSchema = new Schema<IImportJob>(
  {
    status: {
      type: String,
      enum: ["RUNNING", "COMPLETED", "FAILED"],
      default: "RUNNING",
    },
    totalFiles: {
      type: Number,
      required: true,
      default: 0,
    },
    successCount: {
      type: Number,
      default: 0,
    },
    duplicateCount: {
      type: Number,
      default: 0,
    },
    failedCount: {
      type: Number,
      default: 0,
    },
    isDryRun: {
      type: Boolean,
      default: false,
    },
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

export const ImportJob: Model<IImportJob> =
  mongoose.models.ImportJob || mongoose.model<IImportJob>("ImportJob", ImportJobSchema);

export default ImportJob;
