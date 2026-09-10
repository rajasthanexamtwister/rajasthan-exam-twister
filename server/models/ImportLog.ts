import mongoose, { Schema, Document, Model } from "mongoose";

export type ImportLogResult = "SUCCESS" | "DUPLICATE" | "FAILED";

export interface IImportLog extends Document {
  _id: mongoose.Types.ObjectId;
  importJobId: mongoose.Types.ObjectId;
  fileName: string;
  result: ImportLogResult;
  reason?: string;
  createdNoteId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ImportLogSchema = new Schema<IImportLog>(
  {
    importJobId: {
      type: Schema.Types.ObjectId,
      ref: "ImportJob",
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    result: {
      type: String,
      enum: ["SUCCESS", "DUPLICATE", "FAILED"],
      required: true,
    },
    reason: String,
    createdNoteId: {
      type: Schema.Types.ObjectId,
      ref: "Note",
    },
  },
  {
    timestamps: true,
  }
);

export const ImportLog: Model<IImportLog> =
  mongoose.models.ImportLog || mongoose.model<IImportLog>("ImportLog", ImportLogSchema);

export default ImportLog;
