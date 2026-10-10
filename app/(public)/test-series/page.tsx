import { Metadata } from "next";
import Link from "next/link";
import { TestSeriesService } from "@/server/services/test-series-service";
import { getSiteUrl } from "@/server/lib/seo";
import {
  Trophy,
  Award,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Star,
  Users,
  BookOpen,
  Zap,
} from "lucide-react";
import clsx from "clsx";

export const revalidate = 60;

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Rajasthan Online Mock Test Series | BCI, REET, RAS, CET, Police SI",
  description:
    "Full-length online test series for Rajasthan competitive exams (Computer Instructor BCI/SCI, RAS Pre, REET Level 1 & 2, CET, Police SI). Includes free demo tests, all-Rajasthan rank predictor, and authentic negative marking.",
  alternates: {
    canonical: `${siteUrl}/test-series`,
  },
  openGraph: {
    title: "Rajasthan Online Mock Test Series | Rajasthan Exam Twister",
    description:
      "Full-length model papers, subject drills, and all-Rajasthan rank predictor for BCI, REET, RAS, CET, and Police exams.",
    url: `${siteUrl}/test-series`,
    type: "website",
  },
};

interface TestSeriesPageProps {
  searchParams: {
    exam?: string;
  };
}

export default async function TestSeriesPage({ searchParams }: TestSeriesPageProps) {
  const activeExamFilter = searchParams.exam?.toLowerCase() || "all";
  const allSeries = await TestSeriesService.listTestSeries(
    activeExamFilter === "all" ? undefined : activeExamFilter
  );

  const examCategories = [
    { label: "All Exam Series", value: "all" },
    { label: "Computer Instructor (BCI)", value: "bci" },
    { label: "Pashu Parichar", value: "animal-attendant" },
    { label: "RAS / RTS (RPSC)", value: "ras" },
    { label: "REET / 3rd Grade", value: "reet" },
    { label: "Rajasthan CET", value: "cet" },
    { label: "Police SI & Constable", value: "rajasthan-police" },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-amber-700 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-slate-900 font-bold">Online Test Series</span>
        </nav>

        {/* Hero Header */}
        <header className="bg-white rounded-3xl p-6 sm:p-10 border border-amber-200/80 shadow-md space-y-4 text-center sm:text-left relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 font-sans">
                <Trophy className="w-3.5 h-3.5 text-amber-700" />
                <span>All-Rajasthan Rank &amp; Cutoff Predictor</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0B132B] tracking-tight font-heading">
                Rajasthan Competitive Exam Test Series Hub
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 font-devanagari leading-relaxed">
                RAS, REET, CET, एवं पुलिस भर्ती परीक्षाओं के लिए संपूर्ण पाठ्यक्रम पर आधारित फुल-लेंथ मॉडल टेस्ट पेपर्स। प्रामाणिक नेगेटिव मार्किंग और विस्तृत हल सहित।
              </p>
            </div>

            {/* Quality Badges */}
            <div className="flex flex-col gap-2 shrink-0 bg-amber-50/70 p-4 rounded-2xl border border-amber-200 text-xs text-slate-700 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% Free Demo Mocks Available</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Bilingual Hindi &amp; English Interface</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Instant Scorecard &amp; Solutions</span>
              </div>
            </div>
          </div>
        </header>

        {/* Filter Tabs by Target Exam */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {examCategories.map((cat) => {
            const isActive = activeExamFilter === cat.value;
            return (
              <Link
                key={cat.value}
                href={cat.value === "all" ? "/test-series" : `/test-series?exam=${cat.value}`}
                className={clsx(
                  "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 font-heading",
                  isActive
                    ? "bg-[#0B132B] text-amber-400 border-[#0B132B] shadow-xs"
                    : "bg-white text-slate-700 border-amber-200/90 hover:bg-amber-50 hover:border-amber-300"
                )}
              >
                {cat.label}
              </Link>
            );
          })}
        </div>

        {/* Test Series Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {allSeries.map((series) => (
            <div
              key={series.id}
              className="bg-white rounded-3xl border-2 border-amber-200/80 hover:border-amber-400 shadow-sm hover:shadow-md transition-all p-6 sm:p-8 flex flex-col justify-between space-y-6 group"
            >
              <div className="space-y-4">
                {/* Header Tag & Rating */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200 font-sans">
                    {series.targetExam}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span>{series.rating}</span>
                    <span className="text-slate-400 font-normal">({series.enrolledCount}+ Aspirants)</span>
                  </div>
                </div>

                {/* Series Title */}
                <h2 className="text-lg sm:text-xl font-black text-[#0B132B] group-hover:text-amber-800 transition-colors font-heading leading-tight">
                  {series.title}
                </h2>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {series.description}
                </p>

                {/* Key Spec Metrics Grid */}
                <div className="grid grid-cols-3 gap-2.5 pt-2">
                  <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-center">
                    <span className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider">
                      Total Tests
                    </span>
                    <span className="text-base font-black text-[#0B132B] block mt-0.5 font-heading">
                      {series.totalTestsCount} Tests
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-center">
                    <span className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider">
                      Question Bank
                    </span>
                    <span className="text-base font-black text-[#0B132B] block mt-0.5 font-heading">
                      {series.totalQuestionsCount} MCQs
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                    <span className="text-[10px] font-bold text-emerald-800 block uppercase tracking-wider">
                      Free Demo
                    </span>
                    <span className="text-base font-black text-emerald-950 block mt-0.5 font-heading">
                      {series.freeTestsCount} Tests
                    </span>
                  </div>
                </div>

                {/* Features List */}
                <ul className="space-y-1.5 pt-1 text-xs text-slate-700">
                  {series.features.slice(0, 3).map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-amber-100 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500 font-medium">
                  {series.language}
                </span>

                <Link
                  href={`/test-series/${series.slug}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-xs transition-all hover:scale-105 active:scale-95 font-heading"
                >
                  <span>Explore Series &amp; Free Demo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Student Trust Guarantee Footer Banner */}
        <section className="bg-[#0B132B] text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-1 text-center sm:text-left">
            <h2 className="text-base font-bold text-amber-400 font-heading">
              Smart Hybrid Practice Model
            </h2>
            <p className="text-xs text-slate-300">
              हर टेस्ट सीरीज़ में पहला टेस्ट 100% फ्री डेमो है। अपनी रैंक और प्रोग्रेस सेव करने के लिए 1-क्लिक Google साइन-इन करें।
            </p>
          </div>
          <Link
            href="/quizzes"
            className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-sm shrink-0 font-heading"
          >
            Browse Topic Quizzes
          </Link>
        </section>

      </div>
    </div>
  );
}
