import { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Building2, HelpCircle } from "lucide-react";
import { getSiteUrl } from "@/server/lib/seo";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Disclaimer & Editorial Policy | Rajasthan Exam Twister",
  description:
    "Disclaimer and Editorial Policy for Rajasthan Exam Twister. Learn about our non-government affiliation status, fact verification standards, and study guidance disclaimer.",
  alternates: {
    canonical: `${siteUrl}/disclaimer`,
  },
};

export default function DisclaimerPage() {
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
              <AlertCircle className="w-7 h-7 text-amber-700" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#0B132B]">
                Disclaimer & Editorial Policy
              </h1>
              <p className="text-xs text-slate-500">
                Official Examination Guidance Disclaimer & Content Safety
              </p>
            </div>
          </div>
        </div>

        <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed space-y-6 text-slate-700">
          
          {/* Non-Gov Affiliation Box */}
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
              <Building2 className="w-4 h-4 text-amber-700" />
              <span>Non-Governmental Educational Entity Disclaimer</span>
            </div>
            <p className="text-xs text-slate-700">
              <strong>Rajasthan Exam Twister</strong> is an independent educational portal designed exclusively for competitive exam self-study and revision. We are <strong>NOT</strong> affiliated with, endorsed by, or representing RPSC (Rajasthan Public Service Commission), RSSB/RSMSSB (Rajasthan Staff Selection Board), REET, or any department of the Government of Rajasthan.
            </p>
          </div>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#0B132B]">
              1. Accuracy & Verification of Exam Updates
            </h2>
            <p>
              While our editorial workflow verifies official notifications, recruitment guidelines, exam syllabi, and current affairs against government portals (Tier-1 official sources), government exam rules, application dates, and answer keys are subject to change by official bodies. Students are always advised to cross-check official notifications directly on official government portals (e.g. <code>rpsc.rajasthan.gov.in</code> or <code>rssb.rajasthan.gov.in</code>).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#0B132B]">
              2. Exam Results & Selection Disclaimer
            </h2>
            <p>
              Our mock quizzes, booster tests, and revision notes are created to enhance student understanding and speed. Practicing tests on Rajasthan Exam Twister does not guarantee selection or official rank in state competitive exams.
            </p>
          </section>

          <section className="space-y-2 border-t border-amber-200/60 pt-4">
            <h2 className="text-base sm:text-lg font-bold text-[#0B132B] flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              3. Questions & Feedback
            </h2>
            <p>
              If you notice any typographical or factual discrepancy in any question, note, or current affair article, please contact us immediately at{" "}
              <a href="mailto:officalmarshal@gmail.com" className="text-amber-800 font-bold underline">
                officalmarshal@gmail.com
              </a>{" "}
              for editorial correction.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
