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
  User,
  Hash,
  Phone,
  MapPin,
} from "lucide-react";

const RAJASTHAN_DISTRICTS = [
  "Ajmer (अजमेर)",
  "Alwar (अलवर)",
  "Anupgarh (अनूपगढ़)",
  "Balotra (बालोतरा)",
  "Banswara (बांसवाड़ा)",
  "Baran (बारां)",
  "Barmer (बाड़मेर)",
  "Beawar (ब्यावर)",
  "Bharatpur (भरतपुर)",
  "Bhilwara (भीलवाड़ा)",
  "Bikaner (बीकानेर)",
  "Bundi (बूंदी)",
  "Chittorgarh (चित्तौड़गढ़)",
  "Churu (चूरू)",
  "Dausa (दौसा)",
  "Deeg (डीग)",
  "Dholpur (धौलपुर)",
  "Didwana-Kuchaman (डीडवाना-कुचामन)",
  "Dudu (दूदू)",
  "Dungarpur (डूंगरपुर)",
  "Gangapur City (गंगापुर सिटी)",
  "Hanumangarh (हनुमानगढ़)",
  "Jaipur (जयपुर)",
  "Jaipur Rural (जयपुर ग्रामीण)",
  "Jaisalmer (जैसलमेर)",
  "Jalore (जालौर)",
  "Jhalawar (झालावाड़)",
  "Jhunjhunu (झुंझुनूं)",
  "Jodhpur (जोधपुर)",
  "Jodhpur Rural (जोधपुर ग्रामीण)",
  "Karauli (करौली)",
  "Kekri (केकड़ी)",
  "Khairthal-Tijara (खैरथल-तिजारा)",
  "Kota (कोटा)",
  "Kotputli-Behror (कोटपूतली-बहरोड़)",
  "Nagaur (नागौर)",
  "Neem Ka Thana (नीम का थाना)",
  "Pali (पाली)",
  "Phalodi (फलोदी)",
  "Pratapgarh (प्रतापगढ़)",
  "Rajsamand (राजसमंद)",
  "Salumbar (सलूंबर)",
  "Sanchore (सांचौर)",
  "Sawai Madhopur (सवाई माधोपुर)",
  "Shahpura (शाहपुरा)",
  "Sikar (सीकर)",
  "Sirohi (सिरोही)",
  "Sri Ganganagar (श्रीगंगानगर)",
  "Tonk (टोंक)",
  "Udaipur (उदयपुर)",
  "Other / Outside Rajasthan (अन्य राज्य)",
];

