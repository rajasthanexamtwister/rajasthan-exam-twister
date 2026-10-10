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
  Flame,
  Sparkles,
} from "lucide-react";
import { DailyGoalWidget } from "@/components/public/daily-goal-widget";
import { QuizFilterBar } from "@/components/public/quiz-filter-bar";
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
    title: "Mock Tests & Practice Quizzes | Rajasthan Exam Twister",
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
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200/90",
  },
  medium: {
    label: "Medium",
    badge: "bg-amber-50 text-amber-900 border-amber-200/90",
  },
  hard: {
    label: "Hard",
    badge: "bg-rose-50 text-rose-800 border-rose-200/90",
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
        <div className="text-center space-y-3.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 shadow-xs font-sans">
            <CheckSquare className="w-4 h-4 text-amber-700" />
            <span>Smart Practice & Mock Test Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B132B] tracking-tight font-heading">
            Rajasthan Competitive Exam Quizzes
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed font-devanagari">
            नवीनतम परीक्षा पैटर्न पर आधारित बहुविकल्पीय प्रश्न, नेगेटिव मार्किंग गणना, तुरंत विस्तृत व्याख्या और राज्य स्तरीय मेरिट रैंकिंग।
          </p>

          {/* Leaderboard CTA Button */}
          <div className="pt-1">
            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-amber-300 text-amber-900 hover:bg-amber-50 shadow-xs font-bold text-xs transition-all font-heading"
            >
              <Trophy className="w-4 h-4 text-amber-600" />
              <span>View Student Leaderboard & Rankings &rarr;</span>
            </Link>
          </div>
        </div>

        {/* Student Daily & Weekly Goal Tracker Widget */}
        <DailyGoalWidget />

        {/* Discovery Filter Section with Dropdowns & Quick Pills */}
        <QuizFilterBar
          distinctExams={distinctExams}
          distinctSubjects={distinctSubjects}
          activeExam={activeExam}
          activeSubject={activeSubject}
          activeDifficulty={activeDifficulty}
          activeCategory={activeCategory}
        />

        {/* Quizzes Grid */}
        {quizzes.length === 0 ? (
          <div className="bg-white rounded-3xl border border-amber-200/80 p-12 text-center max-w-md mx-auto space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 mx-auto flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-amber-700" />
            </div>
            <h3 className="text-base font-bold text-slate-900 font-heading">No quizzes match these filters</h3>
            <p className="text-xs text-slate-500 font-devanagari">
              चयनित फ़िल्टर को रीसेट करें ताकि सभी उपलब्ध टेस्ट देखे जा सकें।
            </p>
            <Link
              href="/quizzes"
              className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-amber-500 text-[#0B132B] text-xs font-extrabold hover:bg-amber-400 transition-colors shadow-xs font-heading"
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
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100/80 text-amber-900 border border-amber-200/80 font-sans">
                            {quiz.subject}
                          </span>
                        )}
                        <span
                          className={clsx(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider font-sans",
                            diffConfig.badge
                          )}
                        >
                          {diffConfig.label}
                        </span>
                      </div>

                      {quiz.timeLimitSeconds ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 font-sans">
                          <Clock className="w-3 h-3 text-amber-700" />
                          {Math.round(quiz.timeLimitSeconds / 60)}m
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-600 font-sans">Untimed</span>
                      )}
                    </div>

                    {/* Quiz Title */}
                    <h2 className="text-base font-extrabold text-[#0B132B] group-hover:text-amber-700 transition-colors line-clamp-2 leading-snug font-heading">
                      <Link href={`/quizzes/${quiz.slug}`}>{quiz.title}</Link>
                    </h2>

                    {/* Exam Tags */}
                    {quiz.examTags && quiz.examTags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {quiz.examTags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 font-sans"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Stats & Negative Marking Badge */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs text-slate-600 font-medium font-sans">
                        <span className="font-bold text-slate-800">
                          {quiz.questionCount || 0} Questions
                        </span>
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                          <Award className="w-3.5 h-3.5 text-amber-600" />
                          +{quiz.defaultMarks} Marks
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-sans">
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
                            ? `Negative (-${quiz.defaultNegativeMarks})`
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

                  <div className="pt-4 border-t border-amber-100 mt-4 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-sans">
                      Free Test
                    </span>
                    <Link
                      href={`/quizzes/${quiz.slug}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-[#0B132B] text-xs font-extrabold shadow-xs transition-all font-heading"
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
                  "w-9 h-9 rounded-xl text-xs font-bold flex items-center justify-center transition-all font-sans",
                  p === currentPage
                    ? "bg-amber-500 text-[#0B132B] shadow-xs font-extrabold"
                    : "bg-white text-slate-700 border border-amber-200 hover:bg-amber-50"
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
