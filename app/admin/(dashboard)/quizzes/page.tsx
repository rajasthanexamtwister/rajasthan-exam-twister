"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  UploadCloud,
  Search,
  CheckSquare,
  Clock,
  Edit,
  Trash2,
  AlertCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
  Award,
} from "lucide-react";
import clsx from "clsx";

interface QuizItem {
  _id: string;
  title: string;
  slug: string;
  subject?: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  timeLimitSeconds?: number | null;
  defaultMarks: number;
  defaultNegativeMarks: number;
  questionCount?: number;
  updatedAt: string;
  category?: { name: string; slug: string };
}

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmModalId, setConfirmModalId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      params.set("pageSize", "50");

      const res = await fetch(`/api/quizzes?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data.quizzes || []);
      }
    } catch (err) {
      console.error("Failed to fetch quizzes:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const handlePublishToggle = async (id: string, currentStatus: string) => {
    try {
      setActionLoadingId(id);
      const endpoint =
        currentStatus === "PUBLISHED"
          ? `/api/quizzes/${id}/unpublish`
          : `/api/quizzes/${id}/publish`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "x-requested-with": "ret-admin" },
      });

      if (res.ok) {
        await fetchQuizzes();
      } else {
        const data = await res.json();
        alert(data.error?.message || "Failed to update quiz status");
      }
    } catch (err) {
      console.error("Publish toggle error:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      const res = await fetch(`/api/quizzes/${id}?confirm=true`, {
        method: "DELETE",
        headers: { "x-requested-with": "ret-admin" },
      });

      if (res.ok) {
        setQuizzes((prev) => prev.filter((q) => q._id !== id));
        setConfirmModalId(null);
      } else {
        const data = await res.json();
        alert(data.error?.message || "Failed to delete quiz");
      }
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
              Quiz Engine
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {quizzes.length} {quizzes.length === 1 ? "quiz" : "quizzes"} listed
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Manage Quizzes</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Import AI-generated papers, set marking rules and negative marks, and publish interactive tests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchQuizzes()}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
          </button>
          <Link
            href="/admin/quizzes/import"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-sm"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Import JSON Quiz</span>
          </Link>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 md:pb-0">
          {[
            { label: "All Quizzes", value: "ALL" },
            { label: "Published", value: "PUBLISHED" },
            { label: "Drafts", value: "DRAFT" },
            { label: "Archived", value: "ARCHIVED" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={clsx(
                "px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
                statusFilter === tab.value
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by title or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-3" />
            <p className="text-sm text-slate-500 font-medium">Loading quizzes...</p>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="py-20 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <CheckSquare className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No quizzes found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {statusFilter !== "ALL"
                ? `No quizzes matching the filter "${statusFilter}".`
                : "Get started by importing a paper's worth of questions via JSON."}
            </p>
            <div className="mt-5">
              <Link
                href="/admin/quizzes/import"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-all shadow-sm"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Import First Quiz</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-6">Quiz Title & Subject</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Questions</th>
                  <th className="py-3.5 px-4">Marking Scheme</th>
                  <th className="py-3.5 px-4">Time Limit</th>
                  <th className="py-3.5 px-4">Last Updated</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quizzes.map((quiz) => (
                  <tr
                    key={quiz._id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="py-4 px-6 max-w-md">
                      <Link
                        href={`/admin/quizzes/${quiz._id}/edit`}
                        className="font-bold text-slate-900 hover:text-amber-600 line-clamp-1 group-hover:underline text-sm"
                      >
                        {quiz.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <span className="font-mono text-[11px] text-slate-400">/{quiz.slug}</span>
                        {quiz.subject && (
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-medium text-[10px] border border-amber-200/50">
                            {quiz.subject}
                          </span>
                        )}
                        {quiz.category && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[10px]">
                            {quiz.category.name}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span
                        className={clsx(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
                          quiz.status === "PUBLISHED" &&
                            "bg-emerald-50 text-emerald-800 border-emerald-200",
                          quiz.status === "DRAFT" &&
                            "bg-amber-50 text-amber-800 border-amber-200",
                          quiz.status === "ARCHIVED" &&
                            "bg-slate-100 text-slate-700 border-slate-200"
                        )}
                      >
                        <span
                          className={clsx(
                            "w-1.5 h-1.5 rounded-full",
                            quiz.status === "PUBLISHED" && "bg-emerald-500",
                            quiz.status === "DRAFT" && "bg-amber-500",
                            quiz.status === "ARCHIVED" && "bg-slate-400"
                          )}
                        />
                        {quiz.status}
                      </span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {quiz.questionCount || 0} Qs
                      </span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-600" />
                        <span>+{quiz.defaultMarks}</span>
                        {quiz.defaultNegativeMarks > 0 ? (
                          <span className="text-red-600 font-medium">(-{quiz.defaultNegativeMarks})</span>
                        ) : (
                          <span className="text-slate-400">(no neg)</span>
                        )}
                      </span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {quiz.timeLimitSeconds
                          ? `${Math.round(quiz.timeLimitSeconds / 60)} min`
                          : "Untimed"}
                      </span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-500">
                      {new Date(quiz.updatedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {quiz.status === "PUBLISHED" && (
                          <Link
                            href={`/quizzes/${quiz.slug}`}
                            target="_blank"
                            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                            title="View live on public site"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        )}

                        <button
                          onClick={() => handlePublishToggle(quiz._id, quiz.status)}
                          disabled={actionLoadingId === quiz._id}
                          className={clsx(
                            "px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors",
                            quiz.status === "PUBLISHED"
                              ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                              : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                          )}
                          title={quiz.status === "PUBLISHED" ? "Unpublish to draft" : "Publish"}
                        >
                          {actionLoadingId === quiz._id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                          ) : quiz.status === "PUBLISHED" ? (
                            "Unpublish"
                          ) : (
                            "Publish"
                          )}
                        </button>

                        <Link
                          href={`/admin/quizzes/${quiz._id}/edit`}
                          className="p-1.5 text-slate-700 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition-colors"
                          title="Edit quiz settings & questions"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>

                        <button
                          onClick={() => setConfirmModalId(quiz._id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete quiz"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Quiz</h3>
                <p className="text-xs text-slate-500">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete this quiz and all its associated questions and attempt records?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmModalId)}
                disabled={deletingId === confirmModalId}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
              >
                {deletingId === confirmModalId && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Permanently Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
