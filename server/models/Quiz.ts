import mongoose, { Schema, Document, Model } from "mongoose";
import { ContentStatus } from "./Blog";

export interface IQuiz extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  subject?: string;
  categoryId?: mongoose.Types.ObjectId;
  status: ContentStatus;
  timeLimitSeconds?: number | null;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  maxAttempts?: number | null;
  defaultMarks: number;
  defaultNegativeMarks: number;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QuizSchema = new Schema<IQuiz>(
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
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      index: true,
    },
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      default: "DRAFT",
      index: true,
    },
    timeLimitSeconds: {
      type: Number,
      default: null,
    },
    shuffleQuestions: {
      type: Boolean,
      default: false,
    },
    shuffleOptions: {
      type: Boolean,
      default: false,
    },
    maxAttempts: {
      type: Number,
      default: null,
    },
    defaultMarks: {
      type: Number,
      default: 1,
      min: 0.1,
    },
    defaultNegativeMarks: {
      type: Number,
      default: 0,
      min: 0,
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for published listings
QuizSchema.index({ status: 1, publishedAt: -1 });
QuizSchema.index({ subject: 1, status: 1 });

export const Quiz: Model<IQuiz> =
  mongoose.models.Quiz || mongoose.model<IQuiz>("Quiz", QuizSchema);

export default Quiz;
