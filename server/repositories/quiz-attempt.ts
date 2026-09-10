import mongoose from "mongoose";
import { connectToDatabase } from "@/server/lib/mongodb";
import { QuizAttempt, IQuizAttempt } from "@/server/models/QuizAttempt";
import "@/server/models/Student";

export class QuizAttemptRepository {
  static async create(data: {
    quizId: string;
    studentId?: string | null;
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
      studentId:
        data.studentId && mongoose.Types.ObjectId.isValid(data.studentId)
          ? new mongoose.Types.ObjectId(data.studentId)
          : undefined,
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
    return QuizAttempt.findById(id).populate("quizId", "title slug subject").exec();
  }

  static async countByQuizId(quizId: string): Promise<number> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(quizId)) return 0;
    return QuizAttempt.countDocuments({
      quizId: new mongoose.Types.ObjectId(quizId),
    });
  }

  static async listByStudentId(
    studentId: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<{ attempts: IQuizAttempt[]; total: number; page: number; pageSize: number; totalPages: number }> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return { attempts: [], total: 0, page: 1, pageSize, totalPages: 1 };
    }

    const skip = (page - 1) * pageSize;
    const studentObjectId = new mongoose.Types.ObjectId(studentId);

    const [attempts, total] = await Promise.all([
      QuizAttempt.find({ studentId: studentObjectId })
        .populate("quizId", "title slug subject difficulty")
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .exec(),
      QuizAttempt.countDocuments({ studentId: studentObjectId }),
    ]);

    return {
      attempts,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  static async getLeaderboard(windowDays: number = 7, limit: number = 50) {
    await connectToDatabase();
    const sinceDate = windowDays > 0 ? new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000) : new Date(0);

    const matchStage: Record<string, unknown> = {
      studentId: { $ne: null, $exists: true },
      submittedAt: { $gte: sinceDate },
    };

    const results = await QuizAttempt.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$studentId",
          totalAttempts: { $sum: 1 },
          totalScore: { $sum: "$score" },
          totalPossibleScore: { $sum: "$totalPossibleScore" },
          correctCount: { $sum: "$correctCount" },
          incorrectCount: { $sum: "$incorrectCount" },
          unattemptedCount: { $sum: "$unattemptedCount" },
        },
      },
      {
        $lookup: {
          from: "students",
          localField: "_id",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },
      {
        $project: {
          studentId: "$_id",
          studentName: "$student.name",
          avatarUrl: "$student.avatarUrl",
          totalAttempts: 1,
          totalScore: { $round: ["$totalScore", 2] },
          totalPossibleScore: { $round: ["$totalPossibleScore", 2] },
          accuracyPercentage: {
            $cond: [
              { $gt: [{ $add: ["$correctCount", "$incorrectCount"] }, 0] },
              {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          "$correctCount",
                          { $add: ["$correctCount", "$incorrectCount"] },
                        ],
                      },
                      100,
                    ],
                  },
                  1,
                ],
              },
              0,
            ],
          },
        },
      },
      { $sort: { totalScore: -1, totalAttempts: -1 } },
      { $limit: limit },
    ]);

    return results;
  }
}
