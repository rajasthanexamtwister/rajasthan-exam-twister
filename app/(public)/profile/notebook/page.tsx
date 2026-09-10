"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookMarked,
  XCircle,
  CheckCircle2,
  Bookmark,
  BookmarkCheck,
  Zap,
  ArrowLeft,
  Loader2,
  Sparkles,
  HelpCircle,
  Search,
  Filter,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import clsx from "clsx";

interface NotebookQuestion {
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
  attemptedAt?: string;
  bookmarkedAt?: string;
}

export default function NotebookPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"wrong" | "bookmarks">("wrong");
  const [wrongQuestions, setWrongQuestions] = useState<NotebookQuestion[]>([]);
  const [bookmarks, setBookmarks] = useState<NotebookQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [generatingBooster, setGeneratingBooster] = useState(false);
  const [boosterError, setBoosterError] = useState<string | null>(null);
  const [togglingBookmark, setTogglingBookmark] = useState<string | null>(null);

  const fetchData = async () => {
    if (!session?.user) return;
    setLoading(true);

    try {
      const [wrongRes, bookmarkRes] = await Promise.all([
        fetch("/api/student/wrong-questions"),
        fetch("/api/student/bookmarks"),
      ]);

      if (wrongRes.ok) {
        const wrongData = await wrongRes.json();
        setWrongQuestions(wrongData.wrongQuestions || []);
      }

      if (bookmarkRes.ok) {
        const bookmarkData = await bookmarkRes.json();
        setBookmarks(bookmarkData.bookmarks || []);
      }
    } catch (err) {
      console.error("Failed to load notebook data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchData();
    }
  }, [session]);

  const handleToggleBookmark = async (question: NotebookQuestion) => {
    if (!session?.user) return;
    setTogglingBookmark(question.questionId);

    const isCurrentlyBookmarked = question.isBookmarked;

    try {
      if (isCurrentlyBookmarked) {
        const res = await fetch(`/api/student/bookmarks/${question.questionId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          // Update in both lists
          setWrongQuestions((prev) =>
            prev.map((q) =>
              q.questionId === question.questionId ? { ...q, isBookmarked: false } : q
            )
          );
          setBookmarks((prev) => prev.filter((q) => q.questionId !== question.questionId));
        }
      } else {
        const res = await fetch("/api/student/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId: question.questionId }),
        });
        if (res.ok) {
          setWrongQuestions((prev) =>
            prev.map((q) =>
              q.questionId === question.questionId ? { ...q, isBookmarked: true } : q
            )
          );
          // Add to bookmarks if not present
          setBookmarks((prev) => {
            if (prev.some((q) => q.questionId === question.questionId)) return prev;
            return [{ ...question, isBookmarked: true, bookmarkedAt: new Date().toISOString() }, ...prev];
          });
        }
      }
    } catch (err) {
      console.error("Error toggling bookmark:", err);
    } finally {
      setTogglingBookmark(null);
    }
  };

  const handleGenerateBooster = async () => {
    if (generatingBooster) return;
    setGeneratingBooster(true);
    setBoosterError(null);

    try {
      const res = await fetch("/api/student/booster-test", {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error?.message || "Failed to generate booster test");
      }

      // Navigate to the newly generated quiz attempt flow
      router.push(`/quizzes/${data.data.slug}/attempt`);
    } catch (err: any) {
      console.error("Booster generation error:", err);
      setBoosterError(err.message || "Failed to generate booster test. Please try again.");
      setGeneratingBooster(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#FAF8F5] px-4">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading revision notebook...</p>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center bg-[#FAF8F5] px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-amber-200 shadow-xl text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-900 mx-auto flex items-center justify-center shadow-inner">
            <BookMarked className="w-7 h-7 text-amber-700" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-[#0B132B]">Revision Notebook</h1>
            <p className="text-xs text-slate-600">
              Sign in with your student account to review your incorrectly answered questions, manage bookmarks, and access customized booster tests.
            </p>
          </div>
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/profile/notebook" })}
            className="w-full py-3 px-6 text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-2xl transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            <span>Sign in with Google</span>
          </button>
        </div>
      </div>
    );
  }

  const rawList = activeTab === "wrong" ? wrongQuestions : bookmarks;

  // Extract unique subjects
  const subjectList = Array.from(
    new Set(rawList.map((q) => q.subject?.trim()).filter(Boolean))
  ) as string[];

  // Filtered list
  const filteredList = rawList.filter((q) => {
    const matchesSearch =
      searchQuery.trim() === "" ||
      q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.explanation && q.explanation.toLowerCase().includes(searchQuery.toLowerCase())) ||
      q.options.some((opt) => opt.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSubject =
      selectedSubject === "all" || q.subject?.toLowerCase() === selectedSubject.toLowerCase();

    return matchesSearch && matchesSubject;
  });

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/profile"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Profile</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0B132B] flex items-center gap-2.5">
              <BookMarked className="w-7 h-7 text-amber-600" />
              <span>Revision Notebook</span>
            </h1>
            <p className="text-xs text-slate-500">
              Review your weak points, study complete answer explanations, and master high-yield questions.
            </p>
          </div>

          {/* Booster Test CTA Banner Button (13E) */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={handleGenerateBooster}
              disabled={generatingBooster}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-2xl shadow-md shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {generatingBooster ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Generating Booster Test...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
                  <span>Generate My Booster Test</span>
                </>
              )}
            </button>
          </div>
        </div>

        {boosterError && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{boosterError}</span>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex items-center gap-2 border-b border-amber-200/80 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("wrong")}
            className={clsx(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
              activeTab === "wrong"
                ? "bg-[#0B132B] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-amber-50 border border-amber-200/60"
            )}
          >
            <XCircle className={clsx("w-3.5 h-3.5", activeTab === "wrong" ? "text-red-400" : "text-red-600")} />
            <span>Wrong Questions</span>
            <span
              className={clsx(
                "px-2 py-0.5 rounded-full text-[10px] font-extrabold",
                activeTab === "wrong" ? "bg-red-500/20 text-red-200" : "bg-slate-100 text-slate-700"
              )}
            >
              {wrongQuestions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("bookmarks")}
            className={clsx(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
              activeTab === "bookmarks"
                ? "bg-[#0B132B] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-amber-50 border border-amber-200/60"
            )}
          >
            <Bookmark className={clsx("w-3.5 h-3.5", activeTab === "bookmarks" ? "text-amber-400" : "text-amber-600")} />
            <span>Bookmarked Questions</span>
            <span
              className={clsx(
                "px-2 py-0.5 rounded-full text-[10px] font-extrabold",
                activeTab === "bookmarks" ? "bg-amber-500/20 text-amber-200" : "bg-slate-100 text-slate-700"
              )}
            >
              {bookmarks.length}
            </span>
          </button>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="bg-white p-3.5 rounded-2xl border border-amber-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search question text, answers, explanations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white"
            />
          </div>

          {subjectList.length > 0 && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full sm:w-48 py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="all">All Subjects ({rawList.length})</option>
                {subjectList.map((subj) => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Question List */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-amber-200/80 space-y-2">
            <Loader2 className="w-7 h-7 animate-spin text-amber-500 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading question cards...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-amber-200/80 space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 mx-auto flex items-center justify-center">
              {activeTab === "wrong" ? <CheckCircle2 className="w-6 h-6 text-emerald-600" /> : <Bookmark className="w-6 h-6" />}
            </div>
            <h3 className="text-base font-extrabold text-[#0B132B]">
              {activeTab === "wrong"
                ? "No wrong questions found!"
                : "No bookmarked questions yet"}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {activeTab === "wrong"
                ? "Great job! Either you've answered everything correctly, or you haven't taken any mock tests yet."
                : "Bookmark any question during test review to save it in your notebook for quick revision before exams."}
            </p>
            {activeTab === "wrong" && (
              <Link
                href="/quizzes"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-all shadow-xs"
              >
                <span>Practice Quizzes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredList.map((item, idx) => {
              const isToggling = togglingBookmark === item.questionId;

              return (
                <div
                  key={`${item.questionId}-${idx}`}
                  className="bg-white rounded-3xl border border-amber-200/80 shadow-xs p-5 sm:p-6 space-y-4 transition-all hover:border-amber-300"
                >
                  {/* Top Bar: Subject Badge, Quiz Link, Bookmark Toggle */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.subject && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                          {item.subject}
                        </span>
                      )}
                      {item.quizTitle && item.quizSlug && (
                        <Link
                          href={`/quizzes/${item.quizSlug}`}
                          className="text-[11px] font-semibold text-slate-500 hover:text-amber-700 underline decoration-dotted"
                        >
                          From: {item.quizTitle}
                        </Link>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleBookmark(item)}
                      disabled={isToggling}
                      className={clsx(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
                        item.isBookmarked
                          ? "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-800"
                      )}
                    >
                      {isToggling ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : item.isBookmarked ? (
                        <BookmarkCheck className="w-3.5 h-3.5 text-amber-700 fill-amber-700" />
                      ) : (
                        <Bookmark className="w-3.5 h-3.5" />
                      )}
                      <span>{item.isBookmarked ? "Bookmarked" : "Bookmark"}</span>
                    </button>
                  </div>

                  {/* Question Text */}
                  <div className="space-y-1">
                    <div className="text-xs font-black text-amber-700 uppercase tracking-wider">
                      Question #{idx + 1}
                    </div>
                    <p className="text-sm sm:text-base font-bold text-[#0B132B] leading-relaxed">
                      {item.questionText}
                    </p>
                  </div>

                  {/* Options List */}
                  <div className="grid grid-cols-1 gap-2 pt-1">
                    {item.options.map((opt, optIdx) => {
                      const isCorrect = optIdx === item.correctOptionIndex;
                      const isUserSelected = item.userSelectedOptionIndex === optIdx;
                      const isWrongSelection = isUserSelected && !isCorrect;

                      return (
                        <div
                          key={optIdx}
                          className={clsx(
                            "p-3 rounded-2xl border text-xs font-medium flex items-center justify-between gap-3 transition-colors",
                            isCorrect
                              ? "bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold"
                              : isWrongSelection
                              ? "bg-red-50/80 border-red-300 text-red-950"
                              : "bg-slate-50/60 border-slate-200 text-slate-700"
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={clsx(
                                "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0",
                                isCorrect
                                  ? "bg-emerald-600 text-white"
                                  : isWrongSelection
                                  ? "bg-red-600 text-white"
                                  : "bg-slate-200 text-slate-700"
                              )}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                          </div>

                          <div className="shrink-0 flex items-center gap-1 text-[11px] font-bold">
                            {isCorrect && (
                              <span className="inline-flex items-center gap-1 text-emerald-700">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Correct Answer</span>
                              </span>
                            )}
                            {isWrongSelection && (
                              <span className="inline-flex items-center gap-1 text-red-600">
                                <XCircle className="w-4 h-4" />
                                <span>Your Answer</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Solution Explanation Box */}
                  {item.explanation && (
                    <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                        <span>Explanation & Concept</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {item.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
