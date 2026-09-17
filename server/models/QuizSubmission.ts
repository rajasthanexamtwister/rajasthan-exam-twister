import mongoose, { Schema, Document, Model } from "mongoose";

export type QuizSubmissionStatus = "DRAFT" | "VALID" | "REJECTED" | "USED";

export interface IQuizSubmission extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userEmail?: string;
  userName?: string;
  originalFileName?: string;
  quizTitle: string;
  subject?: string;
  questionCount: number;
  jsonData: any;
  status: QuizSubmissionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const QuizSubmissionSchema = new Schema<IQuizSubmission>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    userEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    userName: {
      type: String,
      trim: true,
    },
    originalFileName: {
      type: String,
      trim: true,
    },
    quizTitle: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      trim: true,
    },
    questionCount: {
      type: Number,
      required: true,
      min: 1,
    },
    jsonData: {
      type: Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ["DRAFT", "VALID", "REJECTED", "USED"],
      default: "VALID",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const QuizSubmission: Model<IQuizSubmission> =
  mongoose.models.QuizSubmission ||
  mongoose.model<IQuizSubmission>("QuizSubmission", QuizSubmissionSchema);

export default QuizSubmission;
