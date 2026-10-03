"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Percent,
  Bookmark,
  BookmarkCheck,
  Loader2,
  BookMarked,
} from "lucide-react";
import { BookmarkButton } from "@/components/public/bookmark-button";
import clsx from "clsx";

interface AttemptQuestionBreakdown {
  questionId: string;
  order: number;
  questionText: string;
  questionTextEn?: string;
  options: string[];
  optionsEn?: string[];
  selectedOptionIndex: number | null;
  correctOptionIndex: number;
  explanation: string;
  isCorrect: boolean;
  isUnattempted: boolean;
  marksAwarded: number;
}

interface AttemptResult {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  score: number;
  totalPossibleScore: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  totalQuestions: number;
  breakdown: AttemptQuestionBreakdown[];
  submittedAt: string;
}

export default function QuizResultPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [result, setResult] = useState<AttemptResult | null>(null);
  const [language, setLanguage] = useState<"hi" | "en">("hi");
  const [filter, setFilter] = useState<"ALL" | "CORRECT" | "INCORRECT" | "UNATTEMPTED">("ALL");
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [togglingBookmarkId, setTogglingBookmarkId] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(`ret_quiz_result_${slug}`);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setResult(parsed);
      } catch (err) {
        console.error("Failed to parse stored result:", err);
      }
    }
  }, [slug]);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/student/bookmarks")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.bookmarks) {
            setBookmarkedIds(new Set(data.bookmarks.map((b: any) => b.questionId)));
          }
        })
        .catch((err) => console.error("Failed to fetch initial bookmarks:", err));
    }
  }, [session]);

  const handleToggleBookmark = async (questionId: string) => {
    if (!session?.user) return;
    setTogglingBookmarkId(questionId);

    const isBookmarked = bookmarkedIds.has(questionId);

    try {
      if (isBookmarked) {
        const res = await fetch(`/api/student/bookmarks/${questionId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setBookmarkedIds((prev) => {
            const next = new Set(prev);
            next.delete(questionId);
            return next;
          });
        }
      } else {
        const res = await fetch("/api/student/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId }),
        });
        if (res.ok) {
          setBookmarkedIds((prev) => {
            const next = new Set(prev);
            next.add(questionId);
            return next;
          });
        }
      }
    } catch (err) {
      console.error("Error toggling bookmark:", err);
    } finally {
      setTogglingBookmarkId(null);
    }
  };

  if (!result) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border border-slate-200 shadow-xl space-y-4">
          <HelpCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">No recent result found</h2>
          <p className="text-xs text-slate-500">
            Please start or retake the quiz to generate an authoritative evaluation report.
          </p>
          <Link
            href={`/quizzes/${slug}`}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Go to Quiz Intro</span>
          </Link>
        </div>
      </div>
    );
  }

  const filteredQuestions = result.breakdown.filter((q) => {
    if (filter === "CORRECT") return q.isCorrect;
    if (filter === "INCORRECT") return !q.isCorrect && !q.isUnattempted;
    if (filter === "UNATTEMPTED") return q.isUnattempted;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/quizzes"
            className="text-xs font-semibold text-slate-500 hover:text-amber-600 transition-colors"
          >
            &larr; Back to all quizzes
          </Link>
          <span className="text-[11px] text-slate-400">
            Submitted {new Date(result.submittedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        {/* Score Summary Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="bg-slate-900 text-white p-8 sm:p-10 text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Award className="w-3.5 h-3.5" />
              <span>Official Score Card</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold">{result.quizTitle}</h1>

            <div className="flex items-center justify-center gap-2 pt-2">
              <span className="text-5xl sm:text-6xl font-black text-amber-400 tracking-tight">
                {result.score}
              </span>
              <span className="text-2xl font-bold text-slate-400 self-end mb-1">
                / {result.totalPossibleScore}
              </span>
            </div>

            <p className="text-xs text-slate-300 font-medium">
              Accuracy: <span className="font-bold text-white">{result.percentage}%</span>
            </p>
          </div>

          {/* Breakdown Stats Grid */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 p-6 bg-slate-50/50 border-t border-slate-200">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-emerald-600 mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Correct</span>
              </div>
              <span className="text-2xl font-black text-slate-900">{result.correctCount}</span>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                <XCircle className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Incorrect</span>
              </div>
              <span className="text-2xl font-black text-slate-900">{result.incorrectCount}</span>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-amber-600 mb-1">
                <HelpCircle className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Unattempted</span>
              </div>
              <span className="text-2xl font-black text-slate-900">{result.unattemptedCount}</span>
            </div>
          </div>

          {/* RPSC/RSSB Diagnostic Performance & Readiness Analysis */}
          <div className="p-6 bg-gradient-to-r from-slate-900 to-[#0B132B] text-white border-t border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4" />
              <span>Exam Readiness Analysis (परीक्षोपयोगी विश्लेषण)</span>
            </div>
            {result.percentage >= 80 ? (
              <p className="text-xs text-slate-200 leading-relaxed">
                🎯 <strong className="text-emerald-400">उत्कृष्ट प्रदर्शन (Excellent Preparedness)!</strong> आपकी तैयारी RPSC/REET स्तर के अनुसार बहुत मजबूत है। अपने प्रदर्शन को बनाए रखने के लिए अन्य मॉक टेस्ट भी हल करें।
              </p>
            ) : result.percentage >= 50 ? (
              <p className="text-xs text-slate-200 leading-relaxed">
                ⚖️ <strong className="text-amber-400">संतोषजनक प्रदर्शन (Moderate Preparedness)!</strong> आपके मौलिक विचार स्पष्ट हैं, लेकिन गलत उत्तरों पर पुनः ध्यान देने की आवश्यकता है। गलत प्रश्नों को ⭐ <strong>Notebook में सेव</strong> करके रिवीज़न करें।
              </p>
            ) : (
              <p className="text-xs text-slate-200 leading-relaxed">
                ⚠️ <strong className="text-rose-400">गहन पुनरावृत्ति की आवश्यकता (Needs Revision)!</strong> इस विषय के बुनियादी सिद्धांतों का पुनः अध्ययन करें। हमारे <strong>Exam Revision Notes</strong> सेक्शन से नोट्स पढ़कर पुनः टेस्ट दें।
              </p>
            )}
          </div>

          {/* Retake & Explore Actions */}
          <div className="p-6 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Link
                href={`/quizzes/${slug}/attempt`}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-sm"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake Quiz</span>
              </Link>

              {session?.user && (
                <Link
                  href="/profile/notebook"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition-colors"
                >
                  <BookMarked className="w-4 h-4 text-amber-700" />
                  <span>Revision Notebook</span>
                </Link>
              )}
            </div>

            <Link
              href="/quizzes"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <span>Explore More Tests</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Detailed Solutions Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Question-by-Question Review</h2>
              <p className="text-xs text-slate-500">
                Detailed solution key and answer explanations for all {result.totalQuestions} questions.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Language Toggle Pill */}
              <div
                className="flex items-center bg-white p-0.5 rounded-xl border border-slate-200 shadow-sm"
                role="group"
                aria-label="Language Toggle"
              >
                <button
                  type="button"
                  onClick={() => setLanguage("hi")}
                  className={clsx(
                    "px-2.5 py-1 text-xs font-bold rounded-lg transition-all",
                    language === "hi"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                  title="हिंदी में देखें"
                >
                  हिंदी
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={clsx(
                    "px-2.5 py-1 text-xs font-bold rounded-lg transition-all",
                    language === "en"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                  title="View in English"
                >
                  English
                </button>
              </div>

              {/* Solution Filter Tabs */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
                {[
                  { label: `All (${result.totalQuestions})`, val: "ALL" as const },
                  { label: `Correct (${result.correctCount})`, val: "CORRECT" as const },
                  { label: `Incorrect (${result.incorrectCount})`, val: "INCORRECT" as const },
                  { label: `Skipped (${result.unattemptedCount})`, val: "UNATTEMPTED" as const },
                ].map((t) => (
                  <button
                    key={t.val}
                    type="button"
                    onClick={() => setFilter(t.val)}
                    className={clsx(
                      "px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
                      filter === t.val
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {filteredQuestions.map((q) => {
              const isEnglish = language === "en";
              const displayQuestionText = isEnglish && q.questionTextEn ? q.questionTextEn : q.questionText;
              const isFallbackHindi = isEnglish && !q.questionTextEn;
              const displayOptions =
                isEnglish && q.optionsEn && q.optionsEn.length === q.options.length
                  ? q.optionsEn
                  : q.options;

              const userOptLetter =
                q.selectedOptionIndex !== null
                  ? String.fromCharCode(65 + q.selectedOptionIndex)
                  : "None (Skipped)";

              const correctOptLetter = String.fromCharCode(65 + q.correctOptionIndex);

              return (
                <div
                  key={q.questionId}
                  className={clsx(
                    "bg-white rounded-2xl border p-6 shadow-sm space-y-4 transition-all",
                    q.isCorrect
                      ? "border-emerald-300"
                      : q.isUnattempted
                      ? "border-slate-200"
                      : "border-red-300"
                  )}
                >
                  {/* Question Header Status */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {q.order}
                      </span>
                      <span
                        className={clsx(
                          "px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border",
                          q.isCorrect && "bg-emerald-50 text-emerald-800 border-emerald-200",
                          q.isUnattempted && "bg-amber-50 text-amber-800 border-amber-200",
                          !q.isCorrect && !q.isUnattempted && "bg-red-50 text-red-800 border-red-200"
                        )}
                      >
                        {q.isCorrect ? "Correct" : q.isUnattempted ? "Unattempted" : "Incorrect"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <BookmarkButton
                        item={{
                          id: q.questionId,
                          type: "quiz_question",
                          title: q.questionText,
                          url: `/quizzes/${slug}`,
                          category: result.quizTitle,
                          questionText: q.questionText,
                          options: q.options,
                          correctOptionIndex: q.correctOptionIndex,
                          explanation: q.explanation,
                        }}
                      />
                      <span
                        className={clsx(
                          "text-xs font-bold px-2.5 py-1 rounded-lg border",
                          q.marksAwarded > 0
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : q.marksAwarded < 0
                            ? "bg-red-50 text-red-800 border-red-200"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        )}
                      >
                        {q.marksAwarded > 0
                          ? `+${q.marksAwarded}`
                          : q.marksAwarded < 0
                          ? `${q.marksAwarded}`
                          : "0"}{" "}
                        Marks
                      </span>
                    </div>
                  </div>

                  {/* Question Text */}
                  <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                    {displayQuestionText}
                    {isFallbackHindi && (
                      <span className="inline-block ml-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md align-middle border border-slate-200">
                        Hindi only
                      </span>
                    )}
                  </p>

                  {/* Options List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {displayOptions.map((opt, optIdx) => {
                      const isCorrectAnswer = optIdx === q.correctOptionIndex;
                      const isUserSelection = optIdx === q.selectedOptionIndex;
                      const letter = String.fromCharCode(65 + optIdx);

                      return (
                        <div
                          key={optIdx}
                          className={clsx(
                            "p-3 rounded-xl border flex items-center gap-3 text-xs",
                            isCorrectAnswer
                              ? "bg-emerald-50 border-emerald-400 font-semibold text-emerald-950"
                              : isUserSelection && !q.isCorrect
                              ? "bg-red-50 border-red-400 font-semibold text-red-950"
                              : "bg-slate-50 border-slate-200 text-slate-600"
                          )}
                        >
                          <span
                            className={clsx(
                              "w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0",
                              isCorrectAnswer
                                ? "bg-emerald-600 text-white"
                                : isUserSelection && !q.isCorrect
                                ? "bg-red-600 text-white"
                                : "bg-slate-200 text-slate-700"
                            )}
                          >
                            {letter}
                          </span>
                          <span className="flex-1">{opt}</span>

                          {isCorrectAnswer && (
                            <span className="text-[10px] text-emerald-700 font-bold uppercase">
                              Correct Answer
                            </span>
                          )}
                          {isUserSelection && !isCorrectAnswer && (
                            <span className="text-[10px] text-red-700 font-bold uppercase">
                              Your Answer
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation Block */}
                  {q.explanation && (
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                      <span className="font-bold text-slate-900 block">Explanation:</span>
                      <p className="leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
