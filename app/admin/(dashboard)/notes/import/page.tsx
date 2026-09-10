"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  UploadCloud,
  FileCode,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  RotateCcw,
  Trash2,
  Eye,
  Loader2,
  ArrowLeft,
  RefreshCw,
  FileText,
  Layers,
  Sparkles,
  Send,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import clsx from "clsx";

interface ImportResultItem {
  fileName: string;
  result: "SUCCESS" | "DUPLICATE" | "FAILED";
  reason?: string;
  title?: string;
  slug?: string;
  createdNoteId?: string;
}

interface ImportJobItem {
  _id: string;
  status: "RUNNING" | "COMPLETED" | "FAILED";
  totalFiles: number;
  successCount: number;
  duplicateCount: number;
  failedCount: number;
  isDryRun: boolean;
  createdAt: string;
  completedAt?: string;
}

interface ImportLogItem {
  _id: string;
  fileName: string;
  result: "SUCCESS" | "DUPLICATE" | "FAILED";
  reason?: string;
  createdNoteId?: { _id: string; title: string; slug: string; status: string };
  createdAt: string;
}

interface BulkPublishReport {
  published: string[];
  skipped: { id: string; title?: string; reason: string }[];
  totalRequested: number;
  publishedCount: number;
  skippedCount: number;
}

