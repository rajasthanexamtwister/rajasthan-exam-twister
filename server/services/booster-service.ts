import mongoose from "mongoose";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Quiz, IQuiz } from "@/server/models/Quiz";
import { QuizQuestion, IQuizQuestion } from "@/server/models/QuizQuestion";
import { QuizAttempt } from "@/server/models/QuizAttempt";
import { AnalyticsService } from "./analytics-service";
import { NotebookService } from "./notebook-service";

export interface BoosterGenerationResult {
  quizId: string;
  slug: string;
  title: string;
  totalQuestions: number;
  topics: string[];
}

export class BoosterService {
  /**
   * Generate a targeted booster test (20-25 questions) for a student
   * based on their weakest 2-3 subjects, prioritizing past wrong questions
   * then unattempted questions from published quizzes.
   *
   * Architectural Decision: Persisted Quiz document.
   * Rationale: Reusing the standard persisted Quiz and QuizQuestion models
   * allows the student to immediately take the test using the robust
   * /quizzes/[slug]/attempt engine, submit answers, view results on
   * /quizzes/[slug]/result, and have attempts saved to their history
   * without maintaining a parallel ephemeral quiz runner.
   */
  static async generateBoosterTest(studentId: string): Promise<BoosterGenerationResult> {
    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      throw new Error("Invalid student ID");
    }

    await connectToDatabase();
    const targetStudentId = new mongoose.Types.ObjectId(studentId);

    // 1. Get student's weak topics (relax sample size to 1 so even early attempts count)
    const weakTopicsAnalysis = await AnalyticsService.getStudentWeakTopics(studentId, 1);
    let targetSubjects = weakTopicsAnalysis.slice(0, 3).map((w) => w.topic);

    // If no weak topics found yet, retrieve subjects from any published quizzes
    if (targetSubjects.length === 0) {
      const publishedQuizzes = await Quiz.find({ status: "PUBLISHED" })
        .select("subject")
        .limit(10)
        .lean();

      const uniqueSubjects = Array.from(
        new Set(
          publishedQuizzes
            .map((q) => q.subject?.trim())
            .filter((s): s is string => Boolean(s))
        )
      );

      targetSubjects = uniqueSubjects.slice(0, 3);
    }

    if (targetSubjects.length === 0) {
      targetSubjects = ["General Practice"];
    }

    // 2. Fetch student's wrong questions
    const wrongQuestions = await NotebookService.getStudentWrongQuestions(studentId);

    // Filter wrong questions that belong to the target subjects first, or general wrong questions
    const prioritizedWrongQuestions: NotebookQuestionItemRaw[] = [];
    const otherWrongQuestions: NotebookQuestionItemRaw[] = [];

    for (const wq of wrongQuestions) {
      const isTargetSubject = targetSubjects.some(
        (ts) => wq.subject?.toLowerCase() === ts.toLowerCase()
      );
      if (isTargetSubject) {
        prioritizedWrongQuestions.push(wq);
      } else {
        otherWrongQuestions.push(wq);
      }
    }

    // Combine wrong questions (prioritizing target subjects)
    const selectedWrong = [...prioritizedWrongQuestions, ...otherWrongQuestions].slice(0, 15);

    // 3. Find published quizzes in the target subjects to fetch unattempted questions
    const subjectQuizzes = await Quiz.find({
      status: "PUBLISHED",
      $or: [
        { subject: { $in: targetSubjects.map((s) => new RegExp(`^${s}$`, "i")) } },
        { title: { $in: targetSubjects.map((s) => new RegExp(s, "i")) } },
      ],
    })
      .select("_id")
      .lean();

    let subjectQuizIds = subjectQuizzes.map((q) => q._id);

    // If no subject quizzes match, look for any published quizzes
    if (subjectQuizIds.length === 0) {
      const anyPublished = await Quiz.find({ status: "PUBLISHED" })
        .select("_id")
        .limit(10)
        .lean();
      subjectQuizIds = anyPublished.map((q) => q._id);
    }

    // Find all questions the student has already attempted
    const studentAttempts = await QuizAttempt.find({ studentId: targetStudentId })
      .select("answers.questionId")
      .lean();

    const attemptedQuestionIdSet = new Set<string>();
    for (const att of studentAttempts) {
      for (const ans of att.answers || []) {
        if (ans.questionId) {
          attemptedQuestionIdSet.add(ans.questionId.toString());
        }
      }
    }

