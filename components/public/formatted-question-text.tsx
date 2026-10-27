"use client";

import React from "react";

interface FormattedQuestionTextProps {
  text: string;
  className?: string;
  size?: "sm" | "base" | "lg";
}

interface ParsedMatchingQuestion {
  prompt: string;
  leftHeader: string;
  rightHeader: string;
  leftItems: { prefix: string; text: string }[];
  rightItems: { prefix: string; text: string }[];
  footer: string;
  examBadge?: string;
}

function tryParseMatchingQuestion(text: string): ParsedMatchingQuestion | null {
  if (!text) return null;

  const normalized = text
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n");

  const hasMatchKeyword = /मिलान|सुमेलित|कॉलम|सूची|कोड से सही उत्तर|कूट/i.test(normalized);
  if (!hasMatchKeyword) return null;

  let rawLines = normalized
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // If text is single-line or flattened, split on \t or item prefixes
  if (
    rawLines.length < 5 &&
    (normalized.includes("\t") ||
      /\s+[a-d1-4]\.\s+|\s+\([a-d1-4A-D]\)\s+/i.test(normalized))
  ) {
    const pattern =
      /\n|\t|\s+(?=(?:[0-9]{1,2}[\.\)]|\([0-9]{1,2}\)|\([a-eA-E]\)|[a-eA-E][\.\)]|\((?:i{1,4}|iv|v|vi)\)|(?:i{1,4}|iv|v|vi)[\.\)]|[अबसदयकखगघ][\.\)]|\([अबसदयकखगघ]\)|\b(?:कॉलम|सूची)\s*[-–]?(?:II|2)\b|\bकूट\b|\bनीचे\s*दिए))/i;
    rawLines = normalized
      .split(pattern)
      .map((t) => t.trim())
      .filter(Boolean);
  }

  if (rawLines.length < 4) return null;

  let headerIndex = -1;
  let leftHeader = "";
  let rightHeader = "";

  const isInstructionLine = (l: string) =>
    l.includes("मिलान") ||
    l.includes("सुमेलित") ||
    l.includes("कीजिए") ||
    l.includes("चुनें") ||
    l.includes("चुनिए") ||
    l.length > 60;

  const isCol1 = (l: string) =>
    !isInstructionLine(l) &&
    /^(कॉलम\s*I\b|कॉलम\s*1\b|सूची\s*[-–]?\s*[1I]\b|सूची\s*[-–]?\s*I\b|लिस्ट\s*[-–]?\s*1|शैली\/उपशैली)/i.test(
      l
    );

  const isCol2 = (l: string) =>
    !isInstructionLine(l) &&
    /^(कॉलम\s*II\b|कॉलम\s*2\b|सूची\s*[-–]?\s*[28II]\b|सूची\s*[-–]?\s*II\b|लिस्ट\s*[-–]?\s*2|चित्रकार)/i.test(
      l
    );

  const matchItemPrefix = (str: string) => {
    const m = str.match(
      /^(\([0-9]{1,2}\)|[0-9]{1,2}[\.\)]|\([a-eA-E]\)|[a-eA-E][\.\)]|\((?:i{1,4}|iv|v|vi)\)|(?:i{1,4}|iv|v|vi)[\.\)]|\([अबसदयकखगघ]\)|[अबसदयकखगघ][\.\)])\s*(.*)$/i
    );
    if (m && m[1]) {
      const rawPrefix = m[1].replace(/[\(\)\.\)]/g, "").trim();
      return { prefix: rawPrefix, text: m[2].trim() };
    }
    return null;
  };

  const isFooterLine = (l: string) => {
    return (
      l.startsWith("कूट") ||
      l.startsWith("कुट") ||
      l.startsWith("सही कूट") ||
      l.includes("कूट -") ||
      l.includes("कूट:") ||
      l.includes("उपयुक्त विकल्प") ||
      l.includes("सही विकल्प") ||
      l.includes("सही उत्तर") ||
      l.includes("उपयुक्त उत्तर") ||
      l.includes("विकल्पों में से") ||
      l.includes("उत्तर चुनें") ||
      l.includes("उत्तर चुनिए") ||
      l.includes("उत्तर का चयन") ||
      l.includes("सही युग्म") ||
      /नीचे\s*दिए/i.test(l) ||
      /नीचे\s*लिये/i.test(l) ||
      /नीचे\s*दिये/i.test(l) ||
      /निम्न\s*में\s*से/i.test(l) ||
      Boolean(l.match(/^[A-D][,\s]+[A-D][,\s]+[A-D]/i)) ||
      Boolean(l.match(/^[अबसद][,\s]+[अबसद][,\s]+[अबसद]/i)) ||
      Boolean(l.match(/^[1-4][,\s]+[1-4][,\s]+[1-4]/)) ||
      Boolean(l.match(/^[iIvVxX]+[,\s]+[iIvVxX]+/))
    );
  };

  const isExamLine = (l: string) => {
    // If it's a list item (e.g. "1. 1945", "3. 1922"), it is NEVER an exam line!
    if (matchItemPrefix(l)) return false;
    return (
      /(?:Exam|Officer|Paper|RPSC|RSMSSB|Patwar|CET|REET|Police)/i.test(l) &&
      !l.includes("कूट")
    );
  };

  for (let i = 0; i < rawLines.length; i++) {
    const l = rawLines[i];
    if (isCol1(l)) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    for (let i = 1; i <= 3 && i < rawLines.length - 1; i++) {
      if (
        !isInstructionLine(rawLines[i]) &&
        (rawLines[i].includes("कॉलम") ||
          rawLines[i].includes("सूची") ||
          rawLines[i].includes("शैली")) &&
        (rawLines[i + 1].includes("कॉलम") ||
          rawLines[i + 1].includes("सूची") ||
          rawLines[i + 1].includes("चित्रकार"))
      ) {
        headerIndex = i;
        break;
      }
    }
  }

  let prompt = "";
  let cursor = 0;

  if (headerIndex !== -1) {
    prompt = rawLines.slice(0, headerIndex).join(" ");
    cursor = headerIndex;
    leftHeader = rawLines[cursor];
    cursor++;

    // Subtitle for left header: only if starting with ( AND is not an item prefix!
    if (
      cursor < rawLines.length &&
      rawLines[cursor].startsWith("(") &&
      !matchItemPrefix(rawLines[cursor]) &&
      !isCol2(rawLines[cursor])
    ) {
      leftHeader += " " + rawLines[cursor];
      cursor++;
    }

    if (
      cursor < rawLines.length &&
      (isCol2(rawLines[cursor]) ||
        rawLines[cursor].includes("सूची") ||
        rawLines[cursor].includes("कॉलम") ||
        rawLines[cursor].includes("चित्रकार"))
    ) {
      rightHeader = rawLines[cursor];
      cursor++;
      // Subtitle for right header: only if starting with ( AND is not an item prefix!
      if (
        cursor < rawLines.length &&
        rawLines[cursor].startsWith("(") &&
        !matchItemPrefix(rawLines[cursor])
      ) {
        rightHeader += " " + rawLines[cursor];
        cursor++;
      }
    }
  } else {
    prompt = rawLines[0];
    cursor = 1;
    leftHeader = "सूची - I";
    rightHeader = "सूची - II";
  }

  rightHeader = rightHeader.replace(/सूची-28\b/g, "सूची-2");

  if (!leftHeader) leftHeader = "कॉलम I / सूची - I";
  if (!rightHeader) rightHeader = "कॉलम II / सूची - II";

  const remainingLines = rawLines.slice(cursor);
  const leftItems: { prefix: string; text: string }[] = [];
  const rightItems: { prefix: string; text: string }[] = [];
  let footer = "";
  let examBadge = "";

  // Check if right column header appears later in remaining lines (Block layout)
  let col2BlockIdx = -1;
  for (let idx = 0; idx < remainingLines.length; idx++) {
    const l = remainingLines[idx];
    if (isCol2(l) || ((l.includes("सूची") || l.includes("कॉलम")) && /(?:II|2)\b/.test(l))) {
      col2BlockIdx = idx;
      break;
    }
  }

  if (col2BlockIdx !== -1) {
    rightHeader = remainingLines[col2BlockIdx];
    let rightStart = col2BlockIdx + 1;
    if (
      col2BlockIdx + 1 < remainingLines.length &&
      remainingLines[col2BlockIdx + 1].startsWith("(") &&
      !matchItemPrefix(remainingLines[col2BlockIdx + 1])
    ) {
      rightHeader += " " + remainingLines[col2BlockIdx + 1];
      rightStart = col2BlockIdx + 2;
    }

    for (let i = 0; i < col2BlockIdx; i++) {
      const l = remainingLines[i];
      if (isExamLine(l)) {
        examBadge = l;
        continue;
      }
      if (isFooterLine(l)) {
        footer = footer ? `${footer} | ${l}` : l;
        continue;
      }
      const item = matchItemPrefix(l);
      if (item) {
        leftItems.push(item);
      } else if (leftItems.length > 0) {
        leftItems[leftItems.length - 1].text += " " + l;
      }
    }

    for (let i = rightStart; i < remainingLines.length; i++) {
      const l = remainingLines[i];
      if (isExamLine(l)) {
        examBadge = l;
        continue;
      }
      if (isFooterLine(l)) {
        footer = footer ? `${footer} | ${l}` : l;
        continue;
      }
      const item = matchItemPrefix(l);
      if (item) {
        rightItems.push(item);
      } else if (rightItems.length > 0) {
        rightItems[rightItems.length - 1].text += " " + l;
      }
    }
  } else {
    // Interleaved layout or tab-separated lines
    for (let i = 0; i < remainingLines.length; i++) {
      const l = remainingLines[i];
      if (isExamLine(l)) {
        examBadge = l;
        continue;
      }
      if (isFooterLine(l)) {
        footer = footer ? `${footer} | ${l}` : l;
        continue;
      }

      // Check if line contains tab-separated items (e.g. "1. अजमेर\ta. सालासर")
      if (l.includes("\t")) {
        const parts = l.split("\t").map((p) => p.trim()).filter(Boolean);
        if (parts.length === 2) {
          const item1 = matchItemPrefix(parts[0]);
          const item2 = matchItemPrefix(parts[1]);
          if (item1 && item2) {
            leftItems.push(item1);
            rightItems.push(item2);
            continue;
          }
        }
      }

      const item = matchItemPrefix(l);
      if (item) {
        if (leftItems.length === rightItems.length) {
          leftItems.push(item);
        } else {
          rightItems.push(item);
        }
      } else {
        if (rightItems.length > 0 && rightItems.length === leftItems.length) {
          rightItems[rightItems.length - 1].text += " " + l;
        } else if (leftItems.length > rightItems.length) {
          leftItems[leftItems.length - 1].text += " " + l;
        } else {
          footer = footer ? `${footer} ${l}` : l;
        }
      }
    }
  }

  if (leftItems.length < 2 || rightItems.length < 2) {
    return null;
  }

  return {
    prompt: prompt || "सुमेलित कीजिए:",
    leftHeader,
    rightHeader,
    leftItems,
    rightItems,
    footer,
    examBadge,
  };
}

