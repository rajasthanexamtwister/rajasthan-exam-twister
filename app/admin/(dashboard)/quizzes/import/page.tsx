"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  UploadCloud,
  FileJson,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Eye,
  Check,
} from "lucide-react";
import clsx from "clsx";

interface ParsedQuestion {
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  marks?: number;
  negativeMarks?: number;
}

interface ParsedQuizData {
  quizTitle: string;
  subject?: string;
  questions: ParsedQuestion[];
}

export default function AdminQuizImportPage() {
  const router = useRouter();
  const [jsonInput, setJsonInput] = useState("");
  const [parsedData, setParsedData] = useState<ParsedQuizData | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [activeTab, setActiveTab] = useState<"paste" | "upload">("paste");

  const validateAndParse = (rawText: string) => {
    setValidationErrors([]);
    setParsedData(null);

    if (!rawText.trim()) {
      return;
    }

    try {
      const obj = JSON.parse(rawText);
      const errors: string[] = [];

      if (!obj || typeof obj !== "object") {
        setValidationErrors(["Root JSON must be an object."]);
        return;
      }

      if (!obj.quizTitle || typeof obj.quizTitle !== "string" || !obj.quizTitle.trim()) {
        errors.push("Missing or invalid 'quizTitle' (must be a non-empty string).");
      }

      if (!Array.isArray(obj.questions)) {
        errors.push("Missing or invalid 'questions' array.");
      } else {
        if (obj.questions.length === 0) {
          errors.push("Questions array cannot be empty.");
        } else if (obj.questions.length > 300) {
          errors.push(`Hard cap exceeded: ${obj.questions.length} questions provided (max 300).`);
        }

        obj.questions.forEach((q: unknown, idx: number) => {
          if (!q || typeof q !== "object") {
            errors.push(`Question #${idx + 1} is not a valid object.`);
            return;
          }
          const questionObj = q as Record<string, unknown>;

          if (typeof questionObj.questionText !== "string" || !questionObj.questionText.trim()) {
            errors.push(`Question #${idx + 1}: Missing or empty 'questionText'.`);
          }

          if (!Array.isArray(questionObj.options) || questionObj.options.length < 2 || questionObj.options.length > 6) {
            errors.push(`Question #${idx + 1}: 'options' must be an array of 2 to 6 items.`);
          } else {
            const optLen = questionObj.options.length;
            if (
              typeof questionObj.correctOptionIndex !== "number" ||
              !Number.isInteger(questionObj.correctOptionIndex) ||
              questionObj.correctOptionIndex < 0 ||
              questionObj.correctOptionIndex >= optLen
            ) {
              errors.push(
                `Question #${idx + 1}: 'correctOptionIndex' (${questionObj.correctOptionIndex}) is out of bounds (options length: ${optLen}).`
              );
            }
          }
        });
      }

      if (errors.length > 0) {
        setValidationErrors(errors);
      } else {
        setParsedData(obj as ParsedQuizData);
      }
    } catch (err: unknown) {
      const e = err as Error;
      setValidationErrors([`JSON Syntax Error: ${e.message}`]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonInput(content);
      validateAndParse(content);
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async () => {
    if (!parsedData) return;

    try {
      setImporting(true);
      const res = await fetch("/api/quizzes/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-requested-with": "ret-admin",
        },
        body: JSON.stringify(parsedData),
      });

      const data = await res.json();
      if (res.ok) {
        router.push(`/admin/quizzes/${data.quiz._id}/edit`);
      } else {
        alert(data.error?.message || "Failed to import quiz");
      }
    } catch (err) {
      console.error("Import submit error:", err);
      alert("An unexpected error occurred during import.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/quizzes"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Quizzes</span>
        </Link>
        <Link
          href="/quiz-tools/create"
          target="_blank"
          className="text-xs font-semibold text-amber-600 hover:text-amber-700 underline"
        >
          Need AI Prompt? Open Prompt Generator
        </Link>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <h1 className="text-2xl font-bold text-slate-900">Import Quiz from AI JSON</h1>
        <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
          Upload or paste the JSON generated by ChatGPT/Claude following our prompt schema. The platform validates structure, option bounds, and tags before creating a draft quiz.
        </p>
      </div>

      {/* Input Selection Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/70 p-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("paste")}
            className={clsx(
              "px-4 py-2 rounded-xl text-xs font-semibold transition-all",
              activeTab === "paste"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                : "text-slate-600 hover:bg-slate-200/60"
            )}
          >
            Paste JSON Text
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={clsx(
              "px-4 py-2 rounded-xl text-xs font-semibold transition-all",
              activeTab === "upload"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                : "text-slate-600 hover:bg-slate-200/60"
            )}
          >
            Upload .json File
          </button>
        </div>

        <div className="p-6 space-y-4">
          {activeTab === "upload" ? (
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <FileJson className="w-10 h-10 text-amber-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">Select AI Quiz JSON File</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">Supported file format: .json (up to 300 questions)</p>
              <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg cursor-pointer transition-all shadow-sm">
                <UploadCloud className="w-4 h-4" />
                <span>Browse File</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Paste Raw JSON
              </label>
              <textarea
                rows={12}
                value={jsonInput}
                onChange={(e) => {
                  setJsonInput(e.target.value);
                  validateAndParse(e.target.value);
                }}
                placeholder='{\n  "quizTitle": "Rajasthan History & Heritage Mock 1",\n  "subject": "Rajasthan GK",\n  "questions": [\n    {\n      "questionText": "Where is Mehrangarh Fort located?",\n      "options": ["Jaipur", "Jodhpur", "Udaipur", "Bikaner"],\n      "correctOptionIndex": 1,\n      "explanation": "Mehrangarh Fort is in Jodhpur."\n    }\n  ]\n}'
                className="w-full font-mono text-xs p-4 bg-slate-950 text-emerald-400 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed selection:bg-slate-800"
              />
            </div>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-red-800 text-xs font-bold">
                <AlertCircle className="w-4 h-4" />
                <span>Validation Errors ({validationErrors.length})</span>
              </div>
              <ul className="list-disc list-inside text-xs text-red-700 space-y-1 max-h-40 overflow-y-auto">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Validated Preview Banner */}
          {parsedData && validationErrors.length === 0 && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-xs font-bold">JSON Validated Successfully</p>
                  <p className="text-[11px] text-emerald-700">
                    &quot;{parsedData.quizTitle}&quot; &bull; {parsedData.questions.length} questions detected
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleImportSubmit}
                disabled={importing}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-sm transition-all"
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Import Draft Quiz</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Questions Preview Section */}
      {parsedData && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Questions Preview ({parsedData.questions.length})</h2>
              <p className="text-xs text-slate-500">
                Review parsed questions and verified answer keys before creating the quiz.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
              Subject: {parsedData.subject || "General"}
            </span>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {parsedData.questions.map((q, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="font-bold text-slate-900 whitespace-pre-line leading-relaxed">
                    Q{idx + 1}. {q.questionText}
                  </span>
                  <span className="text-[10px] bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded shrink-0">
                    {q.options.length} options
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {q.options.map((opt, optIdx) => {
                    const isCorrect = optIdx === q.correctOptionIndex;
                    return (
                      <div
                        key={optIdx}
                        className={clsx(
                          "p-2 rounded-lg border flex items-center gap-2",
                          isCorrect
                            ? "bg-emerald-100/70 border-emerald-300 text-emerald-950 font-semibold"
                            : "bg-white border-slate-200 text-slate-700"
                        )}
                      >
                        <span
                          className={clsx(
                            "w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold",
                            isCorrect
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 text-slate-600"
                          )}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="truncate">{opt}</span>
                        {isCorrect && (
                          <span className="ml-auto text-[10px] text-emerald-700 font-bold uppercase">
                            Correct
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {q.explanation && (
                  <p className="text-[11px] text-slate-500 bg-white p-2 rounded-lg border border-slate-200/60">
                    <span className="font-semibold text-slate-700">Explanation:</span> {q.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={handleImportSubmit}
              disabled={importing}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-sm transition-all"
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>Confirm & Import {parsedData.questions.length} Questions</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
