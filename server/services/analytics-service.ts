import mongoose from "mongoose";
import { connectToDatabase } from "@/server/lib/mongodb";
import { QuizAttempt } from "@/server/models/QuizAttempt";
import "@/server/models/Quiz";
import "@/server/models/Category";

export interface WeakTopicAnalysis {
  topic: string;
  totalAttempts: number;
  questionsAttempted: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  accuracyPercentage: number;
  status: "CRITICAL" | "NEEDS_IMPROVEMENT" | "PROFICIENT";
}

export class AnalyticsService {
  /**
   * Compute per-subject accuracy for a student across all their persisted attempts.
   * Filters out topics with fewer than `minSampleSize` attempted questions.
   * Ranked weakest-first (ascending accuracy).
   */
  static async getStudentWeakTopics(
    studentId: string,
    minSampleSize: number = 5
  ): Promise<WeakTopicAnalysis[]> {
    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return [];
    }

    await connectToDatabase();

    const targetStudentId = new mongoose.Types.ObjectId(studentId);

    const rawAggregations = await QuizAttempt.aggregate([
      {
        $match: {
          studentId: targetStudentId,
        },
      },
      {
        $lookup: {
          from: "quizzes",
          localField: "quizId",
          foreignField: "_id",
          as: "quiz",
        },
      },
      {
        $unwind: "$quiz",
      },
      {
        $lookup: {
          from: "categories",
          localField: "quiz.categoryId",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: {
          path: "$category",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          topic: {
            $cond: [
              {
                $and: [
                  { $ne: ["$quiz.subject", null] },
                  { $ne: [{ $trim: { input: "$quiz.subject" } }, ""] },
                ],
              },
              { $trim: { input: "$quiz.subject" } },
              {
                $cond: [
                  {
                    $and: [
                      { $ne: ["$category.name", null] },
                      { $ne: [{ $trim: { input: "$category.name" } }, ""] },
                    ],
                  },
                  { $trim: { input: "$category.name" } },
                  "General Studies",
                ],
              },
            ],
          },
          correctCount: { $ifNull: ["$correctCount", 0] },
          incorrectCount: { $ifNull: ["$incorrectCount", 0] },
          unattemptedCount: { $ifNull: ["$unattemptedCount", 0] },
        },
      },
      {
        $group: {
          _id: "$topic",
          totalAttempts: { $sum: 1 },
          correctCount: { $sum: "$correctCount" },
          incorrectCount: { $sum: "$incorrectCount" },
          unattemptedCount: { $sum: "$unattemptedCount" },
        },
      },
    ]);

    const result: WeakTopicAnalysis[] = [];

    for (const row of rawAggregations) {
      const topicName = row._id || "General Studies";
      const totalAttempts = row.totalAttempts || 0;
      const correct = row.correctCount || 0;
      const incorrect = row.incorrectCount || 0;
      const unattempted = row.unattemptedCount || 0;
      const questionsAttempted = correct + incorrect;

      // Enforce minimum sample size
      if (questionsAttempted < minSampleSize) {
        continue;
      }

      const accuracy =
        questionsAttempted > 0
          ? Math.round((correct / questionsAttempted) * 10000) / 100
          : 0;

      let status: "CRITICAL" | "NEEDS_IMPROVEMENT" | "PROFICIENT" = "PROFICIENT";
      if (accuracy < 50) {
        status = "CRITICAL";
      } else if (accuracy < 70) {
        status = "NEEDS_IMPROVEMENT";
      }

      result.push({
        topic: topicName,
        totalAttempts,
        questionsAttempted,
        correctCount: correct,
        incorrectCount: incorrect,
        unattemptedCount: unattempted,
        accuracyPercentage: accuracy,
        status,
      });
    }

    // Sort weakest-first (ascending accuracy). Tie-break by most questions attempted.
    result.sort((a, b) => {
      if (a.accuracyPercentage !== b.accuracyPercentage) {
        return a.accuracyPercentage - b.accuracyPercentage;
      }
      return b.questionsAttempted - a.questionsAttempted;
    });

    return result;
  }
}
