import mongoose from "mongoose";
import { connectToDatabase } from "@/server/lib/mongodb";
import { QuizQuestion, IQuizQuestion } from "@/server/models/QuizQuestion";

export class QuizQuestionRepository {
  static async insertMany(
    quizId: string,
    questions: {
      order: number;
      questionText: string;
      questionTextEn?: string;
      options: string[];
      optionsEn?: string[];
      correctOptionIndex: number;
      explanation?: string;
      marks?: number;
      negativeMarks?: number;
    }[]
  ): Promise<IQuizQuestion[]> {
    await connectToDatabase();
    const quizObjectId = new mongoose.Types.ObjectId(quizId);

    const docs = questions.map((q) => ({
      quizId: quizObjectId,
      order: q.order,
      questionText: q.questionText,
      questionTextEn: q.questionTextEn,
      options: q.options,
      optionsEn: q.optionsEn,
      correctOptionIndex: q.correctOptionIndex,
      explanation: q.explanation || "",
      marks: q.marks,
      negativeMarks: q.negativeMarks,
    }));

    return QuizQuestion.insertMany(docs);
  }

  static async findByQuizId(
    quizId: string,
    sortByOrder: boolean = true
  ): Promise<IQuizQuestion[]> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(quizId)) return [];

    return QuizQuestion.find({ quizId: new mongoose.Types.ObjectId(quizId) })
      .sort(sortByOrder ? { order: 1 } : { createdAt: 1 })
      .exec();
  }

  static async findById(id: string): Promise<IQuizQuestion | null> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return QuizQuestion.findById(id).exec();
  }

  static async updateQuestion(
    id: string,
    data: Partial<{
      questionText: string;
      questionTextEn: string;
      options: string[];
      optionsEn: string[];
      correctOptionIndex: number;
      explanation: string;
      marks: number | null;
      negativeMarks: number | null;
    }>
  ): Promise<IQuizQuestion | null> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    return QuizQuestion.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    ).exec();
  }

  static async deleteByQuizId(quizId: string): Promise<number> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(quizId)) return 0;

    const res = await QuizQuestion.deleteMany({
      quizId: new mongoose.Types.ObjectId(quizId),
    });
    return res.deletedCount || 0;
  }

  static async countByQuizId(quizId: string): Promise<number> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(quizId)) return 0;
    return QuizQuestion.countDocuments({
      quizId: new mongoose.Types.ObjectId(quizId),
    });
  }
}
