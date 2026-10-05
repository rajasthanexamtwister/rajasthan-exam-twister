"use client";

import { useState, useEffect } from "react";
import { Send, X, Sparkles } from "lucide-react";
import { SOCIAL_LINKS } from "@/server/lib/social-links";
import { useSession } from "next-auth/react";

export const TELEGRAM_BANNER_INTERVAL_JOINED_DAYS = 30;
export const TELEGRAM_BANNER_INTERVAL_NOT_JOINED_DAYS = 7;

export function TelegramStickyBar() {
  const { data: session } = useSession();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Determine user joined state
    const isJoinedStored = typeof window !== "undefined" && localStorage.getItem("ret_telegram_joined") === "true";
    const userJoinedSession = Boolean((session?.user as any)?.telegramJoined);
    const isJoined = isJoinedStored || userJoinedSession;

    const intervalDays = isJoined
      ? TELEGRAM_BANNER_INTERVAL_JOINED_DAYS
      : TELEGRAM_BANNER_INTERVAL_NOT_JOINED_DAYS;

    const intervalMs = intervalDays * 24 * 60 * 60 * 1000;

    const lastDismissedAt = localStorage.getItem("ret_telegram_banner_dismissed_at");
    if (lastDismissedAt) {
      const elapsed = Date.now() - Number(lastDismissedAt);
      if (elapsed < intervalMs) {
        return; // Respect frequency window (30 days for joined, 7 days for others)
      }
    }

    const handleScroll = () => {
      if (window.scrollY > 350) {
        setIsVisible(true);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    const timer = setTimeout(() => setIsVisible(true), 6000);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
    };
  }, [session]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("ret_telegram_banner_dismissed_at", Date.now().toString());
  };

  const handleJoinClick = () => {
    localStorage.setItem("ret_telegram_banner_dismissed_at", Date.now().toString());
    localStorage.setItem("ret_telegram_joined", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Telegram Channel Invitation"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300 print:hidden"
    >
      <div className="bg-[#0F172A] text-white p-4 rounded-2xl border border-sky-500/30 shadow-2xl backdrop-blur-md flex items-center justify-between gap-4 relative overflow-hidden group">
        {/* Subtle glowing background accent */}
        <div className="absolute -right-8 -top-8 w-24 h-24 bg-sky-500/20 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-center gap-3.5 z-10 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-500 flex items-center justify-center shrink-0 shadow-md text-white">
            <Send className="w-5 h-5 -rotate-12 translate-x-[-1px] translate-y-[1px]" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1.5 text-sky-400 font-bold text-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Official Telegram Community</span>
            </div>
            <h2 className="font-extrabold text-sm text-slate-100 truncate normal-case">
              राजस्थान परीक्षा फ्री PDF & क्विज़
            </h2>
            <p className="text-slate-400 text-xs truncate">
              REET, RPSC, CET व Police डेली नोट्स पाएं
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 z-10 shrink-0">
          <a
            href={SOCIAL_LINKS.telegram.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleJoinClick}
            className="px-3.5 py-2 text-xs font-bold bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl transition-all shadow-md hover:shadow-sky-500/25 flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>Join Free</span>
            <Send className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Dismiss notification"
            aria-label="Close Telegram invitation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
