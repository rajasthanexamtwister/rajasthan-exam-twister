import Link from "next/link";
import Image from "next/image";
import { PublicHeader } from "@/components/layout/public-header";
import { CategoryRepository } from "@/server/repositories/category";
import { SOCIAL_LINKS } from "@/server/lib/social-links";
import {
  Mail,
  ArrowUpRight,
  Send,
  Instagram,
  Youtube,
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
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-slate-900 selection:bg-amber-200 selection:text-amber-950">
      {/* Top Sticky Navigation */}
      <PublicHeader />

      {/* Main Page Body */}
      <main className="flex-1">{children}</main>

      {/* Comprehensive Public Footer (No Admin Links) */}
      <footer className="border-t border-amber-200/70 bg-[#0B132B] text-slate-300 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Column 1: Brand, Mission & Official Channels */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-amber-400 bg-slate-900 shrink-0">
                  <Image
                    src="/brand/logo.png"
                    alt="Rajasthan Exam Twister Official Logo"
                    width={36}
                    height={36}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div>
                  <span className="font-extrabold text-white text-sm block leading-tight">
                    Rajasthan Exam Twister
                  </span>
                  <span className="text-[10px] text-amber-400 font-bold block leading-none font-devanagari">
                    सवाल सीधा नहीं, सोच टेढ़ी करो!
                  </span>
                </div>
              </div>

              <p className="text-slate-400 leading-relaxed text-xs">
                Comprehensive GK revision notes, infographics handbooks, current affairs blogs, and mock quizzes for REET, RPSC, CET, Police SI, and state recruitment exams.
              </p>

              {/* Official Social Links in Footer */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-2">
                  Official Channels
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={SOCIAL_LINKS.telegram.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-slate-900/80 hover:bg-sky-600 hover:text-white text-slate-300 transition-all border border-slate-800 hover:border-sky-500 shadow-xs"
                    title="Join Telegram Channel"
                    aria-label="Telegram Channel"
                  >
                    <Send className="w-4 h-4" />
                  </a>
                  <a
                    href={SOCIAL_LINKS.instagram.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-slate-900/80 hover:bg-pink-600 hover:text-white text-slate-300 transition-all border border-slate-800 hover:border-pink-500 shadow-xs"
                    title="Follow on Instagram"
                    aria-label="Instagram Profile"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                  <a
                    href={SOCIAL_LINKS.twitter.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 hover:text-white text-slate-300 transition-all border border-slate-800 hover:border-slate-600 shadow-xs font-mono text-sm leading-none flex items-center justify-center w-8 h-8"
                    title="Follow on X (Twitter)"
                    aria-label="X (Twitter) Profile"
                  >
                    𝕏
                  </a>
                  <a
                    href={SOCIAL_LINKS.youtube.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-slate-900/80 hover:bg-red-600 hover:text-white text-slate-300 transition-all border border-slate-800 hover:border-red-500 shadow-xs"
                    title="Subscribe on YouTube"
                    aria-label="YouTube Channel"
                  >
                    <Youtube className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Quick Navigation
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/" className="text-slate-300 hover:text-amber-300 transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/blogs" className="text-slate-300 hover:text-amber-300 transition-colors">
                    Articles & Current Affairs
                  </Link>
                </li>
                <li>
                  <Link href="/notes" className="text-slate-300 hover:text-amber-300 transition-colors">
                    Exam Revision Notes
                  </Link>
                </li>
                <li>
                  <Link href="/categories" className="text-slate-300 hover:text-amber-300 transition-colors">
                    All Exam Categories
                  </Link>
                </li>
                <li>
                  <Link href="/quizzes" className="text-slate-300 hover:text-amber-300 transition-colors">
                    Mock Quizzes & Test Series
                  </Link>
                </li>
                <li>
                  <Link href="/quiz-tools/create" className="text-slate-300 hover:text-amber-300 transition-colors">
                    AI Quiz Converter
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Categories */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Exam Categories
              </h4>
              {topCategories.length > 0 ? (
                <ul className="space-y-2 text-xs">
                  {topCategories.map((cat) => (
                    <li key={cat._id.toString()}>
                      <Link
                        href={`/notes?category=${cat.slug}`}
                        className="text-slate-300 hover:text-amber-300 transition-colors flex items-center justify-between group"
                      >
                        <span>{cat.name}</span>
                        <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-amber-400 transition-colors" />
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link
                      href="/categories"
                      className="text-amber-400 font-semibold hover:underline block pt-1"
                    >
                      View all categories &rarr;
                    </Link>
                  </li>
                </ul>
              ) : (
                <p className="text-slate-500 text-xs">Categories loading...</p>
              )}
            </div>

            {/* Column 4: Information & Search */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Information & Portal
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/about" className="text-slate-300 hover:text-amber-300 transition-colors">
                    About Rajasthan Exam Twister
                  </Link>
                </li>
                <li>
                  <Link href="/search" className="text-slate-300 hover:text-amber-300 transition-colors">
                    Search Notes & MCQs
                  </Link>
                </li>
                <li>
                  <Link href="/feed.xml" className="text-slate-300 hover:text-amber-300 transition-colors">
                    RSS Feed (Syndication)
                  </Link>
                </li>
                <li className="pt-2">
                  <span className="text-[11px] text-slate-400 block mb-1">Need study guidance or help?</span>
                  <Link
                    href="/about"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B132B] bg-amber-400 hover:bg-amber-300 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Contact Team</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright & Disclaimer */}
          <div className="border-t border-slate-800 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <p>
              &copy; {new Date().getFullYear()} Rajasthan Exam Twister. All rights reserved.
            </p>
            <p className="text-center sm:text-right">
              Dedicated study material & test series for Rajasthan Competitive Examinations.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
