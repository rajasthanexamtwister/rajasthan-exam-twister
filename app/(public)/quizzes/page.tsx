import { Metadata } from "next";
import Link from "next/link";
import { QuizService } from "@/server/services/quiz-service";
import { CategoryService } from "@/server/services/category-service";
import { CheckSquare, Clock, Award, HelpCircle, ArrowRight } from "lucide-react";
import clsx from "clsx";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Mock Tests & Practice Quizzes — Rajasthan Exam Twister",
  description:
    "Practice free online mock tests, previous year exam papers, and MCQs for Rajasthan competitive exams including REET, RPSC, CET, Police SI, and Patwari.",
};

interface QuizzesPageProps {
  searchParams: {
    subject?: string;
    category?: string;
    page?: string;
  };
}

export default async function PublicQuizzesPage({ searchParams }: QuizzesPageProps) {
  const currentPage = Math.max(1, parseInt(searchParams.page || "1", 10));
  const activeSubject = searchParams.subject;
  const activeCategory = searchParams.category;

  const [quizzesData, categories] = await Promise.all([
    QuizService.listQuizzes(
      {
        status: "PUBLISHED",
        subject: activeSubject,
        categoryId: activeCategory,
        page: currentPage,
        pageSize: 12,
      },
      false
    ),
    CategoryService.listCategories(),
  ]);

  const { quizzes, total, totalPages } = quizzesData;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
            <CheckSquare className="w-3.5 h-3.5 text-amber-700" />
            <span>Interactive Test Series</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Rajasthan Competitive Exam Quizzes
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Test your knowledge with authentic exam-style MCQs, instant authoritative scoring, negative marking, and detailed answer explanations.
          </p>
        </div>

        {/* Category Filters */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 justify-start sm:justify-center">
            <Link
              href="/quizzes"
              className={clsx(
                "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border",
                !activeCategory
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
              )}
            >
              All Subjects
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat._id.toString()}
                href={`/quizzes?category=${cat._id}`}
                className={clsx(
                  "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border",
                  activeCategory === cat._id.toString()
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                )}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        {/* Quizzes Grid */}
        {quizzes.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <CheckSquare className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No quizzes available</h3>
            <p className="text-xs text-slate-500">
              New mock tests and topic-wise practice papers are being added regularly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <div
                key={quiz._id.toString()}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-300 transition-all p-6 flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    {quiz.subject ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200/60">
                        {quiz.subject}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                        General GK
                      </span>
                    )}

                    {quiz.timeLimitSeconds ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {Math.round(quiz.timeLimitSeconds / 60)} min
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-400">Untimed</span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-2 leading-snug">
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
                      {quiz.defaultNegativeMarks > 0
                        ? `(-${quiz.defaultNegativeMarks})`
                        : ""}
                    </span>
                  </div>
                </div>

                <div className="pt-5 border-t border-slate-100 mt-4 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Free Practice</span>
                  <Link
                    href={`/quizzes/${quiz.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 group-hover:text-amber-600 transition-colors"
                  >
                    <span>Start Test</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-6">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/quizzes?page=${p}${activeCategory ? `&category=${activeCategory}` : ""}`}
                className={clsx(
                  "w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all",
                  p === currentPage
                    ? "bg-amber-500 text-slate-950 shadow-sm"
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
