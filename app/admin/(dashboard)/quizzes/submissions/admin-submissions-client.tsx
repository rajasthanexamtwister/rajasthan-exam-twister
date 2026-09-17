"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  Filter,
  Eye,
  PlusCircle,
  X,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import clsx from "clsx";

interface SubmissionAdminItem {
  _id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  quizTitle: string;
  subject?: string;
  questionCount: number;
  status: "DRAFT" | "VALID" | "REJECTED" | "USED";
  createdAt: string;
  jsonData: any;
}

interface PaginatedAdminSubmissions {
  submissions: SubmissionAdminItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function AdminSubmissionsClient() {
  const [data, setData] = useState<PaginatedAdminSubmissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [viewingItem, setViewingItem] = useState<SubmissionAdminItem | null>(null);
  const [creatingQuizId, setCreatingQuizId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        pageSize: "10",
        status: statusFilter,
      });
      if (search.trim()) query.set("search", search.trim());

      const res = await fetch(`/api/admin/quiz-submissions?${query.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      setData(json.data);
      setError(null);
    } catch (err: any) {
      console.error("Failed to load admin quiz submissions:", err);
      setError("Failed to fetch student quiz submissions.");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleCreateQuizDraft = async (submissionId: string) => {
    setCreatingQuizId(submissionId);
    setActionSuccess(null);
    try {
      const res = await fetch(`/api/admin/quiz-submissions/${submissionId}/create-quiz`, {
        method: "POST",
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to create quiz draft");
      }

      setActionSuccess(`Created Quiz Draft "${json.quiz?.title || "Draft"}" with ${json.questionCount} questions!`);
      fetchSubmissions();
    } catch (err: any) {
      alert(err.message || "Failed to create quiz draft");
    } finally {
      setCreatingQuizId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-600" />
            <span>Student Quiz Submissions</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review AI-generated quiz JSON submissions from registered students.
          </p>
        </div>

        <Link
          href="/admin/quizzes/import"
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-sm shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Manual Direct Import</span>
        </Link>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-950 text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by quiz title, student name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="py-2 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="VALID">VALID</option>
            <option value="USED">USED</option>
            <option value="DRAFT">DRAFT</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
            Loading student submissions...
          </div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-rose-500">{error}</div>
        ) : !data || data.submissions.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400 italic">
            No student quiz submissions found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Quiz Title</th>
                  <th className="px-4 py-3">Questions</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Submitted Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.submissions.map((sub) => (
                  <tr key={sub._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{sub.userName || "Student"}</div>
                      <div className="text-[11px] text-slate-500">{sub.userEmail || sub.userId}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 max-w-[200px] truncate" title={sub.quizTitle}>
                      {sub.quizTitle}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-amber-900">
                      {sub.questionCount}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={clsx(
                          "px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase",
                          sub.status === "VALID" && "bg-emerald-100 text-emerald-900 border border-emerald-200",
                          sub.status === "USED" && "bg-blue-100 text-blue-900 border border-blue-200",
                          sub.status === "REJECTED" && "bg-rose-100 text-rose-900 border border-rose-200",
                          sub.status === "DRAFT" && "bg-amber-100 text-amber-900 border border-amber-200"
                        )}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(sub.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => setViewingItem(sub)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="View JSON"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleCreateQuizDraft(sub._id)}
                        disabled={creatingQuizId === sub._id}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] rounded-lg transition-colors disabled:opacity-50"
                      >
                        {creatingQuizId === sub._id ? "Creating..." : "Create Quiz Draft"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {data && data.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing Page <strong>{data.page}</strong> of <strong>{data.totalPages}</strong> ({data.total} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Admin JSON Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div>
                <h3 className="text-sm font-bold">{viewingItem.quizTitle}</h3>
                <p className="text-[11px] text-slate-400">
                  Student: {viewingItem.userName} ({viewingItem.userEmail}) • {viewingItem.questionCount} Questions
                </p>
              </div>
              <button
                onClick={() => setViewingItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-slate-950 flex-1">
              <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap leading-relaxed select-all">
                {JSON.stringify(viewingItem.jsonData, null, 2)}
              </pre>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">Status: <strong className="text-slate-900">{viewingItem.status}</strong></span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewingItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setViewingItem(null);
                    handleCreateQuizDraft(viewingItem._id);
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl"
                >
                  Create Quiz Draft
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