export default function AdminNotesImportPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Selected files state
  const [selectedHtmlFiles, setSelectedHtmlFiles] = useState<File[]>([]);
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [dryRun, setDryRun] = useState(true);

  // Import processing state
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<string>("");
  const [currentSummary, setCurrentSummary] = useState<{
    jobId: string;
    totalFiles: number;
    successCount: number;
    duplicateCount: number;
    failedCount: number;
    isDryRun: boolean;
    results: ImportResultItem[];
  } | null>(null);

  // Past jobs list
  const [jobs, setJobs] = useState<ImportJobItem[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  // Job detail / logs modal
  const [viewingJobId, setViewingJobId] = useState<string | null>(null);
  const [viewingJobLogs, setViewingJobLogs] = useState<ImportLogItem[]>([]);
  const [loadingJobDetail, setLoadingJobDetail] = useState(false);

  // Bulk action inside Job Detail Modal
  const [selectedModalNoteIds, setSelectedModalNoteIds] = useState<Set<string>>(new Set());
  const [bulkModalLoading, setBulkModalLoading] = useState(false);
  const [bulkReport, setBulkReport] = useState<BulkPublishReport | null>(null);
  const [showSkippedDetails, setShowSkippedDetails] = useState(false);

  // Rollback confirmation modal
  const [rollbackJobId, setRollbackJobId] = useState<string | null>(null);
  const [rollingBack, setRollingBack] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      setLoadingJobs(true);
      const res = await fetch("/api/import/jobs?pageSize=20", {
        headers: { "x-requested-with": "ret-admin" },
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error("Failed to load import jobs:", err);
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const htmls: File[] = [];
    const images: File[] = [];

    files.forEach((file) => {
      const lower = file.name.toLowerCase();
      if (lower.endsWith(".html") || lower.endsWith(".htm")) {
        htmls.push(file);
      } else if (
        lower.endsWith(".jpg") ||
        lower.endsWith(".jpeg") ||
        lower.endsWith(".png") ||
        lower.endsWith(".webp")
      ) {
        images.push(file);
      }
    });

    setSelectedHtmlFiles(htmls);
    setSelectedImageFiles(images);
    setCurrentSummary(null);
  };

  const handleRunImport = async (isExecuteNow: boolean = false) => {
    if (selectedHtmlFiles.length === 0) {
      alert("Please select at least one .html file to import.");
      return;
    }

    try {
      setImporting(true);
      const executeDryRun = isExecuteNow ? false : dryRun;

      // Chunk client-side into chunks of 50 files
      const chunkSize = 50;
      const chunks: File[][] = [];
      for (let i = 0; i < selectedHtmlFiles.length; i += chunkSize) {
        chunks.push(selectedHtmlFiles.slice(i, i + chunkSize));
      }

      let combinedResults: ImportResultItem[] = [];
      let totalSuccess = 0;
      let totalDuplicate = 0;
      let totalFailed = 0;
      let lastJobId = "";

      for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
        const chunk = chunks[chunkIdx];
        setImportProgress(
          `Processing batch ${chunkIdx + 1} of ${chunks.length} (${chunk.length} files)...`
        );

        const formData = new FormData();
        chunk.forEach((file) => formData.append("files", file));
        selectedImageFiles.forEach((img) => formData.append("images", img));

        const res = await fetch(`/api/import/html?dryRun=${executeDryRun}`, {
          method: "POST",
          headers: { "x-requested-with": "ret-admin" },
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error?.message || "Import batch failed");
        }

        const data = await res.json();
        lastJobId = data.jobId;
        totalSuccess += data.successCount;
        totalDuplicate += data.duplicateCount;
        totalFailed += data.failedCount;
        combinedResults = [...combinedResults, ...(data.results || [])];
      }

      setCurrentSummary({
        jobId: lastJobId,
        totalFiles: selectedHtmlFiles.length,
        successCount: totalSuccess,
        duplicateCount: totalDuplicate,
        failedCount: totalFailed,
        isDryRun: executeDryRun,
        results: combinedResults,
      });

      await fetchJobs();
    } catch (err: unknown) {
      console.error("Import execution error:", err);
      alert(err instanceof Error ? err.message : "Failed to execute import");
    } finally {
      setImporting(false);
      setImportProgress("");
    }
  };

  const handleOpenJobDetail = async (jobId: string) => {
    try {
      setViewingJobId(jobId);
      setSelectedModalNoteIds(new Set());
      setLoadingJobDetail(true);
      const res = await fetch(`/api/import/jobs/${jobId}`, {
        headers: { "x-requested-with": "ret-admin" },
      });
      if (res.ok) {
        const data = await res.json();
        setViewingJobLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Failed to load job details:", err);
    } finally {
      setLoadingJobDetail(false);
    }
  };

  const toggleModalSelectAll = () => {
    const createdNoteIds = viewingJobLogs
      .filter((l) => l.createdNoteId?._id)
      .map((l) => l.createdNoteId!._id);

    if (selectedModalNoteIds.size === createdNoteIds.length) {
      setSelectedModalNoteIds(new Set());
    } else {
      setSelectedModalNoteIds(new Set(createdNoteIds));
    }
  };

  const toggleModalSelectRow = (id: string) => {
    setSelectedModalNoteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkPublishModalNotes = async () => {
    if (selectedModalNoteIds.size === 0) return;
    try {
      setBulkModalLoading(true);
      const noteIds = Array.from(selectedModalNoteIds);
      const res = await fetch("/api/notes/bulk-publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-requested-with": "ret-admin",
        },
        body: JSON.stringify({ noteIds }),
      });

      const data = await res.json();
      if (res.ok) {
        setBulkReport(data);
        setShowSkippedDetails((data.skippedCount || 0) > 0);
        setSelectedModalNoteIds(new Set());
        if (viewingJobId) {
          await handleOpenJobDetail(viewingJobId);
        }
      } else {
        alert(data.error?.message || "Bulk publish failed");
      }
    } catch (err) {
      console.error("Bulk publish error:", err);
      alert("Network error during bulk publish");
    } finally {
      setBulkModalLoading(false);
    }
  };

  const handleRollback = async (jobId: string) => {
    try {
      setRollingBack(true);
      const res = await fetch(`/api/import/jobs/${jobId}`, {
        method: "DELETE",
        headers: { "x-requested-with": "ret-admin" },
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message || `Rollback completed. Removed ${data.deletedCount} draft note(s).`);
        setRollbackJobId(null);
        await fetchJobs();
      } else {
        alert(data.error?.message || "Failed to rollback job");
      }
    } catch (err) {
      console.error("Rollback error:", err);
      alert("Network error while rolling back job");
    } finally {
      setRollingBack(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/notes"
            className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
            title="Back to notes list"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-800">
                HTML Import Engine
              </span>
              <span className="text-xs text-slate-500 font-medium">Bulk Ingestion</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Import HTML Notes & Diagrams</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Securely parse raw HTML notes, resolve relative/base64 diagrams, sanitize typography, and ingest as drafts
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchJobs()}
          className="p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors self-start sm:self-auto"
          title="Refresh import jobs"
        >
          <RefreshCw className={clsx("w-4 h-4", loadingJobs && "animate-spin")} />
        </button>
      </div>

      {/* Upload Zone Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Select Files to Import</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select one or multiple .html files together with their referenced loose images (.png, .jpg, .webp).
            </p>
          </div>

          {/* Dry Run Toggle Switch */}
          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <label htmlFor="dryRunToggle" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Dry Run (Preview Only)
            </label>
            <input
              id="dryRunToggle"
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Dropzone / Upload Box */}
        <label className="border-2 border-dashed border-slate-300 hover:border-amber-400 bg-slate-50/50 hover:bg-amber-50/20 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all text-center">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".html,.htm,.jpg,.jpeg,.png,.webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          <UploadCloud className="w-10 h-10 text-amber-500 mb-2" />
          <p className="text-sm font-bold text-slate-900">
            {selectedHtmlFiles.length > 0 || selectedImageFiles.length > 0
              ? `${selectedHtmlFiles.length} HTML files & ${selectedImageFiles.length} images selected`
              : "Click to browse or drop HTML and loose image files here"}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Supports .html, .htm, .png, .jpg, .webp (Files are sanitized and never executed)
          </p>
        </label>

        {/* File Selection Stats & Action Buttons */}
        {(selectedHtmlFiles.length > 0 || selectedImageFiles.length > 0) && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <span className="flex items-center gap-1 font-semibold text-slate-800">
                <FileCode className="w-4 h-4 text-blue-600" />
                {selectedHtmlFiles.length} HTML Note(s)
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-semibold text-slate-800">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                {selectedImageFiles.length} Loose Image(s)
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setSelectedHtmlFiles([]);
                  setSelectedImageFiles([]);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Clear Selection
              </button>

              <button
                type="button"
                onClick={() => handleRunImport(false)}
                disabled={importing}
                className={clsx(
                  "flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm",
                  dryRun
                    ? "bg-slate-900 text-white hover:bg-slate-800"
                    : "bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/20"
                )}
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{importProgress || "Processing..."}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{dryRun ? "Run Dry Run Validation" : "Import as Draft Notes"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Immediate Batch Summary Banner & Results Table */}
      {currentSummary && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6 animate-in fade-in zoom-in-95 duration-150">
          <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                <span>{currentSummary.isDryRun ? "Dry Run Report" : "Import Completed"}</span>
              </div>
              <p className="text-base font-bold font-mono">
                {currentSummary.totalFiles} files found, {currentSummary.successCount} valid,{" "}
                {currentSummary.duplicateCount} duplicate, {currentSummary.failedCount} failed
              </p>
              <p className="text-xs text-slate-300">
                {currentSummary.isDryRun
                  ? "This was a dry run. No notes were written to the database."
                  : "All valid notes have been created as DRAFT notes ready for admin review."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {currentSummary.isDryRun && currentSummary.successCount > 0 && (
                <button
                  type="button"
                  onClick={() => handleRunImport(true)}
                  disabled={importing}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-md shadow-amber-500/20 whitespace-nowrap"
                >
                  {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Create Drafts ({currentSummary.successCount} valid)</span>
                </button>
              )}
              {!currentSummary.isDryRun && currentSummary.successCount > 0 && (
                <Link
                  href="/admin/notes?status=DRAFT"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-md whitespace-nowrap"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Review Drafts in Notes CMS</span>
                </Link>
              )}
            </div>
          </div>

          {/* Results Table */}
          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase tracking-wider text-slate-500 text-[10px]">
                <tr>
                  <th className="py-3 px-4">File Name</th>
                  <th className="py-3 px-4">Detected Title</th>
                  <th className="py-3 px-4">Result</th>
                  <th className="py-3 px-4">Details / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentSummary.results.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-800">{item.fileName}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs truncate">
                      {item.title || "—"}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={clsx(
                          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
                          item.result === "SUCCESS" && "bg-emerald-50 text-emerald-800 border-emerald-200",
                          item.result === "DUPLICATE" && "bg-amber-50 text-amber-800 border-amber-200",
                          item.result === "FAILED" && "bg-red-50 text-red-800 border-red-200"
                        )}
                      >
                        {item.result}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {item.reason ? (
                        <span className="text-red-600 font-medium">{item.reason}</span>
                      ) : (
                        <span className="text-emerald-700 font-medium">Created as Draft</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Past Import Jobs History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Import Job History</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review past batches, inspect per-file logs, or rollback untouched draft notes
            </p>
          </div>
        </div>

        {loadingJobs ? (
          <div className="py-12 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500 mb-2" />
            <p className="text-xs text-slate-500">Loading past jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-xs text-slate-400">No import jobs recorded yet.</p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase tracking-wider text-slate-500 text-[10px]">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Total Files</th>
                  <th className="py-3 px-4">Success</th>
                  <th className="py-3 px-4">Duplicate</th>
                  <th className="py-3 px-4">Failed</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((job) => (
                  <tr key={job._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-700">
                      {new Date(job.createdAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={clsx(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          job.isDryRun ? "bg-slate-100 text-slate-700" : "bg-blue-50 text-blue-800"
                        )}
                      >
                        {job.isDryRun ? "Dry Run" : "Full Import"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{job.totalFiles}</td>
                    <td className="py-3.5 px-4 text-emerald-700 font-semibold">{job.successCount}</td>
                    <td className="py-3.5 px-4 text-amber-700 font-semibold">{job.duplicateCount}</td>
                    <td className="py-3.5 px-4 text-red-600 font-semibold">{job.failedCount}</td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenJobDetail(job._id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Logs & Publish</span>
                        </button>

                        {!job.isDryRun && job.successCount > 0 && (
                          <button
                            type="button"
                            onClick={() => setRollbackJobId(job._id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-red-700 hover:bg-red-50 border border-red-200 transition-colors"
                            title="Rollback unedited draft notes"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-red-600" />
                            <span>Rollback</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Job Details & Bulk Action Modal */}
      {viewingJobId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 rounded-t-2xl">
              <div>
                <h3 className="text-base font-bold text-slate-900">Import Job Per-File Logs</h3>
                <p className="text-xs text-slate-500 font-mono">Job ID: {viewingJobId}</p>
              </div>

              <div className="flex items-center gap-2">
                {selectedModalNoteIds.size > 0 && (
                  <button
                    type="button"
                    onClick={handleBulkPublishModalNotes}
                    disabled={bulkModalLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm disabled:opacity-50"
                  >
                    {bulkModalLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>Publish Selected ({selectedModalNoteIds.size})</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setViewingJobId(null)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto">
              {loadingJobDetail ? (
                <div className="py-12 text-center flex flex-col items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500 mb-2" />
                  <p className="text-xs text-slate-500">Loading per-file logs...</p>
                </div>
              ) : viewingJobLogs.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No logs available for this job.</p>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase tracking-wider text-slate-500 text-[10px]">
                      <tr>
                        <th className="py-2.5 pl-4 pr-2 w-8">
                          <input
                            type="checkbox"
                            onChange={toggleModalSelectAll}
                            checked={
                              viewingJobLogs.filter((l) => l.createdNoteId?._id).length > 0 &&
                              selectedModalNoteIds.size ===
                                viewingJobLogs.filter((l) => l.createdNoteId?._id).length
                            }
                            className="w-3.5 h-3.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                            title="Select all notes created by this batch"
                          />
                        </th>
                        <th className="py-2.5 px-3">File Name</th>
                        <th className="py-2.5 px-3">Result</th>
                        <th className="py-2.5 px-3">Reason / Details</th>
                        <th className="py-2.5 px-3">Draft Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewingJobLogs.map((log) => {
                        const noteId = log.createdNoteId?._id;
                        const isSelected = noteId ? selectedModalNoteIds.has(noteId) : false;
                        return (
                          <tr
                            key={log._id}
                            className={clsx(
                              "transition-colors",
                              isSelected ? "bg-amber-50/50" : "hover:bg-slate-50/80"
                            )}
                          >
                            <td className="py-2.5 pl-4 pr-2">
                              {noteId ? (
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleModalSelectRow(noteId)}
                                  className="w-3.5 h-3.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                                />
                              ) : null}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-800">{log.fileName}</td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span
                                className={clsx(
                                  "px-2 py-0.5 rounded text-[10px] font-bold",
                                  log.result === "SUCCESS" && "bg-emerald-50 text-emerald-800",
                                  log.result === "DUPLICATE" && "bg-amber-50 text-amber-800",
                                  log.result === "FAILED" && "bg-red-50 text-red-800"
                                )}
                              >
                                {log.result}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">{log.reason || "—"}</td>
                            <td className="py-2.5 px-3 text-slate-700">
                              {log.createdNoteId ? (
                                <div className="flex items-center gap-2">
                                  <Link
                                    href={`/admin/notes/${log.createdNoteId._id}/edit`}
                                    className="text-amber-600 hover:underline font-semibold truncate max-w-xs"
                                    target="_blank"
                                  >
                                    {log.createdNoteId.title || "View Draft Note"}
                                  </Link>
                                  <span
                                    className={clsx(
                                      "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                                      log.createdNoteId.status === "PUBLISHED"
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-amber-100 text-amber-800"
                                    )}
                                  >
                                    {log.createdNoteId.status}
                                  </span>
                                </div>
                              ) : (
                                "—"
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Publish Result Report Modal */}
      {bulkReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Bulk Publish Summary</h3>
                  <p className="text-xs text-slate-500">Processed {bulkReport.totalRequested} note(s)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBulkReport(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-xs font-semibold text-emerald-800">Published</span>
                <p className="text-2xl font-bold text-emerald-900 mt-0.5">{bulkReport.publishedCount}</p>
              </div>
              <div
                className={clsx(
                  "p-3.5 rounded-xl border",
                  bulkReport.skippedCount > 0 ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200"
                )}
              >
                <span
                  className={clsx(
                    "text-xs font-semibold",
                    bulkReport.skippedCount > 0 ? "text-amber-800" : "text-slate-600"
                  )}
                >
                  Skipped
                </span>
                <p
                  className={clsx(
                    "text-2xl font-bold mt-0.5",
                    bulkReport.skippedCount > 0 ? "text-amber-900" : "text-slate-700"
                  )}
                >
                  {bulkReport.skippedCount}
                </p>
              </div>
            </div>

            {bulkReport.skippedCount > 0 && (
              <div className="space-y-2 border border-amber-200 bg-amber-50/50 rounded-xl p-3.5">
                <button
                  type="button"
                  onClick={() => setShowSkippedDetails(!showSkippedDetails)}
                  className="flex items-center justify-between w-full text-xs font-bold text-amber-900 hover:text-amber-800"
                >
                  <span>{bulkReport.skippedCount} note(s) skipped (validation reasons)</span>
                  {showSkippedDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showSkippedDetails && (
                  <div className="max-h-48 overflow-y-auto space-y-2 pt-2 border-t border-amber-200/60">
                    {bulkReport.skipped.map((item, idx) => (
                      <div
                        key={idx}
                        className="text-xs bg-white p-2.5 rounded-lg border border-amber-200 shadow-2xs space-y-0.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800 truncate max-w-[240px]">
                            {item.title || "Untitled Note"}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">{item.id.slice(-6)}</span>
                        </div>
                        <p className="text-[11px] text-red-600 font-medium">{item.reason}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setBulkReport(null)}
                className="px-4 py-2 text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rollback Confirmation Modal */}
      {rollbackJobId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Rollback Import Job</h3>
                <p className="text-xs text-slate-500">Remove ingested drafts</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <p className="font-bold">Caveat & Safeguard:</p>
              <p>
                Rollback will <strong>ONLY</strong> remove notes created by this batch that are still in{" "}
                <strong>DRAFT</strong> status and have <strong>not been edited</strong> since import. Notes that you have
                published or modified will remain untouched.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRollbackJobId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRollback(rollbackJobId)}
                disabled={rollingBack}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
              >
                {rollingBack && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Rollback</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
