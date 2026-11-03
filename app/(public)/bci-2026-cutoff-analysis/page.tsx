import { Metadata } from "next";
import Link from "next/link";
import {
  TrendingUp,
  BarChart3,
  Award,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  Sparkles,
} from "lucide-react";

export const metadata: Metadata = {
  title: "BCI 2026 Expected Cut-off Analysis | Basic Computer Instructor Marks Survey",
  description:
    "Comprehensive expected cut-off analysis for Rajasthan BCI (Basic Computer Instructor) 2026 exam. Category-wise TSP and Non-TSP cut-off estimates, minimum qualifying rules, and live statistical distribution.",
  keywords: [
    "BCI 2026 expected cut off",
    "Basic Computer Instructor cut off 2026",
    "RSSB Computer Instructor cut off marks",
    "BCI TSP Non-TSP cut off",
    "BCI 2026 marks survey",
  ],
};

export default function BciCutoffAnalysisPage() {
  return (
    <div className="py-8 sm:py-12 bg-[#FAF8F5] min-h-[calc(100vh-80px)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Mandatory Header Disclaimer */}
        <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 sm:p-4 text-center">
          <p className="text-xs sm:text-sm font-semibold tracking-wide text-amber-900 uppercase">
            ⚠️ Unofficial Survey | Self-Reported Data | Statistical Estimate | Not RSSB Official Result
          </p>
        </div>

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-3">
            <TrendingUp className="w-3.5 h-3.5" />
            Decision Lab Statistical Projection
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Rajasthan BCI 2026 Expected Cut-off Analysis
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            Detailed statistical analysis of expected 1x cut-off scores, seat distribution ratios, paper qualifying rules, and live marks survey insights.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/bci-2026-marks-survey"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-md hover:bg-indigo-700 transition"
            >
              <Sparkles className="w-4 h-4" />
              Check Your Estimated Standing
            </Link>
            <Link
              href="/bci-2026-result-tracker"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition shadow-sm"
            >
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              View Live Tracker Dashboard
            </Link>
          </div>
        </div>

        {/* Key Determinants of BCI 2026 Cut-off */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            Primary Factors Influencing the BCI 2026 Final Cut-off
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-600">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Individual Paper Qualifying Hurdle
              </h3>
              <p>
                Candidates must achieve at least 40% (40 marks) in Paper-I AND Paper-II separately for UR, EWS, OBC, and MBC. For SC and ST categories, the threshold is 35% (35 marks). Scorers exceeding 120 total marks cannot qualify if either paper falls below threshold.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                Total Vacancy & Backlog Distribution
              </h3>
              <p>
                Total advertised seats stand at 3,629 (2,936 Non-TSP and 693 TSP). Potential inclusion of backlog seats in reserved categories could expand the qualified pool.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
                Negative Marking & Technical Depth
              </h3>
              <p>
                With 1/3rd negative marking in both papers, candidate net aggregates were heavily constrained in technical sections, compressing the median marks distribution.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                Unreserved Migration Dynamics
              </h3>
              <p>
                High-scoring OBC, EWS, and MBC candidates qualifying without age or standard concessions compete directly in the Open/UR quota, pushing the unreserved cut-off upwards.
              </p>
            </div>
          </div>
        </div>

        {/* Expected Cut-off Benchmark Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="bg-slate-900 text-white p-5">
            <h2 className="text-base sm:text-lg font-bold">
              Baseline Estimated Cut-off Range (1x Selected List)
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Subject to final RSSB answer key revisions and document verification list.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Min. Qualifying Rule</th>
                  <th className="py-3 px-4">Non-TSP Estimated Range</th>
                  <th className="py-3 px-4">TSP Estimated Range</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-3 px-4 font-bold text-slate-900">General / UR</td>
                  <td className="py-3 px-4 text-slate-600">40 in P1 & P2 (Min 80)</td>
                  <td className="py-3 px-4 font-extrabold text-indigo-700">105 – 115</td>
                  <td className="py-3 px-4 font-extrabold text-indigo-700">85 – 95</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-slate-900">OBC (Non-Creamy)</td>
                  <td className="py-3 px-4 text-slate-600">40 in P1 & P2 (Min 80)</td>
                  <td className="py-3 px-4 font-extrabold text-indigo-700">102 – 112</td>
                  <td className="py-3 px-4 text-slate-400">N/A (Compete in UR)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-slate-900">EWS</td>
                  <td className="py-3 px-4 text-slate-600">40 in P1 & P2 (Min 80)</td>
                  <td className="py-3 px-4 font-extrabold text-indigo-700">95 – 105</td>
                  <td className="py-3 px-4 text-slate-400">N/A (Compete in UR)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-slate-900">MBC</td>
                  <td className="py-3 px-4 text-slate-600">40 in P1 & P2 (Min 80)</td>
                  <td className="py-3 px-4 font-extrabold text-indigo-700">92 – 102</td>
                  <td className="py-3 px-4 text-slate-400">N/A (Compete in UR)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-slate-900">SC</td>
                  <td className="py-3 px-4 text-slate-600">35 in P1 & P2 (Min 70)</td>
                  <td className="py-3 px-4 font-extrabold text-indigo-700">78 – 88</td>
                  <td className="py-3 px-4 font-extrabold text-indigo-700">70 – 76</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-slate-900">ST</td>
                  <td className="py-3 px-4 text-slate-600">35 in P1 & P2 (Min 70)</td>
                  <td className="py-3 px-4 font-extrabold text-indigo-700">75 – 84</td>
                  <td className="py-3 px-4 font-extrabold text-indigo-700">70 – 74</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Nav Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-center text-xs sm:text-sm">
          <Link
            href="/bci-2026/tsp"
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 font-bold text-slate-800 hover:text-indigo-600 transition shadow-sm"
          >
            TSP Area In-depth Analysis →
          </Link>
          <Link
            href="/bci-2026/non-tsp"
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 font-bold text-slate-800 hover:text-indigo-600 transition shadow-sm"
          >
            Non-TSP Area In-depth Analysis →
          </Link>
          <Link
            href="/bci-2026/category-analysis"
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 font-bold text-slate-800 hover:text-indigo-600 transition shadow-sm"
          >
            Category Comparison Pool →
          </Link>
        </div>

        {/* Mandatory Bottom Disclaimer */}
        <div className="p-4 bg-slate-100 border border-slate-300 rounded-xl text-center text-xs text-slate-600">
          <strong>Mandatory Notice:</strong> All cut-off numbers on this page are statistical approximations calculated from candidate survey responses. Official results, final answer keys, and selection cut-offs will be announced by the Rajasthan Staff Selection Board (RSSB).
        </div>
      </div>
    </div>
  );
}
