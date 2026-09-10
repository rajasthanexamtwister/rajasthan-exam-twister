import mongoose, { Schema, Document, Model } from "mongoose";
import { ContentStatus } from "./Blog";

export interface INote extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  subject?: string;
  content: string; // sanitized HTML
  categoryId?: mongoose.Types.ObjectId;
  tagIds: mongoose.Types.ObjectId[];
  imageIds: mongoose.Types.ObjectId[];
  pdfMediaId?: mongoose.Types.ObjectId;
  source?: string;
  status: ContentStatus;
  publishedAt?: Date;
  contentHash?: string;
  importJobId?: mongoose.Types.ObjectId;
  isEditedSinceImport?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    subject: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      default: "",
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      index: true,
    },
    tagIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],
    imageIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Media",
      },
    ],
    pdfMediaId: {
      type: Schema.Types.ObjectId,
      ref: "Media",
    },
    source: String,
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      default: "DRAFT",
      index: true,
    },
    publishedAt: Date,
    contentHash: {
      type: String,
      index: true,
    },
    importJobId: {
      type: Schema.Types.ObjectId,
      ref: "ImportJob",
      index: true,
    },
    isEditedSinceImport: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast published listings
NoteSchema.index({ status: 1, publishedAt: -1 });

// Full-text search index
NoteSchema.index({ title: "text", subject: "text", content: "text" });

export const Note: Model<INote> =
  mongoose.models.Note || mongoose.model<INote>("Note", NoteSchema);

export default Note;
