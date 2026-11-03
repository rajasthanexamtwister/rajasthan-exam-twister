import { Metadata } from "next";
import Link from "next/link";
import { TrendingUp, BarChart3, CheckCircle2, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "BCI 2026 Non-TSP Marks Survey & Expected Cut-off Analysis",
  description:
    "Non-TSP area marks distribution, expected cut-offs, qualification ratios, and candidate report for Rajasthan BCI (Basic Computer Instructor) 2026.",
};

export default function BciNonTspAnalysisPage() {
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
            Non-TSP Pool Focus
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
            BCI 2026 Non-TSP Area Marks Analysis & Cut-off
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            Comprehensive statistical model covering 2,936 Non-TSP Basic Computer Instructor seats.
          </p>

          <div className="mt-5 flex justify-center gap-3">
            <Link
              href="/bci-2026-marks-survey"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs sm:text-sm shadow hover:bg-indigo-700 transition"
            >
              <Sparkles className="w-4 h-4" /> Submit Non-TSP Marks
            </Link>
            <Link
              href="/bci-2026-result-tracker?area=Non-TSP"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-50 transition"
            >
              <BarChart3 className="w-4 h-4 text-indigo-600" /> View Live Non-TSP Tracker
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm mb-8">
          <h2 className="text-lg font-bold text-slate-900">Non-TSP Category Representation & Weights</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Non-TSP cut-off estimation applies post-stratification category × gender weighting to adjust for voluntary survey participation biases against official application ratios.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-bold text-slate-800 block">General / UR</span>
              <p className="text-indigo-600 font-bold text-lg mt-0.5">105 – 115</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-bold text-slate-800 block">OBC (Non-Creamy)</span>
              <p className="text-indigo-600 font-bold text-lg mt-0.5">102 – 112</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-bold text-slate-800 block">EWS</span>
              <p className="text-indigo-600 font-bold text-lg mt-0.5">95 – 105</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-bold text-slate-800 block">MBC</span>
              <p className="text-indigo-600 font-bold text-lg mt-0.5">92 – 102</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-bold text-slate-800 block">SC</span>
              <p className="text-indigo-600 font-bold text-lg mt-0.5">78 – 88</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-bold text-slate-800 block">ST</span>
              <p className="text-indigo-600 font-bold text-lg mt-0.5">75 – 84</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
