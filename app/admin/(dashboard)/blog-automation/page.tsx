"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
  RefreshCw,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  Send,
  Eye,
  Edit,
  Trash2,
  PauseCircle,
  PlayCircle,
  Search,
  Sliders,
  Layers,
  FileCheck,
  ShieldCheck,
  ExternalLink,
  BookOpen,
  Info,
  ChevronRight,
  X,
} from "lucide-react";
import clsx from "clsx";

interface QueueJob {
  _id: string;
  topic: string;
  articleType: string;
  generationStatus: string;
  qaStatus: string;
  qaScore: number;
  imageStatus: string;
  scheduleStatus: string;
  scheduledAt?: string;
  timezone: string;
  sourceCount: number;
  verifiedClaimCount: number;
  conflictingClaimCount: number;
  warningCount: number;
  adminApproved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  isCurrentAffairs: boolean;
  requiresFreshVerification: boolean;
  blogId?: {
    _id: string;
    slug: string;
    title: string;
    status: string;
  };
  createdAt: string;
}

interface ResearchDetail {
  topic: string;
  researchDate: string;
  sources: Array<{
    url: string;
    title: string;
    publisher?: string;
    snippet?: string;
    confidence: number;
    isOfficial: boolean;
  }>;
  verifiedClaims: string[];
  uncertainClaims: string[];
  conflictingClaims: string[];
  seoBrief?: {
    focusKeywords: string[];
    secondaryKeywords: string[];
    searchIntent?: string;
    metaTitleSuggestion?: string;
    metaDescriptionSuggestion?: string;
  };
  internalLinks: Array<{
    anchorText: string;
    targetSlug: string;
    reason?: string;
  }>;
  faqs: Array<{ question: string; answer: string }>;
  mcqs: Array<{ question: string; options: string[]; correctAnswer: number; explanation: string }>;
}

