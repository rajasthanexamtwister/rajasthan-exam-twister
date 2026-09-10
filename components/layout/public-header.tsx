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
} from "lucide-react";
import clsx from "clsx";
import { SOCIAL_LINKS } from "@/server/lib/social-links";

const navItems = [
  { name: "Home", href: "/" },
  { name: "Blogs", href: "/blogs" },
  { name: "Notes", href: "/notes" },
  { name: "Quizzes", href: "/quizzes" },
  { name: "Leaderboard", href: "/leaderboard" },
  { name: "Categories", href: "/categories" },
  { name: "AI Quiz Tool", href: "/quiz-tools/create", highlight: true },
  { name: "About", href: "/about" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const { data: session, status } = useSession();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
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

  // Close desktop user dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FFFDF9] border-b border-amber-200/70 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">
            {/* Brand Logo & Name */}
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 shrink-0 group">
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden shadow-sm ring-2 ring-amber-400/50 group-hover:scale-105 transition-transform bg-[#0B132B]">
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

            {/* Right Controls: Social Links, Search & Student Auth */}
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
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:text-[#0B132B] bg-amber-50/60 hover:bg-amber-100/70 rounded-xl transition-all border border-amber-200/80 font-medium shadow-xs"
                title="Search Rajasthan GK notes, topics, and blogs"
              >
                <Search className="w-3.5 h-3.5 text-amber-700" />
                <span>Search GK...</span>
              </Link>

              {/* Student Auth: Google Sign-in / User Dropdown */}
              {status === "loading" ? (
                <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
              ) : session?.user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-1.5 p-1 pl-1.5 pr-2 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 transition-all text-xs font-semibold text-slate-900"
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
                    <span className="max-w-[100px] truncate">{session.user.name?.split(" ")[0]}</span>
                    <ChevronDown className="w-3 h-3 text-slate-500" />
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150 z-50">
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
                  onClick={() => signIn("google", { callbackUrl: "/profile" })}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-xs"
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

            {/* Mobile Right Controls: Search Icon + Hamburger Toggle */}
            <div className="flex items-center gap-1.5 lg:hidden">
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

      {/* Mobile Slide-Over Drawer with Backdrop (Rendered outside header flow) */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-start">
          {/* Dark semi-transparent backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Solid Opaque Drawer Container */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
            className="relative z-10 w-full bg-[#FAF8F5] border-b-2 border-amber-300 shadow-2xl flex flex-col max-h-[85vh] overflow-y-auto animate-in slide-in-from-top duration-200"
          >
            {/* Drawer Header Bar */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-amber-200/70 bg-white sticky top-0 z-20">
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
                  <span className="font-extrabold text-[#0B132B] text-xs block leading-tight">
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
              {/* Student Auth Banner */}
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
                          View Profile &rarr;
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
                      signIn("google", { callbackUrl: "/profile" });
                    }}
                    className="w-full py-2.5 px-4 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
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

              {/* Navigation Links */}
              <div className="bg-white rounded-2xl border border-amber-200/80 p-2 space-y-1 shadow-xs">
                <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider px-3 py-1 font-devanagari">
                  नेविगेशन मेनू
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
                        "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all",
                        isActive
                          ? "bg-amber-500 text-[#0B132B] font-bold shadow-xs"
                          : "text-slate-800 hover:bg-amber-50"
                      )}
                    >
                      <span>{item.name}</span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                    </Link>
                  );
                })}
              </div>

              {/* Search Shortcut */}
              <div>
                <Link
                  href="/search"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white hover:bg-amber-50 text-xs font-bold text-[#0B132B] transition-colors border border-amber-200/80 shadow-xs"
                >
                  <Search className="w-4 h-4 text-amber-700" />
                  <span>Search Entire Portal</span>
                </Link>
              </div>

              {/* Official Social Channel Strip */}
              <div className="bg-[#0B132B] rounded-2xl p-3 text-white flex items-center justify-around shadow-sm">
                <a
                  href={SOCIAL_LINKS.telegram.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1 text-[10px] font-bold text-slate-200 hover:text-sky-400 transition-colors"
                >
                  <Send className="w-4 h-4 text-sky-400" />
                  <span>Telegram</span>
                </a>
                <a
                  href={SOCIAL_LINKS.instagram.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1 text-[10px] font-bold text-slate-200 hover:text-pink-400 transition-colors"
                >
                  <Instagram className="w-4 h-4 text-pink-400" />
                  <span>Instagram</span>
                </a>
                <a
                  href={SOCIAL_LINKS.twitter.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1 text-[10px] font-bold text-slate-200 hover:text-amber-400 transition-colors"
                >
                  <span className="font-mono text-sm leading-4">𝕏</span>
                  <span>Twitter</span>
                </a>
                <a
                  href={SOCIAL_LINKS.youtube.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1 text-[10px] font-bold text-slate-200 hover:text-red-400 transition-colors"
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
