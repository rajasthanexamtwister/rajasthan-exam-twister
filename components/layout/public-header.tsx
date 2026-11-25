"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  Menu,
  X,
  Search,
  ArrowRight,
  Send,
  Instagram,
  Youtube,
  User,
  LogOut,
  ChevronDown,
  BookOpen,
  CheckSquare,
  FileText,
  FolderTree,
  Bookmark,
  Trophy,
  Sparkles,
  Info,
  Phone,
  Flame,
} from "lucide-react";
import clsx from "clsx";
import { trackStudentLogin } from "@/components/analytics/gtag-events";
import { SOCIAL_LINKS } from "@/server/lib/social-links";

// Streamlined top navigation items for desktop to avoid clutter
const primaryNavItems = [
  { name: "Home", href: "/" },
  { name: "Test Series", href: "/test-series" },
  { name: "Free Quizzes", href: "/quizzes", isQuiz: true },
  { name: "Exam Notes", href: "/notes" },
  { name: "Articles & GK", href: "/blogs" },
  { name: "Categories", href: "/categories" },
];

const moreNavItems = [
  { name: "Recommended Books", href: "/books", icon: BookOpen, desc: "Curated Exam Prep Books & Store" },
  { name: "Revision Notebook", href: "/notebook", icon: Bookmark, desc: "Saved MCQs & Study Sheets" },
  { name: "State Leaderboard", href: "/leaderboard", icon: Trophy, desc: "Rajasthan Student Rankings" },
  { name: "AI Quiz Converter", href: "/quiz-tools/create", icon: Sparkles, desc: "Convert Exam Papers" },
  { name: "About Exam Twister", href: "/about", icon: Info, desc: "Our Mission & Credentials" },
  { name: "Contact & Support", href: "/contact", icon: Phone, desc: "Feedback & Inquiries" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);

  const userDropdownRef = useRef<HTMLDivElement | null>(null);
  const moreDropdownRef = useRef<HTMLDivElement | null>(null);

  const { data: session, status } = useSession();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    setMoreDropdownOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Close desktop dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(event.target as Node)) {
        setMoreDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isMoreActive = moreNavItems.some(
    (item) => item.href === pathname || pathname.startsWith(item.href)
  );

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FFFDF9] border-b border-amber-200/80 shadow-xs transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">
            {/* Brand Logo & Editorial Title */}
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 shrink-0 group">
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden shadow-xs ring-2 ring-amber-400/70 group-hover:scale-105 transition-transform bg-[#0B132B]">
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
                <span className="font-extrabold text-[#0B132B] tracking-tight block text-sm sm:text-base group-hover:text-amber-700 transition-colors font-heading">
                  Rajasthan Exam Twister
                </span>
                <span className="text-[10px] text-amber-700 font-bold block leading-none font-devanagari">
                  सवाल सीधा नहीं, सोच टेढ़ी करो!
                </span>
              </div>
            </Link>

            {/* Streamlined Desktop Navigation (Uncluttered, High Contrast) */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5" aria-label="Main Navigation">
              {primaryNavItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={clsx(
                      "px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5",
                      item.isQuiz
                        ? isActive
                          ? "bg-amber-500 text-[#0B132B] shadow-xs"
                          : "bg-amber-100/80 text-amber-950 hover:bg-amber-200 border border-amber-300/80 shadow-2xs"
                        : isActive
                        ? "bg-[#0B132B] text-amber-300 shadow-xs"
                        : "text-slate-700 hover:text-amber-800 hover:bg-amber-50/70"
                    )}
                  >
                    {item.isQuiz && <Flame className="w-3.5 h-3.5 text-amber-700" />}
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              {/* "More Tools" Clean Dropdown */}
              <div className="relative" ref={moreDropdownRef}>
                <button
                  type="button"
                  onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                  className={clsx(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1",
                    isMoreActive
                      ? "bg-[#0B132B] text-amber-300 shadow-xs"
                      : "text-slate-700 hover:text-amber-800 hover:bg-amber-50/70"
                  )}
                  aria-expanded={moreDropdownOpen}
                  aria-haspopup="true"
                >
                  <span>More Tools</span>
                  <ChevronDown className={clsx("w-3.5 h-3.5 transition-transform", moreDropdownOpen && "rotate-180")} />
                </button>

                {moreDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl border border-amber-200/90 shadow-xl p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150 z-50">
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">
                      Student Utilities
                    </div>
                    {moreNavItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname.startsWith(item.href);
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setMoreDropdownOpen(false)}
                          className={clsx(
                            "flex items-start gap-2.5 p-2 rounded-xl transition-colors text-left",
                            isActive ? "bg-amber-50 text-amber-950 font-bold" : "text-slate-700 hover:bg-slate-50 hover:text-amber-900"
                          )}
                        >
                          <div className="p-1.5 rounded-lg bg-amber-100 text-amber-900 shrink-0 mt-0.5">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="leading-tight">
                            <div className="text-xs font-bold text-slate-900">{item.name}</div>
                            <div className="text-[11px] text-slate-500 font-normal">{item.desc}</div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </nav>

            {/* Right Controls: Search & Student Auth */}
            <div className="hidden sm:flex items-center gap-2.5">

              {/* Search Shortcut */}
              <Link
                href="/search"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-700 hover:text-[#0B132B] bg-amber-50/70 hover:bg-amber-100/80 rounded-xl transition-all border border-amber-200/80 font-medium shadow-2xs whitespace-nowrap"
                title="Search Rajasthan GK notes, topics, and blogs"
              >
                <Search className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden md:inline">Search GK...</span>
              </Link>

              {/* Student Auth: Google Sign-in / User Dropdown */}
              {status === "loading" ? (
                <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
              ) : session?.user ? (
                <div className="relative" ref={userDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-1.5 p-1 pl-1.5 pr-2 rounded-xl bg-amber-50/80 hover:bg-amber-100 border border-amber-200 transition-all text-xs font-semibold text-slate-900"
                    aria-label="User Account Menu"
                    aria-expanded={userDropdownOpen}
                  >
                    {session.user.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || "Student"}
                        width={24}
                        height={24}
                        className="rounded-full ring-1 ring-amber-400"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-[11px]">
                        {(session.user.name || "S").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="max-w-[90px] truncate">{session.user.name?.split(" ")[0]}</span>
                    <ChevronDown className="w-3 h-3 text-slate-500" />
                  </button>

                  {/* User Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-amber-200/90 shadow-xl p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150 z-50">
                      <div className="p-2.5 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900 truncate">{session.user.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{session.user.email}</p>
                      </div>

                      <Link
                        href="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-900 transition-colors"
                      >
                        <User className="w-3.5 h-3.5 text-amber-600" />
                        <span>My Profile & Progress</span>
                      </Link>

                      <Link
                        href="/notebook"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-900 transition-colors"
                      >
                        <Bookmark className="w-3.5 h-3.5 text-amber-600" />
                        <span>Saved Revision Notebook</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          signOut({ callbackUrl: "/" });
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    trackStudentLogin("google");
                    signIn("google", { callbackUrl: "/profile" });
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
                  <span>Sign in</span>
                </button>
              )}
            </div>

            {/* Mobile Controls: Search + Hamburger Toggle */}
            <div className="flex items-center gap-2 lg:hidden">
              <Link
                href="/search"
                className="p-2 text-slate-700 hover:text-slate-950 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors border border-amber-200/60"
                aria-label="Search Rajasthan Exam Twister"
              >
                <Search className="w-4 h-4 text-amber-700" />
              </Link>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-800 hover:text-[#0B132B] rounded-xl hover:bg-amber-50 transition-colors border border-amber-200/60"
                aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-amber-700" />
                ) : (
                  <Menu className="w-5 h-5 text-slate-800" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* High-Performance Mobile Slide-Over Drawer with Opaque Backdrop */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-start">
          {/* Dark backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Body */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
            className="relative z-10 w-full bg-[#FAF8F5] border-b-2 border-amber-400 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto animate-in slide-in-from-top duration-200"
          >
            {/* Drawer Header Bar */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-amber-200/80 bg-white sticky top-0 z-20">
              <div className="flex items-center gap-2.5">
                <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-amber-400 bg-[#0B132B]">
                  <Image
                    src="/brand/logo.png"
                    alt="Rajasthan Exam Twister Logo"
                    width={32}
                    height={32}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div>
                  <span className="font-extrabold text-[#0B132B] text-xs block leading-tight font-heading">
                    Rajasthan Exam Twister
                  </span>
                  <span className="text-[9px] text-amber-700 font-bold block leading-none font-devanagari">
                    सवाल सीधा नहीं, सोच टेढ़ी करो!
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-amber-700" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-4 space-y-4">
              {/* Prominent Free Quiz Banner Callout on Mobile */}
              <Link
                href="/quizzes"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 flex items-center justify-between shadow-md border border-amber-300 font-bold text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#0B132B] text-amber-400 flex items-center justify-center shrink-0">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-950 font-heading">Free Mock Tests & MCQs</div>
                    <div className="text-[10px] text-slate-800 font-medium">REET, RPSC, CET, Police SI</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </Link>

              {/* Student Auth Section */}
              <div className="p-3 bg-white rounded-2xl border border-amber-200/80 shadow-xs">
                {session?.user ? (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 truncate">
                      {session.user.image ? (
                        <Image
                          src={session.user.image}
                          alt={session.user.name || "Student"}
                          width={36}
                          height={36}
                          className="rounded-full ring-2 ring-amber-400"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                          {(session.user.name || "S").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-900 truncate">{session.user.name}</p>
                        <Link
                          href="/profile"
                          onClick={() => setMobileMenuOpen(false)}
                          className="text-[11px] text-amber-700 hover:underline font-semibold block"
                        >
                          View Student Dashboard &rarr;
                        </Link>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors shrink-0"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      trackStudentLogin("google");
                      signIn("google", { callbackUrl: "/profile" });
                    }}
                    className="w-full py-2.5 px-4 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
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
                )}
              </div>

              {/* Core Navigation Sections */}
              <div className="bg-white rounded-2xl border border-amber-200/80 p-2 space-y-1 shadow-xs">
                <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider px-3 py-1 font-devanagari">
                  मुख्य अध्ययन भाग (Core Modules)
                </div>

                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={clsx(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all min-h-[44px]",
                    pathname === "/" ? "bg-amber-500 text-[#0B132B] font-bold shadow-xs" : "text-slate-800 hover:bg-amber-50"
                  )}
                >
                  <span>Home (मुख्य पृष्ठ)</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                </Link>

                <Link
                  href="/test-series"
                  onClick={() => setMobileMenuOpen(false)}
                  className={clsx(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all min-h-[44px]",
                    pathname.startsWith("/test-series") ? "bg-amber-500 text-[#0B132B] font-bold shadow-xs" : "text-slate-800 hover:bg-amber-50"
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-700" />
                    <span>Online Test Series (टेस्ट सीरीज़)</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded-md">
                      Mocks
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                  </span>
                </Link>

                <Link
                  href="/quizzes"
                  onClick={() => setMobileMenuOpen(false)}
                  className={clsx(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all min-h-[44px]",
                    pathname.startsWith("/quizzes") ? "bg-amber-500 text-[#0B132B] font-bold shadow-xs" : "text-slate-800 hover:bg-amber-50"
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-amber-700" />
                    <span>Free Quizzes & Mock Tests</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                </Link>

                <Link
                  href="/notes"
                  onClick={() => setMobileMenuOpen(false)}
                  className={clsx(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all min-h-[44px]",
                    pathname.startsWith("/notes") ? "bg-amber-500 text-[#0B132B] font-bold shadow-xs" : "text-slate-800 hover:bg-amber-50"
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                    <span>Exam Notes & Revision Sheets</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                </Link>

                {/* Recommended Books Link in Mobile Menu */}
                <Link
                  href="/books"
                  onClick={() => setMobileMenuOpen(false)}
                  className={clsx(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all min-h-[44px]",
                    pathname.startsWith("/books") ? "bg-amber-500 text-[#0B132B] font-bold shadow-xs" : "text-slate-800 hover:bg-amber-50"
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                    <span>Recommended Books (सर्वश्रेष्ठ पुस्तकें)</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded-md">
                      Book Store
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                  </span>
                </Link>

                <Link
                  href="/blogs"
                  onClick={() => setMobileMenuOpen(false)}
                  className={clsx(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all min-h-[44px]",
                    pathname.startsWith("/blogs") ? "bg-amber-500 text-[#0B132B] font-bold shadow-xs" : "text-slate-800 hover:bg-amber-50"
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-700" />
                    <span>Articles & Current Affairs</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                </Link>

                <Link
                  href="/categories"
                  onClick={() => setMobileMenuOpen(false)}
                  className={clsx(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all min-h-[44px]",
                    pathname.startsWith("/categories") ? "bg-amber-500 text-[#0B132B] font-bold shadow-xs" : "text-slate-800 hover:bg-amber-50"
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <FolderTree className="w-3.5 h-3.5 text-amber-700" />
                    <span>All Exam Categories</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                </Link>
              </div>

              {/* Student Utilities Section */}
              <div className="bg-white rounded-2xl border border-amber-200/80 p-2 space-y-1 shadow-xs">
                <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider px-3 py-1 font-devanagari">
                  विद्यार्थी टूल्स (Student Tools)
                </div>

                <Link
                  href="/notebook"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-800 hover:bg-amber-50 min-h-[44px]"
                >
                  <span className="flex items-center gap-1.5">
                    <Bookmark className="w-3.5 h-3.5 text-amber-700" />
                    <span>Revision Notebook (सेव किए प्रश्न)</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                </Link>

                <Link
                  href="/leaderboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-800 hover:bg-amber-50 min-h-[44px]"
                >
                  <span className="flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-700" />
                    <span>State Leaderboard (रैंकिंग)</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                </Link>

                <Link
                  href="/quiz-tools/create"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-800 hover:bg-amber-50 min-h-[44px]"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                    <span>AI Quiz Converter (पेपर कन्वर्टर)</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                </Link>
              </div>

              {/* Official Social Channels Strip */}
              <div className="bg-[#0B132B] rounded-2xl p-3 text-white flex items-center justify-around shadow-sm">
                <a
                  href={SOCIAL_LINKS.telegram.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1 text-[10px] font-bold text-slate-200 hover:text-sky-400 transition-colors p-2"
                >
                  <Send className="w-4 h-4 text-sky-400" />
                  <span>Telegram</span>
                </a>
                <a
                  href={SOCIAL_LINKS.instagram.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1 text-[10px] font-bold text-slate-200 hover:text-pink-400 transition-colors p-2"
                >
                  <Instagram className="w-4 h-4 text-pink-400" />
                  <span>Instagram</span>
                </a>
                <a
                  href={SOCIAL_LINKS.twitter.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1 text-[10px] font-bold text-slate-200 hover:text-amber-400 transition-colors p-2"
                >
                  <span className="font-mono text-sm leading-4">𝕏</span>
                  <span>Twitter</span>
                </a>
                <a
                  href={SOCIAL_LINKS.youtube.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1 text-[10px] font-bold text-slate-200 hover:text-red-400 transition-colors p-2"
                >
                  <Youtube className="w-4 h-4 text-red-400" />
                  <span>YouTube</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
