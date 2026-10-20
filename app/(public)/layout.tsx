import Link from "next/link";
import Image from "next/image";
import { PublicHeader } from "@/components/layout/public-header";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { CategoryRepository } from "@/server/repositories/category";
import { SOCIAL_LINKS } from "@/server/lib/social-links";
import {
  Mail,
  ChevronRight,
  Send,
  Instagram,
  Youtube,
} from "lucide-react";

import { PresenceHeartbeat } from "@/components/analytics/presence-heartbeat";
import { TelegramStickyBar } from "@/components/public/telegram-sticky-bar";
import { PwaInstallBanner } from "@/components/public/pwa-install-banner";
import { CookieSettingsButton } from "@/components/privacy/cookie-settings-button";

export const revalidate = 60;

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await CategoryRepository.list().catch(() => []);
  const topCategories = categories.slice(0, 6);

  return (
    <>
      <PresenceHeartbeat />
      <TelegramStickyBar />
      <PwaInstallBanner />
      <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-slate-900 selection:bg-amber-200 selection:text-amber-950">

        {/* Top Dismissible Announcement Bar */}
        <AnnouncementBar />

        {/* Top Sticky Navigation */}
        <PublicHeader />

        {/* Main Page Body */}
        <main className="flex-1 w-full">{children}</main>

      {/* Comprehensive Public Footer (No Admin Links) */}
      <footer className="border-t border-amber-200/70 bg-[#0B132B] text-slate-300 text-xs w-full mt-auto">
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
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Quick Navigation
              </h2>
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
                  <Link href="/test-series" className="text-slate-300 hover:text-amber-300 transition-colors">
                    Online Test Series
                  </Link>
                </li>
                <li>
                  <Link href="/quizzes" className="text-slate-300 hover:text-amber-300 transition-colors">
                    Topic Mock Quizzes
                  </Link>
                </li>
                <li>
                  <Link href="/quiz-tools/create" className="text-slate-300 hover:text-amber-300 transition-colors">
                    AI Quiz Converter
                  </Link>
                </li>
                <li>
                  <Link href="/books" className="text-amber-300 hover:text-amber-200 transition-colors font-medium flex items-center gap-1.5">
                    <span>📚 Recommended Books</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Categories */}
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Exam Categories
              </h2>
              {topCategories.length > 0 ? (
                <ul className="space-y-2 text-xs">
                  {topCategories.map((cat) => (
                    <li key={cat._id.toString()}>
                      <Link
                        href={`/notes?category=${cat.slug}`}
                        className="text-slate-300 hover:text-amber-300 transition-colors flex items-center justify-between group"
                      >
                        <span>{cat.name}</span>
                        <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-amber-400 transition-colors" />
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
                <p className="text-slate-400 text-xs">Categories loading...</p>
              )}
            </div>

            {/* Column 4: Information & Legal */}
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Information & Legal
              </h2>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/about" className="text-slate-300 hover:text-amber-300 transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-slate-300 hover:text-amber-300 transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/privacy-policy" className="text-slate-300 hover:text-amber-300 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-slate-300 hover:text-amber-300 transition-colors">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/disclaimer" className="text-slate-300 hover:text-amber-300 transition-colors">
                    Disclaimer & Editorial Policy
                  </Link>
                </li>
                <li>
                  <CookieSettingsButton />
                </li>
                <li>
                  <Link href="/feed.xml" className="text-slate-300 hover:text-amber-300 transition-colors">
                    RSS Feed
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="border-t border-slate-800 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p className="text-xs text-slate-400 font-medium">
              &copy; {new Date().getFullYear()} Rajasthan Exam Twister. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <CookieSettingsButton className="text-slate-400 hover:text-amber-300 text-xs transition-colors cursor-pointer" />
              <span className="text-slate-600">|</span>
              <p className="text-xs text-slate-400">
                Curated GK & Revision Resource for Rajasthan Aspirants
              </p>
            </div>
          </div>
          <p className="text-[11px] text-slate-400/80 mt-3 text-center sm:text-left">
            राजस्थान एग्जाम ट्विस्टर Amazon Services LLC Associates Program का सहभागी है। यदि आप हमारे अनुशंसित लिंक्स से खरीदारी करते हैं तो हमें बिना किसी अतिरिक्त शुल्क के छोटा कमीशन प्राप्त हो सकता है।
          </p>
        </div>
      </footer>
    </div>
    </>
  );
}
