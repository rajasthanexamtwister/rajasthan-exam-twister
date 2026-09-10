import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { QuizService } from "@/server/services/quiz-service";
import { CheckSquare, Clock, Award, ArrowRight, Target, Zap } from "lucide-react";
import clsx from "clsx";

export const revalidate = 60;

interface ExamBrowsePageProps {
  params: {
    examSlug: string;
  };
  searchParams: {
    page?: string;
    difficulty?: string;
  };
}

export async function generateMetadata({ params }: ExamBrowsePageProps): Promise<Metadata> {
  const examName = decodeURIComponent(params.examSlug).replace(/-/g, " ").toUpperCase();
  return {
    title: `${examName} Mock Tests & Practice Quizzes — Rajasthan Exam Twister`,
    description: `Practice free online mock tests and previous year questions for ${examName} with instant answer key, negative marking, and detailed explanations.`,
  };
}

const DIFFICULTY_STYLES: Record<string, { label: string; badge: string }> = {
  easy: {
    label: "Easy",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  },
  medium: {
    label: "Medium",
    badge: "bg-amber-50 text-amber-800 border-amber-200/80",
  },
  hard: {
    label: "Hard",
    badge: "bg-rose-50 text-rose-700 border-rose-200/80",
  },
};

export default async function ExamBrowsePage({ params, searchParams }: ExamBrowsePageProps) {
  const currentPage = Math.max(1, parseInt(searchParams.page || "1", 10));
  const activeDifficulty = searchParams.difficulty;
  const examQuery = decodeURIComponent(params.examSlug).replace(/-/g, " ");

  const [quizzesData, distinctExams] = await Promise.all([
    QuizService.listQuizzes(
      {
        status: "PUBLISHED",
        examTag: examQuery,
        difficulty: (activeDifficulty as any) || undefined,
        page: currentPage,
        pageSize: 12,
      },
      false
    ),
    QuizService.listDistinctExams(),
  ]);

  const { quizzes, total, totalPages } = quizzesData;

  const currentExamObj = distinctExams.find(
    (e) => e.slug === params.examSlug.toLowerCase() || e.name.toLowerCase() === examQuery.toLowerCase()
  );
  const displayName = currentExamObj?.name || examQuery.toUpperCase();

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Breadcrumb & Hero */}
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 shadow-xs">
            <Target className="w-4 h-4 text-amber-700" />
            <span>Target Exam Test Series</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B132B] tracking-tight">
            {displayName} Mock Tests & Quizzes
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Curated authentic question papers and subject-wise practice tests specially tailored for {displayName} preparation.
          </p>
        </div>

        {/* Other Exams Chips Bar */}
        <div className="bg-white rounded-2xl border border-amber-200/80 p-4 shadow-xs space-y-2">
          <span className="text-xs font-bold text-[#0B132B] uppercase tracking-wider block">
            Explore Other Target Exams:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              href="/quizzes"
              className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200 hover:bg-amber-50 hover:border-amber-300 transition-all"
            >
              All Tests &rarr;
            </Link>
            {distinctExams.map((ex) => {
              const isCurrent = ex.slug === params.examSlug.toLowerCase() || ex.name.toLowerCase() === examQuery.toLowerCase();
              return (
                <Link
                  key={ex.slug}
                  href={`/exam/${ex.slug}`}
                  className={clsx(
                    "px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border inline-flex items-center gap-1.5",
                    isCurrent
                      ? "bg-[#0B132B] text-white border-[#0B132B] shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300"
                  )}
                >
                  <span>{ex.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-200/60 text-[#0B132B] font-bold">
                    {ex.count}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Quizzes List */}
        {quizzes.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 mx-auto flex items-center justify-center">
              <CheckSquare className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No mock tests found for {displayName}</h3>
            <p className="text-xs text-slate-500">
              New tests for {displayName} are currently being added. Check back soon or explore other exams!
            </p>
            <Link
              href="/quizzes"
              className="inline-block mt-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition-colors"
            >
              Browse All Tests
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => {
              const diffConfig = DIFFICULTY_STYLES[quiz.difficulty || "medium"] || DIFFICULTY_STYLES.medium;

              return (
                <div
                  key={quiz._id.toString()}
                  className="bg-white rounded-2xl border border-amber-200/70 shadow-xs hover:shadow-md hover:border-amber-400 transition-all p-5 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {quiz.subject && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200/60">
                            {quiz.subject}
                          </span>
                        )}
                        <span
                          className={clsx(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider",
                            diffConfig.badge
                          )}
                        >
                          {diffConfig.label}
                        </span>
                      </div>

                      {quiz.timeLimitSeconds ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {Math.round(quiz.timeLimitSeconds / 60)}m
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400">Untimed</span>
                      )}
                    </div>

                    <h3 className="text-base font-extrabold text-[#0B132B] group-hover:text-amber-600 transition-colors line-clamp-2 leading-snug">
                      <Link href={`/quizzes/${quiz.slug}`}>{quiz.title}</Link>
                    </h3>

                    <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                      <span className="font-semibold text-slate-700">
                        {quiz.questionCount || 0} Questions
                      </span>
                      <span>&bull;</span>
                      <span className="inline-flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        +{quiz.defaultMarks}{" "}
                        {quiz.defaultNegativeMarks > 0 ? `(-${quiz.defaultNegativeMarks})` : ""}
                      </span>
                      {quiz.attemptCount !== undefined && quiz.attemptCount > 0 && (
                        <>
                          <span>&bull;</span>
                          <span className="inline-flex items-center gap-0.5 text-amber-800 font-semibold text-[11px]">
                            <Zap className="w-3 h-3 text-amber-500" />
                            {quiz.attemptCount} {quiz.attemptCount === 1 ? "attempt" : "attempts"}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Free Test
                    </span>
                    <Link
                      href={`/quizzes/${quiz.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#0B132B] group-hover:text-amber-600 transition-colors"
                    >
                      <span>Take Quiz</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-6">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/exam/${params.examSlug}?page=${p}${activeDifficulty ? `&difficulty=${activeDifficulty}` : ""}`}
                className={clsx(
                  "w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all",
                  p === currentPage
                    ? "bg-amber-500 text-slate-950 shadow-xs"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                )}
              >
                {p}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
