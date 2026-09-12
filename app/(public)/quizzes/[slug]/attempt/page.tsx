"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Send,
  HelpCircle,
  RotateCcw,
} from "lucide-react";
import clsx from "clsx";

interface PublicQuestion {
  id: string;
  order: number;
  questionText: string;
  questionTextEn?: string;
  options: string[];
  optionsEn?: string[];
  marks?: number;
  negativeMarks?: number;
}

interface PublicQuizDetail {
  id: string;
  title: string;
  slug: string;
  subject?: string;
  timeLimitSeconds?: number | null;
  defaultMarks: number;
  defaultNegativeMarks: number;
  questionCount: number;
  questions: PublicQuestion[];
}

export default function QuizAttemptPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<PublicQuizDetail | null>(null);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [language, setLanguage] = useState<"hi" | "en">("hi");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [startTime] = useState<string>(new Date().toISOString());

  const autoSubmittedRef = useRef(false);

  // Fetch public quiz
  useEffect(() => {
    async function loadQuiz() {
      try {
        setLoading(true);
        const res = await fetch(`/api/quizzes/slug/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setQuiz(data.quiz);

          // Initialize answer map
          const initialAnswers: Record<string, number | null> = {};
          data.quiz.questions.forEach((q: PublicQuestion) => {
            initialAnswers[q.id] = null;
          });
          setAnswers(initialAnswers);

          if (data.quiz.timeLimitSeconds) {
            setTimeLeft(data.quiz.timeLimitSeconds);
          }
        } else {
          router.push(`/quizzes/${slug}`);
        }
      } catch (err) {
        console.error("Failed to load quiz attempt:", err);
      } finally {
        setLoading(false);
      }
    }

    loadQuiz();
  }, [slug, router]);

  // Submit attempt function
  const submitAttempt = useCallback(
    async (isAutoSubmit = false) => {
      if (!quiz || submitting || autoSubmittedRef.current) return;
      if (isAutoSubmit) {
        autoSubmittedRef.current = true;
      }

      try {
        setSubmitting(true);
        setShowConfirmModal(false);

        const answersPayload = Object.entries(answers).map(([questionId, selectedOptionIndex]) => ({
          questionId,
          selectedOptionIndex,
        }));

        const res = await fetch(`/api/quizzes/${quiz.id}/attempts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            answers: answersPayload,
            startedAt: startTime,
          }),
        });

        const data = await res.json();
        if (res.ok && data.result) {
          // Store attempt result in sessionStorage for display on result page
          sessionStorage.setItem(`ret_quiz_result_${quiz.slug}`, JSON.stringify(data.result));
          router.push(`/quizzes/${quiz.slug}/result`);
        } else {
          alert(data.error?.message || "Failed to submit attempt. Please try again.");
          setSubmitting(false);
        }
      } catch (err) {
        console.error("Submit error:", err);
        alert("Network error occurred during submission.");
        setSubmitting(false);
      }
    },
    [quiz, submitting, answers, startTime, router]
  );

  // Countdown timer logic
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          submitAttempt(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitAttempt]);

  const handleOptionSelect = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleClearSelection = (questionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: null,
    }));
  };

  const answeredCount = Object.values(answers).filter((a) => a !== null).length;
  const totalQuestions = quiz?.questions.length || 0;
  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-3" />
        <p className="text-sm text-slate-500 font-medium">Preparing test environment...</p>
      </div>
    );
  }

  if (!quiz) return null;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col pb-24">
      {/* Sticky Header Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="truncate">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate">
              {quiz.title}
            </h1>
            <p className="text-[11px] text-slate-500">
              {answeredCount} of {totalQuestions} answered ({Math.round(progressPercent)}%)
            </p>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Language Toggle Pill */}
            <div
              className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200"
              role="group"
              aria-label="Language Toggle"
            >
              <button
                type="button"
                onClick={() => setLanguage("hi")}
                className={clsx(
                  "px-2.5 py-1 text-xs font-bold rounded-lg transition-all",
                  language === "hi"
                    ? "bg-white text-slate-950 shadow-xs font-extrabold"
                    : "text-slate-500 hover:text-slate-900"
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
                    ? "bg-white text-slate-950 shadow-xs font-extrabold"
                    : "text-slate-500 hover:text-slate-900"
                )}
                title="View in English"
              >
                English
              </button>
            </div>

            {timeLeft !== null && (
              <div
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold border",
                  timeLeft < 300
                    ? "bg-red-50 text-red-600 border-red-200 animate-pulse"
                    : "bg-slate-100 text-slate-700 border-slate-200"
                )}
              >
                <Clock className="w-4 h-4 text-slate-500" />
                <span>{formatTimer(timeLeft)}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-sm transition-all"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Submit Test</span>
            </button>
          </div>
        </div>

        {/* Real-time Progress Bar */}
        <div className="w-full bg-slate-100 h-1">
          <div
            className="bg-amber-500 h-1 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* Main Questions Container */}
      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 pt-6 space-y-6 flex-1">
        {quiz.questions.map((q, idx) => {
          const selectedOption = answers[q.id];
          const isAnswered = selectedOption !== null && selectedOption !== undefined;
          const isEnglish = language === "en";
          const displayQuestionText = isEnglish && q.questionTextEn ? q.questionTextEn : q.questionText;
          const isFallbackHindi = isEnglish && !q.questionTextEn;
          const displayOptions =
            isEnglish && q.optionsEn && q.optionsEn.length === q.options.length
              ? q.optionsEn
              : q.options;

          return (
            <div
              key={q.id}
              id={`question-${idx + 1}`}
              className={clsx(
                "bg-white rounded-2xl border p-6 sm:p-8 shadow-sm transition-all space-y-4",
                isAnswered ? "border-amber-300" : "border-slate-200"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Question {idx + 1} of {totalQuestions}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                    +{q.marks || quiz.defaultMarks} / -{q.negativeMarks ?? quiz.defaultNegativeMarks} Marks
                  </span>

                  {isAnswered && (
                    <button
                      type="button"
                      onClick={() => handleClearSelection(q.id)}
                      className="text-[11px] text-slate-400 hover:text-slate-700 underline transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <p className="text-sm sm:text-base font-semibold text-slate-900 leading-relaxed pt-1">
                {displayQuestionText}
                {isFallbackHindi && (
                  <span className="inline-block ml-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md align-middle border border-slate-200">
                    Hindi only
                  </span>
                )}
              </p>

              {/* Options */}
              <div className="space-y-2.5 pt-2">
                {displayOptions.map((opt, optIdx) => {
                  const isSelected = selectedOption === optIdx;
                  const letter = String.fromCharCode(65 + optIdx);

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleOptionSelect(q.id, optIdx)}
                      className={clsx(
                        "w-full p-3.5 sm:p-4 rounded-xl text-left border flex items-center gap-3 text-xs sm:text-sm font-medium transition-all group",
                        isSelected
                          ? "bg-amber-500 text-slate-950 border-amber-500 font-semibold shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                      )}
                    >
                      <span
                        className={clsx(
                          "w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
                          isSelected
                            ? "bg-slate-950 text-white"
                            : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                        )}
                      >
                        {letter}
                      </span>
                      <span className="flex-1 leading-snug">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-900 mx-auto flex items-center justify-center">
                <Send className="w-6 h-6 text-amber-700" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Submit Exam Paper?</h3>
              <p className="text-xs text-slate-500">
                You are about to complete and submit your quiz attempt for instant evaluation.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Questions:</span>
                <span className="font-bold text-slate-900">{totalQuestions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Answered Questions:</span>
                <span className="font-bold text-emerald-600">{answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Unattempted Questions:</span>
                <span className="font-bold text-amber-600">{totalQuestions - answeredCount}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="w-1/2 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Continue Test
              </button>
              <button
                type="button"
                onClick={() => submitAttempt(false)}
                disabled={submitting}
                className="w-1/2 py-2.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Confirm & Submit</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
