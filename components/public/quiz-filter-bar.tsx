"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Target, BookOpen, Filter, X, ChevronDown, Sparkles } from "lucide-react";
import clsx from "clsx";

interface DistinctItem {
  name: string;
  slug: string;
  count: number;
}

interface QuizFilterBarProps {
  distinctExams: DistinctItem[];
  distinctSubjects: DistinctItem[];
  activeExam?: string;
  activeSubject?: string;
  activeDifficulty?: string;
  activeCategory?: string;
}

export function QuizFilterBar({
  distinctExams,
  distinctSubjects,
  activeExam,
  activeSubject,
  activeDifficulty,
  activeCategory,
}: QuizFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Helper to build URL queries
  const buildFilterUrl = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page"); // Reset pagination on filter change

    const merged: Record<string, string | undefined> = {
      subject: activeSubject,
      category: activeCategory,
      exam: activeExam,
      difficulty: activeDifficulty,
      ...overrides,
    };

    Object.entries(merged).forEach(([k, v]) => {
      if (v) {
        params.set(k, v);
      } else {
        params.delete(k);
      }
    });

    const qs = params.toString();
    return `/quizzes${qs ? `?${qs}` : ""}`;
  };

  const handleExamDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    router.push(buildFilterUrl({ exam: selected ? selected : undefined }));
  };

  const handleSubjectDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    router.push(buildFilterUrl({ subject: selected ? selected : undefined }));
  };

  const hasActiveFilters = Boolean(activeExam || activeSubject || activeDifficulty || activeCategory);

  // Top prominent exams (Top 6-8 by test count)
  const topExams = distinctExams.slice(0, 7);
  const isSelectedExamInTop = topExams.some(
    (ex) =>
      activeExam?.toLowerCase() === ex.name.toLowerCase() ||
      activeExam?.toLowerCase() === ex.slug.toLowerCase()
  );

  return (
    <div className="bg-white rounded-3xl border border-amber-200/80 p-5 sm:p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2 text-sm font-extrabold text-[#0B132B]">
          <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
            <Filter className="w-4 h-4" />
          </div>
          <span>Filter & Discover Tests</span>
        </div>
        {hasActiveFilters && (
          <Link
            href="/quizzes"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200/80 hover:bg-rose-100 transition-colors"
          >
            <X className="w-3 h-3" />
            <span>Reset All Filters</span>
          </Link>
        )}
      </div>

      {/* Target Exam Filter Section */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0B132B] uppercase tracking-wider">
            <Target className="w-3.5 h-3.5 text-amber-600" />
            <span>Target Exam</span>
            <span className="text-[11px] font-normal text-slate-500 normal-case">
              (Choose your target recruitment)
            </span>
          </div>

          {/* Exam Dropdown Selector */}
          <div className="relative min-w-[220px]">
            <select
              aria-label="Select Target Exam"
              value={activeExam || ""}
              onChange={handleExamDropdownChange}
              className="w-full appearance-none pl-3.5 pr-8 py-1.5 text-xs font-bold text-[#0B132B] bg-amber-50/50 border border-amber-300/80 rounded-xl hover:border-amber-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 transition-all cursor-pointer shadow-2xs"
            >
              <option value="">🎯 All Target Exams ({distinctExams.reduce((acc, curr) => acc + curr.count, 0)})</option>
              {distinctExams.map((ex) => (
                <option key={ex.slug} value={ex.name}>
                  {ex.name} ({ex.count} tests)
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-amber-800 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Quick Exam Pills */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <Link
            href={buildFilterUrl({ exam: undefined })}
            className={clsx(
              "px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border",
              !activeExam
                ? "bg-[#0B132B] text-white border-[#0B132B] shadow-xs font-bold"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300"
            )}
          >
            All Exams
          </Link>
          {topExams.map((ex) => {
            const isSelected =
              activeExam?.toLowerCase() === ex.name.toLowerCase() ||
              activeExam?.toLowerCase() === ex.slug.toLowerCase();
            return (
              <Link
                key={ex.slug}
                href={buildFilterUrl({ exam: isSelected ? undefined : ex.name })}
                className={clsx(
                  "px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border inline-flex items-center gap-1.5",
                  isSelected
                    ? "bg-[#0B132B] text-white border-[#0B132B] shadow-xs font-bold"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300"
                )}
              >
                <span>{ex.name}</span>
                <span
                  className={clsx(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                    isSelected ? "bg-amber-400 text-slate-950" : "bg-amber-200/60 text-[#0B132B]"
                  )}
                >
                  {ex.count}
                </span>
              </Link>
            );
          })}

          {/* If the active exam is outside top exams, show it as an active pill */}
          {activeExam && !isSelectedExamInTop && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#0B132B] text-white border border-[#0B132B] shadow-xs">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{activeExam}</span>
              <Link
                href={buildFilterUrl({ exam: undefined })}
                className="ml-1 hover:text-amber-300"
                title="Clear exam filter"
              >
                <X className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Subject / Category Filter Section */}
      {distinctSubjects.length > 0 && (
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0B132B] uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5 text-amber-600" />
              <span>Subject / Category</span>
            </div>

            {/* Subject Dropdown for quick access */}
            {distinctSubjects.length > 5 && (
              <div className="relative min-w-[200px]">
                <select
                  aria-label="Select Subject"
                  value={activeSubject || ""}
                  onChange={handleSubjectDropdownChange}
                  className="w-full appearance-none pl-3.5 pr-8 py-1.5 text-xs font-bold text-[#0B132B] bg-slate-50 border border-slate-200 rounded-xl hover:border-amber-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 transition-all cursor-pointer shadow-2xs"
                >
                  <option value="">📚 All Subjects</option>
                  {distinctSubjects.map((sub) => (
                    <option key={sub.slug} value={sub.name}>
                      {sub.name} ({sub.count} tests)
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              href={buildFilterUrl({ subject: undefined })}
              className={clsx(
                "px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border",
                !activeSubject
                  ? "bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-xs"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300"
              )}
            >
              All Subjects
            </Link>
            {distinctSubjects.map((sub) => {
              const isSelected = activeSubject?.toLowerCase() === sub.name.toLowerCase();
              return (
                <Link
                  key={sub.slug}
                  href={buildFilterUrl({ subject: isSelected ? undefined : sub.name })}
                  className={clsx(
                    "px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border inline-flex items-center gap-1.5",
                    isSelected
                      ? "bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300"
                  )}
                >
                  <span>{sub.name}</span>
                  <span
                    className={clsx(
                      "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                      isSelected ? "bg-slate-900 text-white" : "bg-slate-200/80 text-slate-800"
                    )}
                  >
                    {sub.count}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Difficulty Filter */}
      <div className="flex items-center gap-2 pt-3 border-t border-slate-100 flex-wrap">
        <span className="text-xs font-bold text-slate-600 mr-1">Difficulty:</span>
        {["all", "easy", "medium", "hard"].map((diff) => {
          const isSelected = diff === "all" ? !activeDifficulty : activeDifficulty === diff;
          return (
            <Link
              key={diff}
              href={buildFilterUrl({ difficulty: diff === "all" ? undefined : diff })}
              className={clsx(
                "px-2.5 py-0.5 rounded-lg text-xs font-bold capitalize transition-all border",
                isSelected
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
              )}
            >
              {diff}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
