"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Users,
  Search,
  Trash2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Mail,
  Calendar,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import clsx from "clsx";

interface StudentItem {
  _id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  googleId: string;
  createdAt: string;
  attemptCount: number;
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmModalStudent, setConfirmModalStudent] = useState<StudentItem | null>(null);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      params.set("page", String(page));
      params.set("pageSize", "20");

      const res = await fetch(`/api/admin/students?${params.toString()}`, {
        headers: { "x-requested-with": "ret-admin" },
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch students:", err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleDelete = async () => {
    if (!confirmModalStudent) return;
    try {
      setDeletingId(confirmModalStudent._id);
      const res = await fetch(`/api/admin/students/${confirmModalStudent._id}`, {
        method: "DELETE",
        headers: { "x-requested-with": "ret-admin" },
      });

      if (res.ok) {
        setStudents((prev) => prev.filter((s) => s._id !== confirmModalStudent._id));
        setTotal((t) => t - 1);
        setConfirmModalStudent(null);
      } else {
        const data = await res.json();
        alert(data.error?.message || "Failed to delete student");
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
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
              Students
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {total} registered user{total !== 1 ? "s" : ""}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Manage Students</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View all registered students, their quiz attempt history, and remove accounts if needed.
          </p>
        </div>

        <button
          onClick={() => fetchStudents()}
          className="p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors self-start sm:self-center"
          title="Refresh list"
        >
          <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-3" />
            <p className="text-sm text-slate-500 font-medium">Loading students...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="py-20 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No students found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {debouncedSearch
                ? `No students matching "${debouncedSearch}".`
                : "No students have registered yet. Students sign up via Google OAuth on the public site."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-6">Student</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Quizzes Attempted</th>
                  <th className="py-3.5 px-4">Joined</th>
                  <th className="py-3.5 px-4">Auth</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student._id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Avatar + Name */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-200 shrink-0 ring-2 ring-slate-100">
                          {student.avatarUrl ? (
                            <Image
                              src={student.avatarUrl}
                              alt={student.name}
                              width={36}
                              height={36}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-amber-100 text-amber-700 font-black text-sm">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 text-sm block">
                            {student.name}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            id: {student._id.slice(-8)}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-4 px-4">
                      <span className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {student.email}
                      </span>
                    </td>

                    {/* Attempt count */}
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                        {student.attemptCount} attempt{student.attemptCount !== 1 ? "s" : ""}
                      </span>
                    </td>

                    {/* Joined */}
                    <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(student.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </td>

                    {/* Auth provider */}
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        <ShieldCheck className="w-3 h-3" />
                        Google
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <button
                        onClick={() => setConfirmModalStudent(student)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete student account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Page {page} of {totalPages} ({total} students)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Student Account</h3>
                <p className="text-xs text-slate-500">This action cannot be undone</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center font-black text-amber-700 shrink-0">
                {confirmModalStudent.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{confirmModalStudent.name}</p>
                <p className="text-xs text-slate-500">{confirmModalStudent.email}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This will permanently delete this student&apos;s account and all{" "}
              <span className="font-bold text-red-600">
                {confirmModalStudent.attemptCount} quiz attempt{confirmModalStudent.attemptCount !== 1 ? "s" : ""}
              </span>{" "}
              associated with their account.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalStudent(null)}
                disabled={!!deletingId}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!!deletingId}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-60"
              >
                {deletingId && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete Account & Attempts</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
