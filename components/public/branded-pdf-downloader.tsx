"use client";

import { Printer, Download, Sparkles } from "lucide-react";

interface BrandedPdfDownloaderProps {
  noteTitle: string;
}

export function BrandedPdfDownloader({ noteTitle }: BrandedPdfDownloaderProps) {
  const handlePrintPdf = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <button
      onClick={handlePrintPdf}
      className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 rounded-xl shadow-xs transition-all flex items-center gap-1.5 print:hidden"
      title="Download or print high-yield revision sheet PDF with branding"
    >
      <Download className="w-3.5 h-3.5" />
      <span>Download Branded PDF</span>
    </button>
  );
}
