import { Metadata } from "next";
import Link from "next/link";
import { TrendingUp, BarChart3, CheckCircle2, Sparkles, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "BCI 2026 TSP Area Marks Survey & Expected Cut-off Analysis",
  description:
    "Tribal Sub-Plan (TSP) area marks distribution, expected cut-offs, qualification ratios, and candidate report for Rajasthan BCI (Basic Computer Instructor) 2026.",
};

export default function BciTspAnalysisPage() {
  return (
    <div className="py-8 sm:py-12 bg-[#FAF8F5] min-h-[calc(100vh-80px)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 sm:p-4 text-center">
          <p className="text-xs sm:text-sm font-semibold tracking-wide text-amber-900 uppercase">
            ⚠️ Unofficial Survey | Self-Reported Data | Statistical Estimate | Not RSSB Official Result
          </p>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
            TSP Pool Focus
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
            BCI 2026 TSP Area Marks Analysis & Cut-off
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            Analysis across 693 TSP Basic Computer Instructor seats (General, SC, and ST pools).
          </p>

          <div className="mt-5 flex justify-center gap-3">
            <Link
              href="/bci-2026-marks-survey"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs sm:text-sm shadow hover:bg-indigo-700 transition"
            >
              <Sparkles className="w-4 h-4" /> Submit TSP Marks
            </Link>
            <Link
              href="/bci-2026-result-tracker?area=TSP"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-50 transition"
            >
              <BarChart3 className="w-4 h-4 text-indigo-600" /> View Live TSP Tracker
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm mb-8">
          <h2 className="text-lg font-bold text-slate-900">TSP Area Dynamics & Qualification Hurdles</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            In the previous recruitment, many TSP seats remained unfilled due to the 40% paper minimum hurdle. For 2026, candidates in SC and ST categories benefit from the relaxed 35% threshold, making paper qualification the primary deciding metric for final selection.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900 block">General / UR (TSP)</span>
              <p className="text-indigo-600 font-extrabold text-xl mt-1">85 – 95</p>
              <span className="text-[11px] text-slate-500">Min 40 in both papers</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900 block">SC (TSP)</span>
              <p className="text-indigo-600 font-extrabold text-xl mt-1">70 – 76</p>
              <span className="text-[11px] text-slate-500">Min 35 in both papers</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900 block">ST (TSP)</span>
              <p className="text-indigo-600 font-extrabold text-xl mt-1">70 – 74</p>
              <span className="text-[11px] text-slate-500">Min 35 in both papers</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
