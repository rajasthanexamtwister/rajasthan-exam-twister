"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calculator,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Lock,
  Copy,
  Check,
  ArrowRight,
  HelpCircle,
  Sparkles,
  BarChart3,
  Award,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function BciMarksSurveyPage() {
  const [area, setArea] = useState<"Non-TSP" | "TSP">("Non-TSP");
  const [category, setCategory] = useState<"UR" | "EWS" | "OBC" | "MBC" | "SC" | "ST">("UR");
  const [gender, setGender] = useState<"Male" | "Female" | "Other">("Male");
  const [paper1Marks, setPaper1Marks] = useState<string>("");
  const [paper2Marks, setPaper2Marks] = useState<string>("");
  const [marksSource, setMarksSource] = useState<string>("official_provisional_key");
  const [district, setDistrict] = useState<string>("");
  const [shift, setShift] = useState<string>("");
  const [candidateName, setCandidateName] = useState<string>("");
  const [mobile, setMobile] = useState<string>("");
  const [rollNumber, setRollNumber] = useState<string>("");
  const [consent, setConsent] = useState<boolean>(true);
  const [showOptional, setShowOptional] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<{
    submissionId: string;
    editToken: string;
    totalMarks: number;
    qualificationStatus: string;
    isDuplicate: boolean;
  } | null>(null);

  const [copiedToken, setCopiedToken] = useState<boolean>(false);

  // Live calculation
  const p1 = parseFloat(paper1Marks);
  const p2 = parseFloat(paper2Marks);
  const validP1 = !isNaN(p1) && p1 >= 0 && p1 <= 100;
  const validP2 = !isNaN(p2) && p2 >= 0 && p2 <= 100;
  const total = validP1 && validP2 ? Math.round((p1 + p2) * 100) / 100 : null;

  // Qualification status preview
  const minRequired = ["SC", "ST"].includes(category) ? 35 : 40;
  const p1Passed = validP1 && p1 >= minRequired;
  const p2Passed = validP2 && p2 >= minRequired;
  const isBothPassed = p1Passed && p2Passed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!validP1 || !validP2) {
      setErrorMsg("Please enter valid marks between 0 and 100 for both Paper-I and Paper-II.");
      return;
    }

    if (!consent) {
      setErrorMsg("Please accept the survey consent agreement to proceed.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/bci-survey/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          area,
          category,
          gender,
          paper1Marks: p1,
          paper2Marks: p2,
          marksSource,
          district: district.trim() || undefined,
          shift: shift.trim() || undefined,
          candidateName: candidateName.trim() || undefined,
          mobile: mobile.trim() || undefined,
          rollNumber: rollNumber.trim() || undefined,
          consent,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to submit survey");
      }

      setSubmissionResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyEditToken = () => {
    if (submissionResult?.editToken) {
      navigator.clipboard.writeText(submissionResult.editToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2500);
    }
  };

  return (
    <div className="py-8 sm:py-12 bg-[#FAF8F5] min-h-[calc(100vh-80px)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Mandatory Header Disclaimer */}
        <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 sm:p-4 text-center">
          <p className="text-xs sm:text-sm font-semibold tracking-wide text-amber-900 uppercase">
            ⚠️ Unofficial Survey | Self-Reported Data | Statistical Estimate | Not RSSB Official Result
          </p>
        </div>

        {/* Hero Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            BCI 2026 Result & Cut-off Tracker
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Basic Computer Instructor (BCI) 2026
            <span className="block text-indigo-600 mt-1">Marks Survey & Cut-off Estimator</span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            Participate in Rajasthan’s most transparent candidate marks survey. Enter your Paper-I & Paper-II marks to get your estimated percentile, sample rank range, and category-wise cut-off benchmark.
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs sm:text-sm">
            <Link
              href="/bci-2026-result-tracker"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition shadow-sm"
            >
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              View Live Results & Analytics
            </Link>
            <Link
              href="/bci-2026-cutoff-analysis"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition shadow-sm"
            >
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Category Cut-off Estimator
            </Link>
          </div>
        </div>

        {/* If Form is Submitted Successfully */}
        {submissionResult ? (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-10 animate-in fade-in-50">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-bold text-center text-slate-900">
              Survey Submitted Successfully!
            </h2>
            <p className="text-sm text-center text-slate-600 mt-1 max-w-md mx-auto">
              Your self-reported marks have been recorded into the live analytical sample pool.
            </p>

            {submissionResult.isDuplicate && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 text-center">
                Note: A submission with this roll number was already registered. Your entry has been recorded with a duplicate flag for verification.
              </div>
            )}

            {/* Quick Summary Card */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 p-5 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Calculated</p>
                <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
                  {submissionResult.totalMarks} / 200
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Paper Status</p>
                <span
                  className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    submissionResult.qualificationStatus === "paper_verified_qualified"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {submissionResult.qualificationStatus === "paper_verified_qualified"
                    ? "Qualified"
                    : "Not Qualified"}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs text-slate-500 font-medium">Category</p>
                <p className="text-sm font-bold text-slate-800 mt-1">
                  {category} ({area})
                </p>
              </div>
            </div>

            {/* Edit Token Card */}
            <div className="mt-6 p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 text-left">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
                    Your Confidential Edit Token
                  </h4>
                  <p className="text-xs text-indigo-800 mt-0.5">
                    Save this token securely. If the official answer key changes or you wish to update your marks later, you will need this key:
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={submissionResult.editToken}
                      className="bg-white border border-indigo-300 rounded px-2.5 py-1 text-xs font-mono text-slate-800 select-all flex-1"
                    />
                    <button
                      type="button"
                      onClick={copyEditToken}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-medium transition"
                    >
                      {copiedToken ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedToken ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/bci-2026-marks-survey/report/${submissionResult.submissionId}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold shadow-md hover:bg-indigo-700 transition"
              >
                <Award className="w-4 h-4" />
                View My Complete Candidate Report
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/bci-2026-result-tracker"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition"
              >
                <BarChart3 className="w-4 h-4" />
                Explore Live Dashboard
              </Link>
            </div>
          </div>
        ) : (
          /* Survey Form */
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
          >
            {/* Form Step Indicator */}
            <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-amber-400" />
                  Candidate Marks Submission Form
                </h2>
                <p className="text-xs text-slate-300">
                  Accurate data ensures precise cut-off predictions for all candidates.
                </p>
              </div>
              <span className="text-xs bg-slate-800 text-amber-300 px-3 py-1 rounded-full border border-slate-700">
                100% Confidential
              </span>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Error Alert */}
              {errorMsg && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-sm">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>{errorMsg}</div>
                </div>
              )}

              {/* Area & Category Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Area */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                    1. Area *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["Non-TSP", "TSP"] as const).map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => {
                          setArea(a);
                          if (a === "TSP" && !["UR", "SC", "ST"].includes(category)) {
                            setCategory("UR");
                          }
                        }}
                        className={`py-2 px-3 text-xs sm:text-sm font-semibold rounded-lg border transition ${
                          area === a
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                    2. Social Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="UR">General / UR</option>
                    {area === "Non-TSP" && (
                      <>
                        <option value="EWS">EWS</option>
                        <option value="OBC">OBC</option>
                        <option value="MBC">MBC</option>
                      </>
                    )}
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                  </select>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                    3. Gender *
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other / Prefer not to say</option>
                  </select>
                </div>
              </div>

              {/* Marks Section */}
              <div className="p-5 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    Enter Marks (As per Answer Key)
                  </h3>
                  <span className="text-xs text-indigo-700 font-medium">
                    Passing Rule: Min {minRequired} marks per paper
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Paper-I */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Paper-I Marks (0 to 100) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                      value={paper1Marks}
                      onChange={(e) => setPaper1Marks(e.target.value)}
                      placeholder="e.g. 54.5"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-slate-900 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {validP1 && (
                      <p
                        className={`text-xs mt-1 font-medium ${
                          p1Passed ? "text-emerald-700" : "text-rose-600"
                        }`}
                      >
                        {p1Passed
                          ? `✓ Qualified Paper-I (≥ ${minRequired})`
                          : `✗ Below minimum ${minRequired}`}
                      </p>
                    )}
                  </div>

                  {/* Paper-II */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Paper-II Marks (0 to 100) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                      value={paper2Marks}
                      onChange={(e) => setPaper2Marks(e.target.value)}
                      placeholder="e.g. 48.0"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-slate-900 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {validP2 && (
                      <p
                        className={`text-xs mt-1 font-medium ${
                          p2Passed ? "text-emerald-700" : "text-rose-600"
                        }`}
                      >
                        {p2Passed
                          ? `✓ Qualified Paper-II (≥ ${minRequired})`
                          : `✗ Below minimum ${minRequired}`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Auto Calculated Total Banner */}
                {total !== null && (
                  <div className="mt-3 p-4 bg-white rounded-lg border border-indigo-200 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Auto Calculated Total Marks
                      </p>
                      <p className="text-2xl font-black text-indigo-700">
                        {total} <span className="text-sm font-semibold text-slate-500">/ 200</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Qualification Status
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 mt-0.5 px-3 py-1 rounded-full text-xs font-bold ${
                          isBothPassed
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {isBothPassed ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Paper-Verified Qualified
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5" />
                            Not Qualified (Paper Minimum Rule)
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Marks Source */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  4. Marks Source *
                </label>
                <select
                  value={marksSource}
                  onChange={(e) => setMarksSource(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="official_provisional_key">Official Provisional Answer Key</option>
                  <option value="coaching_key">Coaching Answer Key</option>
                  <option value="self_calculated">Self Calculated</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Optional Fields Toggle */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setShowOptional(!showOptional)}
                  className="w-full flex items-center justify-between text-left text-sm font-semibold text-slate-700 hover:text-slate-900"
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Additional Information (Optional)
                  </span>
                  {showOptional ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showOptional && (
                  <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Candidate Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={candidateName}
                        onChange={(e) => setCandidateName(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Home District (Optional)
                      </label>
                      <input
                        type="text"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        placeholder="e.g. Jaipur, Jodhpur, Udaipur"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Exam Shift (Optional)
                      </label>
                      <input
                        type="text"
                        value={shift}
                        onChange={(e) => setShift(e.target.value)}
                        placeholder="e.g. Shift 1 / Morning"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Roll Number (Optional - Privacy Protected)
                      </label>
                      <input
                        type="text"
                        value={rollNumber}
                        onChange={(e) => setRollNumber(e.target.value)}
                        placeholder="e.g. 1029384"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                      />
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Never stored in plain text. Stored as a one-way encrypted hash to prevent duplicate entries.
                      </p>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Mobile Number (Optional - Never Shared Publicly)
                      </label>
                      <input
                        type="tel"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="e.g. 98XXXXXXXX"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                      />
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Protected by database encryption. Strictly confidential.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Consent Checkbox */}
              <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  id="survey-consent"
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <label
                  htmlFor="survey-consent"
                  className="text-xs text-slate-600 cursor-pointer select-none leading-relaxed"
                >
                  I voluntarily provide these self-reported marks for the BCI 2026 statistical survey. I understand this is an independent estimate and not the official RSSB result.
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-lg shadow-indigo-600/20 disabled:opacity-60 transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Calculating Statistical Metrics...
                  </>
                ) : (
                  <>
                    <Calculator className="w-5 h-5" />
                    Submit Marks & View Candidate Report
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Survey Methodology & FAQ Accordion */}
        <div className="mt-12 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            Methodology & Important Guidelines
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-600">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-800 mb-1">Independent Sample Survey</h4>
              <p>
                All data collected on this platform is voluntarily self-reported by aspiring BCI 2026 candidates. Data is processed using weighted statistical sampling to compensate for category mix.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-800 mb-1">Qualifying Thresholds</h4>
              <p>
                As per initial rules, candidates must score at least 40% (40/100) per paper for UR/EWS/OBC/MBC and 35% (35/100) for SC/ST. A high score in one paper cannot compensate for failure in another.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-800 mb-1">Strict Privacy Safeguards</h4>
              <p>
                No candidate names or mobile numbers are displayed on public boards. Roll numbers are irreversibly hashed for duplicate mitigation.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-800 mb-1">Edit Anytime with Secret Token</h4>
              <p>
                Every submission generates a cryptographic Edit Token. If final answer keys revise your score, you can instantly update your entry.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