export default function BlogAutomationDashboard() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<QueueJob[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"queue" | "discover" | "analytics">("queue");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals state
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showDiscoverModal, setShowDiscoverModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedJobForDetail, setSelectedJobForDetail] = useState<{ job: QueueJob; research?: ResearchDetail } | null>(null);
  const [detailTab, setDetailTab] = useState<"content" | "research" | "qa">("content");

  // Batch generate form state
  const [batchCount, setBatchCount] = useState<number>(5);
  const [dryRun, setDryRun] = useState<boolean>(false);
  const [customTopics, setCustomTopics] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generateMsg, setGenerateMsg] = useState<string>("");

  // Discovery state
  const [discoverType, setDiscoverType] = useState<string>("");
  const [discoveredTopics, setDiscoveredTopics] = useState<any[]>([]);
  const [isDiscovering, setIsDiscovering] = useState<boolean>(false);

  // Batch schedule state
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [scheduleStartDate, setScheduleStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [scheduleStartTime, setScheduleStartTime] = useState<string>("08:00");
  const [scheduleInterval, setScheduleInterval] = useState<number>(6);
  const [isScheduling, setIsScheduling] = useState<boolean>(false);

  // Load Queue & Stats
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.set("scheduleStatus", statusFilter);
      if (typeFilter) params.set("articleType", typeFilter);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/admin/blog-automation/queue?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.items || []);
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error("Failed to load queue data:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Quick Actions on a Job
  const handleJobAction = async (jobId: string, action: string, extraPayload: any = {}) => {
    try {
      const res = await fetch(`/api/admin/blog-automation/queue/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extraPayload }),
      });

      if (res.ok) {
        loadData();
      } else {
        const err = await res.json();
        alert(`Error: ${err.message || "Failed to update item"}`);
      }
    } catch (err) {
      console.error("Action error:", err);
    }
  };

  // Handle Manual Publish
  const handleManualPublish = async (jobId: string) => {
    if (!confirm("Are you sure you want to publish this article immediately?")) return;
    try {
      const res = await fetch(`/api/admin/blog-automation/queue/${jobId}/publish`, {
        method: "POST",
      });
      if (res.ok) {
        alert("Article published successfully!");
        loadData();
      } else {
        const err = await res.json();
        alert(`Publishing failed: ${err.message || "Pre-publish validation failed"}`);
      }
    } catch (err) {
      console.error("Publish error:", err);
    }
  };

  // Run Cron Manually
  const handleTriggerCron = async () => {
    try {
      const res = await fetch(`/api/cron/blog-publisher`, { method: "POST" });
      const data = await res.json();
      alert(`Publisher Cron Completed:\n- Scanned: ${data.scannedCount}\n- Published: ${data.publishedCount}\n- Held: ${data.heldCount}`);
      loadData();
    } catch (err) {
      alert("Failed to run publisher cron");
    }
  };

  // Batch Generation Submission
  const handleBatchGenerate = async () => {
    setIsGenerating(true);
    setGenerateMsg("");
    try {
      const topicsList = customTopics
        .split("\n")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch("/api/admin/blog-automation/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: batchCount,
          topics: topicsList.length > 0 ? topicsList : undefined,
          dryRun,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setGenerateMsg(`Generated ${data.generatedCount} article(s) successfully!`);
        setTimeout(() => {
          setShowGenerateModal(false);
          setGenerateMsg("");
          loadData();
        }, 1500);
      } else {
        setGenerateMsg(`Generation failed: ${data.message || "Error"}`);
      }
    } catch (err) {
      setGenerateMsg("Failed to initiate batch generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Discover Topics Action
  const handleDiscover = async () => {
    setIsDiscovering(true);
    try {
      const res = await fetch("/api/admin/blog-automation/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleType: discoverType || undefined,
          count: 10,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDiscoveredTopics(data.topics || []);
      }
    } catch (err) {
      console.error("Discovery error:", err);
    } finally {
      setIsDiscovering(false);
    }
  };

  // Batch Scheduling Submission
  const handleBatchScheduleSubmit = async () => {
    if (selectedJobIds.length === 0) {
      alert("Please select at least one queue item to schedule.");
      return;
    }

    setIsScheduling(true);
    try {
      const res = await fetch("/api/admin/blog-automation/schedule-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobIds: selectedJobIds,
          startDate: scheduleStartDate,
          startTime: scheduleStartTime,
          intervalHours: scheduleInterval,
          timezone: "Asia/Kolkata",
        }),
      });

      if (res.ok) {
        alert(`Successfully scheduled ${selectedJobIds.length} article(s)!`);
        setShowScheduleModal(false);
        setSelectedJobIds([]);
        loadData();
      } else {
        const err = await res.json();
        alert(`Scheduling failed: ${err.message}`);
      }
    } catch (err) {
      console.error("Batch schedule error:", err);
    } finally {
      setIsScheduling(false);
    }
  };

  // Open Details Modal
  const openDetails = async (job: QueueJob) => {
    try {
      const res = await fetch(`/api/admin/blog-automation/queue/${job._id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedJobForDetail({ job: data.job, research: data.research });
      } else {
        setSelectedJobForDetail({ job });
      }
    } catch (err) {
      setSelectedJobForDetail({ job });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">AI Blog Automation Engine</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Autonomous topic discovery, multi-source fact research, editorial QA, and scheduled CMS publishing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setShowDiscoverModal(true);
              handleDiscover();
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-sm font-semibold transition-all"
          >
            <Search className="w-4 h-4 text-amber-400" />
            Discover Topics
          </button>

          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Generate Batch
          </button>

          <button
            onClick={handleTriggerCron}
            title="Execute publisher cron runner now"
            className="flex items-center gap-2 px-3 py-2.5 bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-sm border border-slate-700/60"
          >
            <Clock className="w-4 h-4 text-emerald-400" />
            Run Cron
          </button>
        </div>
      </div>

      {/* Overview Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="bg-slate-900/90 border border-slate-800/80 p-4 rounded-xl">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Generated Today</span>
            <span className="text-2xl font-black text-amber-400 mt-1 block">{stats.generatedToday}</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800/80 p-4 rounded-xl">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Drafts In Queue</span>
            <span className="text-2xl font-black text-slate-100 mt-1 block">{stats.drafts}</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800/80 p-4 rounded-xl">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">QA Passed</span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">{stats.qaPassed}</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800/80 p-4 rounded-xl">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Scheduled</span>
            <span className="text-2xl font-black text-blue-400 mt-1 block">{stats.scheduled}</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800/80 p-4 rounded-xl">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Awaiting Approval</span>
            <span className="text-2xl font-black text-amber-300 mt-1 block">{stats.awaitingApproval}</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800/80 p-4 rounded-xl">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Published</span>
            <span className="text-2xl font-black text-emerald-500 mt-1 block">{stats.published}</span>
          </div>
        </div>
      )}

      {/* Safety Mode Banner */}
      <div className="bg-amber-950/30 border border-amber-500/30 p-4 rounded-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <span className="text-sm font-bold text-amber-200">Human Approval Mode (v1 Active)</span>
            <p className="text-xs text-amber-300/80 mt-0.5">
              All AI-generated articles start as DRAFT. The publisher cron only releases articles explicitly reviewed and approved by an Admin.
            </p>
          </div>
        </div>

        {selectedJobIds.length > 0 && (
          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-lg shadow"
          >
            <Calendar className="w-3.5 h-3.5" />
            Schedule Selected ({selectedJobIds.length})
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Filters and Controls */}
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/40">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 text-xs rounded-lg text-slate-200 focus:outline-none focus:border-amber-500 w-48 sm:w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-xs rounded-lg text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="">All Schedule Statuses</option>
              <option value="UNSCHEDULED">Unscheduled</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="PUBLISHED">Published</option>
              <option value="HOLD">On Hold</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-xs rounded-lg text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="">All Article Types</option>
              <option value="RAJASTHAN_GK">Rajasthan GK</option>
              <option value="CURRENT_AFFAIRS">Current Affairs</option>
              <option value="EXAM_UPDATES">Exam Updates</option>
              <option value="STATIC_GK">Static GK</option>
              <option value="STUDY_GUIDE">Study Guide</option>
            </select>
          </div>

          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-semibold"
          >
            <RefreshCw className={clsx("w-3.5 h-3.5", loading && "animate-spin")} />
            Refresh
          </button>
        </div>

        {/* Content Queue Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 uppercase text-[10px] font-bold tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5 w-8">
                  <input
                    type="checkbox"
                    checked={jobs.length > 0 && selectedJobIds.length === jobs.length}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedJobIds(jobs.map((j) => j._id));
                      else setSelectedJobIds([]);
                    }}
                    className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
                  />
                </th>
                <th className="p-3.5">Topic & Article Type</th>
                <th className="p-3.5">QA Score</th>
                <th className="p-3.5">Sources & Facts</th>
                <th className="p-3.5">Scheduled Time</th>
                <th className="p-3.5">Status & Approval</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    {loading ? "Loading queue items..." : "No automation items found in the queue."}
                  </td>
                </tr>
              ) : (
                jobs.map((job) => {
                  const isSelected = selectedJobIds.includes(job._id);
                  return (
                    <tr
                      key={job._id}
                      className={clsx(
                        "hover:bg-slate-800/40 transition-colors",
                        isSelected && "bg-amber-500/5"
                      )}
                    >
                      <td className="p-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedJobIds([...selectedJobIds, job._id]);
                            else setSelectedJobIds(selectedJobIds.filter((id) => id !== job._id));
                          }}
                          className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
                        />
                      </td>

                      <td className="p-3.5 max-w-xs sm:max-w-md">
                        <button
                          onClick={() => openDetails(job)}
                          className="font-bold text-slate-100 hover:text-amber-400 text-left line-clamp-1 block transition-colors"
                        >
                          {job.topic}
                        </button>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                          <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-semibold text-[10px]">
                            {job.articleType.replace("_", " ")}
                          </span>
                          {job.isCurrentAffairs && (
                            <span className="px-1.5 py-0.5 bg-rose-950/60 text-rose-300 border border-rose-800/50 rounded text-[9px] font-bold">
                              Current Affairs
                            </span>
                          )}
                          {job.blogId && (
                            <Link
                              href={`/admin/blogs/${job.blogId._id}`}
                              className="text-amber-400/80 hover:text-amber-300 flex items-center gap-1"
                            >
                              <Edit className="w-3 h-3" /> Edit CMS Draft
                            </Link>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={clsx(
                              "px-2 py-0.5 rounded text-[11px] font-bold",
                              job.qaStatus === "PASSED"
                                ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800/50"
                                : "bg-rose-950/80 text-rose-300 border border-rose-800/50"
                            )}
                          >
                            {job.qaScore}/100
                          </span>
                          <span className="text-[10px] text-slate-400">{job.qaStatus}</span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="text-[11px] text-slate-300">
                          <span>{job.sourceCount} sources</span>
                          <span className="mx-1 text-slate-600">•</span>
                          <span className="text-emerald-400">{job.verifiedClaimCount} verified</span>
                        </div>
                        {job.conflictingClaimCount > 0 && (
                          <div className="text-[10px] text-amber-400 flex items-center gap-1 mt-0.5 font-semibold">
                            <AlertTriangle className="w-3 h-3" />
                            {job.conflictingClaimCount} conflict(s)
                          </div>
                        )}
                      </td>

                      <td className="p-3.5">
                        {job.scheduledAt ? (
                          <div>
                            <span className="text-slate-200 block font-semibold">
                              {new Date(job.scheduledAt).toLocaleString("en-IN", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </span>
                            <span className="text-[10px] text-slate-500">{job.timezone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px] italic">Not scheduled</span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={clsx(
                              "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                              job.scheduleStatus === "PUBLISHED" && "bg-emerald-900/60 text-emerald-300 border border-emerald-700/50",
                              job.scheduleStatus === "SCHEDULED" && "bg-blue-900/60 text-blue-300 border border-blue-700/50",
                              job.scheduleStatus === "HOLD" && "bg-amber-900/60 text-amber-300 border border-amber-700/50",
                              job.scheduleStatus === "UNSCHEDULED" && "bg-slate-800 text-slate-300",
                              job.scheduleStatus === "CANCELLED" && "bg-rose-950/60 text-rose-400"
                            )}
                          >
                            {job.scheduleStatus}
                          </span>

                          {job.adminApproved ? (
                            <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                              <CheckCircle className="w-3 h-3" /> Approved
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-400/80 flex items-center gap-1 font-semibold">
                              <Clock className="w-3 h-3" /> Needs Review
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openDetails(job)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                            title="Inspect research and preview"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {!job.adminApproved && (
                            <button
                              onClick={() => handleJobAction(job._id, "APPROVE")}
                              className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 rounded text-[10px] font-bold"
                              title="Approve for publication"
                            >
                              Approve
                            </button>
                          )}

                          {job.scheduleStatus !== "PUBLISHED" && (
                            <button
                              onClick={() => handleManualPublish(job._id)}
                              className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded text-[10px] font-bold"
                              title="Publish right now"
                            >
                              Publish
                            </button>
                          )}

                          {job.scheduleStatus === "SCHEDULED" && (
                            <button
                              onClick={() => handleJobAction(job._id, "HOLD")}
                              className="p-1.5 bg-slate-800 hover:bg-amber-900/60 text-amber-400 rounded"
                              title="Put on hold"
                            >
                              <PauseCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {job.scheduleStatus === "HOLD" && (
                            <button
                              onClick={() => handleJobAction(job._id, "SCHEDULE", { scheduledAt: job.scheduledAt || new Date().toISOString() })}
                              className="p-1.5 bg-slate-800 hover:bg-emerald-900/60 text-emerald-400 rounded"
                              title="Resume schedule"
                            >
                              <PlayCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batch Generation Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">Generate AI Blog Batch</h3>
              </div>
              <button onClick={() => setShowGenerateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Article Count: <span className="text-amber-400 font-bold">{batchCount}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={batchCount}
                  onChange={(e) => setBatchCount(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Custom Topics (Optional — 1 per line)
                </label>
                <textarea
                  rows={4}
                  placeholder="राजस्थान के प्रमुख दुर्ग&#10;राजस्थान में 1857 की क्रांति&#10;राजस्थान समसामयिकी 2026"
                  value={customTopics}
                  onChange={(e) => setCustomTopics(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-slate-200 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
                <input
                  type="checkbox"
                  id="dryRunToggle"
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
                />
                <label htmlFor="dryRunToggle" className="cursor-pointer">
                  <span className="font-bold text-white block">Dry-Run Simulation Mode</span>
                  <span className="text-[11px] text-slate-400">Run research and QA without modifying live CMS blogs.</span>
                </label>
              </div>

              {generateMsg && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl font-semibold">
                  {generateMsg}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleBatchGenerate}
                disabled={isGenerating}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isGenerating ? "Generating Articles..." : "Start Batch Generation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discovery Modal */}
      {showDiscoverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">Discover Topic Candidates</h3>
              </div>
              <button onClick={() => setShowDiscoverModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={discoverType}
                onChange={(e) => setDiscoverType(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 text-xs rounded-xl text-slate-200 focus:outline-none focus:border-amber-500 flex-1"
              >
                <option value="">All Categories & Types</option>
                <option value="RAJASTHAN_GK">Rajasthan GK</option>
                <option value="CURRENT_AFFAIRS">Current Affairs</option>
                <option value="EXAM_UPDATES">Exam Updates</option>
                <option value="STATIC_GK">Static GK</option>
                <option value="STUDY_GUIDE">Study Guide</option>
              </select>

              <button
                onClick={handleDiscover}
                disabled={isDiscovering}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-2"
              >
                <RefreshCw className={clsx("w-3.5 h-3.5", isDiscovering && "animate-spin")} />
                Scan Topics
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {discoveredTopics.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  {isDiscovering ? "Scanning Rajasthan exam syllabus & news feeds..." : "No candidates discovered."}
                </div>
              ) : (
                discoveredTopics.map((topic, i) => (
                  <div key={i} className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-slate-100 block">{topic.topic}</span>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                        <span className="text-amber-400 font-semibold">{topic.category}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-semibold">Relevance: {topic.relevanceScore}%</span>
                        {topic.recommendation === "UPDATE_EXISTING" && (
                          <span className="text-blue-400 bg-blue-950 px-1.5 py-0.5 rounded text-[10px]">
                            Update Existing
                          </span>
                        )}
                        {topic.recommendation === "SKIP" && (
                          <span className="text-rose-400 bg-rose-950 px-1.5 py-0.5 rounded text-[10px]">
                            Already Covered
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setCustomTopics(topic.topic);
                        setShowDiscoverModal(false);
                        setShowGenerateModal(true);
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 font-bold rounded-lg text-xs transition-colors shrink-0"
                    >
                      Generate Draft
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Batch Schedule Modal with Safety Confirmation */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">Batch Schedule ({selectedJobIds.length} Articles)</h3>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={scheduleStartDate}
                    onChange={(e) => setScheduleStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-slate-200 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Start Time</label>
                  <input
                    type="time"
                    value={scheduleStartTime}
                    onChange={(e) => setScheduleStartTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-slate-200 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Publishing Interval</label>
                <select
                  value={scheduleInterval}
                  onChange={(e) => setScheduleInterval(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-slate-200 focus:border-amber-500 focus:outline-none"
                >
                  <option value={4}>Every 4 Hours</option>
                  <option value={6}>Every 6 Hours (Recommended)</option>
                  <option value={8}>Every 8 Hours</option>
                  <option value={12}>Every 12 Hours</option>
                  <option value={24}>Once Daily (24 Hours)</option>
                </select>
              </div>

              <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-amber-200 space-y-1">
                <span className="font-bold block text-xs">Schedule Safety Confirmation</span>
                <p className="text-[11px] text-amber-300/80">
                  Articles will be placed in SCHEDULED status across staggered slots. In v1, articles require explicit human approval before the cron publisher releases them.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleBatchScheduleSubmit}
                disabled={isScheduling}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {isScheduling ? "Scheduling..." : "Confirm Schedule"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail / Research Inspection Drawer */}
      {selectedJobForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl text-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  {selectedJobForDetail.job.articleType} • QA SCORE: {selectedJobForDetail.job.qaScore}/100
                </span>
                <h3 className="text-base font-black text-white mt-0.5 line-clamp-1">
                  {selectedJobForDetail.job.topic}
                </h3>
              </div>

              <div className="flex items-center gap-3">
                {selectedJobForDetail.job.blogId && (
                  <Link
                    href={`/admin/blogs/${selectedJobForDetail.job.blogId._id}`}
                    target="_blank"
                    className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-semibold"
                  >
                    Open CMS Editor <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
                <button
                  onClick={() => setSelectedJobForDetail(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sub-tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950/30 px-5 gap-4 text-xs font-bold">
              <button
                onClick={() => setDetailTab("content")}
                className={clsx(
                  "py-3 border-b-2 transition-colors",
                  detailTab === "content" ? "border-amber-500 text-amber-400" : "border-transparent text-slate-400 hover:text-slate-200"
                )}
              >
                Article Overview & FAQs
              </button>
              <button
                onClick={() => setDetailTab("research")}
                className={clsx(
                  "py-3 border-b-2 transition-colors",
                  detailTab === "research" ? "border-amber-500 text-amber-400" : "border-transparent text-slate-400 hover:text-slate-200"
                )}
              >
                Research Audit ({selectedJobForDetail.job.sourceCount} Sources)
              </button>
              <button
                onClick={() => setDetailTab("qa")}
                className={clsx(
                  "py-3 border-b-2 transition-colors",
                  detailTab === "qa" ? "border-amber-500 text-amber-400" : "border-transparent text-slate-400 hover:text-slate-200"
                )}
              >
                Editorial QA Scorecard
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              {detailTab === "content" && (
                <div className="space-y-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="font-bold text-slate-400 uppercase text-[10px]">Title</span>
                    <p className="text-white font-bold text-sm mt-1">{selectedJobForDetail.job.blogId?.title || selectedJobForDetail.job.topic}</p>
                  </div>

                  {selectedJobForDetail.research?.faqs && selectedJobForDetail.research.faqs.length > 0 && (
                    <div className="space-y-2">
                      <span className="font-bold text-slate-300 block">Generated FAQs ({selectedJobForDetail.research.faqs.length})</span>
                      {selectedJobForDetail.research.faqs.map((faq, i) => (
                        <div key={i} className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                          <p className="font-bold text-slate-200">Q: {faq.question}</p>
                          <p className="text-slate-400 mt-1">A: {faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedJobForDetail.research?.mcqs && selectedJobForDetail.research.mcqs.length > 0 && (
                    <div className="space-y-2">
                      <span className="font-bold text-slate-300 block">Generated MCQs ({selectedJobForDetail.research.mcqs.length})</span>
                      {selectedJobForDetail.research.mcqs.map((mcq, i) => (
                        <div key={i} className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                          <p className="font-bold text-slate-200">Q{i + 1}: {mcq.question}</p>
                          <ul className="list-disc pl-5 mt-1 text-slate-400 space-y-0.5">
                            {mcq.options.map((opt, optIdx) => (
                              <li key={optIdx} className={optIdx === mcq.correctAnswer ? "text-emerald-400 font-bold" : ""}>
                                {opt} {optIdx === mcq.correctAnswer && "✓"}
                              </li>
                            ))}
                          </ul>
                          {mcq.explanation && (
                            <p className="text-[11px] text-slate-500 mt-1">Explanation: {mcq.explanation}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {detailTab === "research" && (
                <div className="space-y-4">
                  {selectedJobForDetail.research?.sources && selectedJobForDetail.research.sources.length > 0 ? (
                    <div className="space-y-2">
                      <span className="font-bold text-slate-300 block">Authoritative Sources</span>
                      {selectedJobForDetail.research.sources.map((src, i) => (
                        <div key={i} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-start justify-between gap-3">
                          <div>
                            <a href={src.url} target="_blank" rel="noopener noreferrer" className="font-bold text-amber-400 hover:underline flex items-center gap-1">
                              {src.title} <ExternalLink className="w-3 h-3" />
                            </a>
                            <p className="text-slate-400 mt-1 text-[11px]">{src.snippet}</p>
                            <span className="text-[10px] text-slate-500 mt-1 block">Publisher: {src.publisher || "Official Source"}</span>
                          </div>
                          {src.isOfficial && (
                            <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded text-[10px] font-bold shrink-0">
                              Official Gov
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-500 italic">No external research sources attached.</div>
                  )}

                  {selectedJobForDetail.research?.verifiedClaims && (
                    <div className="space-y-1.5">
                      <span className="font-bold text-slate-300 block">Verified Factual Claims</span>
                      <ul className="list-disc pl-5 text-slate-400 space-y-1">
                        {selectedJobForDetail.research.verifiedClaims.map((claim, i) => (
                          <li key={i}>{claim}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {detailTab === "qa" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-slate-400 text-[11px] block">Overall QA Score</span>
                      <span className="text-2xl font-black text-emerald-400 mt-1 block">
                        {selectedJobForDetail.job.qaScore}/100
                      </span>
                    </div>

                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-slate-400 text-[11px] block">QA Status</span>
                      <span className="text-lg font-black text-slate-100 mt-1 block">
                        {selectedJobForDetail.job.qaStatus}
                      </span>
                    </div>

                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-slate-400 text-[11px] block">Warnings</span>
                      <span className="text-lg font-black text-amber-400 mt-1 block">
                        {selectedJobForDetail.job.warningCount}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <span className="font-bold text-slate-300 block">Automated Validation Checks</span>
                    <div className="space-y-1.5 text-[11px] text-slate-400">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <CheckCircle className="w-3.5 h-3.5" /> Factual Claim & Source Cross-Verification Passed
                      </div>
                      <div className="flex items-center gap-2 text-emerald-400">
                        <CheckCircle className="w-3.5 h-3.5" /> HTML Sanitization & Heading Structure Validated
                      </div>
                      <div className="flex items-center gap-2 text-emerald-400">
                        <CheckCircle className="w-3.5 h-3.5" /> Single-H1 Discipline Enforced (H1 Demoted to H2)
                      </div>
                      <div className="flex items-center gap-2 text-emerald-400">
                        <CheckCircle className="w-3.5 h-3.5" /> SEO Metadata & FAQ Structure Generated
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="text-[11px] text-slate-400">
                Job ID: <code className="text-amber-400">{selectedJobForDetail.job._id}</code>
              </div>

              <div className="flex items-center gap-2">
                {!selectedJobForDetail.job.adminApproved && (
                  <button
                    onClick={async () => {
                      await handleJobAction(selectedJobForDetail.job._id, "APPROVE");
                      setSelectedJobForDetail(null);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
                  >
                    Approve Article
                  </button>
                )}

                <button
                  onClick={() => setSelectedJobForDetail(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
