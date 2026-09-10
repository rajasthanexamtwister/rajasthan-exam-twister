import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { QuizService } from "@/server/services/quiz-service";
import {
  CheckSquare,
  Clock,
  Award,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";

export const revalidate = 60;

interface QuizPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: QuizPageProps): Promise<Metadata> {
  const quiz = await QuizService.getPublicQuizBySlug(params.slug);
  if (!quiz) {
    return {
      title: "Quiz Not Found — Rajasthan Exam Twister",
    };
  }

  return {
    title: `${quiz.title} — Online Mock Test | Rajasthan Exam Twister`,
    description: `Take the ${quiz.title} mock test (${quiz.questionCount} questions). Test your exam readiness with authentic scoring and explanations.`,
  };
}

export default async function QuizIntroPage({ params }: QuizPageProps) {
  const quiz = await QuizService.getPublicQuizBySlug(params.slug);
  if (!quiz) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Structured Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-2 text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-amber-600 transition-colors">
            Home
          </Link>
          <span className="text-slate-300">/</span>
          <Link href="/quizzes" className="hover:text-amber-600 transition-colors">
            Mock Quizzes
          </Link>
          {quiz.subject && (
            <>
              <span className="text-slate-300">/</span>
              <span className="text-slate-600">{quiz.subject}</span>
            </>
          )}
          <span className="text-slate-300">/</span>
          <span className="text-slate-800 font-bold truncate max-w-xs sm:max-w-md">
            {quiz.title}
          </span>
        </nav>

        {/* Hero Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-10 space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {quiz.subject && (
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
                  {quiz.subject}
                </span>
              )}
              {quiz.category && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                  {quiz.category.name}
                </span>
              )}
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Official Mock Test
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              {quiz.title}
            </h1>
          </div>

          {/* Key Quiz Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Total Questions
              </span>
              <span className="text-xl font-black text-slate-900 mt-1 block">
                {quiz.questionCount} MCQs
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Time Limit
              </span>
              <span className="text-xl font-black text-slate-900 mt-1 block">
                {quiz.timeLimitSeconds
                  ? `${Math.round(quiz.timeLimitSeconds / 60)} Mins`
                  : "Untimed"}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Total Marks
              </span>
              <span className="text-xl font-black text-slate-900 mt-1 block">
                {quiz.questionCount * quiz.defaultMarks} Marks
              </span>
            </div>
          </div>

          {/* Marking Scheme Banner */}
          <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-700" />
              <span>Marking Scheme</span>
            </h3>
            <ul className="text-xs text-amber-950 space-y-1">
              <li className="flex items-center gap-2">
                <span className="font-bold text-emerald-700">+{quiz.defaultMarks} marks</span> for every correct answer
              </li>
              <li className="flex items-center gap-2">
                <span className="font-bold text-red-700">
                  {quiz.defaultNegativeMarks > 0 ? `-${quiz.defaultNegativeMarks} marks` : "0 marks"}
                </span>{" "}
                deducted for each wrong answer (Negative Marking)
              </li>
              <li className="flex items-center gap-2">
                <span className="font-bold text-slate-700">0 marks</span> for unattempted questions
              </li>
            </ul>
          </div>

          {/* Test Instructions */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Exam Instructions & Rules
            </h3>
            <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
              <li>Each question has multiple choice options with exactly 1 correct answer.</li>
              {quiz.timeLimitSeconds && (
                <li>
                  A countdown timer will run during the test. Your answers will be automatically submitted upon timer expiration.
                </li>
              )}
              <li>Scores are computed authoritatively on the server to ensure accuracy.</li>
              <li>A complete question-by-question review with explanations is shown upon test submission.</li>
            </ul>
          </div>

          {/* CTA Button */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-500 font-medium">
              No registration required &bull; Anonymous attempt
            </span>

            <Link
              href={`/quizzes/${quiz.slug}/attempt`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-2xl shadow-md shadow-amber-500/20 transition-all group"
            >
              <span>Start Quiz Now</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
