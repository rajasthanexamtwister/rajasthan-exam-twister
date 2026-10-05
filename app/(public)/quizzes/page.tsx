import { Metadata } from "next";
import Link from "next/link";
import { QuizService } from "@/server/services/quiz-service";
import {
  CheckSquare,
  Clock,
  Award,
  Trophy,
  ArrowRight,
  Zap,
  Target,
  BookOpen,
  Filter,
  ShieldAlert,
} from "lucide-react";
import { DailyGoalWidget } from "@/components/public/daily-goal-widget";
import clsx from "clsx";
import { getSiteUrl } from "@/server/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Mock Tests & Practice Quizzes",
  description:
    "Practice free online mock tests, previous year exam papers, and MCQs for Rajasthan competitive exams including REET, RPSC, CET, Police SI, and Patwari with detailed explanations.",
  alternates: {
    canonical: `${getSiteUrl()}/quizzes`,
  },
  openGraph: {
    title: "Mock Tests & Practice Quizzes — Rajasthan Exam Twister",
    description:
      "Practice free online mock tests and MCQs for Rajasthan competitive exams including REET, RPSC, CET, and Police SI.",
    url: `${getSiteUrl()}/quizzes`,
  },
};

interface QuizzesPageProps {
  searchParams: {
    subject?: string;
    category?: string;
    exam?: string;
    difficulty?: string;
    page?: string;
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

export default async function PublicQuizzesPage({ searchParams }: QuizzesPageProps) {
  const currentPage = Math.max(1, parseInt(searchParams.page || "1", 10));
  const activeSubject = searchParams.subject;
  const activeCategory = searchParams.category;
  const activeExam = searchParams.exam;
  const activeDifficulty = searchParams.difficulty;

  const [quizzesData, distinctExams, distinctSubjects] = await Promise.all([
    QuizService.listQuizzes(
      {
        status: "PUBLISHED",
        subject: activeSubject,
        categoryId: activeCategory,
        examTag: activeExam,
        difficulty: (activeDifficulty as any) || undefined,
        page: currentPage,
        pageSize: 12,
      },
      false
    ),
    QuizService.listDistinctExams(),
    QuizService.listDistinctSubjects(),
  ]);

  const { quizzes, totalPages } = quizzesData;

  // Helper for filter navigation URLs
  const buildFilterUrl = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const current = {
      subject: activeSubject,
      category: activeCategory,
      exam: activeExam,
      difficulty: activeDifficulty,
      ...overrides,
    };

    Object.entries(current).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });

