"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import {
  FileText,
  Calendar,
  Sparkles,
  Eye,
  RotateCcw,
  LogIn,
  AlertCircle,
  X,
} from "lucide-react";
import clsx from "clsx";

interface QuizSubmissionItem {
  _id: string;
  quizTitle: string;
  subject?: string;
  questionCount: number;
  status: "DRAFT" | "VALID" | "REJECTED" | "USED";
  createdAt: string;
  jsonData: any;
}

export function StudentSubmissionsClient() {
  const { status: authStatus } = useSession();
  const [submissions, setSubmissions] = useState<QuizSubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingJson, setViewingJson] = useState<QuizSubmissionItem | null>(null);

  const fetchSubmissions = useCallback(async () => {
    if (authStatus !== "authenticated") return;
    setLoading(true);
    try {
      const res = await fetch("/api/quiz-tools/submissions");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setSubmissions(data.data?.submissions || []);
      setError(null);
    } catch (err: any) {
      console.error("Failed to load submissions:", err);
      setError("Failed to load your submissions history.");
    } finally {
      setLoading(false);
    }
  }, [authStatus]);

  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchSubmissions();
    } else if (authStatus === "unauthenticated") {
      setLoading(false);
    }
  }, [authStatus, fetchSubmissions]);

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12 px-3 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-amber-600 transition-colors">
            Home
          </Link>
          <span className="text-slate-300">/</span>
          <Link href="/quiz-tools/create" className="hover:text-amber-600 transition-colors">
            AI Quiz Tool
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-bold">My Submissions</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <FileText className="w-7 h-7 text-amber-600" />
              <span>My Quiz Submissions</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              View your uploaded AI quiz JSON files and reuse them in the creator tool.
            </p>
          </div>

          <Link
            href="/quiz-tools/create"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-sm shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Create New Quiz JSON</span>
          </Link>
        </div>

        {/* Unauthenticated State */}
        {authStatus === "unauthenticated" && (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <LogIn className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Sign in to view your submissions</h2>
              <p className="text-xs text-slate-500 mt-1">
                Access your saved quiz JSON files, status updates, and reuse history.
              </p>
            </div>
            <button
              onClick={() => signIn("google", { callbackUrl: "/quiz-tools/submissions" })}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign in with Google</span>
            </button>
          </div>
        )}

        {/* Authenticated Loading / Error / Empty / Grid States */}
        {authStatus === "authenticated" && (
          <>
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
                Loading your quiz submissions...
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            ) : submissions.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm text-center space-y-4">
                <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">No Quiz Submissions Yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    You haven&apos;t saved any quiz JSON files yet. Use the AI Quiz Tool to convert questions and save them.
                  </p>
                </div>
                <Link
                  href="/quiz-tools/create"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Go to AI Quiz Tool</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((item) => (
                  <div
                    key={item._id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-amber-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={clsx(
                            "px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider",
                            item.status === "VALID" && "bg-emerald-100 text-emerald-900 border border-emerald-200",
                            item.status === "USED" && "bg-blue-100 text-blue-900 border border-blue-200",
                            item.status === "REJECTED" && "bg-rose-100 text-rose-900 border border-rose-200",
                            item.status === "DRAFT" && "bg-amber-100 text-amber-900 border border-amber-200"
                          )}
                        >
                          {item.status}
                        </span>
                        {item.subject && (
                          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {item.subject}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900 truncate" title={item.quizTitle}>
                        {item.quizTitle}
                      </h3>

                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">{item.questionCount} Questions</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(item.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <button
                        onClick={() => setViewingJson(item)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                      >
                        <Eye className="w-4 h-4 text-slate-600" />
                        <span>View JSON</span>
                      </button>

                      <Link
                        href={`/quiz-tools/create?reuseId=${item._id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors shadow-xs"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Reuse</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* View JSON Modal */}
        {viewingJson && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
                <div className="min-w-0 pr-4">
                  <h3 className="text-sm font-bold truncate">{viewingJson.quizTitle}</h3>
                  <p className="text-[11px] text-slate-400">JSON Payload View ({viewingJson.questionCount} Questions)</p>
                </div>
                <button
                  onClick={() => setViewingJson(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto bg-slate-950 flex-1">
                <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap leading-relaxed overflow-x-auto select-all">
                  {JSON.stringify(viewingJson.jsonData, null, 2)}
                </pre>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">Status: <strong className="text-slate-800">{viewingJson.status}</strong></span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewingJson(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl"
                  >
                    Close
                  </button>
                  <Link
                    href={`/quiz-tools/create?reuseId=${viewingJson._id}`}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl"
                  >
                    Reuse in Creator
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