export default function BciMarksSurveyPage() {
  const [candidateName, setCandidateName] = useState<string>("");
  const [rollNumber, setRollNumber] = useState<string>("");
  const [mobile, setMobile] = useState<string>("");
  const [district, setDistrict] = useState<string>("");
  const [shift, setShift] = useState<string>("");

  const [area, setArea] = useState<"Non-TSP" | "TSP">("Non-TSP");
  const [category, setCategory] = useState<"UR" | "EWS" | "OBC" | "MBC" | "SC" | "ST">("UR");
  const [gender, setGender] = useState<"Male" | "Female" | "Other">("Male");
  const [paper1Marks, setPaper1Marks] = useState<string>("");
  const [paper2Marks, setPaper2Marks] = useState<string>("");
  const [marksSource, setMarksSource] = useState<string>("official_provisional_key");
  const [consent, setConsent] = useState<boolean>(true);

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

    // 1. Mandatory Identity Validations
    const cleanName = candidateName.trim();
    if (!cleanName || cleanName.length < 3) {
      setErrorMsg("कृपया अपना वास्तविक पूरा नाम (कम से कम 3 अक्षर) दर्ज करें।");
      return;
    }

    const cleanRoll = rollNumber.trim();
    if (!cleanRoll || !/^\d{6,8}$/.test(cleanRoll)) {
      setErrorMsg("कृपया अपना मान्य 6 से 8 अंकों का परीक्षा रोल नंबर दर्ज करें (उदा. 1029384)।");
      return;
    }

    const cleanMobile = mobile.replace(/\D/g, "");
    if (!cleanMobile || !/^[6-9]\d{9}$/.test(cleanMobile)) {
      setErrorMsg("कृपया अपना 10 अंकों का मान्य मोबाइल नंबर दर्ज करें (उदा. 9829XXXXXX)।");
      return;
    }

    if (!district) {
      setErrorMsg("कृपया अपना गृह जिला (Home District) अवश्य चुनें।");
      return;
    }

    if (!validP1 || !validP2) {
      setErrorMsg("कृपया Paper-I और Paper-II दोनों के 0 से 100 के बीच मान्य मार्क्स दर्ज करें।");
      return;
    }

    if (!consent) {
      setErrorMsg("कृपया आगे बढ़ने के लिए सहमति (Consent) बॉक्स को टिक करें।");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/bci-survey/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName: cleanName,
          rollNumber: cleanRoll,
          mobile: cleanMobile,
          district,
          shift: shift.trim() || undefined,
          area,
          category,
          gender,
          paper1Marks: p1,
          paper2Marks: p2,
          marksSource,
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

        {/* Official Result Announcement Banner */}
        <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 border border-emerald-400/30">
          <div className="space-y-1 text-center sm:text-left">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold uppercase tracking-wider">
              🎉 परिणाम घोषित (Official Result Out)
            </span>
            <h3 className="text-base sm:text-lg font-extrabold text-white">
              RSMSSB द्वारा BCI / SCI 2026 का आधिकारिक परिणाम जारी!
            </h3>
            <p className="text-xs text-emerald-100 max-w-xl">
              बोर्ड द्वारा आधिकारिक प्रोविजनल मेरिट लिस्ट, श्रेणीवार कट-ऑफ एवं स्क्रूटनी फॉर्म शेड्यूल जारी हो चुका है। आधिकारिक कट-ऑफ व पीडीएफ नीचे देखें।
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0 w-full sm:w-auto">
            <Link
              href="/bci-2026-result-tracker"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white text-emerald-950 font-extrabold text-xs shadow-md hover:bg-emerald-50 transition text-center"
            >
              आधिकारिक कट-ऑफ व मेरिट देखें →
            </Link>
            <Link
              href="/blogs/rsmssb-bci-sci-women-supervisor-result-merit-list-cut-off-2026"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-900 text-white font-bold text-xs border border-white/20 transition text-center"
            >
              विस्तृत DV विश्लेषण गाइड
            </Link>
          </div>
        </div>

        {/* Hero Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            100% Verified Candidate Sample
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Basic Computer Instructor (BCI) 2026
            <span className="block text-indigo-600 mt-1">Marks Survey & Cut-off Estimator</span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            सटीक और प्रामाणिक कट-ऑफ अनुमान के लिए केवल वास्तविक परीक्षार्थी ही अपना विवरण दर्ज करें। फर्जी एंट्रीज को रोकने के लिए नाम, रोल नंबर एवं मोबाइल सत्यापन अनिवार्य किया गया है।
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
              अभ्यर्थी <strong>{candidateName}</strong> के मार्क्स प्रामाणिक विश्लेषणात्मक डेटाबेस में सुरक्षित दर्ज हो गए हैं।
            </p>

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
                    इस सीक्रेट टोकन को कॉपी करके सुरक्षित रख लें। यदि संशोधित उत्तर कुंजी (Answer Key) के बाद आपको अपने मार्क्स अपडेट करने हों, तो यह आवश्यक होगा:
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
                  सटीक आंकड़ों हेतु वास्तविक अभ्यर्थी विवरण भरें। 1 रोल नंबर से केवल 1 एंट्री मान्य होगी।
                </p>
              </div>
              <span className="text-xs bg-slate-800 text-emerald-400 px-3 py-1 rounded-full border border-slate-700 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Anti-Fake Verified
              </span>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Error Alert */}
              {errorMsg && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-sm">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="font-medium">{errorMsg}</div>
                </div>
              )}

              {/* SECTION 1: MANDATORY CANDIDATE VERIFICATION (ANTI-FAKE) */}
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4 text-indigo-600" />
                    1. अभ्यर्थी पहचान विवरण (Mandatory Candidate Details)
                  </h3>
                  <span className="text-[11px] font-semibold text-rose-600">सभी अनिवार्य (*)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Candidate Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      अभ्यर्थी का पूरा नाम (Full Name) *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        required
                        minLength={3}
                        maxLength={60}
                        value={candidateName}
                        onChange={(e) => setCandidateName(e.target.value)}
                        placeholder="उदा. Ramesh Kumar Sharma"
                        className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                      />
                    </div>
                  </div>

                  {/* Roll Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      रोल नंबर (RSSB Exam Roll No.) *
                    </label>
                    <div className="relative">
                      <Hash className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        required
                        pattern="\d{6,8}"
                        value={rollNumber}
                        onChange={(e) => setRollNumber(e.target.value.replace(/\D/g, ""))}
                        placeholder="उदा. 1029384 (6-8 अंक)"
                        className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-600" />
                      सुरक्षित: रोल नंबर एनक्रिप्टेड रहेगा, एक रोल नंबर से 1 ही बार एंट्री होगी।
                    </p>
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      मोबाइल नंबर (10-Digit Mobile) *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                        placeholder="उदा. 9829XXXXXX"
                        className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-600" />
                      गोपनीय: यह नंबर सार्वजनिक रूप से कभी नहीं दिखाया जाएगा।
                    </p>
                  </div>

                  {/* District Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      गृह जिला (Home District) *
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                      <select
                        required
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                      >
                        <option value="">-- अपना जिला चुनें --</option>
                        {RAJASTHAN_DISTRICTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: AREA, CATEGORY & GENDER */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Area */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                    2. क्षेत्र (Area) *
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
                    3. सामाजिक श्रेणी (Category) *
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
                        <option value="OBC">OBC (Non-Creamy)</option>
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
                    4. लिंग (Gender) *
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="Male">Male (पुरुष)</option>
                    <option value="Female">Female (महिला)</option>
                    <option value="Other">Other / Prefer not to say</option>
                  </select>
                </div>
              </div>

              {/* SECTION 3: MARKS INPUT */}
              <div className="p-5 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    5. प्रश्नपत्र अनुसार प्राप्तांक (Marks as per Answer Key)
                  </h3>
                  <span className="text-xs text-indigo-700 font-medium">
                    पासिंग नियम: प्रति पेपर न्यूनतम {minRequired} अंक
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
                      placeholder="उदा. 54.5"
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
                      placeholder="उदा. 48.0"
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

              {/* SECTION 4: MARKS SOURCE & SHIFT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                    6. उत्तर कुंजी स्रोत (Marks Source) *
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

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                    7. परीक्षा पारी (Exam Shift - Optional)
                  </label>
                  <input
                    type="text"
                    value={shift}
                    onChange={(e) => setShift(e.target.value)}
                    placeholder="उदा. Morning / Shift 1"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
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
                  className="text-xs text-slate-700 cursor-pointer select-none leading-relaxed font-medium"
                >
                  मैं प्रमाणित करता/करती हूँ कि मेरे द्वारा दिए गए मार्क्स एवं परीक्षा विवरण वास्तविक हैं। मैं समझता/समझती हूँ कि यह एक सांख्यिकीय सर्वेक्षण (Survey) है और RSSB का आधिकारिक परिणाम नहीं है।
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
                    सत्यापित किया जा रहा है...
                  </>
                ) : (
                  <>
                    <Calculator className="w-5 h-5" />
                    Submit Verified Marks & View My Rank Report
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
            Anti-Fake & Verification Guidelines (फर्जी डेटा रोकथाम नीति)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-600">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-800 mb-1">रोल नंबर आधारित सिंगल एंट्री</h4>
              <p>
                प्रत्येक अभ्यर्थी के रोल नंबर को SHA-256 एल्गोरिदम द्वारा सुरक्षित हैश में बदला जाता है। एक रोल नंबर से दोबारा सर्वे नहीं भरा जा सकता, जिससे डुप्लीकेट व फर्जी एंट्री पूर्णतया रुकती है।
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-800 mb-1">गोपनीयता की 100% गारंटी</h4>
              <p>
                आपका रोल नंबर और मोबाइल नंबर कभी भी सार्वजनिक रिजल्ट व कट-ऑफ बोर्ड पर नहीं दिखाया जाता। यह केवल फर्जीवाड़े की रोकथाम के लिए डेटाबेस स्तर पर सुरक्षित रखा जाता है।
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-800 mb-1">सीक्रेट एडिट टोकन से मार्क्स अपडेट</h4>
              <p>
                फॉर्म सबमिट होते ही आपको 48-अक्षरों का एक सुरक्षित &apos;Edit Token&apos; मिलता है। भविष्य में यदि बोर्ड की आंसर की बदलती है, तो आप उसी टोकन से अपने मार्क्स अपडेट कर सकेंगे।
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-800 mb-1">पारदर्शी कट-ऑफ मॉडल</h4>
              <p>
                सर्वेक्षण में प्राप्त डेटा को टीएसपी और नॉन-टीएसपी श्रेणियों तथा आरक्षण नियमों के आधार पर विश्लेषित कर सटीक 1x कट-ऑफ रेंज और पर्सेंटाइल निकाला जाता है।
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
