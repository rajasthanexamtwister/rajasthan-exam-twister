"use client";

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Flag,
  Loader2,
  X,
  HelpCircle,
  ShieldAlert,
} from "lucide-react";
import clsx from "clsx";
import {
  QUESTION_ISSUE_REASONS,
  QuestionIssueReasonType,
  REASON_CONFIG,
} from "@/server/validation/question-report";

interface QuestionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizId: string;
  quizSlug: string;
  questionId: string;
  questionNumber: number;
  questionSnippet?: string;
}

export function QuestionReportModal({
  isOpen,
  onClose,
  quizId,
  quizSlug,
  questionId,
  questionNumber,
  questionSnippet,
}: QuestionReportModalProps) {
  const [selectedReason, setSelectedReason] =
    useState<QuestionIssueReasonType>("INCORRECT_ANSWER");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reset form when modal opens or question changes
  useEffect(() => {
    if (isOpen) {
      setSelectedReason("INCORRECT_ANSWER");
      setDescription("");
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen, questionId]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  const currentConfig = REASON_CONFIG[selectedReason];
  const isDescriptionRequired = currentConfig.descriptionRequired;
  const isDescriptionEmpty = !description.trim();
  const isSubmitDisabled = submitting || (isDescriptionRequired && isDescriptionEmpty);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitDisabled) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(
        `/api/quizzes/${quizId}/questions/${questionId}/report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason: selectedReason,
            description: description.trim(),
            quizSlug,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(
          data?.error?.message ||
            data?.message ||
            "Failed to submit issue report. Please try again."
        );
        return;
      }

      setSuccessMessage(
        data.message ||
          "Thank you! Your issue report has been submitted to the editorial team."
      );
    } catch (err: any) {
      console.error("Question report error:", err);
      setErrorMessage("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 bg-gradient-to-r from-amber-500/10 via-amber-50 to-white border-b border-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
              <Flag className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3
                id="report-modal-title"
                className="text-base font-extrabold text-slate-900 leading-tight"
              >
                Report an Issue
              </h3>
              <p className="text-xs font-semibold text-amber-900/80">
                Question #{questionNumber} • प्रश्न में त्रुटि की रिपोर्ट करें
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        {successMessage ? (
          <div className="p-6 sm:p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 mx-auto flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-lg font-bold text-slate-900">
                Report Submitted!
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                {successMessage}
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Return to Exam
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {questionSnippet && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-xs text-slate-700">
                <span className="font-bold text-slate-900 block mb-0.5">
                  Question:
                </span>
                <p className="line-clamp-2 italic text-slate-600">
                  &ldquo;{questionSnippet}&rdquo;
                </p>
              </div>
            )}

            {errorMessage && (
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            {/* 5 Specific Reasons Radio Group */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Select Reason for Report <span className="text-red-500">*</span>
              </label>

              <div className="space-y-2">
                {QUESTION_ISSUE_REASONS.map((reasonKey) => {
                  const cfg = REASON_CONFIG[reasonKey];
                  const isChecked = selectedReason === reasonKey;

                  return (
                    <label
                      key={reasonKey}
                      className={clsx(
                        "flex items-center gap-3 p-3 rounded-2xl border text-xs font-semibold cursor-pointer transition-all",
                        isChecked
                          ? "bg-amber-50/80 border-amber-400 text-slate-950 shadow-xs ring-1 ring-amber-400/30"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                      )}
                    >
                      <input
                        type="radio"
                        name="report-reason"
                        value={reasonKey}
                        checked={isChecked}
                        onChange={() => setSelectedReason(reasonKey)}
                        className="w-4 h-4 text-amber-600 border-slate-300 focus:ring-amber-500 shrink-0"
                      />
                      <div className="flex-1 flex flex-wrap items-center justify-between gap-1">
                        <span className="font-bold">{cfg.label}</span>
                        <span className="text-[11px] font-normal text-slate-500">
                          {cfg.hindiLabel}
                        </span>
                      </div>
                      {cfg.descriptionRequired && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
                          Details Req.
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Description Field (Required for OTHER, optional for others) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="report-description"
                  className="text-xs font-bold text-slate-800"
                >
                  {isDescriptionRequired ? (
                    <>
                      Describe the Issue <span className="text-red-500">*</span>
                    </>
                  ) : (
                    "Additional Details (Optional)"
                  )}
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {description.length}/1000
                </span>
              </div>

              <textarea
                id="report-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                placeholder={
                  isDescriptionRequired
                    ? "Please specify the exact issue in detail so our editorial team can verify it..."
                    : "E.g., Which option should be correct, reference book, or typo details..."
                }
                className={clsx(
                  "w-full px-3.5 py-2.5 rounded-2xl border text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all resize-none",
                  isDescriptionRequired && isDescriptionEmpty
                    ? "border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    : "border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-300/20"
                )}
              />

              {isDescriptionRequired && isDescriptionEmpty && (
                <p className="text-[11px] text-amber-700 font-medium">
                  * A brief description is required when selecting &apos;Other&apos;.
                </p>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                id="submit-question-report-btn"
                disabled={isSubmitDisabled}
                className={clsx(
                  "inline-flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer",
                  isSubmitDisabled
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-amber-500 hover:bg-amber-400 text-slate-950 hover:shadow-md"
                )}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Flag className="w-3.5 h-3.5" />
                    <span>Submit Report</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default QuestionReportModal;
