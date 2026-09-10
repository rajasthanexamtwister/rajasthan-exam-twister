import mongoose, { Schema, Document, Model } from "mongoose";

export interface IQuizAttemptAnswer {
  questionId: mongoose.Types.ObjectId;
  selectedOptionIndex: number | null;
}

export interface IQuizAttempt extends Document {
  _id: mongoose.Types.ObjectId;
  quizId: mongoose.Types.ObjectId;
  answers: IQuizAttemptAnswer[];
  score: number;
  totalPossibleScore: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  startedAt?: Date;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QuizAttemptAnswerSchema = new Schema(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "QuizQuestion",
      required: true,
    },
    selectedOptionIndex: {
      type: Number,
      default: null,
    },
  },
  { _id: false }
);

const QuizAttemptSchema = new Schema<IQuizAttempt>(
  {
    quizId: {
      type: Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },
    answers: {
      type: [QuizAttemptAnswerSchema],
      default: [],
    },
    score: {
      type: Number,
      required: true,
    },
    totalPossibleScore: {
      type: Number,
      required: true,
    },
    correctCount: {
      type: Number,
      required: true,
      default: 0,
    },
    incorrectCount: {
      type: Number,
      required: true,
      default: 0,
    },
    unattemptedCount: {
      type: Number,
      required: true,
      default: 0,
    },
    startedAt: {
      type: Date,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

QuizAttemptSchema.index({ quizId: 1, submittedAt: -1 });

export const QuizAttempt: Model<IQuizAttempt> =
  mongoose.models.QuizAttempt ||
  mongoose.model<IQuizAttempt>("QuizAttempt", QuizAttemptSchema);

export default QuizAttempt;
