"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileCheck2,
  Filter,
  Flag,
  HelpCircle,
  History,
  Layers,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  User,
  X,
  XCircle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Edit3,
} from "lucide-react";
import clsx from "clsx";
import {
  QUESTION_ISSUE_REASONS,
  QUESTION_REPORT_STATUSES,
  REASON_CONFIG,
} from "@/server/validation/question-report";

interface PopulatedQuiz {
  _id: string;
  title: string;
  slug: string;
  subject?: string;
  difficulty?: string;
}

interface QuestionAuditEntry {
  modifiedBy: string;
  modifiedAt: string;
  changeReason: string;
  evidenceSource?: string;
  previousState: {
    questionText: string;
    options: string[];
    correctOptionIndex: number;
    explanation?: string;
  };
  newState: {
    questionText: string;
    options: string[];
    correctOptionIndex: number;
    explanation?: string;
  };
}

interface PopulatedQuestion {
  _id: string;
  questionText: string;
  questionTextEn?: string;
  options: string[];
  optionsEn?: string[];
  correctOptionIndex: number;
  explanation?: string;
  order: number;
  seoStatus?: string;
  isAnswerVerified?: boolean;
  verifiedOptionIndex?: number;
  verificationSource?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  auditTrail?: QuestionAuditEntry[];
}

