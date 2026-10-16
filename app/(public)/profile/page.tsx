"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  User,
  Mail,
  Award,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  LogOut,
  ShieldCheck,
  Zap,
  Loader2,
  Trophy,
  History,
  XCircle,
  HelpCircle,
  Target,
  Flame,
  AlertTriangle,
  BookMarked,
  Bookmark,
  Sparkles,
  Send,
  Phone,
  Smartphone,
  Flag,
} from "lucide-react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { SOCIAL_LINKS } from "@/server/lib/social-links";

interface AttemptHistoryItem {
  _id: string;
  quizId: {
    _id: string;
    title: string;
    slug: string;
    subject?: string;
    difficulty?: string;
  };
  score: number;
  totalPossibleScore: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  submittedAt: string;
}

interface StudentReportItem {
  _id: string;
  quizId?: {
    _id: string;
    title: string;
    slug: string;
    subject?: string;
  };
  quizSlug: string;
  questionId?: {
    _id: string;
    questionText: string;
    order: number;
  };
  reason: string;
  reasonLabel: string;
  description?: string;
  status: "PENDING" | "UNDER_REVIEW" | "RESOLVED" | "REJECTED";
  resolutionReason?: string;
  studentFeedback?: string;
  resolvedAt?: string;
  createdAt: string;
}

interface WeakTopicItem {
  topic: string;
  totalAttempts: number;
  questionsAttempted: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  accuracyPercentage: number;
  status: "CRITICAL" | "NEEDS_IMPROVEMENT" | "PROFICIENT";
}

interface StudentStats {
  totalAttempts: number;
  averagePercentage: number;
  bestPercentage: number;
}

