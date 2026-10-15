import mongoose, { Schema, Document, Model } from "mongoose";

export type QuestionSeoStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface IQuestionAuditEntry {
  modifiedBy: string;
  modifiedAt: Date;
  changeReason: string;
  evidenceSource?: string;
  reportId?: mongoose.Types.ObjectId | null;
  previousState: {
    questionText: string;
    options: string[];
    correctOptionIndex: number;
    explanation?: string;
  };
  newState: {
    questionText: string;
    options: string[];
    correctOptionIndex: number;
    explanation?: string;
  };
}

export interface IQuizQuestion extends Document {
  _id: mongoose.Types.ObjectId;
  quizId: mongoose.Types.ObjectId;
  order: number;
  questionText: string;
  questionTextEn?: string;
  options: string[];
  optionsEn?: string[];
  correctOptionIndex: number;
  explanation?: string;
  marks?: number;
  negativeMarks?: number;

  // Editorial Verification & SEO Architecture Fields
  seoStatus: QuestionSeoStatus;
  seoSlug?: string;
  seoTitle?: string;
  seoDescription?: string;
  isAnswerVerified: boolean;
  verifiedOptionIndex?: number;
  verificationSource?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  examSource?: string;

  // Question Correction Audit Trail
  auditTrail?: IQuestionAuditEntry[];

  createdAt: Date;
  updatedAt: Date;
}

const QuizQuestionSchema = new Schema<IQuizQuestion>(
  {
    quizId: {
      type: Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    questionText: {
      type: String,
      required: true,
      trim: true,
    },
    questionTextEn: {
      type: String,
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      validate: [
        (val: string[]) => val.length >= 2 && val.length <= 6,
        "Options array must contain between 2 and 6 items",
      ],
    },
    optionsEn: {
      type: [String],
      default: undefined,
    },
    correctOptionIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    explanation: {
      type: String,
      trim: true,
      default: "",
    },
    marks: {
      type: Number,
      min: 0.01,
    },
    negativeMarks: {
      type: Number,
      min: 0,
    },
    seoStatus: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      default: "DRAFT",
      index: true,
    },
    seoSlug: {
      type: String,
      trim: true,
      lowercase: true,
    },
    seoTitle: {
      type: String,
      trim: true,
    },
    seoDescription: {
      type: String,
      trim: true,
    },
    isAnswerVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    verifiedOptionIndex: {
      type: Number,
      min: 0,
    },
    verificationSource: {
      type: String,
      trim: true,
    },
    reviewedBy: {
      type: String,
      trim: true,
    },
    reviewedAt: {
      type: Date,
    },
    examSource: {
      type: String,
      trim: true,
    },
    auditTrail: [
      {
        modifiedBy: { type: String, required: true },
        modifiedAt: { type: Date, default: Date.now },
        changeReason: { type: String, required: true, trim: true },
        evidenceSource: { type: String, trim: true },
        reportId: { type: Schema.Types.ObjectId, ref: "QuestionIssueReport", default: null },
        previousState: {
          questionText: { type: String, required: true },
          options: { type: [String], required: true },
          correctOptionIndex: { type: Number, required: true },
          explanation: { type: String, default: "" },
        },
        newState: {
          questionText: { type: String, required: true },
          options: { type: [String], required: true },
          correctOptionIndex: { type: Number, required: true },
          explanation: { type: String, default: "" },
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound index for querying questions by quiz and order
QuizQuestionSchema.index({ quizId: 1, order: 1 });

// Indexes for public SEO question retrieval and sitemap generation
QuizQuestionSchema.index({ seoSlug: 1 }, { unique: true, sparse: true });
QuizQuestionSchema.index({ seoStatus: 1, isAnswerVerified: 1, updatedAt: -1 });

export const QuizQuestion: Model<IQuizQuestion> =
  mongoose.models.QuizQuestion ||
  mongoose.model<IQuizQuestion>("QuizQuestion", QuizQuestionSchema);

export default QuizQuestion;
