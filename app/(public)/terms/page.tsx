import { Metadata } from "next";
import Link from "next/link";
import { FileCheck, ArrowLeft, AlertTriangle } from "lucide-react";
import { getSiteUrl } from "@/server/lib/seo";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Terms & Conditions | Rajasthan Exam Twister",
  description:
    "Terms and Conditions for using Rajasthan Exam Twister. Read our guidelines regarding educational content, mock test series, and website terms of service.",
  alternates: {
    canonical: `${siteUrl}/terms`,
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8 bg-white p-6 sm:p-10 rounded-3xl border border-amber-200/80 shadow-xs">
        
        {/* Navigation & Header */}
        <div className="space-y-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-amber-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-100 text-amber-900">
              <FileCheck className="w-7 h-7 text-amber-700" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#0B132B]">
                Terms & Conditions
              </h1>
              <p className="text-xs text-slate-500">
                Effective Date: October 2026 | Rajasthan Exam Twister Terms of Service
              </p>
            </div>
          </div>
        </div>

        <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed space-y-6 text-slate-700">
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#0B132B]">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using <strong>Rajasthan Exam Twister</strong> ({" "}
              <a href={siteUrl} className="text-amber-700 underline font-semibold">
                {siteUrl}
              </a>
              ), you agree to comply with and be bound by these Terms and Conditions. If you do not agree, please refrain from using the platform.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#0B132B]">
              2. Intellectual Property & Study Material Usage
            </h2>
            <p>
              All GK notes, practice quizzes, question banks, infographics, and editorial content published on this portal are the intellectual property of Rajasthan Exam Twister unless stated otherwise.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Content is provided strictly for individual student exam preparation (REET, RPSC, CET, Police SI, RSSB, Patwari, VDO, etc.).</li>
              <li>Unauthorized commercial scrapers, data harvesting, or selling of our quiz databases is strictly prohibited.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#0B132B]">
              3. Student Conduct & Account Safety
            </h2>
            <p>
              When participating in student leaderboard rankings or uploading quiz JSON files via student tools:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Users must provide authentic info via Google sign-in.</li>
              <li>Attempting to bypass security headers, inject malicious scripts, or exploit server APIs will result in permanent IP ban.</li>
            </ul>
          </section>

          <section className="space-y-2 border-t border-amber-200/60 pt-4">
            <h2 className="text-base sm:text-lg font-bold text-[#0B132B] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              4. Governing Law
            </h2>
            <p>
              These terms shall be governed by and construed in accordance with the laws of Rajasthan, India. Any legal disputes shall be subject to the jurisdiction of the courts in Rajasthan.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
