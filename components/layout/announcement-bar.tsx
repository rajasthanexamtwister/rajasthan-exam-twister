"use client";

import React, { useState, useEffect } from "react";
import { SOCIAL_LINKS } from "@/server/lib/social-links";
import { Send, X } from "lucide-react";

/**
 * Announcement bar configuration
 * Easily update the text, badge, or CTA here without altering component structure.
 */
export const ANNOUNCEMENT_CONFIG = {
  badge: "दैनिक अपडेट",
  text: "रोज़ाना नए टेस्ट, ट्रिक्स और PDF नोट्स के लिए हमारा Telegram चैनल जॉइन करें!",
  ctaText: "Join Channel",
  url: SOCIAL_LINKS.telegram.url,
  sessionKey: "ret_announcement_telegram_dismissed",
};

export function AnnouncementBar() {
  const [isDismissed, setIsDismissed] = useState(true); // Default to true to prevent SSR hydration mismatch

  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem(ANNOUNCEMENT_CONFIG.sessionKey);
      if (!dismissed) {
        setIsDismissed(false);
      }
    } catch {
      // Fallback if sessionStorage is disabled or blocked in private mode
      setIsDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem(ANNOUNCEMENT_CONFIG.sessionKey, "1");
    } catch {
      // Ignore sessionStorage write errors
    }
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Telegram Announcement"
      className="bg-gradient-to-r from-[#0B132B] via-[#1C2541] to-[#0B132B] text-slate-100 border-b border-amber-500/30 text-xs py-2 px-3 sm:px-6 relative z-40 transition-all"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Left/Center Message Area */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 justify-center sm:justify-start">
          <span className="hidden sm:inline-flex items-center gap-1 bg-amber-400/20 text-amber-300 font-bold px-2 py-0.5 rounded-full text-[10px] tracking-wide border border-amber-400/30 shrink-0 font-devanagari">
            🔔 {ANNOUNCEMENT_CONFIG.badge}
          </span>
          <p className="truncate sm:overflow-visible font-medium text-slate-200 text-[11px] sm:text-xs font-devanagari">
            <span className="sm:hidden mr-1">🔔</span>
            {ANNOUNCEMENT_CONFIG.text}
          </p>
        </div>

        {/* Action Button & Dismiss */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <a
            href={ANNOUNCEMENT_CONFIG.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-bold px-2.5 py-1 rounded-md text-[11px] sm:text-xs transition-colors shadow-xs group"
          >
            <Send className="w-3 h-3 text-sky-700 group-hover:scale-110 transition-transform" />
            <span>{ANNOUNCEMENT_CONFIG.ctaText}</span>
          </a>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Dismiss Announcement"
            aria-label="Dismiss Announcement"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
