"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import {
  Copy,
  Check,
  Sparkles,
  UploadCloud,
  FileCheck,
  AlertCircle,
  LogIn,
  BookOpen,
  Eye,
  RefreshCw,
  FileText,
} from "lucide-react";
import clsx from "clsx";

const PROMPT_TEXT = `You are converting a set of exam questions into a strict JSON format for a quiz platform. I will give you a paper's worth of questions below (or describe/paste them). Convert ALL of them into a single JSON object matching EXACTLY this schema - no extra commentary, no markdown fences, JSON only:

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
- If the original paper doesn't specify marks/negative marking, default marks to 1 and negativeMarks to 0.33 per question: the website lets the uploader change these afterward, so defaults are fine.
- Do not invent questions that aren't in the source material.
- Do not skip any question from the source material.
- Output ONLY the JSON object, nothing else: no explanation, no markdown code fences, no preamble.

Here are my questions:
[PASTE YOUR QUESTIONS / DESCRIBE YOUR IMAGE OR PDF HERE]`;

export function QuizCreateClient() {
  const searchParams = useSearchParams();
  const reuseId = searchParams.get("reuseId");
  const { data: session, status } = useSession();

  const [copied, setCopied] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successSubmission, setSuccessSubmission] = useState<{ id: string; title: string; count: number } | null>(null);
  const [loadingReuse, setLoadingReuse] = useState(false);

  // If reuseId is passed in URL, load submission from API
  useEffect(() => {
    if (!reuseId) return;

    const fetchReuseSubmission = async () => {
      setLoadingReuse(true);
      try {
        const res = await fetch(`/api/quiz-tools/submissions/${reuseId}`);
        if (!res.ok) {
          throw new Error("Failed to load submission for reuse");
        }
        const data = await res.json();
        if (data.data?.submission?.jsonData) {
          setJsonText(JSON.stringify(data.data.submission.jsonData, null, 2));
        }
      } catch (err: any) {
        console.error("Reuse load error:", err);
        setValidationError("Could not load submission for reuse. Please try again.");
      } finally {
        setLoadingReuse(false);
      }
    };

    fetchReuseSubmission();
  }, [reuseId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(PROMPT_TEXT);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error("Failed to copy prompt:", err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonText(content || "");
      setValidationError(null);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSuccessSubmission(null);

    if (status === "unauthenticated") {
      setValidationError("Authentication required. Please sign in to save your quiz JSON.");
      return;
    }

    if (!jsonText.trim()) {
      setValidationError("Please paste or upload valid quiz JSON before submitting.");
      return;
    }

    let parsedJson: any;
    try {
      parsedJson = JSON.parse(jsonText);
    } catch {
      setValidationError("Malformed JSON format. Please ensure your input is valid JSON.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/quiz-tools/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonData: parsedJson,
          originalFileName: fileName || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setValidationError("Your session expired. Please sign in again.");
        } else {
          setValidationError(data.error?.message || "Failed to save quiz submission.");
        }
        return;
      }

      const created = data.data?.submission;
      setSuccessSubmission({
        id: created._id,
        title: created.quizTitle,
        count: created.questionCount,
      });
      setJsonText("");
      setFileName(null);
    } catch (err: any) {
      console.error("Submission error:", err);
      setValidationError("Network error while submitting quiz JSON.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12 px-3 sm:px-6 lg:px-8">
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
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
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
            <h3 className="text-xs font-bold text-slate-900">Upload & Save</h3>
            <p className="text-[11px] text-slate-500 leading-normal">
              Submit your JSON to save it to your account for admin review & publishing.
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
        </div>

        {/* JSON Submission & Editor Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-amber-600" />
                <span>Upload & Save Quiz JSON</span>
              </h2>
              <p className="text-xs text-slate-500">
                Paste the AI output or upload a .json file to store in your account history.
              </p>
            </div>

            {session?.user && (
              <Link
                href="/quiz-tools/submissions"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors shrink-0"
              >
                <FileText className="w-4 h-4 text-amber-700" />
                <span>My Submissions</span>
              </Link>
            )}
          </div>

          {/* Login Required Notice for Unauthenticated Visitors */}
          {status === "unauthenticated" && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-900 shrink-0">
                  <LogIn className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Login required to save your quiz JSON</h3>
                  <p className="text-[11px] text-slate-600">
                    Sign in with your Google account to submit JSON and track your submission history.
                  </p>
                </div>
              </div>
              <button
                onClick={() => signIn("google", { callbackUrl: "/quiz-tools/create" })}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-sm whitespace-nowrap shrink-0"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign in with Google</span>
              </button>
            </div>
          )}

          {loadingReuse && (
            <div className="p-4 rounded-xl bg-blue-50 text-blue-800 text-xs flex items-center gap-2 animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Loading saved submission for editing...</span>
            </div>
          )}

          {/* Success Message Alert */}
          {successSubmission && (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <span>Quiz JSON saved successfully!</span>
              </div>
              <p className="text-xs text-emerald-800">
                &ldquo;{successSubmission.title}&rdquo; ({successSubmission.count} questions) has been stored in your submission history.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Link
                  href="/quiz-tools/submissions"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View My Submissions</span>
                </Link>
              </div>
            </div>
          )}

          {/* Validation Error Alert */}
          {validationError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="jsonText" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Quiz JSON Data
              </label>

              <div className="relative">
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-amber-700 font-semibold cursor-pointer">
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{fileName ? `File: ${fileName}` : "Upload .json file"}</span>
                </span>
              </div>
            </div>

            <textarea
              id="jsonText"
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                setValidationError(null);
              }}
              rows={12}
              placeholder="Paste generated quiz JSON here..."
              className="w-full p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs border border-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
            />

            <div className="flex items-center justify-between gap-4 pt-2">
              <p className="text-[11px] text-slate-500">
                Supported limit: up to 300 questions / 2MB per JSON file.
              </p>

              <button
                type="submit"
                disabled={submitting || status === "unauthenticated" || !jsonText.trim()}
                className={clsx(
                  "inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md shrink-0",
                  status === "unauthenticated" || !jsonText.trim() || submitting
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-amber-500 hover:bg-amber-400 text-slate-950"
                )}
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving JSON...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>{status === "authenticated" ? "Upload & Save to Account" : "Login Required to Save"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
