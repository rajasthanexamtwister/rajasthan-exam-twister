import Link from "next/link";
import { getSiteUrl } from "@/server/lib/seo";
import { BookOpen, FileText, Sparkles, Target, Award, Users, CheckCircle2, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Rajasthan Exam Twister provides comprehensive, high-yield revision notes, infographics, and exam preparation blogs for RAS, REET, CET, Police, and state competitive exams.",
  alternates: {
    canonical: `${getSiteUrl()}/about`,
  },
  openGraph: {
    title: "About Us | Rajasthan Exam Twister",
    description:
      "High-yield revision notes, infographics, and GK handbooks for Rajasthan competitive exams.",
    url: `${getSiteUrl()}/about`,
  },
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Hero Header */}
      <header className="text-center space-y-4 border-b border-slate-200 pb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span>About the Platform</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          About Rajasthan Exam Twister
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Dedicated study portal empowering Rajasthan competitive examination aspirants with fast, visual, and high-yield revision materials.
        </p>
      </header>

      {/* Mission Section */}
      <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 text-amber-600">
          <Target className="w-5 h-5" />
          <h2 className="text-xl font-bold text-slate-900">Our Mission</h2>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          Rajasthan competitive exams like RAS, REET, CET, Patwar, and Police SI require mastery over extensive General Knowledge, state history, geography, arts, and culture. We simplify this vast syllabus into concise revision handbooks, memory tricks, and visual infographics.
        </p>
      </section>

      {/* Target Examinations */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-600" />
          <span>Exams We Cover</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              title: "RAS / RTS (RPSC)",
              desc: "Rajasthan Administrative Services preliminary & mains GK breakdowns.",
            },
            {
              title: "REET / 3rd Grade Teacher",
              desc: "Child pedagogy, Rajasthan culture, geography, and language notes.",
            },
            {
              title: "Rajasthan CET (10+2 & Graduate)",
              desc: "Complete syllabus coverage and fast memory revision sheets.",
            },
            {
              title: "Rajasthan Police Constable & SI",
              desc: "High-yield state history, districts overview, and legal knowledge.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1.5"
            >
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{item.title}</span>
              </div>
              <p className="text-xs text-slate-600 pl-6">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Action Navigation CTA */}
      <section className="bg-slate-900 text-white rounded-3xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="text-lg font-bold">Ready to start preparing?</h2>
          <p className="text-xs text-slate-300">
            Browse our curated revision handbooks and subject notes right away.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/notes"
            className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4" />
            <span>Revision Notes</span>
          </Link>
          <Link
            href="/blogs"
            className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            <span>Articles</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
