"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shuffle,
  Award,
  Edit,
  ExternalLink,
  Check,
} from "lucide-react";
import clsx from "clsx";

interface QuestionItem {
  _id: string;
  order: number;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  marks?: number;
  negativeMarks?: number;
}

interface QuizDetail {
  _id: string;
  title: string;
  slug: string;
  subject?: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  timeLimitSeconds?: number | null;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  maxAttempts?: number | null;
  defaultMarks: number;
  defaultNegativeMarks: number;
  category?: { name: string; slug: string };
}

export default function AdminQuizEditPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<string>("");
  const [defaultMarks, setDefaultMarks] = useState<number>(1);
  const [defaultNegativeMarks, setDefaultNegativeMarks] = useState<number>(0);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [maxAttempts, setMaxAttempts] = useState<string>("");

  // Inline question editing state
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editQText, setEditQText] = useState("");
  const [editQOptions, setEditQOptions] = useState<string[]>([]);
  const [editQCorrectIdx, setEditQCorrectIdx] = useState<number>(0);
  const [editQExplanation, setEditQExplanation] = useState("");
  const [editQMarks, setEditQMarks] = useState<string>("");
  const [editQNegMarks, setEditQNegMarks] = useState<string>("");
  const [savingQuestion, setSavingQuestion] = useState(false);

  const fetchQuiz = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/quizzes/${quizId}`);
      if (res.ok) {
        const data = await res.json();
        setQuiz(data.quiz);
        setQuestions(data.questions || []);

        setTitle(data.quiz.title || "");
        setSubject(data.quiz.subject || "");
        setTimeLimitMinutes(
          data.quiz.timeLimitSeconds ? String(Math.round(data.quiz.timeLimitSeconds / 60)) : ""
        );
        setDefaultMarks(data.quiz.defaultMarks ?? 1);
        setDefaultNegativeMarks(data.quiz.defaultNegativeMarks ?? 0);
        setShuffleQuestions(!!data.quiz.shuffleQuestions);
        setShuffleOptions(!!data.quiz.shuffleOptions);
        setMaxAttempts(data.quiz.maxAttempts ? String(data.quiz.maxAttempts) : "");
      } else {
        setErrorMessage("Quiz not found or failed to load");
      }
    } catch (err) {
      console.error("Fetch quiz error:", err);
      setErrorMessage("Network error loading quiz");
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      setSuccessMessage(null);
      setErrorMessage(null);

      const parsedTimeLimit = timeLimitMinutes.trim()
        ? Math.max(10, parseInt(timeLimitMinutes, 10) * 60)
        : null;

      const parsedMaxAttempts = maxAttempts.trim()
        ? Math.max(1, parseInt(maxAttempts, 10))
        : null;

      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-requested-with": "ret-admin",
        },
        body: JSON.stringify({
          title,
          subject: subject || undefined,
          timeLimitSeconds: parsedTimeLimit,
          defaultMarks: Number(defaultMarks),
          defaultNegativeMarks: Number(defaultNegativeMarks),
          shuffleQuestions,
          shuffleOptions,
          maxAttempts: parsedMaxAttempts,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setQuiz(data.quiz);
        setSuccessMessage("Quiz settings updated successfully.");
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(data.error?.message || "Failed to save settings");
      }
    } catch (err) {
      console.error("Save settings error:", err);
      setErrorMessage("Unexpected error while updating settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const handlePublishToggle = async () => {
    if (!quiz) return;
    try {
      const endpoint =
        quiz.status === "PUBLISHED"
          ? `/api/quizzes/${quiz._id}/unpublish`
          : `/api/quizzes/${quiz._id}/publish`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "x-requested-with": "ret-admin" },
      });

      if (res.ok) {
        const data = await res.json();
        setQuiz(data.quiz);
        setSuccessMessage(
          data.quiz.status === "PUBLISHED" ? "Quiz published to public site!" : "Quiz unpublished to draft."
        );
      } else {
        const data = await res.json();
        setErrorMessage(data.error?.message || "Failed to update quiz status");
      }
    } catch (err) {
      console.error("Publish toggle error:", err);
    }
  };

  const startEditQuestion = (q: QuestionItem) => {
    setEditingQuestionId(q._id);
    setEditQText(q.questionText);
    setEditQOptions([...q.options]);
    setEditQCorrectIdx(q.correctOptionIndex);
    setEditQExplanation(q.explanation || "");
    setEditQMarks(q.marks !== undefined ? String(q.marks) : "");
    setEditQNegMarks(q.negativeMarks !== undefined ? String(q.negativeMarks) : "");
  };

  const handleSaveQuestion = async (qId: string) => {
    try {
      setSavingQuestion(true);
      const res = await fetch(`/api/quizzes/${quizId}/questions/${qId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-requested-with": "ret-admin",
        },
        body: JSON.stringify({
          questionText: editQText,
          options: editQOptions,
          correctOptionIndex: editQCorrectIdx,
          explanation: editQExplanation,
          marks: editQMarks.trim() ? Number(editQMarks) : null,
          negativeMarks: editQNegMarks.trim() ? Number(editQNegMarks) : null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setQuestions((prev) =>
          prev.map((q) => (q._id === qId ? data.question : q))
        );
        setEditingQuestionId(null);
      } else {
        alert(data.error?.message || "Failed to update question");
      }
    } catch (err) {
      console.error("Save question error:", err);
      alert("Error saving question");
    } finally {
      setSavingQuestion(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-3" />
        <p className="text-sm text-slate-500 font-medium">Loading quiz details...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Quiz not found</h2>
        <Link
          href="/admin/quizzes"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-950 bg-amber-500 px-4 py-2 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Quizzes</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/admin/quizzes"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm transition-all w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Quizzes</span>
        </Link>

        <div className="flex items-center gap-2">
          {quiz.status === "PUBLISHED" && (
            <Link
              href={`/quizzes/${quiz.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Preview Live</span>
            </Link>
          )}

          <button
            type="button"
            onClick={handlePublishToggle}
            className={clsx(
              "px-4 py-1.5 rounded-lg text-xs font-bold border transition-all shadow-sm",
              quiz.status === "PUBLISHED"
                ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                : "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-500"
            )}
          >
            {quiz.status === "PUBLISHED" ? "Unpublish Quiz" : "Publish Quiz Live"}
          </button>
        </div>
      </div>

      {/* Status Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-800 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Quiz Title Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border",
              quiz.status === "PUBLISHED"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
            )}
          >
            {quiz.status}
          </span>
          <span className="text-xs text-slate-400 font-mono">/{quiz.slug}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{quiz.title}</h1>
        <p className="text-xs text-slate-500">
          Contains {questions.length} questions &bull; Default scheme: +{quiz.defaultMarks} / -{quiz.defaultNegativeMarks} marks
        </p>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900">Quiz Configuration & Rules</h2>
          <p className="text-xs text-slate-500">Customize marking scheme, time limits, and test behavior.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Quiz Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject / Category</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Rajasthan GK, Polity, History"
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Positive Marks (per correct answer)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.1"
              value={defaultMarks}
              onChange={(e) => setDefaultMarks(parseFloat(e.target.value))}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Negative Marks (deduction per wrong answer)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={defaultNegativeMarks}
              onChange={(e) => setDefaultNegativeMarks(parseFloat(e.target.value))}
              placeholder="0 for no negative marking, 0.33 for 1/3 deduction"
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Time Limit (in Minutes — leave empty for untimed)
            </label>
            <input
              type="number"
              min="1"
              value={timeLimitMinutes}
              onChange={(e) => setTimeLimitMinutes(e.target.value)}
              placeholder="e.g. 30"
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Max Attempts Allowed (leave empty for unlimited)
            </label>
            <input
              type="number"
              min="1"
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(e.target.value)}
              placeholder="Unlimited"
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Toggle checkboxes */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-6 text-xs text-slate-700 font-semibold">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={shuffleQuestions}
              onChange={(e) => setShuffleQuestions(e.target.checked)}
              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
            />
            <span>Shuffle Questions for each taker</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={shuffleOptions}
              onChange={(e) => setShuffleOptions(e.target.checked)}
              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
            />
            <span>Shuffle Options order</span>
          </label>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={savingSettings}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-sm transition-all"
          >
            {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Settings</span>
          </button>
        </div>
      </form>

      {/* Imported Questions & Inline Fixes */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Questions List ({questions.length})</h2>
            <p className="text-xs text-slate-500">
              Inspect questions, correct answer keys, and adjust per-question mark overrides inline.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {questions.map((q, idx) => {
            const isEditing = editingQuestionId === q._id;

            return (
              <div
                key={q._id}
                className={clsx(
                  "p-4 rounded-xl border text-xs transition-all space-y-3",
                  isEditing ? "bg-amber-50/40 border-amber-300" : "bg-slate-50 border-slate-200"
                )}
              >
                {isEditing ? (
                  /* Inline Edit Mode */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-900">Editing Question #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => setEditingQuestionId(null)}
                        className="text-xs text-slate-500 hover:text-slate-800"
                      >
                        Cancel
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Question Text
                      </label>
                      <textarea
                        rows={2}
                        value={editQText}
                        onChange={(e) => setEditQText(e.target.value)}
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[11px] font-semibold text-slate-700">
                        Options (select the radio button next to the correct answer)
                      </label>
                      {editQOptions.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correctOption_${q._id}`}
                            checked={editQCorrectIdx === optIdx}
                            onChange={() => setEditQCorrectIdx(optIdx)}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="w-5 text-center font-bold text-slate-500">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...editQOptions];
                              newOpts[optIdx] = e.target.value;
                              setEditQOptions(newOpts);
                            }}
                            className="flex-1 text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Explanation (optional)
                      </label>
                      <input
                        type="text"
                        value={editQExplanation}
                        onChange={(e) => setEditQExplanation(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Marks Override (leave empty to use default: +{quiz.defaultMarks})
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={editQMarks}
                          onChange={(e) => setEditQMarks(e.target.value)}
                          placeholder={`Default: ${quiz.defaultMarks}`}
                          className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Negative Marks Override (leave empty for default: -{quiz.defaultNegativeMarks})
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={editQNegMarks}
                          onChange={(e) => setEditQNegMarks(e.target.value)}
                          placeholder={`Default: ${quiz.defaultNegativeMarks}`}
                          className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => handleSaveQuestion(q._id)}
                        disabled={savingQuestion}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-sm"
                      >
                        {savingQuestion && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>Save Question</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Read-Only View with Quick Edit Button */
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="font-bold text-slate-900">
                        Q{idx + 1}. {q.questionText}
                      </span>
                      <button
                        type="button"
                        onClick={() => startEditQuestion(q)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:text-amber-800 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded transition-colors shrink-0"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = optIdx === q.correctOptionIndex;
                        return (
                          <div
                            key={optIdx}
                            className={clsx(
                              "p-2 rounded-lg border flex items-center gap-2",
                              isCorrect
                                ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold"
                                : "bg-white border-slate-200 text-slate-700"
                            )}
                          >
                            <span
                              className={clsx(
                                "w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold",
                                isCorrect ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                              )}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="truncate">{opt}</span>
                            {isCorrect && (
                              <span className="ml-auto text-[10px] text-emerald-700 font-bold uppercase">
                                Correct
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <p className="mt-2 text-[11px] text-slate-500 bg-white p-2 rounded-lg border border-slate-200/60">
                        <span className="font-semibold text-slate-700">Explanation:</span> {q.explanation}
                      </p>
                    )}

                    {(q.marks !== undefined || q.negativeMarks !== undefined) && (
                      <div className="mt-2 text-[10px] text-slate-500">
                        <span className="font-semibold">Per-question overrides:</span>{" "}
                        {q.marks !== undefined && `+${q.marks} marks`}
                        {q.marks !== undefined && q.negativeMarks !== undefined && " | "}
                        {q.negativeMarks !== undefined && `-${q.negativeMarks} neg`}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
