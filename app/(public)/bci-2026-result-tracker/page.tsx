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
  Download,
  FileText,
  ExternalLink,
  Trophy,
  Calendar,
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

        {/* Official Declared Result & PDF Downloads Section */}
        <div className="mb-10 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                आधिकारिक परिणाम घोषित (Official Result Out)
              </span>
              <span className="text-xs text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                बोर्ड परिणाम घोषणा: 04 नवंबर 2026
              </span>
            </div>

            <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
              RSMSSB कंप्यूटर अनुदेशक (BCI / SCI 2026) आधिकारिक मेरिट व श्रेणीवार कट-ऑफ
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl mb-6">
              राजस्थान कर्मचारी चयन बोर्ड (RSSB जयपुर) द्वारा बेसिक कंप्यूटर अनुदेशक (BCI) व वरिष्ठ कंप्यूटर अनुदेशक (SCI) का प्रोविजनल परिणाम एवं दस्तावेज़ सत्यापन (DV) हेतु आधिकारिक कट-ऑफ जारी कर दिया गया है।
            </p>

            {/* Quick Action Download Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
              <a
                href="https://rssb.rajasthan.gov.in/storage/result_item/1793800804.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 transition group backdrop-blur-sm"
              >
                <div>
                  <div className="text-xs text-emerald-300 font-semibold">बेसिक कंप्यूटर अनुदेशक</div>
                  <div className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                    BCI TSP Merit PDF
                  </div>
                </div>
                <Download className="w-4 h-4 text-emerald-400 group-hover:translate-y-0.5 transition-transform shrink-0" />
              </a>

              <a
                href="https://rssb.rajasthan.gov.in/storage/result_item/1793800830.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 transition group backdrop-blur-sm"
              >
                <div>
                  <div className="text-xs text-amber-300 font-semibold">वरिष्ठ कंप्यूटर अनुदेशक</div>
                  <div className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                    SCI Cut-Off & Result
                  </div>
                </div>
                <Download className="w-4 h-4 text-amber-400 group-hover:translate-y-0.5 transition-transform shrink-0" />
              </a>

              <a
                href="https://rssb.rajasthan.gov.in/storage/result_item/1793800878.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 transition group backdrop-blur-sm"
              >
                <div>
                  <div className="text-xs text-sky-300 font-semibold">वरिष्ठ कंप्यूटर अनुदेशक</div>
                  <div className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                    SCI TSP Merit PDF
                  </div>
                </div>
                <Download className="w-4 h-4 text-sky-400 group-hover:translate-y-0.5 transition-transform shrink-0" />
              </a>

              <Link
                href="/blogs/rsmssb-bci-sci-women-supervisor-result-merit-list-cut-off-2026"
                className="flex items-center justify-between p-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition group shadow-lg shadow-amber-500/20"
              >
                <div>
                  <div className="text-[11px] text-slate-900 font-semibold">विस्तृत विश्लेषण गाइड</div>
                  <div className="text-sm font-black">कट-ऑफ व DV स्क्रूटनी →</div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-950 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </Link>
            </div>

            {/* Official Cut-Off & Toppers Summary Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-white/10">
              {/* Official Cut-Off Table (SCI Non-TSP & TSP) */}
              <div className="bg-white/5 rounded-2xl p-4 sm:p-5 border border-white/10 backdrop-blur-md">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    वरिष्ठ कंप्यूटर अनुदेशक (SCI) आधिकारिक कट-ऑफ अंक
                  </h3>
                  <span className="text-[11px] text-slate-400">Non-TSP / TSP</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-white/10 text-slate-200">
                      <tr>
                        <th className="py-2 px-3 rounded-l">श्रेणी (Category)</th>
                        <th className="py-2 px-3">सामान्य (Male)</th>
                        <th className="py-2 px-3 rounded-r">महिला (Female)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      <tr>
                        <td className="py-2 px-3 font-semibold text-white">अनारक्षित (GEN)</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">102.2729</td>
                        <td className="py-2 px-3 text-emerald-300">93.7291</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-white">आर्थिक रूप से कमजोर (EWS)</td>
                        <td className="py-2 px-3 font-bold text-white">82.9095</td>
                        <td className="py-2 px-3">82.9095</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-white">अन्य पिछड़ा वर्ग (OBC)</td>
                        <td className="py-2 px-3 text-amber-400 font-bold">84.0802</td>
                        <td className="py-2 px-3 text-amber-300">80.7875</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-white">अनुसूचित जाति (SC)</td>
                        <td className="py-2 px-3 font-bold text-white">71.6547</td>
                        <td className="py-2 px-3">71.6547</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-white">अनुसूचित जनजाति (ST)</td>
                        <td className="py-2 px-3 font-bold text-white">82.9303</td>
                        <td className="py-2 px-3">74.6044</td>
                      </tr>
                      <tr className="bg-indigo-900/30">
                        <td className="py-2 px-3 font-semibold text-indigo-300">TSP - अनारक्षित (GEN)</td>
                        <td className="py-2 px-3 font-bold text-indigo-200" colSpan={2}>
                          80.8182 (पुरुष एवं महिला)
                        </td>
                      </tr>
                      <tr className="bg-indigo-900/30">
                        <td className="py-2 px-3 font-semibold text-indigo-300">TSP - जनजाति (ST)</td>
                        <td className="py-2 px-3 font-bold text-indigo-200" colSpan={2}>
                          79.6957 (सामान्य पुरुष)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* BCI Top Rankers & Key Notes */}
              <div className="bg-white/5 rounded-2xl p-4 sm:p-5 border border-white/10 backdrop-blur-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-emerald-400" />
                      बेसिक कंप्यूटर अनुदेशक (BCI TSP) राज्य टॉपर मेरिट
                    </h3>
                    <span className="text-[11px] text-slate-400">Roll No. & Marks</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] flex items-center justify-center">
                          1
                        </span>
                        <span className="font-bold text-white">दुर्गेश शर्मा (Roll: 2328278)</span>
                      </div>
                      <span className="font-mono font-extrabold text-emerald-400">155.1361 अंक</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-700 text-white font-bold text-[10px] flex items-center justify-center">
                          2
                        </span>
                        <span className="font-semibold text-slate-200">शैलेश पटेल (Roll: 2331560)</span>
                      </div>
                      <span className="font-mono font-bold text-slate-300">131.9524 अंक</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-700 text-white font-bold text-[10px] flex items-center justify-center">
                          3
                        </span>
                        <span className="font-semibold text-slate-200">राकेश जन्नावत (Roll: 2332529)</span>
                      </div>
                      <span className="font-mono font-bold text-slate-300">127.6803 अंक</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-700 text-white font-bold text-[10px] flex items-center justify-center">
                          4
                        </span>
                        <span className="font-semibold text-slate-200">नरहरि गोगरोत (Roll: 2326096)</span>
                      </div>
                      <span className="font-mono font-bold text-slate-300">127.1361 अंक</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-slate-300 flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>स्क्रूटनी फॉर्म शेड्यूल:</strong> चयनित अभ्यर्थी SSO पोर्टल (Recruitment Portal) पर <strong>12 नवंबर से 21 नवंबर 2026</strong> तक विस्तृत संवीक्षा फॉर्म ऑनलाइन भरकर DV हेतु प्रस्तुत करेंगे।
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Header for Survey Research Archive */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              सांख्यिकीय सर्वेक्षण व पूर्व-अनुमान विश्लेषण (Survey Research Pool)
            </h3>
            <p className="text-xs text-slate-500">
              परीक्षा पूर्व अभ्यर्थियों द्वारा दर्ज किए गए स्व-घोषित प्राप्तांकों का तुलनात्मक डेटाबेस एवं पर्सेंटाइल मॉडल।
            </p>
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
