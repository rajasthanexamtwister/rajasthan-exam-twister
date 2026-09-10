"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import {
  User,
  Mail,
  Calendar,
  Award,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  LogOut,
  ShieldCheck,
  Sparkles,
  Loader2,
  FileText,
} from "lucide-react";
import clsx from "clsx";

export default function StudentProfilePage() {
  const { data: session, status } = useSession();

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
              <li>Bookmark and review wrong answers in your revision notebook</li>
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
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Header Card */}
        <div className="bg-white rounded-3xl border border-amber-200 shadow-xl p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
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

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors self-center sm:self-start"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Quick Stats Banner (Prepared for 13B-13E) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Quiz Attempts
            </span>
            <span className="text-2xl font-black text-[#0B132B] block">0</span>
            <span className="text-[10px] text-slate-400">Mock tests completed</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Overall Accuracy
            </span>
            <span className="text-2xl font-black text-amber-700 block">—</span>
            <span className="text-[10px] text-slate-400">Average % score</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Weekly Rank
            </span>
            <span className="text-2xl font-black text-emerald-700 block">—</span>
            <span className="text-[10px] text-slate-400">Statewide leaderboard</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Wrong Questions
            </span>
            <span className="text-2xl font-black text-red-600 block">0</span>
            <span className="text-[10px] text-slate-400">In revision notebook</span>
          </div>
        </div>

        {/* Quick Action Navigation */}
        <div className="bg-white rounded-3xl border border-amber-200 shadow-xs p-6 space-y-4">
          <h2 className="text-base font-bold text-[#0B132B]">Continue Studying</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/quizzes"
              className="p-4 rounded-2xl bg-amber-50/60 hover:bg-amber-100/80 border border-amber-200/80 transition-all flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-[#0B132B] block">Practice Quizzes</span>
                <span className="text-[11px] text-slate-500">Attempt state exam papers</span>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-700 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/notes"
              className="p-4 rounded-2xl bg-amber-50/60 hover:bg-amber-100/80 border border-amber-200/80 transition-all flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-[#0B132B] block">Revision Notes</span>
                <span className="text-[11px] text-slate-500">High-yield GK summaries</span>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-700 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/quiz-tools/create"
              className="p-4 rounded-2xl bg-amber-50/60 hover:bg-amber-100/80 border border-amber-200/80 transition-all flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-[#0B132B] block">AI Quiz Tool</span>
                <span className="text-[11px] text-slate-500">Convert question papers</span>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-700 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
