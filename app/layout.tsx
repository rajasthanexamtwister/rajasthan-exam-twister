import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rajasthan Exam Twister — Rajasthan GK & Competitive Exam Hub",
  description: "Comprehensive notes, blogs, and master revision guides for REET, RPSC, CET, Rajasthan Police, and state competitive exams.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased bg-slate-50 text-slate-900 selection:bg-amber-100 selection:text-amber-900">
        {children}
      </body>
    </html>
  );
}
