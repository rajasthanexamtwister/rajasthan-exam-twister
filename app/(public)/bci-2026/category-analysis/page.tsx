import { Metadata } from "next";
import Link from "next/link";
import { Users, BarChart3, TrendingUp, Sparkles, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "BCI 2026 Category-wise Marks & Cut-off Comparison | UR, OBC, EWS, SC, ST",
  description:
    "Cross-category comparative analysis for Rajasthan BCI (Basic Computer Instructor) 2026 exam. Compare scores and cut-offs across UR, OBC, EWS, MBC, SC, and ST.",
};

export default function BciCategoryAnalysisPage() {
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
            Cross-Category Analysis
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
            BCI 2026 Category-wise Comparison & Distribution
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            Deep-dive into social category score clusters, qualification distributions, and migration factors.
          </p>

          <div className="mt-5 flex justify-center gap-3">
            <Link
              href="/bci-2026-marks-survey"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs sm:text-sm shadow hover:bg-indigo-700 transition"
            >
              <Sparkles className="w-4 h-4" /> Participate in Survey
            </Link>
            <Link
              href="/bci-2026-result-tracker"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-50 transition"
            >
              <BarChart3 className="w-4 h-4 text-indigo-600" /> Live Analytics Dashboard
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm mb-8">
          <h2 className="text-lg font-bold text-slate-900">Open Merit & Vertical Migration</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            The Open (Unreserved) merit category is not restricted to General candidates. Eligible meritorious candidates from OBC, EWS, MBC, SC, and ST who meet general standards compete against the open quota. Our Decision Lab incorporates dynamic migration approximation ($M = H/c$) to estimate competitive pressure on the final unreserved cut-off.
          </p>
        </div>
      </div>
    </div>
  );
}
