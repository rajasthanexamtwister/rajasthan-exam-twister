"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  BookOpen,
  FileCheck,
  UploadCloud,
  HelpCircle,
} from "lucide-react";
import clsx from "clsx";

const PROMPT_TEXT = `You are converting a set of exam questions into a strict JSON format for a quiz platform. I will give you a paper's worth of questions below (or describe/paste them). Convert ALL of them into a single JSON object matching EXACTLY this schema — no extra commentary, no markdown fences, JSON only:

{
  "quizTitle": "string, a short descriptive title based on the paper's subject/topic",
  "subject": "string, e.g. 'Rajasthan GK', 'History', 'Polity'",
  "questions": [
    {
      "questionText": "string, the full question text",
      "options": ["string", "string", "string", "string"],
      "correctOptionIndex": 0,
      "explanation": "string, brief explanation of the correct answer, or empty string if unknown",
      "marks": 1,
      "negativeMarks": 0.33
    }
  ]
}

Rules:
- correctOptionIndex is 0-based (0 = first option).
- Every question must have between 2 and 6 options.
- If the original paper doesn't specify marks/negative marking, default marks to 1 and negativeMarks to 0.33 per question — the website lets the uploader change these afterward, so defaults are fine.
- Do not invent questions that aren't in the source material.
- Do not skip any question from the source material.
- Output ONLY the JSON object, nothing else — no explanation, no markdown code fences, no preamble.

Here are my questions:
[PASTE YOUR QUESTIONS / DESCRIBE YOUR IMAGE OR PDF HERE]`;

export default function QuizPromptGeneratorPage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(PROMPT_TEXT);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error("Failed to copy prompt:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-amber-600 transition-colors">
            Home
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-bold">AI Quiz Tool</span>
        </nav>

        {/* Title Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 shadow-md shadow-amber-500/20 mb-1">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            AI Exam Paper to Quiz Converter
          </h1>
          <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Convert any question paper, PDF, or image of MCQs into a ready-to-import interactive quiz in seconds.
          </p>
        </div>

        {/* 4-Step Workflow Guide */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 relative">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center">
              1
            </div>
            <h3 className="text-xs font-bold text-slate-900">Copy AI Prompt</h3>
            <p className="text-[11px] text-slate-500 leading-normal">
              Click the button below to copy our strict JSON prompt template.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 relative">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-900 font-bold text-xs flex items-center justify-center">
              2
            </div>
            <h3 className="text-xs font-bold text-slate-900">Paste in AI Chat</h3>
            <p className="text-[11px] text-slate-500 leading-normal">
              Open ChatGPT, Claude, or Gemini. Paste the prompt + your question paper.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 relative">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-center">
              3
            </div>
            <h3 className="text-xs font-bold text-slate-900">Copy Output JSON</h3>
            <p className="text-[11px] text-slate-500 leading-normal">
              The AI will generate clean JSON matching our exact schema.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 relative">
            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-900 font-bold text-xs flex items-center justify-center">
              4
            </div>
            <h3 className="text-xs font-bold text-slate-900">Upload & Publish</h3>
            <p className="text-[11px] text-slate-500 leading-normal">
              Admin uploads JSON, sets negative marking, and publishes live.
            </p>
          </div>
        </div>

        {/* Prompt Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              <span className="text-xs text-slate-400 font-mono ml-2">quiz-prompt-template.txt</span>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className={clsx(
                "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md",
                copied
                  ? "bg-emerald-500 text-slate-950"
                  : "bg-amber-500 hover:bg-amber-400 text-slate-950"
              )}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Copied to Clipboard!" : "Copy Prompt"}</span>
            </button>
          </div>

          <div className="p-6 bg-slate-950">
            <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap leading-relaxed overflow-x-auto selection:bg-slate-800">
              {PROMPT_TEXT}
            </pre>
          </div>

          <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs text-slate-600">
              <span className="font-semibold text-slate-900">Tip:</span> Replace the last line{" "}
              <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">[PASTE YOUR QUESTIONS...]</code>{" "}
              with your questions before sending to the AI.
            </p>

            <Link
              href="/quizzes"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-sm shrink-0"
            >
              <BookOpen className="w-4 h-4" />
              <span>Browse Active Mock Quizzes</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
