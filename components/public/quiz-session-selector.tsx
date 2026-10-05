"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, CheckCircle2, Zap } from "lucide-react";
import clsx from "clsx";

interface QuizSessionSelectorProps {
  slug: string;
  totalBankQuestions: number;
  defaultMarks: number;
}

export function QuizSessionSelector({
  slug,
  totalBankQuestions,
  defaultMarks,
}: QuizSessionSelectorProps) {
  const [selectedLimit, setSelectedLimit] = useState<number>(10);

  const options = [
    { count: 10, label: "10 MCQs", desc: "Quick Practice (~10 mins)", badge: "Recommended" },
    { count: 20, label: "20 MCQs", desc: "Standard Test (~20 mins)", badge: null },
    { count: 30, label: "30 MCQs", desc: "Deep Drill (~30 mins)", badge: null },
  ];

  // If question bank is small (<= 10 questions), render standard start button
  if (totalBankQuestions <= 10) {
    return (
      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-xs text-slate-500 font-medium">
          No registration required &bull; Anonymous attempt
        </span>
        <Link
          href={`/quizzes/${slug}/attempt`}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-2xl shadow-md shadow-amber-500/20 transition-all group"
        >
          <span>Start Quiz Now</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-4 border-t border-slate-100 space-y-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-600" />
            <span>Select Practice Session Size</span>
          </label>
          <span className="text-xs text-slate-500 font-medium">
            Bank contains <strong className="text-slate-800">{totalBankQuestions} MCQs</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {options.map((opt) => {
            const isSelected = selectedLimit === opt.count;
            return (
              <button
                key={opt.count}
                type="button"
                onClick={() => setSelectedLimit(opt.count)}
                className={clsx(
                  "p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between",
                  isSelected
                    ? "bg-amber-50/90 border-amber-500 ring-2 ring-amber-400/40 shadow-sm"
                    : "bg-slate-50/70 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300 text-slate-700"
                )}
              >
                {opt.badge && (
                  <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 shadow-sm">
                    {opt.badge}
                  </span>
                )}
                <div>
                  <span
                    className={clsx(
                      "text-sm font-black block",
                      isSelected ? "text-amber-950" : "text-slate-900"
                    )}
                  >
                    {opt.label}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">{opt.desc}</span>
                </div>
                <div className="mt-2 text-[11px] font-semibold text-slate-600">
                  Total: {opt.count * defaultMarks} Marks
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <span className="text-xs text-slate-500 font-medium">
          Dynamically selects next pending questions for your account
        </span>

        <Link
          href={`/quizzes/${slug}/attempt?limit=${selectedLimit}`}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-2xl shadow-md shadow-amber-500/20 transition-all group"
        >
          <span>Start {selectedLimit} Question Practice</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
