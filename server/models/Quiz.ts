import mongoose, { Schema, Document, Model } from "mongoose";
import { ContentStatus } from "./Blog";
import "./Category";

export type QuizDifficulty = "easy" | "medium" | "hard";

export interface IQuiz extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  subject?: string;
  categoryId?: mongoose.Types.ObjectId;
  examTags: string[];
  difficulty: QuizDifficulty;
  attemptCount: number;
  contentFingerprint?: string;
  isPersonalizedBooster?: boolean;
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
    examTags: {
      type: [String],
      default: [],
      index: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
      index: true,
    },
    attemptCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    contentFingerprint: {
      type: String,
      index: true,
      sparse: true,
      trim: true,
    },
    isPersonalizedBooster: {
      type: Boolean,
      default: false,
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

// Compound indexes for published listings & discovery
QuizSchema.index({ status: 1, publishedAt: -1 });
QuizSchema.index({ isPersonalizedBooster: 1, status: 1 });
QuizSchema.index({ subject: 1, status: 1 });
QuizSchema.index({ examTags: 1, status: 1 });
QuizSchema.index({ difficulty: 1, status: 1 });
QuizSchema.index({ status: 1, attemptCount: -1 });

export const Quiz: Model<IQuiz> =
  mongoose.models.Quiz || mongoose.model<IQuiz>("Quiz", QuizSchema);

export default Quiz;