export default function StudentProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [attempts, setAttempts] = useState<AttemptHistoryItem[]>([]);
  const [weakTopics, setWeakTopics] = useState<WeakTopicItem[]>([]);
  const [reports, setReports] = useState<StudentReportItem[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [stats, setStats] = useState<StudentStats>({
    totalAttempts: 0,
    averagePercentage: 0,
    bestPercentage: 0,
  });
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [loadingWeakTopics, setLoadingWeakTopics] = useState(false);
  const [generatingBooster, setGeneratingBooster] = useState(false);
  const [boosterError, setBoosterError] = useState<string | null>(null);

  const [mobileNumber, setMobileNumber] = useState("");
  const [targetExam, setTargetExam] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSavedSuccess, setProfileSavedSuccess] = useState(false);
  const [mobileError, setMobileError] = useState<string | null>(null);

  const handleGenerateBooster = async () => {
    if (generatingBooster) return;
    setGeneratingBooster(true);
    setBoosterError(null);

    try {
      const res = await fetch("/api/student/booster-test", {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error?.message || "Failed to generate booster test");
      }

      router.push(`/quizzes/${data.data.slug}/attempt`);
    } catch (err: any) {
      console.error("Booster generation error:", err);
      setBoosterError(err.message || "Failed to generate booster test.");
      setGeneratingBooster(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMobileError(null);
    setProfileSavedSuccess(false);

    if (mobileNumber && !/^[6-9]\d{9}$/.test(mobileNumber.trim())) {
      setMobileError("Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.");
      return;
    }

    try {
      setSavingProfile(true);
      const res = await fetch("/api/student/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobileNumber: mobileNumber.trim() || null,
          targetExam: targetExam.trim() || null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setProfileSavedSuccess(true);
        if (data.student) {
          setMobileNumber(data.student.mobileNumber || "");
          setTargetExam(data.student.targetExam || "");
        }
        // Redirect directly to official Telegram channel invite link
        if (typeof window !== "undefined") {
          window.open(SOCIAL_LINKS.telegram.url, "_blank");
        }
      } else {
        setMobileError(data.error?.message || "Failed to update profile details.");
      }
    } catch (err) {
      console.error("Profile save error:", err);
      setMobileError("Network error. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      setLoadingAttempts(true);
      setLoadingWeakTopics(true);

      fetch("/api/student/profile")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.student) {
            setMobileNumber(data.student.mobileNumber || "");
            setTargetExam(data.student.targetExam || "");
          }
        })
        .catch((err) => console.error("Failed to load profile details:", err));

      fetch("/api/student/attempts")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setAttempts(data.attempts || []);
            if (data.stats) {
              setStats(data.stats);
            }
          }
        })
        .catch((err) => console.error("Failed to load student attempts:", err))
        .finally(() => setLoadingAttempts(false));

      fetch("/api/student/weak-topics")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.weakTopics) {
            setWeakTopics(data.weakTopics);
          }
        })
        .catch((err) => console.error("Failed to load weak topics:", err))
        .finally(() => setLoadingWeakTopics(false));

      setLoadingReports(true);
      fetch("/api/student/question-reports")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.data?.reports) {
            setReports(data.data.reports);
          }
        })
        .catch((err) => console.error("Failed to load student reports:", err))
        .finally(() => setLoadingReports(false));
    }
  }, [session]);

  if (status === "loading") {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#FAF8F5] px-4">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading student profile...</p>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center bg-[#FAF8F5] px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-amber-200 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-900 mx-auto flex items-center justify-center shadow-inner">
            <User className="w-7 h-7 text-amber-700" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-[#0B132B]">Student Account</h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sign in with Google to save your quiz attempts, track personal leaderboard ranking, analyze weak topics, and build your revision notebook.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-left space-y-2 text-xs text-slate-700">
            <p className="font-bold text-amber-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Learner Perks (100% Free):</span>
            </p>
            <ul className="space-y-1 text-[11px] text-slate-600 list-disc list-inside">
              <li>Save unlimited mock test attempts & track accuracy over time</li>
              <li>Compete on weekly Rajasthan-wide test leaderboards</li>
              <li>Auto-detect your weakest exam syllabus subjects</li>
              <li>Review solutions and previous scores anytime</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/profile" })}
            className="w-full py-3 px-6 text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-2xl transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>
        </div>
      </div>
    );
  }

  const user = session.user;

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Profile Header Card */}
        <div className="bg-white rounded-3xl border border-amber-200/80 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-amber-400 bg-[#0B132B] shadow-md shrink-0">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name || "Student Avatar"}
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-black text-2xl text-amber-400">
                  {(user.name || "S").charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Verified Learner</span>
              </div>
              <h1 className="text-2xl font-black text-[#0B132B]">{user.name}</h1>
              <p className="text-xs text-slate-500 font-medium flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{user.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-center sm:self-start flex-wrap">
            <Link
              href="/profile/notebook"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#0B132B] bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-xs"
            >
              <BookMarked className="w-3.5 h-3.5 text-[#0B132B]" />
              <span>Revision Notebook</span>
            </Link>
            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200/80 border border-amber-300 rounded-xl transition-colors"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-700" />
              <span>Leaderboard</span>
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Real Stats Cards (13B) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Tests Attempted
            </span>
            <span className="text-2xl font-black text-[#0B132B] block">
              {stats.totalAttempts}
            </span>
            <span className="text-[10px] text-slate-400">Mock tests & quizzes completed</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Average Score
            </span>
            <span className="text-2xl font-black text-amber-700 block">
              {stats.averagePercentage > 0 ? `${stats.averagePercentage}%` : "-"}
            </span>
            <span className="text-[10px] text-slate-400">Average accuracy across attempts</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Best Score
            </span>
            <span className="text-2xl font-black text-emerald-700 block">
              {stats.bestPercentage > 0 ? `${stats.bestPercentage}%` : "-"}
            </span>
            <span className="text-[10px] text-slate-400">Highest performance achieved</span>
          </div>
        </div>

        {/* Mobile Number & Target Exam Update Card (Telegram Community Integration) */}
        <div className="bg-white rounded-3xl border border-amber-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-800 border border-sky-200">
                <Send className="w-3.5 h-3.5 text-sky-600" />
                <span>Telegram & WhatsApp PDF Updates</span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#0B132B]">
                Get Daily PDF Notes & Exam Notifications
              </h2>
              <p className="text-xs text-slate-500">
                Add your 10-digit mobile number to receive daily GK revision notes, quiz notifications & instant Telegram updates.
              </p>
            </div>

            <a
              href={SOCIAL_LINKS.telegram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition-all shadow-sm shrink-0 self-start sm:self-center"
            >
              <Send className="w-4 h-4" />
              <span>Join Official Telegram Channel</span>
            </a>
          </div>

          <form onSubmit={handleSaveProfile} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="mobileNumber" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>Mobile Number (WhatsApp / Telegram)</span>
              </label>
              <input
                id="mobileNumber"
                type="tel"
                maxLength={10}
                placeholder="e.g. 9876543210"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="targetExam" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-slate-500" />
                <span>Target Exam</span>
              </label>
              <select
                id="targetExam"
                value={targetExam}
                onChange={(e) => setTargetExam(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all bg-white"
              >
                <option value="">Select Target Exam...</option>
                <option value="RPSC RAS">RPSC RAS (Pre & Mains)</option>
                <option value="REET Level-1">REET Level-1</option>
                <option value="REET Level-2">REET Level-2</option>
                <option value="CET Graduate">CET Graduate Level</option>
                <option value="CET Sr Secondary">CET Senior Secondary</option>
                <option value="Rajasthan Police SI">Rajasthan Police SI</option>
                <option value="RSMSSB LDC / Patwari">RSMSSB LDC / Patwari / VDO</option>
                <option value="Other Exams">Other Rajasthan State Exams</option>
              </select>
            </div>

            {mobileError && (
              <p className="text-xs font-semibold text-red-600 col-span-1 sm:col-span-2">{mobileError}</p>
            )}

            {profileSavedSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold col-span-1 sm:col-span-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Profile updated successfully! You can now join our official Telegram channel above.</span>
              </div>
            )}

            <div className="col-span-1 sm:col-span-2 flex items-center justify-end pt-1">
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-xs disabled:opacity-50"
              >
                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-3.5 h-3.5" />}
                <span>Save Profile Details</span>
              </button>
            </div>
          </form>
        </div>

        {/* Revision Notebook & Personalized Booster Test Card (13D & 13E) */}
        <div className="bg-gradient-to-br from-[#0B132B] to-[#1C2541] rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-6 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Smart Revision Suite (13D & 13E)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Turn Wrong Answers Into Guaranteed Marks
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Review every question you ever missed with complete explanations in your <strong>Revision Notebook</strong>, or let our engine generate a customized 20-25 question <strong>Booster Test</strong> focusing strictly on your weakest subjects.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
              <button
                type="button"
                onClick={handleGenerateBooster}
                disabled={generatingBooster}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-wider text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-2xl shadow-lg shadow-amber-500/25 transition-all active:scale-95 disabled:opacity-50"
              >
                {generatingBooster ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Building Booster...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
                    <span>Generate My Booster Test</span>
                  </>
                )}
              </button>

              <Link
                href="/profile/notebook"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl transition-all"
              >
                <BookMarked className="w-4 h-4 text-amber-400" />
                <span>Open Revision Notebook</span>
              </Link>
            </div>
          </div>

          {boosterError && (
            <div className="relative z-10 p-3.5 rounded-xl bg-red-500/20 border border-red-500/40 text-xs text-red-200">
              {boosterError}
            </div>
          )}
        </div>

        {/* Focus & Weak-Topic Analysis Section (13C) */}
        <div className="bg-white rounded-3xl border border-amber-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-extrabold text-[#0B132B] uppercase tracking-wider">
                Your Focus & Weak Topics
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Ranked weakest-first (min. 5 questions evaluated)
            </span>
          </div>

          {loadingWeakTopics ? (
            <div className="p-8 text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Analyzing your subject performance...</p>
            </div>
          ) : weakTopics.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-11 h-11 rounded-full bg-amber-50 text-amber-700 mx-auto flex items-center justify-center">
                <Flame className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">More data needed for topic analysis</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Complete at least 5 questions in any subject or syllabus category to unlock automated accuracy analytics, accuracy indicators, and targeted practice recommendations!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {weakTopics.map((item) => {
                const isCritical = item.status === "CRITICAL";
                const isImprovement = item.status === "NEEDS_IMPROVEMENT";

                return (
                  <div
                    key={item.topic}
                    className="p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-amber-50/30 transition-colors"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-[#0B132B]">
                          {item.topic}
                        </span>
                        <span
                          className={clsx(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                            isCritical
                              ? "bg-red-50 text-red-800 border-red-200"
                              : isImprovement
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-emerald-50 text-emerald-800 border-emerald-200"
                          )}
                        >
                          {isCritical
                            ? "Critical Focus Area"
                            : isImprovement
                            ? "Needs Practice"
                            : "Proficient"}
                        </span>
                      </div>

                      {/* Progress accuracy bar */}
                      <div className="w-full max-w-md space-y-1">
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={clsx(
                              "h-full rounded-full transition-all duration-500",
                              isCritical
                                ? "bg-red-500"
                                : isImprovement
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            )}
                            style={{ width: `${Math.min(100, Math.max(0, item.accuracyPercentage))}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>
                            {item.correctCount} correct / {item.questionsAttempted} attempted ({item.totalAttempts} {item.totalAttempts === 1 ? "quiz" : "quizzes"})
                          </span>
                          <span className="font-bold text-[#0B132B]">
                            {item.accuracyPercentage}% accuracy
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center justify-end">
                      <Link
                        href={`/quizzes?subject=${encodeURIComponent(item.topic)}`}
                        className={clsx(
                          "inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all shadow-xs",
                          isCritical
                            ? "bg-red-600 hover:bg-red-700 text-white"
                            : isImprovement
                            ? "bg-amber-500 hover:bg-amber-600 text-slate-950"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                        )}
                      >
                        <span>Practice This Topic</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Persisted Attempt History Section */}
        <div className="bg-white rounded-3xl border border-amber-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-extrabold text-[#0B132B] uppercase tracking-wider">
                My Quiz Attempt History
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              {attempts.length} Recorded
            </span>
          </div>

          {loadingAttempts ? (
            <div className="p-8 text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Loading your attempts...</p>
            </div>
          ) : attempts.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 mx-auto flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No tests completed yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Take your first mock test to see your scores, accuracy breakdowns, and rank on the student leaderboard!
              </p>
              <Link
                href="/quizzes"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-all shadow-xs"
              >
                <span>Take a Quiz Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {attempts.map((att) => {
                const quiz = att.quizId;
                const percentage =
                  att.totalPossibleScore > 0
                    ? Math.round((att.score / att.totalPossibleScore) * 10000) / 100
                    : 0;
                const formattedDate = new Date(att.submittedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });

                return (
                  <div
                    key={att._id}
                    className="p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-amber-50/40 transition-colors"
                  >
                    <div className="space-y-1 truncate">
                      <div className="flex items-center gap-2 flex-wrap">
                        {quiz?.subject && (
                          <span className="px-2 py-0.2 rounded-md text-[10px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200/60">
                            {quiz.subject}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 font-medium">
                          {formattedDate}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[#0B132B] truncate">
                        {quiz?.title || "Practice Test"}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-slate-500 pt-0.5">
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {att.correctCount} correct
                        </span>
                        <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                          <XCircle className="w-3.5 h-3.5" />
                          {att.incorrectCount} wrong
                        </span>
                        {att.unattemptedCount > 0 && (
                          <span className="text-slate-400">
                            {att.unattemptedCount} skipped
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-left sm:text-right">
                        <div className="text-sm font-extrabold text-[#0B132B]">
                          {att.score} / {att.totalPossibleScore} pts
                        </div>
                        <div className="text-[11px] font-bold text-amber-700">
                          {percentage}% accuracy
                        </div>
                      </div>

                      {quiz?.slug && (
                        <Link
                          href={`/quizzes/${quiz.slug}`}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-500 hover:text-slate-950 text-slate-700 text-xs font-bold transition-all whitespace-nowrap"
                        >
                          Retake Test &rarr;
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* My Reported Questions Section (Dispute Tracking) */}
        <div className="bg-white rounded-3xl border border-amber-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-extrabold text-[#0B132B] uppercase tracking-wider">
                My Reported Questions &amp; Dispute Status
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              {reports.length} Submitted
            </span>
          </div>

          {loadingReports ? (
            <div className="p-8 text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Checking your reported questions...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="p-6 text-center space-y-1.5 text-slate-500 text-xs">
              <p className="font-semibold text-slate-700">No question reports submitted yet.</p>
              <p className="text-[11px] text-slate-400">
                If you encounter an error during any test, click the flag icon on that question to submit an editorial review request.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {reports.map((rep) => {
                const isPending = rep.status === "PENDING";
                const isUnderReview = rep.status === "UNDER_REVIEW";
                const isResolved = rep.status === "RESOLVED";
                const isRejected = rep.status === "REJECTED";

                const formattedDate = new Date(rep.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });

                return (
                  <div
                    key={rep._id}
                    className="p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-amber-50/30 transition-colors"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={clsx(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                            isPending && "bg-amber-50 text-amber-800 border-amber-300",
                            isUnderReview && "bg-sky-50 text-sky-800 border-sky-300",
                            isResolved && "bg-emerald-50 text-emerald-800 border-emerald-300",
                            isRejected && "bg-rose-50 text-rose-800 border-rose-300"
                          )}
                        >
                          {rep.status === "PENDING"
                            ? "Pending Review"
                            : rep.status === "UNDER_REVIEW"
                            ? "Under Review"
                            : rep.status === "RESOLVED"
                            ? "Resolved & Verified"
                            : "Rejected - Key Upheld"}
                        </span>

                        <span className="text-[11px] font-bold text-slate-700">
                          {rep.reasonLabel}
                        </span>

                        <span className="text-[11px] text-slate-400 font-medium">
                          {formattedDate}
                        </span>
                      </div>

                      {rep.questionId?.questionText && (
                        <p className="text-xs font-bold text-[#0B132B] whitespace-pre-line line-clamp-3">
                          Question: &ldquo;{rep.questionId.questionText}&rdquo;
                        </p>
                      )}

                      {/* Editorial feedback for student (if resolved/rejected) */}
                      {rep.studentFeedback ? (
                        <div className="text-[11px] bg-slate-50 p-2 rounded-xl border border-slate-200 text-slate-700">
                          <span className="font-bold text-slate-900 block text-[10px] uppercase">
                            Editorial Board Notice:
                          </span>
                          {rep.studentFeedback}
                        </div>
                      ) : rep.resolutionReason ? (
                        <div className="text-[11px] bg-slate-50 p-2 rounded-xl border border-slate-200 text-slate-700">
                          <span className="font-bold text-slate-900 block text-[10px] uppercase">
                            Resolution Note:
                          </span>
                          {rep.resolutionReason}
                        </div>
                      ) : null}
                    </div>

                    {rep.quizSlug && (
                      <div className="shrink-0 pt-2 sm:pt-0">
                        <Link
                          href={`/quizzes/${rep.quizSlug}`}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-400 hover:text-slate-950 text-slate-700 text-xs font-bold transition-all whitespace-nowrap inline-flex items-center gap-1"
                        >
                          <span>View Quiz</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Action Navigation */}
        <div className="bg-white rounded-3xl border border-amber-200/80 shadow-xs p-6 space-y-4">
          <h2 className="text-base font-bold text-[#0B132B]">Quick Exam Tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/quizzes"
              className="p-4 rounded-2xl bg-amber-50/60 hover:bg-amber-100/80 border border-amber-200/80 transition-all flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-[#0B132B] block">Practice Quizzes</span>
                <span className="text-[11px] text-slate-500">Filter by exam & subject</span>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-700 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/leaderboard"
              className="p-4 rounded-2xl bg-amber-50/60 hover:bg-amber-100/80 border border-amber-200/80 transition-all flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-[#0B132B] block">Student Leaderboard</span>
                <span className="text-[11px] text-slate-500">Weekly statewide ranks</span>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-700 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/quiz-tools/create"
              className="p-4 rounded-2xl bg-amber-50/60 hover:bg-amber-100/80 border border-amber-200/80 transition-all flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-[#0B132B] block">AI Quiz Tool</span>
                <span className="text-[11px] text-slate-500">Convert exam papers</span>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-700 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
