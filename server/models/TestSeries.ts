import mongoose, { Schema, Document, Model } from "mongoose";
import { ContentStatus } from "./Blog";

export type TestType = "FULL_MOCK" | "SUBJECT_TEST" | "SECTIONAL" | "PREVIOUS_YEAR";

export interface ITestSeriesQuiz {
  quizId: mongoose.Types.ObjectId;
  title: string;
  testType: TestType;
  order: number;
  isFreeDemo: boolean;
  durationMinutes?: number;
  totalQuestions?: number;
  totalMarks?: number;
}

export interface ITestSeries {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  targetExam: string;
  examCategorySlug: string;
  bannerImage?: string;
  features: string[];
  totalTestsCount: number;
  freeTestsCount: number;
  totalQuestionsCount: number;
  language: string;
  status: ContentStatus;
  quizzes: ITestSeriesQuiz[];
  enrolledCount: number;
  rating: number;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type ITestSeriesDoc = ITestSeries & Document;

const TestSeriesQuizSchema = new Schema<ITestSeriesQuiz>(
  {
    quizId: {
      type: Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    testType: {
      type: String,
      enum: ["FULL_MOCK", "SUBJECT_TEST", "SECTIONAL", "PREVIOUS_YEAR"],
      default: "FULL_MOCK",
    },
    order: {
      type: Number,
      default: 0,
    },
    isFreeDemo: {
      type: Boolean,
      default: false,
    },
    durationMinutes: {
      type: Number,
      default: 60,
    },
    totalQuestions: {
      type: Number,
      default: 50,
    },
    totalMarks: {
      type: Number,
      default: 100,
    },
  },
  { _id: false }
);

const TestSeriesSchema = new Schema<ITestSeriesDoc>(
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
    description: {
      type: String,
      required: true,
      trim: true,
    },
    targetExam: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    examCategorySlug: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    bannerImage: {
      type: String,
      trim: true,
    },
    features: {
      type: [String],
      default: [
        "All-Rajasthan Rank & Percentile Predictor",
        "Full Syllabus Mock Papers with Authentic Negative Marking",
        "Instant Detailed Hindi & English Explanations",
        "Weak-Topic AI Booster Practice Generator",
      ],
    },
    totalTestsCount: {
      type: Number,
      default: 0,
    },
    freeTestsCount: {
      type: Number,
      default: 1,
    },
    totalQuestionsCount: {
      type: Number,
      default: 0,
    },
    language: {
      type: String,
      default: "Hindi & English (Bilingual)",
    },
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      default: "PUBLISHED",
      index: true,
    },
    quizzes: {
      type: [TestSeriesQuizSchema],
      default: [],
    },
    enrolledCount: {
      type: Number,
      default: 1250,
    },
    rating: {
      type: Number,
      default: 4.9,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

TestSeriesSchema.index({ status: 1, examCategorySlug: 1, createdAt: -1 });

export const TestSeries: Model<ITestSeriesDoc> =
  mongoose.models.TestSeries ||
  mongoose.model<ITestSeriesDoc>("TestSeries", TestSeriesSchema);
