"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  CheckCircle2,
  AlertTriangle,
  Filter,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Info,
} from "lucide-react";

export default function BciResultTrackerPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [area, setArea] = useState<string>("ALL");
  const [category, setCategory] = useState<string>("ALL");
  const [gender, setGender] = useState<string>("ALL");
  const [marksSource, setMarksSource] = useState<string>("ALL");

  const fetchAnalytics = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const params = new URLSearchParams();
      if (area !== "ALL") params.append("area", area);
      if (category !== "ALL") params.append("category", category);
      if (gender !== "ALL") params.append("gender", gender);
      if (marksSource !== "ALL") params.append("marksSource", marksSource);

      const res = await fetch(`/api/bci-survey/analytics?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.message || "Failed to load analytics");
      }
      setData(json);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load live survey data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [area, category, gender, marksSource]);

  const maxBinCount = data?.histogram
    ? Math.max(...data.histogram.map((b: any) => b.count), 1)
    : 1;

  return (
    <div className="py-8 sm:py-12 bg-[#FAF8F5] min-h-[calc(100vh-80px)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mandatory Header Disclaimer */}
        <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 sm:p-4 text-center">
          <p className="text-xs sm:text-sm font-semibold tracking-wide text-amber-900 uppercase">
            ⚠️ Unofficial Survey | Self-Reported Data | Statistical Estimate | Not RSSB Official Result
          </p>
        </div>

        {/* Hero Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Candidate Analytics & Cut-off Tracker
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              BCI 2026 Live Result Tracker & Cut-off Model
            </h1>
            <p className="mt-1 text-sm sm:text-base text-slate-600">
              Real-time statistical dashboard based on voluntary candidate marks submissions across Rajasthan.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/bci-2026-marks-survey"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-md hover:bg-indigo-700 transition"
            >
              <Sparkles className="w-4 h-4" />
              Submit Your Marks Now
            </Link>
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition shadow-sm"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 mb-8 shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-500 uppercase tracking-wide">
            <Filter className="w-4 h-4 text-indigo-600" />
            Filter Analysis Pool
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Area Region
              </label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Areas (Combined)</option>
                <option value="Non-TSP">Non-TSP</option>
                <option value="TSP">TSP</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Social Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Categories</option>
                <option value="UR">UR / General</option>
                <option value="EWS">EWS</option>
                <option value="OBC">OBC</option>
                <option value="MBC">MBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Candidate Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Marks Source
              </label>
              <select
                value={marksSource}
                onChange={(e) => setMarksSource(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Sources</option>
                <option value="official_provisional_key">Official Provisional Key</option>
                <option value="coaching_key">Coaching Answer Key</option>
                <option value="self_calculated">Self Calculated</option>
              </select>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>{errorMsg}</div>
          </div>
        )}

        {/* Top KPI Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Sample Submissions
              </span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {data?.totalCount ?? 0}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Active candidates in pool
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Pass Qualification Rate
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2">
              {data?.qualificationRate ?? 0}%
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {data?.qualifiedCount ?? 0} paper-qualified
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Average Score
              </span>
              <TrendingUp className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {data?.avgTotal ?? 0}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              P1: {data?.avgPaper1 ?? 0} | P2: {data?.avgPaper2 ?? 0}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Median Score
              </span>
              <Award className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {data?.medianTotal ?? 0}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Range: {data?.lowestTotal ?? 0} – {data?.highestTotal ?? 0}
            </p>
          </div>
        </div>

        {/* Decision Lab Expected Cut-off Estimator Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="bg-slate-900 text-white p-5 sm:p-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h2 className="text-base sm:text-lg font-bold">
                  Decision Lab: Category-wise Expected Cut-off Estimator
                </h2>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Model assumptions: 15% sample coverage fraction (c=0.15) with Non-TSP category × gender normalization.
              </p>
            </div>
            <span className="text-xs bg-slate-800 text-amber-300 px-3 py-1 rounded-full border border-slate-700">
              Statistical Projection
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Region</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Applicable Seats</th>
                  <th className="py-3 px-4">Sample Pool</th>
                  <th className="py-3 px-4">Qualified (N_eff)</th>
                  <th className="py-3 px-4">Estimated 1x Cut-off</th>
                  <th className="py-3 px-4">80% Uncertainty Range</th>
                  <th className="py-3 px-4">Decision Lab Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data?.decisionLabCutoffs && data.decisionLabCutoffs.length > 0 ? (
                  data.decisionLabCutoffs.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-semibold text-slate-900">{row.area}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-bold text-slate-800">
                          {row.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">{row.seats}</td>
                      <td className="py-3 px-4 text-slate-600">{row.sampleSize}</td>
                      <td className="py-3 px-4 text-slate-700">
                        {row.qualifiedSample} ({Math.round(row.effectiveSampleSize)})
                      </td>
                      <td className="py-3 px-4">
                        {row.estimatedCutoff !== null ? (
                          <span className="text-base font-extrabold text-indigo-700">
                            {row.estimatedCutoff}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Withheld (Sample Building)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {row.p10 !== null && row.p90 !== null
                          ? `[${row.p10} – ${row.p90}]`
                          : "Pending 5+ records"}
                      </td>
                      <td className="py-3 px-4">
                        {row.warning ? (
                          <span className="text-[11px] text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200 block max-w-xs">
                            ⚠️ {row.warning}
                          </span>
                        ) : (
                          <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 inline-block font-semibold">
                            ✓ Adequate Support
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No candidate submissions recorded in this filter view yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Score Distribution Histogram */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                Total Marks Distribution Frequency
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Distribution of candidate total marks (Paper-I + Paper-II combined) in sample pool.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {data?.histogram?.map((bin: any, idx: number) => {
              const pct = Math.round((bin.count / maxBinCount) * 100);
              return (
                <div key={idx} className="flex items-center gap-3 text-xs">
                  <span className="w-20 font-semibold text-slate-700 text-right shrink-0">
                    {bin.range}
                  </span>
                  <div className="flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden flex items-center p-0.5">
                    <div
                      className="h-full bg-indigo-600 rounded-md transition-all duration-500 flex items-center justify-end px-2"
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    >
                      {bin.count > 0 && (
                        <span className="text-[10px] text-white font-bold">{bin.count}</span>
                      )}
                    </div>
                  </div>
                  <span className="w-10 text-slate-500 font-medium">{bin.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown & Area Breakdown Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Category-wise Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Category-wise Score Summary
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Count</th>
                    <th className="py-2.5 px-3">Pass %</th>
                    <th className="py-2.5 px-3">Average</th>
                    <th className="py-2.5 px-3">Median</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.categoryBreakdown?.map((cat: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-800">{cat.category}</td>
                      <td className="py-2.5 px-3 text-slate-600">{cat.count}</td>
                      <td className="py-2.5 px-3 font-semibold text-emerald-600">
                        {cat.qualificationRate}%
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 font-medium">{cat.avgScore}</td>
                      <td className="py-2.5 px-3 text-slate-800 font-medium">{cat.medianScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Area Comparison */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                TSP vs Non-TSP Comparison
              </h3>

              <div className="space-y-4">
                {data?.areaBreakdown?.map((areaRow: any, i: number) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold text-slate-900 text-sm">{areaRow.area} Region</h4>
                      <span className="text-xs bg-indigo-100 text-indigo-800 font-semibold px-2.5 py-0.5 rounded-full">
                        {areaRow.count} Candidates
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-2 text-xs text-slate-600">
                      <div>
                        Paper Qualified: <strong className="text-emerald-700">{areaRow.qualifiedCount}</strong>
                      </div>
                      <div>
                        Average Score: <strong className="text-slate-800">{areaRow.avgScore}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-indigo-50 border border-indigo-200">
              <p className="text-xs text-indigo-900 leading-relaxed font-medium">
                Want to know where you stand in your specific category? Submit your marks in 60 seconds to get your candidate percentile and estimated rank range.
              </p>
              <Link
                href="/bci-2026-marks-survey"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900"
              >
                Go to Candidate Survey Form <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="p-4 bg-slate-100 border border-slate-300 rounded-xl text-center text-xs text-slate-600">
          <strong>Mandatory Notice:</strong> All metrics, percentiles, and cut-off projections on this page are generated from independent candidate self-reported submissions for statistical research. This platform is not associated with or endorsed by the Rajasthan Staff Selection Board (RSSB). Official results and cut-offs will be announced exclusively on rssb.rajasthan.gov.in.
        </div>
      </div>
    </div>
  );
}
