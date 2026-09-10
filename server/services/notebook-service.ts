import mongoose from "mongoose";
import { connectToDatabase } from "@/server/lib/mongodb";
import { QuizAttempt } from "@/server/models/QuizAttempt";
import { QuizQuestion, IQuizQuestion } from "@/server/models/QuizQuestion";
import { Bookmark, IBookmark } from "@/server/models/Bookmark";
import "@/server/models/Quiz";
import "@/server/models/Student";

export interface NotebookQuestionItem {
  questionId: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  marks?: number;
  negativeMarks?: number;
  userSelectedOptionIndex?: number | null;
  quizId: string;
  quizTitle: string;
  quizSlug: string;
  subject?: string;
  isBookmarked: boolean;
  attemptedAt?: Date;
  bookmarkedAt?: Date;
}

export class NotebookService {
  /**
   * Retrieve all questions the student answered incorrectly across their quiz attempts.
   * Scoped strictly to the studentId.
   */
  static async getStudentWrongQuestions(studentId: string): Promise<NotebookQuestionItem[]> {
    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return [];
    }

    await connectToDatabase();
    const targetStudentId = new mongoose.Types.ObjectId(studentId);

    // Fetch student's attempts sorted latest first
    const attempts = await QuizAttempt.find({ studentId: targetStudentId })
      .populate({
        path: "quizId",
        select: "_id title slug subject",
      })
      .sort({ submittedAt: -1 })
      .lean();

    if (!attempts || attempts.length === 0) {
      return [];
    }

    // Collect all question IDs from answers where an answer was chosen
    const questionAttemptsMap = new Map<
      string,
      {
        selectedOptionIndex: number | null;
        attemptedAt: Date;
        quiz: { _id: string; title: string; slug: string; subject?: string };
      }
    >();

    for (const attempt of attempts) {
      const quizObj = attempt.quizId as any;
      if (!quizObj) continue;

      for (const ans of attempt.answers || []) {
        if (ans.selectedOptionIndex !== null && ans.selectedOptionIndex !== undefined) {
          const qIdStr = ans.questionId.toString();
          // Retain latest attempt data if student encountered question multiple times
          if (!questionAttemptsMap.has(qIdStr)) {
            questionAttemptsMap.set(qIdStr, {
              selectedOptionIndex: ans.selectedOptionIndex,
              attemptedAt: attempt.submittedAt || (attempt as any).createdAt,
              quiz: {
                _id: quizObj._id ? quizObj._id.toString() : String(quizObj),
                title: quizObj.title || "Quiz Practice",
                slug: quizObj.slug || "",
                subject: quizObj.subject || "",
              },
            });
          }
        }
      }
    }

    const questionIds = Array.from(questionAttemptsMap.keys()).map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    if (questionIds.length === 0) {
      return [];
    }

    // Fetch canonical question documents
    const questions = await QuizQuestion.find({ _id: { $in: questionIds } }).lean();

    // Fetch student's bookmarks to annotate bookmarked status
    const studentBookmarks = await Bookmark.find({
      studentId: targetStudentId,
      questionId: { $in: questionIds },
    }).lean();

    const bookmarkedSet = new Set(studentBookmarks.map((b) => b.questionId.toString()));

    const wrongQuestions: NotebookQuestionItem[] = [];

    for (const q of questions) {
      const qIdStr = q._id.toString();
      const attemptInfo = questionAttemptsMap.get(qIdStr);
      if (!attemptInfo) continue;

      // Filter: only include if selected option does not match correctOptionIndex
      if (
        attemptInfo.selectedOptionIndex !== null &&
        attemptInfo.selectedOptionIndex !== q.correctOptionIndex
      ) {
        wrongQuestions.push({
          questionId: qIdStr,
          questionText: q.questionText,
          options: q.options,
          correctOptionIndex: q.correctOptionIndex,
          explanation: q.explanation || "",
          marks: q.marks,
          negativeMarks: q.negativeMarks,
          userSelectedOptionIndex: attemptInfo.selectedOptionIndex,
          quizId: attemptInfo.quiz._id,
          quizTitle: attemptInfo.quiz.title,
          quizSlug: attemptInfo.quiz.slug,
          subject: attemptInfo.quiz.subject,
          isBookmarked: bookmarkedSet.has(qIdStr),
          attemptedAt: attemptInfo.attemptedAt,
        });
      }
    }

    // Sort latest attempted first
    wrongQuestions.sort((a, b) => {
      const timeA = a.attemptedAt ? new Date(a.attemptedAt).getTime() : 0;
      const timeB = b.attemptedAt ? new Date(b.attemptedAt).getTime() : 0;
      return timeB - timeA;
    });

    return wrongQuestions;
  }

  /**
   * Retrieve all bookmarked questions for a student.
   * Scoped strictly to the studentId.
   */
  static async getStudentBookmarks(studentId: string): Promise<NotebookQuestionItem[]> {
    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return [];
    }

    await connectToDatabase();
    const targetStudentId = new mongoose.Types.ObjectId(studentId);

    const bookmarks = await Bookmark.find({ studentId: targetStudentId })
      .populate({
        path: "questionId",
        populate: {
          path: "quizId",
          select: "_id title slug subject",
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    const items: NotebookQuestionItem[] = [];

    for (const b of bookmarks) {
      const q = b.questionId as any;
      if (!q || !q.questionText) continue;

      const quizObj = q.quizId as any;

      items.push({
        questionId: q._id.toString(),
        questionText: q.questionText,
        options: q.options || [],
        correctOptionIndex: q.correctOptionIndex,
        explanation: q.explanation || "",
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        quizId: quizObj?._id ? quizObj._id.toString() : "",
        quizTitle: quizObj?.title || "Quiz Practice",
        quizSlug: quizObj?.slug || "",
        subject: quizObj?.subject || "",
        isBookmarked: true,
        bookmarkedAt: (b as any).createdAt,
      });
    }

    return items;
  }

  /**
   * Add a question bookmark.
   */
  static async addBookmark(studentId: string, questionId: string): Promise<boolean> {
    if (
      !studentId ||
      !questionId ||
      !mongoose.Types.ObjectId.isValid(studentId) ||
      !mongoose.Types.ObjectId.isValid(questionId)
    ) {
      return false;
    }

    await connectToDatabase();
    await Bookmark.findOneAndUpdate(
      {
        studentId: new mongoose.Types.ObjectId(studentId),
        questionId: new mongoose.Types.ObjectId(questionId),
      },
      {
        $setOnInsert: {
          studentId: new mongoose.Types.ObjectId(studentId),
          questionId: new mongoose.Types.ObjectId(questionId),
        },
      },
      { upsert: true, new: true }
    );

    return true;
  }

  /**
   * Remove a question bookmark.
   */
  static async removeBookmark(studentId: string, questionId: string): Promise<boolean> {
    if (
      !studentId ||
      !questionId ||
      !mongoose.Types.ObjectId.isValid(studentId) ||
      !mongoose.Types.ObjectId.isValid(questionId)
    ) {
      return false;
    }

    await connectToDatabase();
    const res = await Bookmark.deleteOne({
      studentId: new mongoose.Types.ObjectId(studentId),
      questionId: new mongoose.Types.ObjectId(questionId),
    });

    return res.deletedCount > 0;
  }
}
