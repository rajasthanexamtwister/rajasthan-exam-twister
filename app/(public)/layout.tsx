import Link from "next/link";
import { BookOpen, FileText, Search, ShieldCheck, Sparkles } from "lucide-react";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar / Header */}
      <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center font-bold text-slate-950 text-sm shadow-sm">
              RT
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight block text-sm sm:text-base leading-tight">
                Rajasthan Exam Twister
              </span>
              <span className="text-[10px] text-amber-600 font-semibold block leading-none">
                Master GK & Revision
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/blogs"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-amber-600 hover:bg-slate-100 transition-colors"
            >
              Blogs & Articles
            </Link>
            <Link
              href="/notes"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-amber-600 hover:bg-slate-100 transition-colors"
            >
              Exam Notes
            </Link>
            <Link
              href="/quizzes"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-amber-600 hover:bg-slate-100 transition-colors"
            >
              Mock Quizzes
            </Link>
            <Link
              href="/quiz-tools/create"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors"
            >
              AI Quiz Tool
            </Link>
            <Link
              href="/about"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-amber-600 hover:bg-slate-100 transition-colors"
            >
              About
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/search"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 bg-slate-100/80 hover:bg-slate-200/80 rounded-xl transition-all border border-slate-200"
            title="Search notes and articles"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline font-medium">Search GK & Notes...</span>
          </Link>

          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-amber-700 bg-slate-100 hover:bg-amber-50 px-3 py-1.5 rounded-lg transition-colors border border-slate-200"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Admin CMS</span>
          </Link>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200 bg-white text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-semibold text-slate-700">Rajasthan Exam Twister</p>
          <p className="text-slate-500 max-w-md mx-auto text-[11px]">
            Comprehensive study notes, revision guides, and current affairs for REET, RPSC, CET, Police, and competitive exams in Rajasthan.
          </p>
          <p className="pt-2 text-[10px] text-slate-400">
            © {new Date().getFullYear()} Rajasthan Exam Twister. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
