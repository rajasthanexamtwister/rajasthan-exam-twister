"use client";

import { useState, useEffect } from "react";
import { Flame, Award, ShieldCheck } from "lucide-react";

const STREAK_KEY = "ret_daily_study_streak";

interface StreakData {
  count: number;
  lastDate: string; // YYYY-MM-DD
}

export function updateDailyStreak(): number {
  if (typeof window === "undefined") return 1;
  try {
    const today = new Date().toISOString().split("T")[0];
    const raw = localStorage.getItem(STREAK_KEY);
    let streakData: StreakData = raw ? JSON.parse(raw) : { count: 0, lastDate: "" };

    if (streakData.lastDate === today) {
      return streakData.count || 1;
    }

    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split("T")[0];

    if (streakData.lastDate === yesterday) {
      streakData.count += 1;
    } else {
      streakData.count = 1;
    }

    streakData.lastDate = today;
    localStorage.setItem(STREAK_KEY, JSON.stringify(streakData));
    return streakData.count;
  } catch {
    return 1;
  }
}

export function DailyStreakBadge() {
  const [streakCount, setStreakCount] = useState<number>(0);

  useEffect(() => {
    const count = updateDailyStreak();
    setStreakCount(count);
  }, []);

  if (streakCount <= 0) return null;

  let badgeTitle = "Aspirant";
  if (streakCount >= 7) badgeTitle = "REET Warrior 🛡️";
  if (streakCount >= 14) badgeTitle = "RPSC Master 🏆";
  if (streakCount >= 30) badgeTitle = "Rajasthan GK Champion 👑";

  return (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-400/40 text-amber-900 text-xs font-black shadow-2xs"
      title={`Current Daily Study Streak: ${streakCount} Day(s). Badge: ${badgeTitle}`}
    >
      <Flame className="w-4 h-4 text-orange-600 fill-orange-500 animate-bounce" />
      <span>{streakCount} Day Streak</span>
      <span className="text-[10px] font-bold text-amber-800 bg-amber-200/80 px-1.5 py-0.2 rounded-md">
        {badgeTitle}
      </span>
    </div>
  );
}
