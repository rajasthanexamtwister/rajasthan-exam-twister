"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Award,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Share2,
  Printer,
  Copy,
  Check,
  Edit3,
  ArrowLeft,
  Shield,
  HelpCircle,
  Clock,
  Sparkles,
} from "lucide-react";

export default function CandidateReportPage() {
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editToken, setEditToken] = useState<string>("");
  const [editP1, setEditP1] = useState<string>("");
  const [editP2, setEditP2] = useState<string>("");
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  const fetchReport = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bci-survey/report/${id}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to load report");
      }
      setReport(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load candidate report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [id]);

  const copySummaryText = () => {
    if (!report) return;
    const sub = report.submission;
    const stats = report.sampleStats;

    const text = `📊 BCI 2026 Candidate Survey Report
----------------------------------------
📍 Area: ${sub.area} | Category: ${sub.category}
📝 Paper-I: ${sub.paper1Marks} | Paper-II: ${sub.paper2Marks}
🎯 Total Marks: ${sub.totalMarks} / 200
✅ Qualification: ${
      sub.qualificationStatus === "paper_verified_qualified"
        ? "Paper-Verified Qualified"
        : "Not Qualified"
    }
📈 Sample Percentile: ${stats.percentileCategory}% (Category)
🏆 Estimated Sample Rank: #${stats.sampleRankInterval?.midpointRank || "N/A"}
📌 Estimated Category Cut-off: ${stats.estimatedCutoff ?? "Withheld"}
⚡ Cut-off Margin: ${
      stats.cutoffMargin
        ? `${stats.cutoffMargin.margin > 0 ? "+" : ""}${stats.cutoffMargin.margin} (${stats.cutoffMargin.label})`
        : "Pending sample support"
    }

*Unofficial Survey | Statistical Estimate | Not RSSB Official Result*
Check live cut-offs here: https://rajasthanexamtwister.in/bci-2026-result-tracker`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const handleEditSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    if (!editToken.trim()) {
      setEditError("Please enter your secret edit token.");
      return;
    }

    const p1 = parseFloat(editP1);
    const p2 = parseFloat(editP2);
    if (isNaN(p1) || isNaN(p2) || p1 < 0 || p1 > 100 || p2 < 0 || p2 > 100) {
      setEditError("Paper marks must be valid numbers between 0 and 100.");
      return;
    }

    setEditLoading(true);
    try {
      const res = await fetch("/api/bci-survey/edit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: editToken.trim(),
          paper1Marks: p1,
          paper2Marks: p2,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to update marks");
      }
      setShowEditModal(false);
      fetchReport();
    } catch (err: any) {
      setEditError(err.message || "Failed to update submission");
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600 font-medium text-sm">
          Analyzing candidate marks against live statistical pool...
        </p>
      </div>
    );
  }

  if (errorMsg || !report) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Submission Not Found</h2>
        <p className="text-sm text-slate-600 mt-1">{errorMsg || "Invalid submission ID."}</p>
        <Link
          href="/bci-2026-marks-survey"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Marks Survey
        </Link>
      </div>
    );
  }

  const { submission: sub, sampleStats: stats } = report;
  const isQualified = sub.qualificationStatus === "paper_verified_qualified";

  return (
    <div className="py-8 sm:py-12 bg-[#FAF8F5] min-h-[calc(100vh-80px)] print:bg-white print:py-2">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Mandatory Header Disclaimer */}
        <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 sm:p-4 text-center print:border-slate-300">
          <p className="text-xs sm:text-sm font-semibold tracking-wide text-amber-900 uppercase">
            ⚠️ Unofficial Survey | Self-Reported Data | Statistical Estimate | Not RSSB Official Result
          </p>
        </div>

        {/* Top Navigation & Utility Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 print:hidden">
          <Link
            href="/bci-2026-marks-survey"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Submit Another Entry
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={copySummaryText}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition shadow-sm"
            >
              {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedSummary ? "Copied!" : "Copy Summary"}
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>

            <button
              onClick={() => {
                setEditP1(String(sub.paper1Marks));
                setEditP2(String(sub.paper2Marks));
                setShowEditModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Marks
            </button>
          </div>
        </div>

        {/* Report Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Card Header */}
          <div className="bg-slate-900 text-white p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 px-3 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                  Candidate Report #{sub.id.slice(-6).toUpperCase()}
                </span>
                <h1 className="text-xl sm:text-3xl font-extrabold mt-2 text-white">
                  BCI 2026 Marks & Cut-off Analysis
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Candidate: <strong className="text-white">{sub.candidateName || "Anonymous Candidate"}</strong> | District: {sub.district || "Not Specified"}
                </p>
              </div>

              <div className="text-right">
                <span
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold ${
                    isQualified
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                      : "bg-rose-500/20 text-rose-300 border border-rose-400/30"
                  }`}
                >
                  {isQualified ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  {isQualified ? "Paper-Verified Qualified" : "Not Qualified as per Rule"}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Evaluated on configured {sub.category} base criteria
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {/* Scorecard Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 text-center">
                <span className="text-xs font-semibold text-slate-500 uppercase">Total Marks</span>
                <p className="text-2xl sm:text-3xl font-black text-indigo-700 mt-1">
                  {sub.totalMarks}
                </p>
                <span className="text-[11px] text-slate-500">out of 200</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-xs font-semibold text-slate-500 uppercase">Paper-I</span>
                <p className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1">
                  {sub.paper1Marks}
                </p>
                <span className="text-[11px] text-slate-500">out of 100</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-xs font-semibold text-slate-500 uppercase">Paper-II</span>
                <p className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1">
                  {sub.paper2Marks}
                </p>
                <span className="text-[11px] text-slate-500">out of 100</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-xs font-semibold text-slate-500 uppercase">Category & Area</span>
                <p className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">
                  {sub.category}
                </p>
                <span className="text-[11px] text-slate-500">{sub.area} ({sub.gender})</span>
              </div>
            </div>

            {/* Decision Lab Estimated Cut-off Analysis */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-base sm:text-lg">
                    Decision Lab Cut-off Benchmark
                  </h3>
                </div>
                <span className="text-xs bg-white/10 px-2.5 py-1 rounded text-slate-300">
                  {sub.area} • {sub.category} Pool
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-xs text-slate-400 block uppercase font-medium">
                    Estimated 1x Cut-off
                  </span>
                  <p className="text-2xl sm:text-3xl font-extrabold text-amber-300 mt-1">
                    {stats.estimatedCutoff !== null ? `${stats.estimatedCutoff}` : "Sample Building..."}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {stats.cutoffWarning || "Calculated using weighted sample interpolation"}
                  </p>
                </div>

                <div>
                  <span className="text-xs text-slate-400 block uppercase font-medium">
                    Candidate Margin
                  </span>
                  {stats.cutoffMargin ? (
                    <>
                      <p
                        className={`text-2xl sm:text-3xl font-extrabold mt-1 ${
                          stats.cutoffMargin.margin >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {stats.cutoffMargin.margin > 0 ? "+" : ""}
                        {stats.cutoffMargin.margin}
                      </p>
                      <span
                        className={`inline-block mt-0.5 text-xs font-semibold px-2 py-0.5 rounded ${
                          stats.cutoffMargin.status === "safe"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : stats.cutoffMargin.status === "borderline"
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-rose-500/20 text-rose-300"
                        }`}
                      >
                        {stats.cutoffMargin.label}
                      </span>
                    </>
                  ) : (
                    <p className="text-sm text-slate-400 mt-1">Withheld until sample target reached</p>
                  )}
                </div>

                <div>
                  <span className="text-xs text-slate-400 block uppercase font-medium">
                    80% Bootstrap Uncertainty
                  </span>
                  {stats.bootstrapInterval && stats.bootstrapInterval.p10 !== null ? (
                    <>
                      <p className="text-xl sm:text-2xl font-bold text-slate-200 mt-1">
                        [{stats.bootstrapInterval.p10} – {stats.bootstrapInterval.p90}]
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        10th to 90th percentile over 200 resamples
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-400 mt-1">Pending adequate sample size</p>
                  )}
                </div>
              </div>
            </div>

            {/* Percentile and Rank Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-sm font-bold text-slate-900">
                    Candidate Percentile Standing
                  </h4>
                </div>
                <div className="space-y-3 mt-3">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>Category Pool ({sub.category})</span>
                      <span className="text-indigo-600 font-bold">{stats.percentileCategory}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, stats.percentileCategory)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>Overall Area Pool ({sub.area})</span>
                      <span className="text-slate-900 font-bold">{stats.percentileOverall}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-slate-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, stats.percentileOverall)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-amber-600" />
                  <h4 className="text-sm font-bold text-slate-900">
                    Estimated Sample Rank Range
                  </h4>
                </div>
                <div className="mt-3 space-y-2 text-xs sm:text-sm text-slate-700">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Sample Category Rank:</span>
                    <strong className="text-slate-900">
                      #{stats.categoryRankInterval.lowerRank} – #{stats.categoryRankInterval.upperRank} (Mid: #{stats.categoryRankInterval.midpointRank})
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Area Overall Rank:</span>
                    <strong className="text-slate-900">
                      #{stats.sampleRankInterval.lowerRank} – #{stats.sampleRankInterval.upperRank}
                    </strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600">Total Valid Samples:</span>
                    <span className="text-slate-800 font-medium">
                      {stats.categoryPoolCount} in category / {stats.totalSamplePool} total
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Links */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap gap-3 justify-center print:hidden">
              <Link
                href="/bci-2026-result-tracker"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition shadow-sm text-sm"
              >
                <BarChart3 className="w-4 h-4" />
                View Full Rajasthan BCI Live Dashboard
              </Link>

              <Link
                href="/bci-2026-cutoff-analysis"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition text-sm"
              >
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Category-wise Cut-off Comparison
              </Link>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                Edit Candidate Marks
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Enter your secret Edit Token and revised marks as per the latest answer key.
              </p>

              {editError && (
                <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                  {editError}
                </div>
              )}

              <form onSubmit={handleEditSubmission} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Secret Edit Token *
                  </label>
                  <input
                    type="text"
                    required
                    value={editToken}
                    onChange={(e) => setEditToken(e.target.value)}
                    placeholder="Paste the 48-character token"
                    className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2 text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Paper-I Marks *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                      value={editP1}
                      onChange={(e) => setEditP1(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Paper-II Marks *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                      value={editP2}
                      onChange={(e) => setEditP2(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {editLoading ? "Updating..." : "Save Updates"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
