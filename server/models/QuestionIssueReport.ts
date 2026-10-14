import mongoose, { Schema, Document, Model } from "mongoose";

export type QuestionIssueReason =
  | "INCORRECT_ANSWER"
  | "INCORRECT_QUESTION"
  | "SPELLING_TYPO"
  | "OPTIONS_INCORRECT"
  | "OTHER";

export type QuestionIssueStatus = "PENDING" | "REVIEWED" | "RESOLVED" | "REJECTED";

export interface IQuestionIssueReport extends Document {
  _id: mongoose.Types.ObjectId;
  quizId: mongoose.Types.ObjectId;
  quizSlug: string;
  questionId: mongoose.Types.ObjectId;
  studentId?: mongoose.Types.ObjectId | null;
  studentEmail?: string | null;
  studentName?: string | null;
  reason: QuestionIssueReason;
  reasonLabel: string;
  description?: string;
  status: QuestionIssueStatus;
  adminNotes?: string;
  resolvedAt?: Date | null;
  resolvedBy?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionIssueReportSchema = new Schema<IQuestionIssueReport>(
  {
    quizId: {
      type: Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },
    quizSlug: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "QuizQuestion",
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      default: null,
      index: true,
    },
    studentEmail: {
      type: String,
      default: null,
      trim: true,
    },
    studentName: {
      type: String,
      default: null,
      trim: true,
    },
    reason: {
      type: String,
      required: true,
      enum: [
        "INCORRECT_ANSWER",
        "INCORRECT_QUESTION",
        "SPELLING_TYPO",
        "OPTIONS_INCORRECT",
        "OTHER",
      ],
      index: true,
    },
    reasonLabel: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    status: {
      type: String,
      enum: ["PENDING", "REVIEWED", "RESOLVED", "REJECTED"],
      default: "PENDING",
      index: true,
    },
    adminNotes: {
      type: String,
      trim: true,
      default: "",
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: String,
      default: null,
      trim: true,
    },
    clientIp: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

QuestionIssueReportSchema.index({ quizId: 1, questionId: 1, createdAt: -1 });
QuestionIssueReportSchema.index({ status: 1, createdAt: -1 });

export const QuestionIssueReport: Model<IQuestionIssueReport> =
  mongoose.models.QuestionIssueReport ||
  mongoose.model<IQuestionIssueReport>("QuestionIssueReport", QuestionIssueReportSchema);

export default QuestionIssueReport;
