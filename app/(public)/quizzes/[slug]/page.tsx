import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { QuizService } from "@/server/services/quiz-service";
import {
  CheckSquare,
  Clock,
  Award,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  ChevronRight,
  Sparkles,
} from "lucide-react";

import { getSiteUrl } from "@/server/lib/seo";

export const dynamic = "force-dynamic";

interface QuizPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: QuizPageProps): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  const quiz = await QuizService.getPublicQuizBySlug(params.slug);
  if (!quiz) {
    return {
      title: "Quiz Not Found",
    };
  }

  const title = `${quiz.title} | Online Mock Test`;
  const description = `Take the ${quiz.title} mock test (${quiz.questionCount} questions). Test your exam readiness with authentic scoring and explanations.`;
  const canonicalUrl = `${siteUrl}/quizzes/${quiz.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${quiz.title} | Online Mock Test | Rajasthan Exam Twister`,
      description,
      url: canonicalUrl,
    },
    twitter: {
      card: "summary_large_image",
      title: `${quiz.title} | Online Mock Test | Rajasthan Exam Twister`,
      description,
    },
  };
}

import { QuizSessionSelector } from "@/components/public/quiz-session-selector";

export default async function QuizIntroPage({ params }: QuizPageProps) {
  const siteUrl = getSiteUrl();
  const quiz = await QuizService.getPublicQuizBySlug(params.slug);
  if (!quiz) {
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
            name: "Mock Quizzes",
            item: `${siteUrl}/quizzes`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: quiz.title,
            item: `${siteUrl}/quizzes/${quiz.slug}`,
          },
        ],
      },
      {
        "@type": "LearningResource",
        name: quiz.title,
        description: `Online mock test with ${quiz.totalBankQuestions || quiz.questionCount} MCQs for Rajasthan competitive exams.`,
        url: `${siteUrl}/quizzes/${quiz.slug}`,
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
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Structured Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-2 text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-amber-700 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <Link href="/quizzes" className="hover:text-amber-700 transition-colors">
            Mock Quizzes
          </Link>
          {quiz.subject && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="text-slate-600">{quiz.subject}</span>
            </>
          )}
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-slate-900 font-bold truncate max-w-xs sm:max-w-md">
            {quiz.title}
          </span>
        </nav>

        {/* Hero Card */}
        <div className="bg-white rounded-3xl border border-amber-200/80 shadow-md p-6 sm:p-10 space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {quiz.subject && (
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200 font-sans">
                  {quiz.subject}
                </span>
              )}
              {quiz.category && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 font-sans">
                  {quiz.category.name}
                </span>
              )}
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 font-sans">
                Free Mock Test
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B132B] leading-tight font-heading">
              {quiz.title}
            </h1>
          </div>

          {/* Key Quiz Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 pt-4 border-t border-amber-100">
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70">
              <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block font-sans">
                Topic Bank Questions
              </span>
              <span className="text-xl font-black text-[#0B132B] mt-1 block font-heading">
                {quiz.totalBankQuestions || quiz.questionCount} MCQs
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70">
              <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block font-sans">
                Part Structure
              </span>
              <span className="text-xl font-black text-[#0B132B] mt-1 block font-heading">
                Dynamic (10-50 Qs)
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block font-sans">
                Marking Scheme
              </span>
              <span className="text-xl font-black text-[#0B132B] mt-1 block font-heading">
                +{quiz.defaultMarks} / 0 (Practice)
              </span>
              <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                Exam Test: -{quiz.defaultNegativeMarks > 0 ? quiz.defaultNegativeMarks : (quiz.defaultMarks / 3).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Marking Scheme Banner */}
          <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5 font-heading">
              <Award className="w-4 h-4 text-amber-700" />
              <span>Marking Scheme & Multi-Part Structure (मूल्यांकन व खंड नियम)</span>
            </h3>
            <ul className="text-xs text-amber-950 space-y-1.5 font-devanagari">
              <li className="flex items-center gap-2">
                <span className="font-bold text-emerald-700">+{quiz.defaultMarks} अंक:</span> प्रत्येक सही उत्तर के लिए
              </li>
              <li className="flex items-center gap-2">
                <span className="font-bold text-emerald-800">0 अंक (Default Quiz Mode):</span> क्विज़ अभ्यास में कोई नेगेटिव मार्किंग नहीं (No negative marking)
              </li>
              <li className="flex items-center gap-2">
                <span className="font-bold text-red-700">
                  -{quiz.defaultNegativeMarks > 0 ? quiz.defaultNegativeMarks : (quiz.defaultMarks / 3).toFixed(2)} अंक (Exam Test Mode):
                </span>{" "}
                परीक्षा पेपर नियम के अनुसार टेस्ट मोड में नेगेटिव मार्किंग लागू होगी
              </li>
              <li className="flex items-center gap-2">
                <span className="font-bold text-slate-800">Sequential Practice:</span> सभी प्रश्नों को खंडों (Parts) में विभाजित किया गया है ताकि आप क्रमवार तैयारी कर सकें।
              </li>
            </ul>
          </div>

          {/* Test Instructions */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-heading">
              Exam Instructions & Rules
            </h3>
            <ul className="text-xs text-slate-700 space-y-2 list-disc list-inside font-devanagari">
              <li>प्रत्येक प्रश्न में 4 विकल्प हैं जिनमें से केवल 1 सही उत्तर है।</li>
              <li>बाय डिफॉल्ट क्विज़ अभ्यास में कोई नेगेटिव मार्किंग नहीं है। यदि आप परीक्षा जैसा टेस्ट देना चाहते हैं तो &lsquo;Exam Test&rsquo; मोड चुन सकते हैं।</li>
              <li>सबमिट करने पर तुरंत प्रामाणिक स्कोरकार्ड और विस्तृत व्याख्या उपलब्ध कराई जाएगी।</li>
            </ul>
          </div>

          {/* Dynamic Session Size Selector & CTA */}
          <QuizSessionSelector
            slug={quiz.slug}
            totalBankQuestions={quiz.totalBankQuestions || quiz.questionCount}
            defaultMarks={quiz.defaultMarks}
            defaultNegativeMarks={quiz.defaultNegativeMarks}
          />
        </div>
      </div>
    </div>
  );
}
