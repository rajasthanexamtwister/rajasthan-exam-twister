import mongoose from "mongoose";
import { connectToDatabase } from "@/server/lib/mongodb";
import { QuizAttempt, IQuizAttempt } from "@/server/models/QuizAttempt";

export class QuizAttemptRepository {
  static async create(data: {
    quizId: string;
    answers: {
      questionId: string;
      selectedOptionIndex: number | null;
    }[];
    score: number;
    totalPossibleScore: number;
    correctCount: number;
    incorrectCount: number;
    unattemptedCount: number;
    startedAt?: Date;
    submittedAt?: Date;
  }): Promise<IQuizAttempt> {
    await connectToDatabase();

    const attempt = new QuizAttempt({
      quizId: new mongoose.Types.ObjectId(data.quizId),
      answers: data.answers.map((a) => ({
        questionId: new mongoose.Types.ObjectId(a.questionId),
        selectedOptionIndex: a.selectedOptionIndex,
      })),
      score: data.score,
      totalPossibleScore: data.totalPossibleScore,
      correctCount: data.correctCount,
      incorrectCount: data.incorrectCount,
      unattemptedCount: data.unattemptedCount,
      startedAt: data.startedAt,
      submittedAt: data.submittedAt || new Date(),
    });

    return attempt.save();
  }

  static async findById(id: string): Promise<IQuizAttempt | null> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return QuizAttempt.findById(id).exec();
  }

  static async countByQuizId(quizId: string): Promise<number> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(quizId)) return 0;
    return QuizAttempt.countDocuments({
      quizId: new mongoose.Types.ObjectId(quizId),
    });
  }
}