    const qs = params.toString();
    return `/quizzes${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 shadow-xs">
            <CheckSquare className="w-4 h-4 text-amber-700" />
            <span>Smart Practice & Mock Test Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B132B] tracking-tight">
            Rajasthan Competitive Exam Quizzes
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Authentic exam-pattern MCQs with instant authoritative scoring, negative marking calculation, detailed solutions, and student rankings.
          </p>

          {/* Leaderboard CTA Button */}
          <div className="pt-2">
            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-amber-300 text-amber-900 hover:bg-amber-50 shadow-xs font-bold text-xs transition-all hover:scale-102"
            >
              <Trophy className="w-4 h-4 text-amber-600" />
              <span>View Student Leaderboard & Rankings &rarr;</span>
            </Link>
          </div>
        </div>

        {/* Student Daily & Weekly Goal Tracker Widget */}
        <DailyGoalWidget />

        {/* Discovery Filter Section */}
        <div className="bg-white rounded-3xl border border-amber-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-sm font-extrabold text-[#0B132B]">
              <Filter className="w-4 h-4 text-amber-600" />
              <span>Filter & Discover Tests</span>
            </div>
            {(activeExam || activeSubject || activeDifficulty) && (
              <Link
                href="/quizzes"
                className="text-xs font-bold text-amber-700 hover:text-amber-800 underline"
              >
                Reset Filters
              </Link>
            )}
          </div>

          {/* Browse by Exam Chips */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0B132B] uppercase tracking-wider">
              <Target className="w-3.5 h-3.5 text-amber-600" />
              <span>Target Exam</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                href={buildFilterUrl({ exam: undefined })}
                className={clsx(
                  "px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border",
                  !activeExam
                    ? "bg-[#0B132B] text-white border-[#0B132B] shadow-xs font-bold"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300"
                )}
              >
                All Exams
              </Link>
              {distinctExams.map((ex) => (
                <Link
                  key={ex.slug}
                  href={buildFilterUrl({ exam: ex.name })}
                  className={clsx(
                    "px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border inline-flex items-center gap-1.5",
                    activeExam?.toLowerCase() === ex.name.toLowerCase()
                      ? "bg-[#0B132B] text-white border-[#0B132B] shadow-xs font-bold"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300"
                  )}
                >
                  <span>{ex.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-200/60 text-[#0B132B] font-bold">
                    {ex.count}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Browse by Subject Chips */}
          {distinctSubjects.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0B132B] uppercase tracking-wider">
                <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                <span>Subject / Category</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link
                  href={buildFilterUrl({ subject: undefined })}
                  className={clsx(
                    "px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border",
                    !activeSubject
                      ? "bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300"
                  )}
                >
                  All Subjects
                </Link>
                {distinctSubjects.map((sub) => (
                  <Link
                    key={sub.slug}
                    href={buildFilterUrl({ subject: sub.name })}
                    className={clsx(
                      "px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border inline-flex items-center gap-1.5",
                      activeSubject?.toLowerCase() === sub.name.toLowerCase()
                        ? "bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300"
                    )}
                  >
                    <span>{sub.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/80 text-slate-800 font-bold">
                      {sub.count}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Difficulty Filter Chips */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap">
            <span className="text-xs font-bold text-slate-600 mr-1">Difficulty:</span>
            {["all", "easy", "medium", "hard"].map((diff) => {
              const isSelected = diff === "all" ? !activeDifficulty : activeDifficulty === diff;
              return (
                <Link
                  key={diff}
                  href={buildFilterUrl({ difficulty: diff === "all" ? undefined : diff })}
                  className={clsx(
                    "px-2.5 py-0.5 rounded-lg text-xs font-bold capitalize transition-all border",
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  {diff}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Quizzes Grid */}
        {quizzes.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 mx-auto flex items-center justify-center">
              <CheckSquare className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No quizzes match these filters</h3>
            <p className="text-xs text-slate-500">
              Try clearing selected exam or subject filters to see all available tests.
            </p>
            <Link
              href="/quizzes"
              className="inline-block mt-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition-colors"
            >
              Reset All Filters
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => {
              const diffConfig = DIFFICULTY_STYLES[quiz.difficulty || "medium"] || DIFFICULTY_STYLES.medium;
              const hasNegativeMarking = quiz.defaultNegativeMarks > 0;

              return (
                <div
                  key={quiz._id.toString()}
                  className="bg-white rounded-2xl border border-amber-200/70 shadow-xs hover:shadow-md hover:border-amber-400 transition-all p-5 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    {/* Badges Bar */}
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
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          <Clock className="w-3 h-3 text-amber-700" />
                          {Math.round(quiz.timeLimitSeconds / 60)}m
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-600">Untimed</span>
                      )}
                    </div>

                    {/* Quiz Title */}
                    <h2 className="text-base font-extrabold text-[#0B132B] group-hover:text-amber-700 transition-colors line-clamp-2 leading-snug">
                      <Link href={`/quizzes/${quiz.slug}`}>{quiz.title}</Link>
                    </h2>

                    {/* Exam Tags */}
                    {quiz.examTags && quiz.examTags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {quiz.examTags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Stats & Negative Marking Badge */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                        <span className="font-bold text-slate-800">
                          {quiz.questionCount || 0} Questions
                        </span>
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                          <Award className="w-3.5 h-3.5 text-amber-600" />
                          +{quiz.defaultMarks} Marks
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span
                          className={clsx(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold border",
                            hasNegativeMarking
                              ? "bg-rose-50 text-rose-800 border-rose-200"
                              : "bg-emerald-50 text-emerald-800 border-emerald-200"
                          )}
                        >
                          <ShieldAlert className="w-3 h-3" />
                          {hasNegativeMarking
                            ? `Negative Marking (-${quiz.defaultNegativeMarks})`
                            : "No Negative Marking"}
                        </span>

                        {quiz.attemptCount !== undefined && quiz.attemptCount > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-amber-900 font-bold text-[11px]">
                            <Zap className="w-3 h-3 text-amber-600" />
                            {quiz.attemptCount} {quiz.attemptCount === 1 ? "attempt" : "attempts"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Free Test
                    </span>
                    <Link
                      href={`/quizzes/${quiz.slug}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-xs transition-all group-hover:scale-102"
                    >
                      <span>Start Quiz</span>
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
                href={buildFilterUrl({ page: p.toString() })}
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
