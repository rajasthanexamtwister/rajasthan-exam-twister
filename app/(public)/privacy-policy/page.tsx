import { Metadata } from "next";
import Link from "next/link";
import { Shield, Lock, Eye, FileText, ArrowLeft, Mail } from "lucide-react";
import { getSiteUrl } from "@/server/lib/seo";
import { CookieSettingsButton } from "@/components/privacy/cookie-settings-button";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Privacy Policy | Rajasthan Exam Twister",
  description:
    "Privacy Policy for Rajasthan Exam Twister. Learn how we collect, protect, and handle student data, cookies, analytics, and Google AdSense privacy compliance.",
  alternates: {
    canonical: `${siteUrl}/privacy-policy`,
  },
};

export default function PrivacyPolicyPage() {
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
              <Shield className="w-7 h-7 text-amber-700" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#0B132B]">
                Privacy Policy
              </h1>
              <p className="text-xs text-slate-500">
                Last updated: October 2026 | Rajasthan Exam Twister Compliance Policy
              </p>
            </div>
          </div>
        </div>

        <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed space-y-6 text-slate-700">
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#0B132B] flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600" />
              1. Overview & Commitment
            </h2>
            <p>
              At <strong>Rajasthan Exam Twister</strong> (accessible at{" "}
              <a href={siteUrl} className="text-amber-700 underline font-semibold">
                https://www.rajasthanexamtwister.in
              </a>
              ), we respect the privacy of our students, educators, and visitors. This Privacy Policy details the types of information we collect, how it is used, and the security measures in place to safeguard your data.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#0B132B] flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-600" />
              2. Information We Collect
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>
                <strong>Google Authentication Data:</strong> When students sign in using Google OAuth, we receive your name, email address, and profile avatar to maintain your quiz attempts, leaderboard scores, and revision notebook.
              </li>
              <li>
                <strong>Student Quiz & Practice Data:</strong> We store quiz submission scores, bookmarked questions, weak-topic performance, and incorrect question history for personalized student revision.
              </li>
              <li>
                <strong>Anonymous Real-Time Visitor Logs:</strong> We log aggregated, non-personally identifiable presence heartbeats to count active study sessions on the platform.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#0B132B] flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              3. Google AdSense & Google Analytics 4 (Consent Mode v2)
            </h2>
            <p>
              Rajasthan Exam Twister uses Google Analytics 4 (GA4) to understand portal traffic and Google AdSense to serve relevant educational advertisements.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>
                <strong>Google Consent Mode v2:</strong> We adhere to Google Consent Mode v2. By default, advertising and analytics storage are strictly denied until you explicitly grant consent through our cookie preferences banner.
              </li>
              <li>
                <strong>Google AdSense & Cookies:</strong> Google and third-party vendors use cookies to serve ads based on your visit to our website and other sites across the web.
              </li>
              <li>
                <strong>Analytics Measurement:</strong> Aggregated anonymous usage metrics are captured only when analytics consent is granted to help us enhance quiz question quality and site responsiveness.
              </li>
              <li>
                <strong>Student Rights & Opt-Out:</strong> You can manage or revoke your cookie choices at any time by clicking the button below or visiting{" "}
                <a
                  href="https://www.google.com/settings/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-700 underline font-medium"
                >
                  Google Ads Settings
                </a>
                .
              </li>
            </ul>

            <div className="pt-2">
              <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-xs block text-amber-400">Your Privacy, Your Choice</span>
                  <p className="text-[11px] text-slate-300">You can customize or change your cookie and tracking consent at any time.</p>
                </div>
                <CookieSettingsButton className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shrink-0 cursor-pointer">
                  Manage Cookie Preferences
                </CookieSettingsButton>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#0B132B]">
              4. Data Retention & Student Rights
            </h2>
            <p>
              You retain full control over your student data. You may sign out or request account/notebook deletion at any time by contacting our editorial team at{" "}
              <a href="mailto:rajasthanexamtwister@gmail.com" className="text-amber-700 font-bold underline">
                rajasthanexamtwister@gmail.com
              </a>
              .
            </p>
          </section>

          <section className="space-y-2 border-t border-amber-200/60 pt-4">
            <h2 className="text-base sm:text-lg font-bold text-[#0B132B]">
              5. Contact Us
            </h2>
            <p>
              If you have any questions or privacy inquiries regarding our platform policy:
            </p>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3">
              <Mail className="w-5 h-5 text-amber-700 shrink-0" />
              <div>
                <span className="font-bold text-slate-900 block text-xs">Official Support Email</span>
                <a href="mailto:rajasthanexamtwister@gmail.com" className="text-amber-800 font-bold text-xs underline">
                  rajasthanexamtwister@gmail.com
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
