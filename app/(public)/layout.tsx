import Link from "next/link";
import { PublicHeader } from "@/components/layout/public-header";
import { CategoryRepository } from "@/server/repositories/category";
import {
  BookOpen,
  FileText,
  CheckSquare,
  Sparkles,
  FolderTree,
  Mail,
  ArrowUpRight,
  ShieldAlert,
} from "lucide-react";

export const revalidate = 60;

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await CategoryRepository.list().catch(() => []);
  const topCategories = categories.slice(0, 6);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-amber-100 selection:text-amber-900">
      {/* Top Navigation */}
      <PublicHeader />

      {/* Main Page Body */}
      <main className="flex-1">{children}</main>

      {/* Comprehensive Public Footer (No Admin Links) */}
      <footer className="border-t border-slate-200 bg-white text-slate-600 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Column 1: Brand & Mission */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center font-black text-slate-950 text-sm shadow-sm">
                  RT
                </div>
                <div>
                  <span className="font-extrabold text-slate-900 text-sm block leading-tight">
                    Rajasthan Exam Twister
                  </span>
                  <span className="text-[10px] text-amber-600 font-semibold block leading-none">
                    State Exam Hub
                  </span>
                </div>
              </div>

              <p className="text-slate-500 leading-relaxed text-xs">
                Comprehensive study notes, infographic handbooks, current affairs blogs, and interactive mock tests for REET, RPSC, CET, Police SI, and state exams in Rajasthan.
              </p>
            </div>

            {/* Column 2: Quick Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Quick Navigation
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/" className="hover:text-amber-600 transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/blogs" className="hover:text-amber-600 transition-colors">
                    Articles & Current Affairs
                  </Link>
                </li>
                <li>
                  <Link href="/notes" className="hover:text-amber-600 transition-colors">
                    Exam Revision Notes
                  </Link>
                </li>
                <li>
                  <Link href="/categories" className="hover:text-amber-600 transition-colors">
                    All Exam Categories
                  </Link>
                </li>
                <li>
                  <Link href="/quizzes" className="hover:text-amber-600 transition-colors">
                    Mock Quizzes & Test Series
                  </Link>
                </li>
                <li>
                  <Link href="/quiz-tools/create" className="hover:text-amber-600 transition-colors">
                    AI Quiz Converter
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Categories */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Exam Categories
              </h4>
              {topCategories.length > 0 ? (
                <ul className="space-y-2 text-xs">
                  {topCategories.map((cat) => (
                    <li key={cat._id.toString()}>
                      <Link
                        href={`/notes?category=${cat.slug}`}
                        className="hover:text-amber-600 transition-colors flex items-center justify-between"
                      >
                        <span>{cat.name}</span>
                        <ArrowUpRight className="w-3 h-3 text-slate-400" />
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link
                      href="/categories"
                      className="text-amber-600 font-semibold hover:underline block pt-1"
                    >
                      View all categories &rarr;
                    </Link>
                  </li>
                </ul>
              ) : (
                <p className="text-slate-400 text-xs">Categories loading...</p>
              )}
            </div>

            {/* Column 4: Information & Search */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Information & Portal
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/about" className="hover:text-amber-600 transition-colors">
                    About Rajasthan Exam Twister
                  </Link>
                </li>
                <li>
                  <Link href="/search" className="hover:text-amber-600 transition-colors">
                    Search Notes & MCQs
                  </Link>
                </li>
                <li className="pt-2">
                  <span className="text-[11px] text-slate-400 block mb-1">Need help or study material?</span>
                  <Link
                    href="/about"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Contact Team</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright & Disclaimer */}
          <div className="border-t border-slate-200 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <p>
              &copy; {new Date().getFullYear()} Rajasthan Exam Twister. All rights reserved.
            </p>
            <p className="text-center sm:text-right">
              Dedicated study material for Rajasthan Competitive Examinations.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