export interface QuestionReportItem {
  _id: string;
  quizId: PopulatedQuiz;
  quizSlug: string;
  questionId: PopulatedQuestion;
  studentId?: string | null;
  studentEmail?: string | null;
  studentName?: string | null;
  reason: string;
  reasonLabel: string;
  description?: string;
  status: "PENDING" | "UNDER_REVIEW" | "RESOLVED" | "REJECTED";
  adminNotes?: string;
  assignedTo?: string | null;
  assignedAt?: string | null;
  evidenceSource?: string | null;
  resolutionReason?: string | null;
  studentFeedback?: string | null;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  clientIp?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ReportCounts {
  pending: number;
  underReview: number;
  resolved: number;
  rejected: number;
  total: number;
}

export function QuestionReportsClient() {
  const [reports, setReports] = useState<QuestionReportItem[]>([]);
  const [counts, setCounts] = useState<ReportCounts>({
    pending: 0,
    underReview: 0,
    resolved: 0,
    rejected: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Active Report Drawer / Detail
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<QuestionReportItem | null>(null);
  const [otherReportsForQuestion, setOtherReportsForQuestion] = useState<QuestionReportItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Review Action Form State inside Drawer
  const [actionNotes, setActionNotes] = useState("");
  const [actionAssignee, setActionAssignee] = useState("");
  const [actionStatus, setActionStatus] = useState<string>("");
  const [actionEvidence, setActionEvidence] = useState("");
  const [actionResolutionReason, setActionResolutionReason] = useState("");
  const [actionStudentFeedback, setActionStudentFeedback] = useState("");
  const [savingAction, setSavingAction] = useState(false);
  const [actionFeedbackMsg, setActionFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Safe Correction Modal State
  const [isCorrectModalOpen, setIsCorrectModalOpen] = useState(false);
  const [correctQuestionText, setCorrectQuestionText] = useState("");
  const [correctOptions, setCorrectOptions] = useState<string[]>([]);
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number>(0);
  const [correctExplanation, setCorrectExplanation] = useState("");
  const [correctEvidenceSource, setCorrectEvidenceSource] = useState("");
  const [correctChangeReason, setCorrectChangeReason] = useState("");
  const [correctStudentFeedback, setCorrectStudentFeedback] = useState("");
  const [correctAdminNotes, setCorrectAdminNotes] = useState("");
  const [confirmSafetyAudit, setConfirmSafetyAudit] = useState(false);
  const [savingCorrection, setSavingCorrection] = useState(false);
  const [correctionError, setCorrectionError] = useState<string | null>(null);
  const [correctionSuccessMsg, setCorrectionSuccessMsg] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams({
        page: String(page),
        pageSize: "15",
        status: statusFilter,
      });

      if (categoryFilter !== "ALL") {
        query.set("category", categoryFilter);
      }
      if (searchQuery.trim()) {
        query.set("search", searchQuery.trim());
      }

      const res = await fetch(`/api/admin/question-reports?${query.toString()}`);
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const errData = await res.json();
          if (errData?.error?.message) {
            msg = `${errData.error.message} (${msg})`;
          }
        } catch {}
        throw new Error(`Failed to load reports: ${msg}`);
      }

      const json = await res.json();
      const payload = json.data || json;
      if (res.ok && json.success !== false && (payload.reports !== undefined || Array.isArray(payload.reports))) {
        setReports(payload.reports || []);
        setTotalPages(payload.totalPages || 1);
        setTotalItems(payload.total || 0);
        if (payload.counts) {
          setCounts(payload.counts);
        }
      } else {
        throw new Error(json.error?.message || payload.error?.message || "Failed to load reports");
      }
    } catch (err: any) {
      console.error("Fetch question reports error:", err);
      setError(err.message || "Failed to fetch question reports");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, categoryFilter, searchQuery]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Load Single Report Details
  const handleOpenDetail = async (reportId: string) => {
    setSelectedReportId(reportId);
    setDetailLoading(true);
    setActionFeedbackMsg(null);

    try {
      const res = await fetch(`/api/admin/question-reports/${reportId}`);
      if (!res.ok) throw new Error("Failed to fetch report details");
      const json = await res.json();
      const payload = json.data || json;
      const reportData: QuestionReportItem = payload.report;
      if (!reportData) throw new Error(json.error?.message || "Report details not found");

      setSelectedReport(reportData);
      setOtherReportsForQuestion(payload.otherReports || []);

      // Prepopulate form fields
      setActionNotes(reportData.adminNotes || "");
      setActionAssignee(reportData.assignedTo || "");
      setActionStatus(reportData.status || "PENDING");
      setActionEvidence(reportData.evidenceSource || "");
      setActionResolutionReason(reportData.resolutionReason || "");
      setActionStudentFeedback(reportData.studentFeedback || "");
    } catch (err: any) {
      console.error("Detail fetch error:", err);
      setActionFeedbackMsg({ type: "error", text: err.message || "Could not load report details" });
    } finally {
      setDetailLoading(false);
    }
  };

  // Save Review Status & Notes
  const handleSaveReviewAction = async (targetStatus?: string) => {
    if (!selectedReport) return;
    setSavingAction(true);
    setActionFeedbackMsg(null);

    const newStatus = targetStatus || actionStatus;

    try {
      const res = await fetch(`/api/admin/question-reports/${selectedReport._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          adminNotes: actionNotes,
          assignedTo: actionAssignee.trim() || null,
          evidenceSource: actionEvidence.trim() || null,
          resolutionReason: actionResolutionReason.trim() || null,
          studentFeedback: actionStudentFeedback.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.error?.message || "Failed to update review status");
      }

      const payload = json.data || json;
      setActionFeedbackMsg({ type: "success", text: `Report status updated to ${newStatus}.` });
      if (payload.report) {
        setSelectedReport(payload.report);
      }
      fetchReports();
    } catch (err: any) {
      console.error("Update review action error:", err);
      setActionFeedbackMsg({ type: "error", text: err.message || "Failed to save action" });
    } finally {
      setSavingAction(false);
    }
  };

  // Open Safe Correction Dialog
  const handleOpenCorrectionModal = () => {
    if (!selectedReport?.questionId) return;

    const q = selectedReport.questionId;
    setCorrectQuestionText(q.questionText || "");
    setCorrectOptions([...(q.options || ["", "", "", ""])]);
    setCorrectOptionIndex(typeof q.correctOptionIndex === "number" ? q.correctOptionIndex : 0);
    setCorrectExplanation(q.explanation || "");
    setCorrectEvidenceSource(selectedReport.evidenceSource || "");
    setCorrectChangeReason(
      selectedReport.resolutionReason ||
        `Verified discrepancy reported under '${selectedReport.reasonLabel}'. Corrected option and added authoritative explanation.`
    );
    setCorrectStudentFeedback(
      `Your report was verified by our editorial board. The question and answer key have been corrected based on authoritative syllabus standards. Thank you!`
    );
    setCorrectAdminNotes(actionNotes);
    setConfirmSafetyAudit(false);
    setCorrectionError(null);
    setCorrectionSuccessMsg(null);
    setIsCorrectModalOpen(true);
  };

  // Submit Safe Question Correction
  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    if (!confirmSafetyAudit) {
      setCorrectionError("Please confirm that you have verified the authoritative source.");
      return;
    }

    if (!correctEvidenceSource.trim()) {
      setCorrectionError("Evidence source (e.g. RSSB answer key, Rajasthan Hindi Granth Akademi) is mandatory.");
      return;
    }

    if (!correctChangeReason.trim()) {
      setCorrectionError("Change reason / editorial justification is mandatory.");
      return;
    }

    setSavingCorrection(true);
    setCorrectionError(null);
    setCorrectionSuccessMsg(null);

    try {
      const res = await fetch(`/api/admin/question-reports/${selectedReport._id}/correct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: correctQuestionText.trim(),
          options: correctOptions.map((o) => o.trim()),
          correctOptionIndex,
          explanation: correctExplanation.trim(),
          evidenceSource: correctEvidenceSource.trim(),
          changeReason: correctChangeReason.trim(),
          studentFeedback: correctStudentFeedback.trim(),
          adminNotes: correctAdminNotes.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.error?.message || "Failed to apply question correction");
      }

      const payload = json.data || json;
      setCorrectionSuccessMsg(
        `Question corrected successfully! ${payload.historicalNotice || ""}`
      );

      // Refresh data
      fetchReports();
      handleOpenDetail(selectedReport._id);

      setTimeout(() => {
        setIsCorrectModalOpen(false);
      }, 2500);
    } catch (err: any) {
      console.error("Question correction submission error:", err);
      setCorrectionError(err.message || "Failed to submit correction");
    } finally {
      setSavingCorrection(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-200 mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>Editorial Verification Board</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Question Dispute Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
            Review student-reported question errors, examine answer keys, claim tickets, and execute auditable corrections.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchReports()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-all shadow-xs cursor-pointer"
          >
            <RefreshCw className={clsx("w-3.5 h-3.5", loading && "animate-spin")} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <button
          type="button"
          onClick={() => {
            setStatusFilter("ALL");
            setPage(1);
          }}
          className={clsx(
            "p-4 rounded-2xl border text-left transition-all",
            statusFilter === "ALL"
              ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/20"
              : "bg-white text-slate-800 border-slate-200 hover:border-slate-300 shadow-xs"
          )}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider block opacity-75">
            Total Reports
          </span>
          <span className="text-2xl font-black block mt-1">{counts.total}</span>
          <span className="text-[10px] opacity-70 block mt-0.5">All student submissions</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter("PENDING");
            setPage(1);
          }}
          className={clsx(
            "p-4 rounded-2xl border text-left transition-all",
            statusFilter === "PENDING"
              ? "bg-amber-500 text-slate-950 border-amber-500 shadow-md ring-2 ring-amber-500/20 font-bold"
              : "bg-white text-amber-900 border-amber-200/80 hover:border-amber-300 shadow-xs"
          )}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider block text-amber-950/80">
            Pending
          </span>
          <span className="text-2xl font-black block mt-1">{counts.pending}</span>
          <span className="text-[10px] text-amber-900/80 block mt-0.5">Awaiting triage</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter("UNDER_REVIEW");
            setPage(1);
          }}
          className={clsx(
            "p-4 rounded-2xl border text-left transition-all",
            statusFilter === "UNDER_REVIEW"
              ? "bg-sky-600 text-white border-sky-600 shadow-md ring-2 ring-sky-600/20 font-bold"
              : "bg-white text-sky-900 border-sky-200/80 hover:border-sky-300 shadow-xs"
          )}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider block text-sky-800">
            Under Review
          </span>
          <span className="text-2xl font-black block mt-1">{counts.underReview}</span>
          <span className="text-[10px] text-sky-700 block mt-0.5">Assigned to editor</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter("RESOLVED");
            setPage(1);
          }}
          className={clsx(
            "p-4 rounded-2xl border text-left transition-all",
            statusFilter === "RESOLVED"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-600/20 font-bold"
              : "bg-white text-emerald-900 border-emerald-200/80 hover:border-emerald-300 shadow-xs"
          )}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider block text-emerald-800">
            Resolved
          </span>
          <span className="text-2xl font-black block mt-1">{counts.resolved}</span>
          <span className="text-[10px] text-emerald-700 block mt-0.5">Corrected & verified</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter("REJECTED");
            setPage(1);
          }}
          className={clsx(
            "p-4 rounded-2xl border text-left transition-all col-span-2 lg:col-span-1",
            statusFilter === "REJECTED"
              ? "bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-600/20 font-bold"
              : "bg-white text-rose-900 border-rose-200/80 hover:border-rose-300 shadow-xs"
          )}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider block text-rose-800">
            Rejected
          </span>
          <span className="text-2xl font-black block mt-1">{counts.rejected}</span>
          <span className="text-[10px] text-rose-700 block mt-0.5">Official key upheld</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search reports by student, email, question, or description..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* Status Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by report status"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Statuses ({counts.total})</option>
              <option value="PENDING">Pending Triage ({counts.pending})</option>
              <option value="UNDER_REVIEW">Under Review ({counts.underReview})</option>
              <option value="RESOLVED">Resolved ({counts.resolved})</option>
              <option value="REJECTED">Rejected ({counts.rejected})</option>
            </select>
          </div>

          {/* Category Dropdown */}
          <div className="sm:col-span-4">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by issue category"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Issue Categories</option>
              {QUESTION_ISSUE_REASONS.map((reasonKey) => (
                <option key={reasonKey} value={reasonKey}>
                  {REASON_CONFIG[reasonKey].label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-600" />
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Issue Reports Table
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Showing {reports.length} of {totalItems} total
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
            <p className="text-xs font-semibold text-slate-500">Loading dispute reports...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
            <p className="text-xs text-red-600 font-semibold">{error}</p>
            <button
              type="button"
              onClick={() => fetchReports()}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
            >
              Try Again
            </button>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">No reports found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are no dispute reports matching the current filter criteria.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reports.map((report) => {
              const reasonConfig =
                REASON_CONFIG[report.reason as keyof typeof REASON_CONFIG] || {
                  label: report.reasonLabel || report.reason,
                  hindiLabel: "",
                };

              const isPending = report.status === "PENDING";
              const isUnderReview = report.status === "UNDER_REVIEW";
              const isResolved = report.status === "RESOLVED";
              const isRejected = report.status === "REJECTED";

              const formattedDate = new Date(report.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={report._id}
                  className="p-4 sm:p-6 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Left Column: Status & Question Info */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={clsx(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                          isPending && "bg-amber-50 text-amber-900 border-amber-300",
                          isUnderReview && "bg-sky-50 text-sky-900 border-sky-300",
                          isResolved && "bg-emerald-50 text-emerald-900 border-emerald-300",
                          isRejected && "bg-rose-50 text-rose-900 border-rose-300"
                        )}
                      >
                        {report.status.replace("_", " ")}
                      </span>

                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {reasonConfig.label}
                      </span>

                      {report.quizId && (
                        <span className="text-[11px] font-semibold text-slate-500 truncate max-w-xs">
                          {report.quizId.title}
                        </span>
                      )}

                      <span className="text-[11px] text-slate-400 font-mono">
                        {formattedDate}
                      </span>
                    </div>

                    {/* Question text snippet */}
                    <div className="text-xs text-slate-900 font-bold leading-relaxed line-clamp-2">
                      {report.questionId?.questionText || (
                        <span className="text-slate-400 italic">Question content loaded</span>
                      )}
                    </div>

                    {/* Student remarks / description */}
                    {report.description && (
                      <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 line-clamp-2 italic">
                        &ldquo;{report.description}&rdquo;
                      </div>
                    )}

                    {/* Meta info: Reporter and Assignee */}
                    <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-0.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 font-medium">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {report.studentName || report.studentEmail || "Anonymous Student"}
                      </span>

                      {report.assignedTo && (
                        <span className="inline-flex items-center gap-1 font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md">
                          <ShieldCheck className="w-3 h-3 text-sky-600" />
                          Claimed by: {report.assignedTo}
                        </span>
                      )}

                      {report.resolvedBy && (
                        <span className="inline-flex items-center gap-1 text-slate-400">
                          Resolved by: {report.resolvedBy}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(report._id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 transition-all shadow-xs cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review & Audit</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <span className="text-xs text-slate-500 font-semibold">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* DETAIL & AUDIT DRAWER */}
      {selectedReportId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget && !savingAction) {
              setSelectedReportId(null);
            }
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-extrabold tracking-tight">
                    Audit Ticket #{selectedReportId.slice(-6)}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Verify official keys, record evidence, and claim report
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedReportId(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {detailLoading || !selectedReport ? (
                <div className="p-12 text-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500 mx-auto" />
                  <p className="text-xs text-slate-500">Loading complete audit dossier...</p>
                </div>
              ) : (
                <>
                  {actionFeedbackMsg && (
                    <div
                      className={clsx(
                        "p-3 rounded-2xl text-xs font-semibold flex items-center gap-2",
                        actionFeedbackMsg.type === "success"
                          ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                          : "bg-red-50 text-red-900 border border-red-200"
                      )}
                    >
                      {actionFeedbackMsg.type === "success" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      )}
                      <span>{actionFeedbackMsg.text}</span>
                    </div>
                  )}

                  {/* Student Report Dossier */}
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-amber-950">
                        Student Dispute Details
                      </span>
                      <span className="text-[11px] text-amber-900 font-medium">
                        Reported: {new Date(selectedReport.createdAt).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="font-bold text-slate-500 block">Reported Category:</span>
                        <span className="font-extrabold text-slate-900">
                          {selectedReport.reasonLabel}
                        </span>
                      </div>

                      <div>
                        <span className="font-bold text-slate-500 block">Student Reporter:</span>
                        <span className="font-semibold text-slate-900">
                          {selectedReport.studentName || selectedReport.studentEmail || "Anonymous Student"}
                        </span>
                      </div>
                    </div>

                    {selectedReport.description && (
                      <div className="text-xs text-slate-800 bg-white/90 p-3 rounded-xl border border-amber-200">
                        <span className="font-bold block text-slate-500 text-[10px] uppercase mb-1">
                          Student Observation:
                        </span>
                        &ldquo;{selectedReport.description}&rdquo;
                      </div>
                    )}
                  </div>

                  {/* Question Canonical Content */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-slate-700" />
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Question Content & Correct Option
                        </h4>
                      </div>
                      {selectedReport.quizId?.slug && (
                        <Link
                          href={`/quizzes/${selectedReport.quizId.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:underline"
                        >
                          <span>Open Quiz</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>

                    {/* Question Text */}
                    <div className="text-sm font-bold text-slate-900">
                      {selectedReport.questionId?.questionText}
                    </div>

                    {/* Options list with correct indicator */}
                    <div className="space-y-1.5 pt-1">
                      {selectedReport.questionId?.options?.map((opt, idx) => {
                        const isCorrect =
                          idx === selectedReport.questionId.correctOptionIndex;
                        const optionLetter = String.fromCharCode(65 + idx);

                        return (
                          <div
                            key={idx}
                            className={clsx(
                              "p-2.5 rounded-xl border text-xs flex items-center justify-between",
                              isCorrect
                                ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-bold"
                                : "bg-white border-slate-200 text-slate-700"
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className={clsx(
                                  "w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold",
                                  isCorrect
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-100 text-slate-600"
                                )}
                              >
                                {optionLetter}
                              </span>
                              <span>{opt}</span>
                            </div>

                            {isCorrect && (
                              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold">
                                Current Answer Key
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {selectedReport.questionId?.explanation && (
                      <div className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
                        <span className="font-bold block text-slate-500 text-[10px] uppercase mb-0.5">
                          Current Explanation:
                        </span>
                        {selectedReport.questionId.explanation}
                      </div>
                    )}
                  </div>

                  {/* Other reports for this same question */}
                  {otherReportsForQuestion.length > 0 && (
                    <div className="bg-sky-50/70 border border-sky-200/80 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <History className="w-4 h-4 text-sky-700" />
                        <h4 className="text-xs font-bold text-sky-950 uppercase tracking-wider">
                          Other Reports For This Question ({otherReportsForQuestion.length})
                        </h4>
                      </div>
                      <div className="divide-y divide-sky-100 text-xs">
                        {otherReportsForQuestion.map((other) => (
                          <div key={other._id} className="py-2 flex items-center justify-between gap-2">
                            <div>
                              <span className="font-bold text-sky-900">{other.reasonLabel}</span>
                              {other.description && (
                                <p className="text-[11px] text-sky-800 italic line-clamp-1">
                                  &ldquo;{other.description}&rdquo;
                                </p>
                              )}
                            </div>
                            <span className="text-[10px] text-sky-700 font-mono">
                              {new Date(other.createdAt).toLocaleDateString("en-IN")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Audit Trail if previously edited */}
                  {selectedReport.questionId?.auditTrail &&
                    selectedReport.questionId.auditTrail.length > 0 && (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <History className="w-4 h-4 text-slate-700" />
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Editorial Audit History ({selectedReport.questionId.auditTrail.length})
                          </h4>
                        </div>
                        <div className="divide-y divide-slate-200 text-xs">
                          {selectedReport.questionId.auditTrail.map((entry, idx) => (
                            <div key={idx} className="py-2 space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-slate-800">
                                  Modified by {entry.modifiedBy}
                                </span>
                                <span className="text-slate-400 font-mono">
                                  {new Date(entry.modifiedAt).toLocaleDateString("en-IN")}
                                </span>
                              </div>
                              <p className="text-slate-600 font-medium">
                                Reason: {entry.changeReason}
                              </p>
                              {entry.evidenceSource && (
                                <p className="text-[11px] text-amber-800 font-mono">
                                  Evidence: {entry.evidenceSource}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Administrative Review Controls */}
                  <div className="border-t border-slate-200 pt-4 space-y-4">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Editorial Actions & Internal Log
                    </h4>

                    {/* Assignee / Claim */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 block">
                          Assigned Editor
                        </label>
                        <input
                          type="text"
                          value={actionAssignee}
                          onChange={(e) => setActionAssignee(e.target.value)}
                          placeholder="e.g. editor@rajasthanexamtwister.in"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 block">
                          Change Ticket Status
                        </label>
                        <select
                          value={actionStatus}
                          onChange={(e) => setActionStatus(e.target.value)}
                          aria-label="Change ticket status"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-white"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="UNDER_REVIEW">UNDER REVIEW</option>
                          <option value="RESOLVED">RESOLVED</option>
                          <option value="REJECTED">REJECTED</option>
                        </select>
                      </div>
                    </div>

                    {/* Official Verification Evidence Source */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        Official Evidence Source / Answer Key Reference
                      </label>
                      <input
                        type="text"
                        value={actionEvidence}
                        onChange={(e) => setActionEvidence(e.target.value)}
                        placeholder="e.g. RSSB CET Sr. Secondary Final Answer Key 2024 Q#89 / Hindi Granth Akademi"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                      />
                    </div>

                    {/* Resolution Reason */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        Resolution / Rejection Justification
                      </label>
                      <input
                        type="text"
                        value={actionResolutionReason}
                        onChange={(e) => setActionResolutionReason(e.target.value)}
                        placeholder="e.g. Board master answer key confirms Option B as correct; question formulation is valid."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                      />
                    </div>

                    {/* Internal Notes */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        Internal Admin Notes (Private to Editorial Staff)
                      </label>
                      <textarea
                        rows={2}
                        value={actionNotes}
                        onChange={(e) => setActionNotes(e.target.value)}
                        placeholder="Private notes, internal discussion, cross-checked with team..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 resize-none"
                      />
                    </div>

                    {/* Student Public Feedback */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        Student Feedback Message (Publicly visible to reporter)
                      </label>
                      <input
                        type="text"
                        value={actionStudentFeedback}
                        onChange={(e) => setActionStudentFeedback(e.target.value)}
                        placeholder="e.g. Thank you for reporting! Our editorial team has verified this against the official answer key."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                      />
                    </div>

                    {/* Action Buttons inside Drawer */}
                    <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveReviewAction()}
                          disabled={savingAction}
                          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs"
                        >
                          {savingAction ? "Saving..." : "Save Status & Notes"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSaveReviewAction("UNDER_REVIEW")}
                          disabled={savingAction}
                          className="px-3.5 py-2 rounded-xl bg-sky-50 text-sky-800 border border-sky-300 text-xs font-bold hover:bg-sky-100 transition-colors"
                        >
                          Mark Under Review
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleOpenCorrectionModal}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-sm transition-all cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Accept & Correct Question</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SAFE QUESTION CORRECTION MODAL (WITH BEFORE/AFTER DIFF & SAFETY CONSTRAINTS) */}
      {isCorrectModalOpen && selectedReport && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
        >
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-amber-500 text-slate-950 border-b border-amber-600">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-slate-950" />
                <div>
                  <h3 className="text-sm font-black tracking-tight">
                    Safe Question Correction Workflow
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-900/80">
                    Mandatory audit logging • Preserves attempt integrity • Enforces DRAFT SEO status
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCorrectModalOpen(false)}
                disabled={savingCorrection}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-950 hover:bg-amber-400 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitCorrection} className="flex-1 overflow-y-auto p-6 space-y-6">
              {correctionError && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{correctionError}</span>
                </div>
              )}

              {correctionSuccessMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{correctionSuccessMsg}</span>
                </div>
              )}

              {/* Safety Policy Notice */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-xs text-amber-950 space-y-1">
                <span className="font-extrabold block">Rajasthan Exam Twister Safety Constraints:</span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-900">
                  <li>Disputed/corrected questions strictly remain in <strong>seoStatus: DRAFT</strong>.</li>
                  <li>Historical student attempt records are preserved and never altered silently.</li>
                  <li>An immutable audit entry will be permanently linked to this question and reviewer account.</li>
                </ul>
              </div>

              {/* Side-by-Side / Diff Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* BEFORE (Snapshot) */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Before Modification (Original Stored State)
                  </span>
                  <div className="text-xs font-bold text-slate-800 line-clamp-2">
                    {selectedReport.questionId?.questionText}
                  </div>
                  <div className="space-y-1 pt-1">
                    {selectedReport.questionId?.options?.map((opt, idx) => (
                      <div
                        key={idx}
                        className={clsx(
                          "p-2 rounded-lg text-[11px]",
                          idx === selectedReport.questionId?.correctOptionIndex
                            ? "bg-emerald-100 font-bold text-emerald-900"
                            : "bg-white text-slate-600 border border-slate-200"
                        )}
                      >
                        {String.fromCharCode(65 + idx)}. {opt}
                        {idx === selectedReport.questionId?.correctOptionIndex && (
                          <span className="ml-2 font-mono text-[9px] uppercase font-bold text-emerald-700">
                            (Original Correct)
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  {selectedReport.questionId?.explanation && (
                    <div className="text-[11px] text-slate-500 italic mt-2 line-clamp-2">
                      Exp: {selectedReport.questionId.explanation}
                    </div>
                  )}
                </div>

                {/* AFTER (Live Edit Target) */}
                <div className="bg-amber-50/40 border border-amber-300 rounded-2xl p-4 space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 block">
                    After Modification (Live Target State)
                  </span>

                  {/* Question Text Input */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Question Text (Hindi) <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={correctQuestionText}
                      onChange={(e) => setCorrectQuestionText(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Options with Correct Radio Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Options &amp; Verified Correct Answer <span className="text-red-500">*</span>
                    </label>

                    {correctOptions.map((opt, idx) => {
                      const isSelected = correctOptionIndex === idx;
                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <label className="flex items-center gap-1 shrink-0 cursor-pointer">
                            <input
                              type="radio"
                              name="correct-option-radio"
                              checked={isSelected}
                              onChange={() => setCorrectOptionIndex(idx)}
                              className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                            />
                            <span className="text-xs font-bold text-slate-700 w-4">
                              {String.fromCharCode(65 + idx)}
                            </span>
                          </label>

                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const updated = [...correctOptions];
                              updated[idx] = e.target.value;
                              setCorrectOptions(updated);
                            }}
                            className={clsx(
                              "flex-1 px-3 py-1.5 rounded-lg border text-xs text-slate-900",
                              isSelected
                                ? "border-emerald-500 bg-emerald-50/50 font-bold"
                                : "border-slate-200"
                            )}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Authoritative Explanation (Hindi / English)
                    </label>
                    <textarea
                      rows={2}
                      value={correctExplanation}
                      onChange={(e) => setCorrectExplanation(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Mandatory Audit Proof Fields */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Mandatory Audit Documentation
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Official Source / Citation <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={correctEvidenceSource}
                      onChange={(e) => setCorrectEvidenceSource(e.target.value)}
                      placeholder="e.g. RSSB Official Final Key 2024 / Rajasthan Granth Akademi p. 112"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Editorial Change Reason <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={correctChangeReason}
                      onChange={(e) => setCorrectChangeReason(e.target.value)}
                      placeholder="e.g. Verified answer key discrepancy; corrected option C to D."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Student-Facing Feedback Message
                  </label>
                  <input
                    type="text"
                    value={correctStudentFeedback}
                    onChange={(e) => setCorrectStudentFeedback(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* Explicit Confirmation Checkbox */}
              <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmSafetyAudit}
                  onChange={(e) => setConfirmSafetyAudit(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded-sm mt-0.5 border-amber-300 focus:ring-amber-500"
                />
                <span className="font-bold text-amber-950 leading-relaxed">
                  I confirm that I have verified the official government answer key or authoritative reference book. I authorize saving this correction with an audit trail, keeping SEO status as DRAFT, and resolving the dispute ticket.
                </span>
              </label>

              {/* Modal Footer Actions */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={savingCorrection}
                  onClick={() => setIsCorrectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingCorrection || !confirmSafetyAudit}
                  className={clsx(
                    "inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer",
                    !confirmSafetyAudit || savingCorrection
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-amber-500 hover:bg-amber-400 text-slate-950 hover:shadow-md"
                  )}
                >
                  {savingCorrection ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Applying Audit Correction...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm &amp; Apply Correction</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
