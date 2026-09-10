import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMedia extends Document {
  _id: mongoose.Types.ObjectId;
  url: string;
  altText?: string;
  caption?: string;
  width?: number;
  height?: number;
  fileSize?: number;
  mimeType: string;
  order?: number;
  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema = new Schema<IMedia>(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    altText: {
      type: String,
      trim: true,
    },
    caption: {
      type: String,
      trim: true,
    },
    width: Number,
    height: Number,
    fileSize: Number,
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    order: Number,
  },
  {
    timestamps: true,
  }
);

export const Media: Model<IMedia> =
  mongoose.models.Media || mongoose.model<IMedia>("Media", MediaSchema);

export default Media;
