"use client";

import { useState, useEffect, useRef } from "react";
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
  Share2,
  Bot,
  Copy,
  Check,
  Sparkles,
  Send,
  Play,
  CheckSquare,
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

interface NextQuizInfo {
  id: string;
  title: string;
  slug: string;
  subject?: string;
}

export default function QuizResultPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [result, setResult] = useState<AttemptResult | null>(null);
  const [nextQuiz, setNextQuiz] = useState<NextQuizInfo | null>(null);
  const [loadingNext, setLoadingNext] = useState(true);
  const [language, setLanguage] = useState<"hi" | "en">("hi");
  const [filter, setFilter] = useState<"ALL" | "CORRECT" | "INCORRECT" | "UNATTEMPTED">("ALL");

  const [copiedAi, setCopiedAi] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [showAiFallbackModal, setShowAiFallbackModal] = useState(false);
  const [aiTextContent, setAiTextContent] = useState("");

  const reviewSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(`ret_quiz_result_${slug}`);
    if (raw) {
      try {
        const parsed: AttemptResult = JSON.parse(raw);
        setResult(parsed);

        // Fetch next quiz in series
        if (parsed.quizId) {
          fetch(`/api/quizzes/${parsed.quizId}/next`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              if (data?.nextQuiz) {
                setNextQuiz(data.nextQuiz);
              }
            })
            .catch((err) => console.error("Failed to fetch next quiz:", err))
            .finally(() => setLoadingNext(false));
        }
      } catch (err) {
        console.error("Failed to parse stored result:", err);
        setLoadingNext(false);
      }
    } else {
      setLoadingNext(false);
    }
  }, [slug]);

  const handleCopyForAi = async () => {
    if (!result) return;

    const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://www.rajasthanexamtwister.in";
    const quizUrl = `${siteUrl}/quizzes/${slug}`;

    const formattedQuestions = result.breakdown
      .map((q, idx) => {
        const userOptText =
          q.selectedOptionIndex !== null && q.selectedOptionIndex !== undefined
            ? `${String.fromCharCode(65 + q.selectedOptionIndex)}) ${q.options[q.selectedOptionIndex]}`
            : "Unattempted / Skipped";

        const correctOptText = `${String.fromCharCode(65 + q.correctOptionIndex)}) ${q.options[q.correctOptionIndex]}`;

        return `Q${idx + 1}. ${q.questionText}
My Answer: ${userOptText}
Correct Answer: ${correctOptText}${q.explanation ? `\nExplanation: ${q.explanation}` : ""}`;
      })
      .join("\n\n");

    const text = `----------------------------------------
I attempted this quiz on Rajasthan Exam Twister.

Source:
Rajasthan Exam Twister

Website:
${siteUrl}

Quiz:
${result.quizTitle}

Quiz URL:
${quizUrl}

My Result:
Score: ${result.score}/${result.totalPossibleScore}
Accuracy: ${result.percentage}%

Correct: ${result.correctCount}
Incorrect: ${result.incorrectCount}
Unattempted: ${result.unattemptedCount}

Please analyze my performance.

For each incorrect or unattempted question:
1. Explain the correct answer.
2. Explain why my selected answer was wrong, if applicable.
3. Give me the key fact to remember.
4. Identify the related topic.
5. Give me 3 similar practice questions.

Questions:

${formattedQuestions}

Source:
Rajasthan Exam Twister
${quizUrl}
----------------------------------------`;

    setAiTextContent(text);

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        setCopiedAi(true);
        setTimeout(() => setCopiedAi(false), 3000);
      } else {
        setShowAiFallbackModal(true);
      }
    } catch {
      setShowAiFallbackModal(true);
    }
  };

  const handleShareResult = async () => {
    if (!result) return;

    const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://www.rajasthanexamtwister.in";
    const quizUrl = `${siteUrl}/quizzes/${slug}`;

    const shareTitle = `🎯 ${result.quizTitle}`;
    const shareText = `I scored ${result.score}/${result.totalPossibleScore} (${result.percentage}% accuracy) on Rajasthan Exam Twister!\nCan you beat my score?`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `${shareText}\n\nTake the quiz:\n${quizUrl}`,
          url: quizUrl,
        });
        return;
      } catch {
        // Fallback to copy link
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareText}\n\nTake the quiz:\n${quizUrl}`);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 3000);
    } catch (err) {
      console.error("Failed to copy share link:", err);
    }
  };

  const scrollToReview = () => {
    if (reviewSectionRef.current) {
      reviewSectionRef.current.scrollIntoView({ behavior: "smooth" });
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
    <div className="min-h-screen bg-[#FAF8F5] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/quizzes"
            className="text-xs font-semibold text-slate-600 hover:text-amber-700 transition-colors flex items-center gap-1"
          >
            &larr; Back to all quizzes
          </Link>
          <span className="text-[11px] text-slate-400 font-medium">
            Submitted {new Date(result.submittedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        {/* Score Summary Card */}
        <div className="bg-white rounded-3xl border border-amber-200/80 shadow-xl overflow-hidden">
          <div className="bg-[#0B132B] text-white p-8 sm:p-10 text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Official Score Card</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{result.quizTitle}</h1>

            <div className="flex items-center justify-center gap-2 pt-2">
              <span className="text-5xl sm:text-6xl font-black text-amber-400 tracking-tight">
                {result.score}
              </span>
              <span className="text-2xl font-bold text-slate-400 self-end mb-1">
                / {result.totalPossibleScore}
              </span>
            </div>

            <p className="text-xs text-slate-300 font-medium">
              Accuracy Rating: <span className="font-extrabold text-white">{result.percentage}%</span>
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

          {/* Diagnostic Readiness & Feedback */}
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

          {/* Result Actions Hub */}
          <div className="p-6 bg-white border-t border-slate-200 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={scrollToReview}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-extrabold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-sm"
              >
                <CheckSquare className="w-4 h-4" />
                <span>Review Answers</span>
              </button>

              {/* Copy for AI Button */}
              <button
                type="button"
                onClick={handleCopyForAi}
                className={clsx(
                  "inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-extrabold rounded-xl transition-all shadow-sm border",
                  copiedAi
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-purple-600 hover:bg-purple-500 text-white border-purple-600"
                )}
              >
                {copiedAi ? <Check className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                <span>{copiedAi ? "Copied for AI!" : "🤖 Copy for AI"}</span>
              </button>

              {/* Share Result Button */}
              <button
                type="button"
                onClick={handleShareResult}
                className={clsx(
                  "inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-extrabold rounded-xl transition-all shadow-sm border",
                  copiedShare
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-sky-600 hover:bg-sky-500 text-white border-sky-600"
                )}
              >
                {copiedShare ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                <span>{copiedShare ? "Link Copied!" : "🔗 Share Result"}</span>
              </button>

              <Link
                href={`/quizzes/${slug}/attempt`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retry Quiz</span>
              </Link>
            </div>

            {/* Next Quiz / Series Completed Container */}
            <div className="pt-4 border-t border-slate-100">
              {nextQuiz ? (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-0.5 text-center sm:text-left">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800">
                      Continue Series & Practice
                    </span>
                    <h3 className="text-sm font-extrabold text-[#0B132B]">
                      Next Quiz: {nextQuiz.title}
                    </h3>
                  </div>
                  <Link
                    href={`/quizzes/${nextQuiz.slug}`}
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-extrabold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-md shrink-0"
                  >
                    <span>▶ Next Quiz</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-extrabold text-emerald-950">
                      🎉 Topic / Series Completed!
                    </h3>
                    <p className="text-xs text-emerald-800">
                      You have finished all active published tests in this category.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href="/notes"
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-emerald-900 border border-emerald-300 hover:bg-emerald-100 transition-colors"
                    >
                      Practice Weak Topics
                    </Link>
                    <Link
                      href="/quizzes"
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors"
                    >
                      More Quizzes
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Solutions Review Section */}
        <div ref={reviewSectionRef} className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Question-by-Question Review</h2>
              <p className="text-xs text-slate-500">
                Detailed solution key and answer explanations for all {result.totalQuestions} questions.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Language Toggle Pill */}
              <div
                className="flex items-center bg-white p-0.5 rounded-xl border border-slate-200 shadow-xs"
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
                >
                  English
                </button>
              </div>

              {/* Solution Filter Tabs */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
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
                        ? "bg-slate-900 text-white shadow-xs"
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

              return (
                <div
                  key={q.questionId}
                  className={clsx(
                    "bg-white rounded-2xl border p-6 shadow-xs space-y-4 transition-all",
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

                  {/* Explanation Block & Learning Links */}
                  {q.explanation && (
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
                      <span className="font-bold text-slate-900 block">Explanation:</span>
                      <p className="leading-relaxed">{q.explanation}</p>
                      <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2">
                        <Link
                          href="/notes"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-900 underline"
                        >
                          <BookOpen className="w-3 h-3 text-amber-700" />
                          <span>Study Related Revision Notes</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Fallback Modal for Copy for AI */}
      {showAiFallbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-600" />
                <span>Copy Quiz Results for AI Analysis</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAiFallbackModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Select all and copy the structured prompt text below to paste into ChatGPT, Gemini, Grok, or Claude:
            </p>
            <textarea
              readOnly
              value={aiTextContent}
              rows={12}
              className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAiFallbackModal(false)}
                className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
