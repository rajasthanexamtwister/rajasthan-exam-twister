"use client";

import React from "react";
import { useLivePresence } from "./use-live-presence";
import clsx from "clsx";
import { Users } from "lucide-react";

interface LivePresenceBadgeProps {
  variant?: "header" | "hero" | "mobile" | "compact";
  className?: string;
  showIcon?: boolean;
}

export function LivePresenceBadge({
  variant = "header",
  className,
  showIcon = false,
}: LivePresenceBadgeProps) {
  const { liveCount } = useLivePresence();

  // The visitor viewing the page is at least 1 real active user
  const displayCount = Math.max(1, liveCount);
  const learnerText = displayCount === 1 ? "Learner" : "Learners";

  if (variant === "hero") {
    return (
      <div
        className={clsx(
          "inline-flex items-center gap-2.5 px-4 py-2 rounded-full",
          "bg-emerald-950/60 border border-emerald-500/40 text-emerald-300",
          "text-xs sm:text-sm font-semibold shadow-lg backdrop-blur-xs transition-all",
          className
        )}
        title="Real-time students studying and taking quizzes on Rajasthan Exam Twister"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <span className="tracking-wide">
          <strong className="text-white font-black text-sm sm:text-base font-mono mr-1">
            {displayCount}
          </strong>
          {displayCount === 1 ? "Aspirant Studying Live" : "Aspirants Studying Live"}
        </span>
      </div>
    );
  }

  if (variant === "mobile") {
    return (
      <div
        className={clsx(
          "flex items-center justify-between px-3.5 py-2.5 rounded-xl",
          "bg-emerald-50/80 border border-emerald-200/80 text-emerald-900 text-xs font-semibold",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Active {learnerText} Online</span>
        </div>
        <span className="font-mono font-bold bg-white px-2 py-0.5 rounded-md border border-emerald-200 text-emerald-700">
          {displayCount}
        </span>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <span
        className={clsx(
          "inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700",
          className
        )}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-mono font-bold">{displayCount}</span> live
      </span>
    );
  }

  // Default "header" variant
  return (
    <div
      className={clsx(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full",
        "bg-emerald-50/90 hover:bg-emerald-100/80 border border-emerald-300/80 text-emerald-800",
        "text-[11px] font-bold shadow-2xs transition-all cursor-default select-none",
        className
      )}
      title={`${displayCount} real user${displayCount === 1 ? "" : "s"} active on the website right now`}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      {showIcon && <Users className="w-3 h-3 text-emerald-600" />}
      <span className="font-mono text-emerald-950 font-extrabold">{displayCount}</span>
      <span className="text-emerald-700 font-medium">Live</span>
    </div>
  );
}
