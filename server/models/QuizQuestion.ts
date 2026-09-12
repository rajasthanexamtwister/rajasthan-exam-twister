import mongoose, { Schema, Document, Model } from "mongoose";

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
  },
  {
    timestamps: true,
  }
);

// Compound index for querying questions by quiz and order
QuizQuestionSchema.index({ quizId: 1, order: 1 });

export const QuizQuestion: Model<IQuizQuestion> =
  mongoose.models.QuizQuestion ||
  mongoose.model<IQuizQuestion>("QuizQuestion", QuizQuestionSchema);

export default QuizQuestion;
