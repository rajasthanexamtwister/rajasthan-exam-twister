import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, BookOpen, Search, Home } from "lucide-react";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The requested page could not be found on Rajasthan Exam Twister.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#FAF8F5]">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-amber-100 text-amber-800 font-black text-3xl shadow-inner border border-amber-200">
          404
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Page Not Found
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            The page you are looking for might have been moved, renamed, or does not exist on Rajasthan Exam Twister.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-md"
          >
            <Home className="w-4 h-4" />
            <span>Go to Homepage</span>
          </Link>
          <Link
            href="/search"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-200 transition-all shadow-xs"
          >
            <Search className="w-4 h-4 text-amber-600" />
            <span>Search Content</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
