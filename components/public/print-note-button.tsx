"use client";

import { Printer } from "lucide-react";

interface PrintNoteButtonProps {
  noteTitle: string;
}

export function PrintNoteButton({ noteTitle }: PrintNoteButtonProps) {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-amber-100/70 text-slate-700 hover:text-amber-900 border border-slate-200 hover:border-amber-300 transition-all shadow-sm group print:hidden"
      title={`Print or Save "${noteTitle}" as PDF`}
      aria-label="Print or Save Note"
    >
      <Printer className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-700 transition-colors" />
      <span>Print / Save PDF</span>
    </button>
  );
}