    // Fetch unattempted questions from these published quizzes
    const targetQuestionCount = 20; // 20-25 questions
    const neededUnattempted = Math.max(0, targetQuestionCount - selectedWrong.length);

    let unattemptedQuestions: any[] = [];
    if (neededUnattempted > 0 && subjectQuizIds.length > 0) {
      const selectedWrongIds = new Set(selectedWrong.map((q) => q.questionId));

      const candidateQuestions = await QuizQuestion.find({
        quizId: { $in: subjectQuizIds },
      }).lean();

      for (const cand of candidateQuestions) {
        const candIdStr = cand._id.toString();
        // Priority to unattempted and not already in selectedWrong
        if (!attemptedQuestionIdSet.has(candIdStr) && !selectedWrongIds.has(candIdStr)) {
          unattemptedQuestions.push(cand);
          if (unattemptedQuestions.length >= neededUnattempted) {
            break;
          }
        }
      }

      // If we still need more questions, include any available questions from the subject quizzes
      if (unattemptedQuestions.length + selectedWrong.length < 10) {
        for (const cand of candidateQuestions) {
          const candIdStr = cand._id.toString();
          if (
            !selectedWrongIds.has(candIdStr) &&
            !unattemptedQuestions.some((u) => u._id.toString() === candIdStr)
          ) {
            unattemptedQuestions.push(cand);
            if (unattemptedQuestions.length + selectedWrong.length >= targetQuestionCount) {
              break;
            }
          }
        }
      }
    }

    // Merge wrong questions and unattempted questions
    const questionsToClone: {
      questionText: string;
      options: string[];
      correctOptionIndex: number;
      explanation: string;
      marks: number;
      negativeMarks: number;
    }[] = [];

    // Add wrong questions
    for (const w of selectedWrong) {
      questionsToClone.push({
        questionText: w.questionText,
        options: w.options,
        correctOptionIndex: w.correctOptionIndex,
        explanation: w.explanation || "",
        marks: w.marks || 1,
        negativeMarks: w.negativeMarks || 0,
      });
    }

    // Add unattempted questions
    for (const u of unattemptedQuestions) {
      questionsToClone.push({
        questionText: u.questionText,
        options: u.options,
        correctOptionIndex: u.correctOptionIndex,
        explanation: u.explanation || "",
        marks: u.marks || 1,
        negativeMarks: u.negativeMarks || 0,
      });
    }

    // Fallback: If no questions exist in DB at all, throw informative error
    if (questionsToClone.length === 0) {
      throw new Error(
        "No published questions available to generate a booster test. Please ensure quizzes are published first."
      );
    }

    // 4. Create the persisted Quiz document
    const subjectLabel = targetSubjects.slice(0, 2).join(" & ");
    const boosterTitle = `Personalized Booster: ${subjectLabel}`;
    const timestamp = Date.now();
    const shortStudent = studentId.slice(-6);
    const boosterSlug = `booster-${shortStudent}-${timestamp}`;

    const newQuiz = await Quiz.create({
      title: boosterTitle,
      slug: boosterSlug,
      subject: targetSubjects[0] || "General Studies",
      difficulty: "medium",
      status: "PUBLISHED",
      publishedAt: new Date(),
      defaultMarks: 1,
      defaultNegativeMarks: 0,
      timeLimitSeconds: questionsToClone.length * 60, // 1 min per question
      shuffleQuestions: true,
      shuffleOptions: false,
    });

    // 5. Create the cloned QuizQuestion documents
    const questionDocs = questionsToClone.map((q, idx) => ({
      quizId: newQuiz._id,
      order: idx + 1,
      questionText: q.questionText,
      options: q.options,
      correctOptionIndex: q.correctOptionIndex,
      explanation: q.explanation,
      marks: q.marks,
      negativeMarks: q.negativeMarks,
    }));

    await QuizQuestion.insertMany(questionDocs);

    return {
      quizId: newQuiz._id.toString(),
      slug: newQuiz.slug,
      title: newQuiz.title,
      totalQuestions: questionDocs.length,
      topics: targetSubjects,
    };
  }
}

interface NotebookQuestionItemRaw {
  questionId: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  marks?: number;
  negativeMarks?: number;
  subject?: string;
}
