import mongoose, { Schema, Document, Model } from "mongoose";

export type ContentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface IBlog extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  excerpt?: string;
  content: string; // sanitized HTML
  coverImageId?: mongoose.Types.ObjectId;
  categoryId?: mongoose.Types.ObjectId;
  tagIds: mongoose.Types.ObjectId[];
  status: ContentStatus;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  readingTime?: number;
  featured: boolean;
  author?: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema = new Schema<IBlog>(
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
    excerpt: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    coverImageId: {
      type: Schema.Types.ObjectId,
      ref: "Media",
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
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      default: "DRAFT",
      index: true,
    },
    metaTitle: String,
    metaDescription: String,
    canonicalUrl: String,
    readingTime: Number,
    featured: {
      type: Boolean,
      default: false,
    },
    author: String,
    publishedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Compound index for fast published listings
BlogSchema.index({ status: 1, publishedAt: -1 });

// Full-text search index
BlogSchema.index({ title: "text", excerpt: "text", content: "text" });

export const Blog: Model<IBlog> =
  mongoose.models.Blog || mongoose.model<IBlog>("Blog", BlogSchema);

export default Blog;
