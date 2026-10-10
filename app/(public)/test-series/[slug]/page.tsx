import { Metadata } from "next";
import { notFound } from "next/navigation";
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
  Lock,
  PlayCircle,
  HelpCircle,
  CheckSquare,
} from "lucide-react";
import clsx from "clsx";
import { TestSeriesPaperList } from "./test-series-paper-list";

export const dynamic = "force-dynamic";

interface TestSeriesDetailPageProps {
  params: {
    slug: string;
  };
}

const siteUrl = getSiteUrl();

export async function generateMetadata({
  params,
}: TestSeriesDetailPageProps): Promise<Metadata> {
  const series = await TestSeriesService.getTestSeriesBySlug(params.slug);
  if (!series) {
    return {
      title: "Test Series Not Found",
    };
  }

  const title = `${series.title} | Online Test Series`;
  const description = `${series.description} Take full-length mock tests with All-Rajasthan Rank Predictor and detailed solutions.`;
  const canonicalUrl = `${siteUrl}/test-series/${series.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${series.title} | Rajasthan Exam Twister`,
      description,
      url: canonicalUrl,
      type: "website",
    },
  };
}

export default async function TestSeriesDetailPage({
  params,
}: TestSeriesDetailPageProps) {
  const series = await TestSeriesService.getTestSeriesBySlug(params.slug);
  if (!series) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: siteUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Test Series",
            item: `${siteUrl}/test-series`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: series.title,
            item: `${siteUrl}/test-series/${series.slug}`,
          },
        ],
      },
      {
        "@type": "Course",
        name: series.title,
        description: series.description,
        provider: {
          "@type": "Organization",
          name: "Rajasthan Exam Twister",
          url: siteUrl,
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-10 px-4 sm:px-6 lg:px-8">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-amber-700 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <Link href="/test-series" className="hover:text-amber-700 transition-colors">
            Test Series
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-slate-900 font-bold truncate max-w-xs sm:max-w-md">
            {series.title}
          </span>
        </nav>

        {/* Hero Card */}
        <header className="bg-white rounded-3xl p-6 sm:p-10 border border-amber-200/80 shadow-md space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200 font-sans">
                {series.targetExam}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 font-sans">
                {series.freeTestsCount} Free Demo Mocks Included
              </span>
              <div className="flex items-center gap-1 text-xs font-bold text-slate-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                <span>{series.rating}</span>
                <span className="text-slate-400 font-normal">({series.enrolledCount}+ Enrolled)</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B132B] leading-tight font-heading">
              {series.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-devanagari">
              {series.description}
            </p>
          </div>

          {/* Key Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-amber-100">
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-center">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                Total Papers
              </span>
              <span className="text-base font-black text-[#0B132B] block mt-0.5 font-heading">
                {series.totalTestsCount} Mocks
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-center">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                Questions Bank
              </span>
              <span className="text-base font-black text-[#0B132B] block mt-0.5 font-heading">
                {series.totalQuestionsCount} MCQs
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-center">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                Language
              </span>
              <span className="text-base font-black text-[#0B132B] block mt-0.5 font-heading">
                Bilingual (हिन्दी/EN)
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                Free Demo
              </span>
              <span className="text-base font-black text-emerald-950 block mt-0.5 font-heading">
                Available Now
              </span>
            </div>
          </div>

          {/* Features Checklist */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5 font-heading">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <span>Test Series Highlights &amp; Exam Analytics</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
              {series.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* Interactive Paper List with Smart Hybrid Auth */}
        <TestSeriesPaperList
          seriesTitle={series.title}
          quizzes={series.quizzes}
        />

      </div>
    </div>
  );
}
