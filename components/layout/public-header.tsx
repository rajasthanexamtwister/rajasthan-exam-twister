"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Search,
  ArrowRight,
  Send,
  Instagram,
  Youtube,
} from "lucide-react";
import clsx from "clsx";
import { SOCIAL_LINKS } from "@/server/lib/social-links";

const navItems = [
  { name: "Home", href: "/" },
  { name: "Blogs", href: "/blogs" },
  { name: "Notes", href: "/notes" },
  { name: "Categories", href: "/categories" },
  { name: "Quizzes", href: "/quizzes" },
  { name: "AI Quiz Tool", href: "/quiz-tools/create", highlight: true },
  { name: "About", href: "/about" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#FFFDF9]/95 backdrop-blur-md border-b border-amber-200/60 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="relative w-10 h-10 rounded-full overflow-hidden shadow-sm ring-2 ring-amber-400/50 group-hover:scale-105 transition-transform bg-[#0B132B]">
              <Image
                src="/brand/logo.png"
                alt="Rajasthan Exam Twister Official Logo"
                width={40}
                height={40}
                className="object-cover w-full h-full"
                priority
              />
            </div>
            <div className="leading-tight">
              <span className="font-extrabold text-[#0B132B] tracking-tight block text-sm sm:text-base group-hover:text-amber-600 transition-colors">
                Rajasthan Exam Twister
              </span>
              <span className="text-[10px] text-amber-700 font-bold block leading-none font-devanagari">
                सवाल सीधा नहीं, सोच टेढ़ी करो!
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
                    item.highlight
                      ? "text-amber-900 bg-amber-100/80 hover:bg-amber-200/80 border border-amber-300 font-bold shadow-xs"
                      : isActive
                      ? "bg-[#0B132B] text-amber-300 shadow-sm"
                      : "text-slate-700 hover:text-amber-700 hover:bg-amber-50/60"
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Controls: Social Links & Search */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Social Channels Strip */}
            <div className="flex items-center gap-1 pr-2 border-r border-amber-200/60">
              <a
                href={SOCIAL_LINKS.telegram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                title="Join Telegram Channel"
                aria-label="Telegram"
              >
                <Send className="w-4 h-4" />
              </a>
              <a
                href={SOCIAL_LINKS.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-slate-600 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                title="Follow on Instagram"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={SOCIAL_LINKS.twitter.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors font-mono text-xs"
                title="Follow on X (Twitter)"
                aria-label="X (Twitter)"
              >
                𝕏
              </a>
              <a
                href={SOCIAL_LINKS.youtube.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Subscribe on YouTube"
                aria-label="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>

            {/* Desktop Search Button */}
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-700 hover:text-[#0B132B] bg-amber-50/60 hover:bg-amber-100/70 rounded-xl transition-all border border-amber-200/80 font-medium shadow-xs"
              title="Search Rajasthan GK notes, topics, and blogs"
            >
              <Search className="w-3.5 h-3.5 text-amber-700" />
              <span>Search GK...</span>
            </Link>
          </div>

          {/* Mobile Right Controls: Search Icon + Hamburger Toggle */}
          <div className="flex items-center gap-2 lg:hidden">
            <Link
              href="/search"
              className="p-2 text-slate-700 hover:text-slate-950 rounded-xl bg-amber-50 hover:bg-amber-100/70 transition-colors border border-amber-200/60"
              aria-label="Search"
            >
              <Search className="w-4 h-4 text-amber-700" />
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-800 hover:text-[#0B132B] rounded-xl hover:bg-amber-50/80 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-amber-700" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Slide-down Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-16 bg-[#FFFDF9]/98 backdrop-blur-xl border-b border-amber-200 shadow-2xl p-4 sm:p-6 space-y-4 max-h-[calc(100vh-4rem)] overflow-y-auto animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-1">
            <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider px-3 pb-1">
              Navigation
            </div>
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={clsx(
                    "flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all",
                    isActive
                      ? "bg-amber-500 text-[#0B132B] font-bold shadow-sm"
                      : "text-slate-800 hover:bg-amber-50/70"
                  )}
                >
                  <span>{item.name}</span>
                  <ArrowRight className="w-4 h-4 opacity-50" />
                </Link>
              );
            })}
          </div>

          {/* Mobile Social Channel Row */}
          <div className="pt-3 border-t border-amber-100 flex items-center justify-around py-2 bg-amber-50/60 rounded-2xl">
            <a
              href={SOCIAL_LINKS.telegram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 text-[11px] font-bold text-sky-700"
            >
              <Send className="w-4 h-4" />
              <span>Telegram</span>
            </a>
            <a
              href={SOCIAL_LINKS.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 text-[11px] font-bold text-pink-700"
            >
              <Instagram className="w-4 h-4" />
              <span>Instagram</span>
            </a>
            <a
              href={SOCIAL_LINKS.twitter.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 text-[11px] font-bold text-slate-900"
            >
              <span className="font-mono text-sm leading-4">𝕏</span>
              <span>Twitter</span>
            </a>
            <a
              href={SOCIAL_LINKS.youtube.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 text-[11px] font-bold text-red-700"
            >
              <Youtube className="w-4 h-4" />
              <span>YouTube</span>
            </a>
          </div>

          <div className="pt-2">
            <Link
              href="/search"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-amber-50 hover:bg-amber-100/80 text-xs font-bold text-[#0B132B] transition-colors border border-amber-200"
            >
              <Search className="w-4 h-4 text-amber-700" />
              <span>Search Entire Portal</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
