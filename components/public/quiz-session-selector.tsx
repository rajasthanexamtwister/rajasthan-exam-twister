"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Layers,
  Sliders,
  ChevronDown,
  Sparkles,
  Zap,
} from "lucide-react";
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
  const totalCount = Math.max(1, totalBankQuestions);

  // Available part size options
  const sizeOptions = useMemo(() => {
    const defaultSizes = [10, 20, 30, 40, 50, 100];
    const filtered = defaultSizes.filter(
      (size) => size <= Math.max(20, totalCount)
    );
    if (!filtered.includes(20)) filtered.push(20);
    filtered.sort((a, b) => a - b);
    return filtered;
  }, [totalCount]);

  // Default part size is 20, or 10 if total questions < 20
  const [partSize, setPartSize] = useState<number>(() => {
    return totalCount >= 20 ? 20 : 10;
  });

  // Dynamically calculate parts based on selected partSize
  const parts = useMemo(() => {
    const numParts = Math.max(1, Math.ceil(totalCount / partSize));

    return Array.from({ length: numParts }, (_, idx) => {
      const partNumber = idx + 1;
      const startQ = idx * partSize + 1;
      const endQ = Math.min((idx + 1) * partSize, totalCount);
      const count = endQ - startQ + 1;

      return {
        partNumber,
        startQ,
        endQ,
        count,
      };
    });
  }, [totalCount, partSize]);

  return (
    <div className="pt-6 border-t border-amber-100 space-y-6">
      {/* Session Size Selector Controls */}
      <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200/90 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label
            htmlFor="part-size-selector"
            className="text-xs font-black uppercase tracking-wider text-[#0B132B] flex items-center gap-1.5 font-heading"
          >
            <Sliders className="w-4 h-4 text-amber-700" />
            <span>Questions Per Part (प्रति पार्ट प्रश्न संख्या चुनें)</span>
          </label>
          <span className="text-xs text-slate-600 font-medium">
            Total Bank: <strong className="text-amber-900 font-black">{totalCount} MCQs</strong> &bull; Generated: <strong className="text-slate-900">{parts.length} Parts</strong>
          </span>
        </div>

        {/* Dropdown & Quick Selection Pills */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Dropdown */}
          <div className="relative flex-1 sm:max-w-xs">
            <select
              id="part-size-selector"
              value={partSize}
              onChange={(e) => setPartSize(Number(e.target.value))}
              className="w-full appearance-none bg-white border-2 border-amber-300 hover:border-amber-400 focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 rounded-xl py-2.5 px-3.5 pr-9 text-xs font-bold text-[#0B132B] transition-all cursor-pointer outline-none shadow-xs font-heading"
            >
              {sizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size} Questions / Part ({Math.ceil(totalCount / size)} Parts)
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-amber-800 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Quick Click Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 mr-1 hidden md:inline">
              Quick:
            </span>
            {sizeOptions.map((size) => {
              const isSelected = partSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => setPartSize(size)}
                  className={clsx(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border font-heading cursor-pointer",
                    isSelected
                      ? "bg-[#0B132B] text-amber-400 border-[#0B132B] shadow-xs ring-2 ring-amber-400/40 scale-105"
                      : "bg-white text-slate-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300"
                  )}
                >
                  {size} Qs
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dynamic Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-600" />
          <h2 className="text-sm font-black uppercase tracking-wider text-[#0B132B] font-heading">
            Practice Parts ({parts.length} Parts Available)
          </h2>
        </div>
        <span className="text-xs text-slate-500">
          Click &lsquo;Start Quiz&rsquo; on any part
        </span>
      </div>

      {/* Dynamic Multi-Part Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {parts.map((part) => {
          return (
            <div
              key={part.partNumber}
              className="bg-white border-2 border-amber-200/80 hover:border-amber-400 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
            >
              {/* Card Header */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-base font-extrabold text-[#0B132B] font-heading">
                    Quiz Part-{part.partNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                    Q{part.startQ} - Q{part.endQ}
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  Topic Practice Session
                </p>
              </div>

              {/* Card Meta Stats */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-100/70 text-xs">
                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Questions
                  </span>
                  <span className="text-sm font-black text-[#0B132B] block mt-0.5 font-heading">
                    {part.count} MCQs
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Total Marks
                  </span>
                  <span className="text-sm font-black text-[#0B132B] block mt-0.5 font-heading">
                    {part.count * defaultMarks} M
                  </span>
                </div>
              </div>

              {/* Start Quiz Action */}
              <Link
                href={`/quizzes/${slug}/attempt?part=${part.partNumber}&limit=${partSize}`}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 rounded-xl shadow-xs transition-all group-hover:scale-[1.02] font-heading cursor-pointer"
              >
                <span>Start Quiz</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          );
        })}
      </div>

      <div className="text-center pt-1">
        <p className="text-xs text-slate-500">
          No registration required &bull; Select any part to start practicing immediately
        </p>
      </div>
    </div>
  );
}
