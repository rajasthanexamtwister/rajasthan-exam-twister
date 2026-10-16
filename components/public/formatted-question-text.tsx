"use client";

import React from "react";

interface FormattedQuestionTextProps {
  text: string;
  className?: string;
  size?: "sm" | "base" | "lg";
}

export function FormattedQuestionText({
  text,
  className = "",
  size = "base",
}: FormattedQuestionTextProps) {
  if (!text) return null;

  // Split lines by newline and trim
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const textSizeClass =
    size === "sm"
      ? "text-xs sm:text-sm"
      : size === "lg"
      ? "text-lg sm:text-xl"
      : "text-sm sm:text-base md:text-lg";

  // If simple single line question, render cleanly with whitespace preservation
  if (lines.length <= 1) {
    return (
      <span className={`whitespace-pre-line leading-relaxed font-devanagari ${textSizeClass} ${className}`}>
        {text}
      </span>
    );
  }

  return (
    <div className={`space-y-2 font-devanagari ${textSizeClass} ${className}`}>
      {lines.map((line, idx) => {
        const isFirstLine = idx === 0;

        const isSubHeader =
          !isFirstLine &&
          line.includes(" - ") &&
          !line.match(/^[\(0-9a-zA-Zअ-दiIvVxX]/);

        const isFooter =
          !isFirstLine &&
          (line.startsWith("कूट") ||
            line.startsWith("सही कूट") ||
            line.includes("दिए गए कूट") ||
            line.includes("सही उत्तर चुनिए") ||
            line.includes("कौन-सा/से सही") ||
            line.endsWith("कूट चुनिए -"));

        if (isFirstLine) {
          return (
            <div key={idx} className="font-extrabold text-slate-900 leading-snug">
              {line}
            </div>
          );
        }

        if (isSubHeader) {
          return (
            <div
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-300/80 text-amber-950 font-bold text-xs sm:text-sm my-1 shadow-2xs"
            >
              <span className="select-none text-amber-600">🏷️</span>
              <span>{line}</span>
            </div>
          );
        }

        if (isFooter) {
          return (
            <div
              key={idx}
              className="font-bold text-amber-950 text-xs sm:text-sm pt-2 border-t border-amber-200/70"
            >
              {line}
            </div>
          );
        }

        // Ordered statement or match item: e.g. (1) ... or 1. ... or i. ... or A. ...
        return (
          <div
            key={idx}
            className="flex items-start gap-2.5 pl-1.5 sm:pl-3 text-slate-800 font-semibold leading-relaxed"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0 select-none" />
            <span className="flex-1 break-words">{line}</span>
          </div>
        );
      })}
    </div>
  );
}

export default FormattedQuestionText;
