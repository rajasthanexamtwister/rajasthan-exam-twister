import Link from "next/link";
import { getSiteUrl } from "@/server/lib/seo";
import { ArrowRight, BookOpen, FileText, Search, ShieldCheck, Sparkles } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Rajasthan Exam Twister — Master Revision Guides & Exam Notes",
  description:
    "High-yield GK handbooks, current affairs blogs, and fast revision sheets for REET, RPSC, CET, Police, and state competitive exams in Rajasthan.",
  alternates: {
    canonical: getSiteUrl(),
  },
  openGraph: {
    title: "Rajasthan Exam Twister — Master Revision Guides & Exam Notes",
    description:
      "High-yield GK handbooks, current affairs blogs, and fast revision sheets for Rajasthan competitive exams.",
    url: getSiteUrl(),
    type: "website",
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center font-bold text-slate-950 text-sm shadow-sm">
            RT
          </div>
          <span className="font-bold text-slate-900 tracking-tight">
            Rajasthan Exam Twister
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/search"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors border border-slate-200"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Search</span>
          </Link>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-amber-600 bg-slate-100 hover:bg-amber-50 px-3 py-1.5 rounded-lg transition-colors border border-slate-200"
          >
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Admin Portal</span>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-200 text-amber-800 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Rajasthan State Exam Preparation Portal</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Master Revision Guides & Exam Notes for Rajasthan Aspirants
        </h1>

        <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl">
          High-yield GK handbooks, current affairs blogs, and fast revision sheets for REET, RPSC, CET, Police, and state competitive exams.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/notes"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 transition-all"
          >
            <BookOpen className="w-4 h-4" />
            <span>Browse Exam Notes</span>
          </Link>
          <Link
            href="/blogs"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-semibold text-sm border border-slate-200 shadow-sm transition-all"
          >
            <FileText className="w-4 h-4 text-amber-600" />
            <span>Read Articles</span>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 text-center text-xs text-slate-500 bg-white">
        © {new Date().getFullYear()} Rajasthan Exam Twister. All rights reserved.
      </footer>
    </div>
  );
}