export function FormattedQuestionText({
  text,
  className = "",
  size = "base",
}: FormattedQuestionTextProps) {
  if (!text) return null;

  const textSizeClass =
    size === "sm"
      ? "text-xs sm:text-sm"
      : size === "lg"
      ? "text-base sm:text-lg md:text-xl"
      : "text-sm sm:text-base md:text-lg";

  // Check if this is a matching-type question (Col I / Col II or सूची-1 / सूची-2)
  const matching = tryParseMatchingQuestion(text);
  if (matching) {
    return (
      <div className={`space-y-3 font-devanagari ${textSizeClass} ${className}`}>
        {/* Main Prompt */}
        <div className="font-extrabold text-slate-900 leading-snug">
          {matching.prompt}
        </div>

        {/* Side-by-side Matching Columns Card */}
        <div className="rounded-2xl border border-amber-200/90 bg-linear-to-b from-amber-50/40 to-white p-3.5 sm:p-4 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Left Column Card */}
            <div className="rounded-xl border border-amber-200/80 bg-white p-3 space-y-2 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-black text-amber-950 border-b border-amber-100 pb-1.5 uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span className="truncate">{matching.leftHeader}</span>
              </div>
              <div className="space-y-2">
                {matching.leftItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 bg-amber-50/60 p-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 border border-amber-100/80"
                  >
                    <span className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      {item.prefix}
                    </span>
                    <span className="leading-snug pt-0.5">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column Card */}
            <div className="rounded-xl border border-sky-200/80 bg-white p-3 space-y-2 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-black text-sky-950 border-b border-sky-100 pb-1.5 uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                <span className="truncate">{matching.rightHeader}</span>
              </div>
              <div className="space-y-2">
                {matching.rightItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 bg-sky-50/60 p-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 border border-sky-100/80"
                  >
                    <span className="w-6 h-6 rounded-lg bg-sky-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      {item.prefix}
                    </span>
                    <span className="leading-snug pt-0.5">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer instruction or Koot selection prompt */}
          {(matching.footer || matching.examBadge) && (
            <div className="mt-3 pt-2.5 border-t border-amber-200/70 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-amber-950">
              <span className="flex items-center gap-1.5">
                <span className="text-amber-600">🎯</span>
                <span>{matching.footer || "कूट से सही उत्तर का चयन कीजिए:"}</span>
              </span>
              {matching.examBadge && (
                <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded-md font-bold">
                  {matching.examBadge}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 1. Normalize line endings and escaped newlines
  let processed = text
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n");

  // 2. Intelligently format inline match items / statements / markdown images / bare Cloudinary URLs
  processed = processed
    .replace(/(!\[.*?\]\(.*?\))/g, "\n$1\n")
    .replace(/(https:\/\/res\.cloudinary\.com\/[^\s"'>\)]+\.(?:jpg|jpeg|png|webp|svg|gif))/gi, "\n$1\n")
    .replace(
      /\s+(कथन\s*(?:\([0-9a-zA-Z\u0900-\u097FivxIVX]+\)|[0-9a-zA-Z\u0900-\u097FivxIVX]+)?[:\s\-]|कारण\s*(?:\([0-9a-zA-Z\u0900-\u097FivxIVX]+\)|[0-9a-zA-Z\u0900-\u097FivxIVX]+)?[:\s\-]|अभिकथन\s*(?:\([0-9a-zA-Z\u0900-\u097FivxIVX]+\)|[0-9a-zA-Z\u0900-\u097FivxIVX]+)?[:\s\-]|वक्तव्य\s*(?:\([0-9a-zA-Z\u0900-\u097FivxIVX]+\)|[0-9a-zA-Z\u0900-\u097FivxIVX]+)?[:\s\-])/gi,
      "\n$1"
    )
    .replace(
      /(?<!(?:कथन|कारण|अभिकथन|वक्तव्य))\s+(\([0-9a-zA-ZivxIVXअबसदकखगघ]+\)|[0-9a-zA-ZivxIVXअबसदकखगघ]+[\.\)])\s+/g,
      "\n$1 "
    )
    .replace(
      /\s+(कूट\s*[-:]|कूट:|सही कूट\s*[-:]|नीचे दिए गए कूट|उपरोक्त कथनों के|उपर्युक्त कथनों के|उपरोक्त में से|उपर्युक्त में से|विकल्प\s*[-:])/g,
      "\n$1"
    );

  // 3. Split lines and trim
  const lines = processed
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const hasAnyImage = processed.includes("![") || processed.includes("res.cloudinary.com");

  // If simple single line question without images, render cleanly with whitespace preservation
  if (lines.length <= 1 && !hasAnyImage) {
    return (
      <span
        className={`whitespace-pre-line leading-relaxed font-devanagari ${textSizeClass} ${className}`}
      >
        {text}
      </span>
    );
  }

  return (
    <div className={`space-y-2 font-devanagari ${textSizeClass} ${className}`}>
      {lines.map((line, idx) => {
        // 0. Markdown image support: ![alt text](url) or bare Cloudinary URL
        const imgMdMatch = line.match(/^!\[(.*?)\]\((.*?)\)$/);
        const bareCloudinaryMatch = line.match(/^(https:\/\/res\.cloudinary\.com\/[^\s"'>\)]+\.(?:jpg|jpeg|png|webp|svg|gif))$/i);
        const imgSrc = imgMdMatch ? imgMdMatch[2] : (bareCloudinaryMatch ? bareCloudinaryMatch[1] : null);
        const imgAlt = imgMdMatch ? (imgMdMatch[1] || "Question diagram") : "Question diagram";

        if (imgSrc) {
          return (
            <div key={idx} className="my-3 flex justify-center w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgSrc}
                alt={imgAlt}
                className="max-h-80 w-auto max-w-full rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm object-contain"
                loading="lazy"
              />
            </div>
          );
        }

        const isFirstLine = idx === 0;

        const isSubHeader =
          !isFirstLine &&
          line.includes(" - ") &&
          (line.includes("सूची") ||
            line.includes("कॉलम") ||
            line.includes("स्तंभ") ||
            line.includes("सुमेलित"));

        const isFooter =
          line.startsWith("कूट") ||
          line.startsWith("कुट") ||
          line.startsWith("सही कूट") ||
          line.startsWith("विकल्प") ||
          line.includes("दिए गए कूट") ||
          line.includes("सही उत्तर चुनिए") ||
          line.includes("कौन-सा/से सही") ||
          line.includes("उपरोक्त कथन") ||
          line.includes("उपर्युक्त कथन") ||
          line.includes("उपरोक्त में से") ||
          line.includes("उपर्युक्त में से") ||
          line.includes("विकल्पों में से") ||
          line.includes("सबसे उपयुक्त उत्तर") ||
          line.endsWith("कूट चुनिए -");

        // 1. Statement or Assertion label: e.g. कथन (I):, कथन (1):, कथन (अ):, कारण (R):, कारण (ब):, अभिकथन (A):
        const statementMatch = line.match(
          /^(कथन\s*(?:\([0-9a-zA-Z\u0900-\u097FivxIVX]+\)|[0-9a-zA-Z\u0900-\u097FivxIVX]+)?[:\s\-]|कारण\s*(?:\([0-9a-zA-Z\u0900-\u097FivxIVX]+\)|[0-9a-zA-Z\u0900-\u097FivxIVX]+)?[:\s\-]|अभिकथन\s*(?:\([0-9a-zA-Z\u0900-\u097FivxIVX]+\)|[0-9a-zA-Z\u0900-\u097FivxIVX]+)?[:\s\-]|वक्तव्य\s*(?:\([0-9a-zA-Z\u0900-\u097FivxIVX]+\)|[0-9a-zA-Z\u0900-\u097FivxIVX]+)?[:\s\-])\s*(.*)$/i
        );

        if (statementMatch && statementMatch[1]) {
          const badgeText = statementMatch[1].replace(/[:\-]\s*$/, "").trim();
          const content = statementMatch[2];
          return (
            <div
              key={idx}
              className="flex items-start gap-2.5 pl-1 sm:pl-2 text-slate-800 font-semibold leading-relaxed"
            >
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-xs shrink-0 mt-0.5 border border-amber-300/60 shadow-2xs">
                {badgeText}
              </span>
              <span className="flex-1 break-words">{content}</span>
            </div>
          );
        }

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



        // 2. Ordered item: e.g. (1) ... or (A) ... or 1. ... or A) ... or (क) ...
        const itemMatch = line.match(
          /^(\([0-9a-zA-ZivxIVXअबसदकखगघ]+\)|[0-9a-zA-ZivxIVXअबसदकखगघ]+[\.\)])\s*(.*)$/
        );

        if (itemMatch && itemMatch[1]) {
          const prefix = itemMatch[1].replace(/[\(\)\.]/g, "");
          const content = itemMatch[2];
          return (
            <div
              key={idx}
              className="flex items-start gap-2.5 pl-1 sm:pl-2 text-slate-800 font-semibold leading-relaxed"
            >
              <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-xs shrink-0 mt-0.5 border border-amber-300/40">
                {prefix}
              </span>
              <span className="flex-1 break-words">{content}</span>
            </div>
          );
        }

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
