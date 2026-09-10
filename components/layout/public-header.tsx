"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Search,
  BookOpen,
  FileText,
  CheckSquare,
  Sparkles,
  FolderTree,
  Info,
  ArrowRight,
} from "lucide-react";
import clsx from "clsx";

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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center font-black text-slate-950 text-sm shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              RT
            </div>
            <div className="leading-tight">
              <span className="font-extrabold text-slate-900 tracking-tight block text-sm sm:text-base group-hover:text-amber-600 transition-colors">
                Rajasthan Exam Twister
              </span>
              <span className="text-[10px] text-amber-600 font-semibold block leading-none">
                Master GK & Revision
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
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                    item.highlight
                      ? "text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 font-bold"
                      : isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-700 hover:text-amber-600 hover:bg-slate-100"
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Search Button */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-all border border-slate-200 font-medium"
              title="Search Rajasthan GK notes, topics, and blogs"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Search GK & Notes...</span>
            </Link>
          </div>

          {/* Mobile Right Controls: Search Icon + Hamburger Toggle */}
          <div className="flex items-center gap-2 lg:hidden">
            <Link
              href="/search"
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-slate-950 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Slide-down Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-16 bg-white/98 backdrop-blur-xl border-b border-slate-200 shadow-2xl p-4 sm:p-6 space-y-4 max-h-[calc(100vh-4rem)] overflow-y-auto animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 pb-1">
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
                      ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                      : "text-slate-800 hover:bg-slate-100"
                  )}
                >
                  <span>{item.name}</span>
                  <ArrowRight className="w-4 h-4 opacity-50" />
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <Link
              href="/search"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition-colors border border-slate-200"
            >
              <Search className="w-4 h-4 text-slate-500" />
              <span>Search Entire Portal</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
