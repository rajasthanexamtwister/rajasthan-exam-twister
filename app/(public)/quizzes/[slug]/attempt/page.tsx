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
  ArrowRight,
  Send,
  HelpCircle,
  RotateCcw,
  Sparkles,
  HelpCircle as QuestionIcon,
  XCircle,
} from "lucide-react";
import { recordQuizCompletion } from "@/components/public/daily-goal-widget";
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

interface QuestionFeedback {
  isCorrect: boolean;
  isUnattempted: boolean;
  correctOptionIndex: number;
  explanation: string;
  marksAwarded: number;
}

export default function QuizAttemptPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<PublicQuizDetail | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [feedbackMap, setFeedbackMap] = useState<Record<string, QuestionFeedback>>({});
  const [evaluatingQuestionId, setEvaluatingQuestionId] = useState<string | null>(null);
  const [language, setLanguage] = useState<"hi" | "en">("hi");
  const [mode, setMode] = useState<"exam" | "practice">("exam");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [startTime] = useState<string>(new Date().toISOString());

  const autoSubmittedRef = useRef(false);
  const autoNextTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Clean up auto-next timer on unmount
  useEffect(() => {
    return () => {
      if (autoNextTimerRef.current) {
        clearTimeout(autoNextTimerRef.current);
      }
    };
  }, []);

  // Submit full attempt function
  const submitAttempt = useCallback(
    async (isAutoSubmit = false) => {
      if (!quiz || submitting || autoSubmittedRef.current) return;
      if (isAutoSubmit) {
        autoSubmittedRef.current = true;
      }

      // Clear any pending auto-next timers
      if (autoNextTimerRef.current) {
        clearTimeout(autoNextTimerRef.current);
        autoNextTimerRef.current = null;
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
            isPracticeMode: mode === "practice",
          }),
        });

        const data = await res.json();
        if (res.ok && data.result) {
          recordQuizCompletion();
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
    [quiz, submitting, answers, startTime, mode, router]
  );

  // Countdown timer logic for overall test
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

  // Navigate to next question safely
  const advanceToNextQuestion = useCallback(
    (targetIndex?: number) => {
      if (autoNextTimerRef.current) {
        clearTimeout(autoNextTimerRef.current);
        autoNextTimerRef.current = null;
      }

      if (!quiz) return;
      const nextIdx = targetIndex !== undefined ? targetIndex : currentQuestionIndex + 1;

      if (nextIdx < quiz.questions.length) {
        setCurrentQuestionIndex(nextIdx);
      } else {
        // Reached end of questions -> trigger submission confirmation or auto-submit
        submitAttempt(false);
      }
    },
    [quiz, currentQuestionIndex, submitAttempt]
  );

  // Evaluate answer selection & trigger auto-next timer
  const handleSelectOption = async (questionId: string, optionIndex: number | null) => {
    if (!quiz || evaluatingQuestionId || feedbackMap[questionId]) return;

    setEvaluatingQuestionId(questionId);
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));

    try {
      const res = await fetch(`/api/quizzes/${quiz.id}/check-answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          selectedOptionIndex: optionIndex,
          isPracticeMode: mode === "practice",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const fb: QuestionFeedback = data.feedback;
        setFeedbackMap((prev) => ({ ...prev, [questionId]: fb }));

        // Target delay: 1.5s for correct, 2.0s for wrong/unattempted
        const delayMs = fb.isCorrect ? 1500 : 2000;

        if (autoNextTimerRef.current) {
          clearTimeout(autoNextTimerRef.current);
        }

        autoNextTimerRef.current = setTimeout(() => {
          advanceToNextQuestion();
        }, delayMs);
      }
    } catch (err) {
      console.error("Failed to check answer:", err);
    } finally {
      setEvaluatingQuestionId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-3" />
        <p className="text-sm text-slate-500 font-medium">Preparing test environment...</p>
      </div>
    );
  }

  if (!quiz || quiz.questions.length === 0) return null;

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;
  const currentFeedback = feedbackMap[currentQuestion.id];
  const currentAnswer = answers[currentQuestion.id];
  const isQuestionAnswered = currentFeedback !== undefined;

  // Calculate live counters
  let correctCount = 0;
  let wrongCount = 0;
  let unattemptedCount = 0;

  Object.values(feedbackMap).forEach((fb) => {
    if (fb.isCorrect) correctCount++;
    else if (fb.isUnattempted) unattemptedCount++;
    else wrongCount++;
  });

  const progressPercent = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const isEnglish = language === "en";
  const displayQuestionText = isEnglish && currentQuestion.questionTextEn ? currentQuestion.questionTextEn : currentQuestion.questionText;
  const isFallbackHindi = isEnglish && !currentQuestion.questionTextEn;
  const displayOptions = isEnglish && currentQuestion.optionsEn && currentQuestion.optionsEn.length === currentQuestion.options.length
    ? currentQuestion.optionsEn
    : currentQuestion.options;

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col pb-24">
      {/* Sticky Header Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="truncate">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate">
              {quiz.title}
            </h1>
            <p className="text-[11px] text-slate-500 font-semibold">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Mode Switcher Pill */}
            <div
              className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200"
              role="group"
              aria-label="Quiz Attempt Mode"
            >
              <button
                type="button"
                onClick={() => setMode("exam")}
                className={clsx(
                  "px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1",
                  mode === "exam"
                    ? "bg-amber-500 text-slate-950 shadow-xs font-extrabold"
                    : "text-slate-500 hover:text-slate-900"
                )}
                title="Exam Mode (Negative Marking Active)"
              >
                <span>🎯</span>
                <span className="hidden sm:inline">Exam Mode</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("practice")}
                className={clsx(
                  "px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1",
                  mode === "practice"
                    ? "bg-emerald-600 text-white shadow-xs font-extrabold"
                    : "text-slate-500 hover:text-slate-900"
                )}
                title="Practice Mode (No Negative Marking)"
              >
                <span>⚡</span>
                <span className="hidden sm:inline">Practice Mode</span>
              </button>
            </div>

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
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-sm transition-all"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Submit Test</span>
            </button>
          </div>
        </div>

        {/* Real-time Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5 overflow-hidden">
          <div
            className="bg-amber-500 h-1.5 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* Main Single Question Container */}
      <main className="max-w-3xl mx-auto w-full px-4 sm:px-6 pt-6 space-y-6 flex-1">
        {/* Compact Counters & Status Bar */}
        <div className="flex items-center justify-between text-xs font-bold bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1 text-emerald-700">
              🟢 Correct: <strong className="text-emerald-950">{correctCount}</strong>
            </span>
            <span className="inline-flex items-center gap-1 text-red-700">
              🔴 Wrong: <strong className="text-red-950">{wrongCount}</strong>
            </span>
            <span className="inline-flex items-center gap-1 text-amber-700">
              ⚪ Unattempted: <strong className="text-amber-950">{unattemptedCount}</strong>
            </span>
          </div>

          <span className="text-slate-500 font-semibold">
            {mode === "practice"
              ? "⚡ Practice Mode (No Negative)"
              : `🎯 Wrong: -${currentQuestion.negativeMarks ?? quiz.defaultNegativeMarks}`}
          </span>
        </div>

        {/* Single Question Card */}
        <div className="bg-white rounded-3xl border border-amber-200/80 p-6 sm:p-8 shadow-sm space-y-6 transition-all">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center shrink-0">
                {currentQuestionIndex + 1}
              </span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Question {currentQuestionIndex + 1} / {totalQuestions}
              </span>
            </div>

            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200">
              +{currentQuestion.marks || quiz.defaultMarks} Marks
            </span>
          </div>

          {/* Question Text */}
          <p className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
            {displayQuestionText}
            {isFallbackHindi && (
              <span className="inline-block ml-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md align-middle border border-slate-200">
                Hindi only
              </span>
            )}
          </p>

          {/* Options List */}
          <div className="space-y-3 pt-2">
            {displayOptions.map((opt, optIdx) => {
              const letter = String.fromCharCode(65 + optIdx);
              const isSelected = currentAnswer === optIdx;

              let optionStyle = "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-amber-300";
              let badgeStyle = "bg-slate-100 text-slate-600";

              if (currentFeedback) {
                const isCorrectOption = optIdx === currentFeedback.correctOptionIndex;
                if (isCorrectOption) {
                  optionStyle = "bg-emerald-50 text-emerald-950 border-emerald-500 font-bold ring-2 ring-emerald-500/20";
                  badgeStyle = "bg-emerald-600 text-white";
                } else if (isSelected && !currentFeedback.isCorrect) {
                  optionStyle = "bg-red-50 text-red-950 border-red-500 font-bold";
                  badgeStyle = "bg-red-600 text-white";
                } else {
                  optionStyle = "bg-slate-50 text-slate-400 border-slate-200 opacity-60";
                }
              } else if (isSelected) {
                optionStyle = "bg-amber-500 text-slate-950 border-amber-500 font-bold shadow-sm";
                badgeStyle = "bg-slate-950 text-white";
              }

              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelectOption(currentQuestion.id, optIdx)}
                  disabled={isQuestionAnswered || evaluatingQuestionId === currentQuestion.id}
                  className={clsx(
                    "w-full p-4 rounded-2xl text-left border flex items-center gap-3 text-sm font-medium transition-all group disabled:cursor-default",
                    optionStyle
                  )}
                >
                  <span
                    className={clsx(
                      "w-7 h-7 rounded-xl flex items-center justify-center text-xs font-extrabold shrink-0 transition-colors",
                      badgeStyle
                    )}
                  >
                    {letter}
                  </span>
                  <span className="flex-1 leading-snug">{opt}</span>

                  {currentFeedback && optIdx === currentFeedback.correctOptionIndex && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  )}
                  {currentFeedback && isSelected && !currentFeedback.isCorrect && (
                    <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Don't Know / Skip Option */}
          {!isQuestionAnswered && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleSelectOption(currentQuestion.id, null)}
                disabled={evaluatingQuestionId === currentQuestion.id}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-all"
              >
                <span>⚪ Don't Know / Skip</span>
              </button>

              <span className="text-[11px] text-slate-500 font-medium">
                No negative marks for unattempted questions
              </span>
            </div>
          )}

          {/* Feedback Banner */}
          {currentFeedback && (
            <div
              className={clsx(
                "p-4 rounded-2xl border space-y-2 animate-in fade-in duration-200",
                currentFeedback.isCorrect
                  ? "bg-emerald-50/90 border-emerald-300 text-emerald-950"
                  : currentFeedback.isUnattempted
                  ? "bg-amber-50/90 border-amber-300 text-amber-950"
                  : "bg-red-50/90 border-red-300 text-red-950"
              )}
            >
              <div className="flex items-center justify-between font-bold text-sm">
                <div className="flex items-center gap-2">
                  {currentFeedback.isCorrect ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>🟢 Correct! (+{currentFeedback.marksAwarded} Marks)</span>
                    </>
                  ) : currentFeedback.isUnattempted ? (
                    <>
                      <QuestionIcon className="w-5 h-5 text-amber-600" />
                      <span>⚪ Unattempted</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-600" />
                      <span>🔴 Incorrect ({currentFeedback.marksAwarded} Marks)</span>
                    </>
                  )}
                </div>

                <span className="text-xs font-semibold text-slate-600">
                  Correct Answer: Option {String.fromCharCode(65 + currentFeedback.correctOptionIndex)}
                </span>
              </div>

              {currentFeedback.explanation && (
                <p className="text-xs leading-relaxed text-slate-800 pt-1 border-t border-slate-200/60">
                  <strong className="text-slate-900 font-bold">Explanation:</strong>{" "}
                  {currentFeedback.explanation}
                </p>
              )}
            </div>
          )}

          {/* Question Navigation Control Bar */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => advanceToNextQuestion(currentQuestionIndex - 1)}
              disabled={currentQuestionIndex === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            {/* Manual Next Question Button */}
            <button
              type="button"
              onClick={() => advanceToNextQuestion(currentQuestionIndex + 1)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-102"
            >
              <span>
                {currentQuestionIndex + 1 === totalQuestions
                  ? "Finish & Submit Test →"
                  : "Next Question →"}
              </span>
            </button>
          </div>
        </div>
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
                <span className="text-slate-600">Answered / Attempted:</span>
                <span className="font-bold text-emerald-600">{correctCount + wrongCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Unattempted / Skipped:</span>
                <span className="font-bold text-amber-600">{totalQuestions - (correctCount + wrongCount)}</span>
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
