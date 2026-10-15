"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { Target, Flame, CheckCircle2, Trophy, Sparkles, ArrowRight, ShieldCheck, RefreshCcw } from "lucide-react";
import { updateDailyStreak } from "./daily-streak-badge";

const GOAL_TARGET_KEY = "ret_daily_quiz_goal_target";
const COMPLETED_TODAY_KEY = "ret_quizzes_completed_history";

export interface GoalHistory {
  date: string; // YYYY-MM-DD
  completedCount: number;
}

export function recordQuizCompletion(): { completedToday: number; target: number; goalAchieved: boolean } {
  if (typeof window === "undefined") return { completedToday: 1, target: 3, goalAchieved: false };
  try {
    const today = new Date().toISOString().split("T")[0];
    const target = parseInt(localStorage.getItem(GOAL_TARGET_KEY) || "3", 10);
    const rawHistory = localStorage.getItem(COMPLETED_TODAY_KEY);
    let history: GoalHistory[] = rawHistory ? JSON.parse(rawHistory) : [];

    let todayEntry = history.find((h) => h.date === today);
    if (!todayEntry) {
      todayEntry = { date: today, completedCount: 1 };
      history.push(todayEntry);
    } else {
      todayEntry.completedCount += 1;
    }

    // Keep last 30 days history only
    history = history.slice(-30);
    localStorage.setItem(COMPLETED_TODAY_KEY, JSON.stringify(history));

    if (todayEntry.completedCount >= target) {
      updateDailyStreak();
    }

    return {
      completedToday: todayEntry.completedCount,
      target,
      goalAchieved: todayEntry.completedCount >= target,
    };
  } catch {
    return { completedToday: 1, target: 3, goalAchieved: false };
  }
}

export function DailyGoalWidget() {
  const { data: session } = useSession();
  const [target, setTarget] = useState<number>(3);
  const [completedToday, setCompletedToday] = useState<number>(0);
  const [weekDays, setWeekDays] = useState<{ dayName: string; dateStr: string; status: "completed" | "partial" | "missed" }[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Load saved target
    const savedTarget = parseInt(localStorage.getItem(GOAL_TARGET_KEY) || "3", 10);
    setTarget(savedTarget);

    // Load today's history
    const today = new Date().toISOString().split("T")[0];
    const rawHistory = localStorage.getItem(COMPLETED_TODAY_KEY);
    const history: GoalHistory[] = rawHistory ? JSON.parse(rawHistory) : [];
    const todayEntry = history.find((h) => h.date === today);
    const count = todayEntry ? todayEntry.completedCount : 0;
    setCompletedToday(count);

    // Compute last 7 days (Mon-Sun)
    const current = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(current.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" })[0];
      const entry = history.find((h) => h.date === dateStr);
      const done = entry ? entry.completedCount : 0;

      let status: "completed" | "partial" | "missed" = "missed";
      if (done >= savedTarget) status = "completed";
      else if (done > 0) status = "partial";

      days.push({ dayName, dateStr, status });
    }
    setWeekDays(days);
  }, [target]);

  const handleTargetChange = (newTarget: number) => {
    setTarget(newTarget);
    if (typeof window !== "undefined") {
      localStorage.setItem(GOAL_TARGET_KEY, String(newTarget));
    }
  };

  const progressPercent = Math.min(100, Math.round((completedToday / target) * 100));
  const isGoalAchieved = completedToday >= target;

  return (
    <div className="my-6 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0B132B] via-slate-900 to-amber-950 text-white border border-amber-400/30 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Target className="w-3.5 h-3.5 text-amber-400" />
            <span>Daily Quiz Target & Streak</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white leading-tight font-devanagari">
            आपका दैनिक अध्ययन लक्ष्य (Daily Quiz Goal)
          </h2>
          <p className="text-xs text-slate-200 font-medium">
            दैनिक लक्ष्य पूरा करके अपनी स्टडी स्ट्राइक 🔥 बनाए रखें एवं लीडरबोर्ड पर आगे बढ़ें।
          </p>
        </div>

        {/* Goal Selector Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-2xl border border-slate-800 self-start sm:self-auto">
          {[1, 3, 5].map((num) => (
            <button
              key={num}
              onClick={() => handleTargetChange(num)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                target === num
                  ? "bg-amber-500 text-[#0B132B] shadow-md"
                  : "text-slate-200 hover:text-white hover:bg-slate-800 font-bold"
              }`}
            >
              {num} {num === 1 ? "Quiz" : "Quizzes"}/Day
            </button>
          ))}
        </div>
      </div>

      {/* Progress Bar & Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-100">
              आज की प्रगति (Today&apos;s Progress): <strong className="text-amber-400">{completedToday}</strong> / {target} Quizzes
            </span>
            <span className="text-amber-400 font-mono text-sm">{progressPercent}%</span>
          </div>

          <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isGoalAchieved
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-md shadow-emerald-500/50"
                  : "bg-gradient-to-r from-amber-500 to-orange-500"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {isGoalAchieved ? (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
              <span>🎉 बधाई हो! आज का दैनिक लक्ष्य पूरा हो गया है। Streak 1 Day से बढ़ गई है!</span>
            </div>
          ) : (
            <p className="text-xs text-slate-300 font-medium">
              लक्ष्य पूरा करने के लिए केवल <strong className="text-amber-300 font-bold">{target - completedToday}</strong> और क्विज़ हल करें।
            </p>
          )}
        </div>

        {/* 7-Day Weekly Streak Tracker Calendar */}
        <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2 text-center">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
            Weekly Activity Tracker
          </span>
          <div className="flex items-center justify-between gap-1 pt-1">
            {weekDays.map((wd, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] text-slate-300 font-bold uppercase">{wd.dayName}</span>
                <div
                  className={`w-7 h-7 rounded-xl text-[11px] font-bold flex items-center justify-center transition-all ${
                    wd.status === "completed"
                      ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30"
                      : wd.status === "partial"
                      ? "bg-amber-500 text-slate-950"
                      : "bg-slate-900 text-slate-400 border border-slate-700 font-semibold"
                  }`}
                  title={`${wd.dateStr}: ${wd.status}`}
                >
                  {wd.status === "completed" ? "✓" : wd.dayName}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Login Incentive Banner if not signed in */}
      {!session?.user && (
        <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Google से लॉग इन करें ताकि आपकी Weekly Streak और Leaderboard रैंक हमेशा सुरक्षित रहे।</span>
          </div>
          <button
            onClick={() => signIn("google")}
            className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md shrink-0"
          >
            Google Sign In
          </button>
        </div>
      )}
    </div>
  );
}
