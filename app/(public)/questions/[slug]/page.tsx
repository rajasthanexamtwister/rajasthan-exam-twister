import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronRight,
  Award,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  FileText,
  Clock,
  Layers,
} from "lucide-react";
import { QuestionSeoRepository } from "@/server/repositories/question-seo";
import { getSiteUrl } from "@/server/lib/seo";

export const dynamic = "force-dynamic";

interface QuestionPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: QuestionPageProps): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  const question = await QuestionSeoRepository.getPublishedQuestionBySlug(params.slug);

  if (!question) {
    return {
      title: "Question Not Found | Rajasthan Exam Twister",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const cleanQuestion = question.questionText.replace(/\s+/g, " ").trim();
  const title = question.seoTitle || `${cleanQuestion.slice(0, 65)}... | Rajasthan GK MCQ`;
  const description =
    question.seoDescription ||
    `${cleanQuestion.slice(0, 130)} - सही उत्तर, प्रामाणिक व्याख्या व महत्वपूर्ण परीक्षा तथ्य (RPSC, RSMSSB)।`;
  const canonicalUrl = `${siteUrl}/questions/${question.seoSlug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "article",
      siteName: "Rajasthan Exam Twister",
      locale: "hi_IN",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

const OPTION_LABELS = ["(A)", "(B)", "(C)", "(D)", "(E)", "(F)"];

export default async function PublicQuestionPage({ params }: QuestionPageProps) {
  const siteUrl = getSiteUrl();
  const question = await QuestionSeoRepository.getPublishedQuestionBySlug(params.slug);

  if (!question) {
    notFound();
    return null;
  }

  const relatedQuestions = await QuestionSeoRepository.getRelatedPublishedQuestions(
    question.quiz.id,
    question.id,
    4
  );

  const correctOptionText = question.options[question.correctOptionIndex] || "";
  const correctOptionLetter = OPTION_LABELS[question.correctOptionIndex] || "";

  // Compliant Schema.org structured data (LearningResource + Quiz/Question + BreadcrumbList)
  const structuredData = {
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
            name: "Quizzes",
            item: `${siteUrl}/quizzes`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: question.quiz.title,
            item: `${siteUrl}/quizzes/${question.quiz.slug}`,
          },
          {
            "@type": "ListItem",
            position: 4,
            name: `Question #${question.order}`,
            item: `${siteUrl}/questions/${question.seoSlug}`,
          },
        ],
      },
      {
        "@type": "LearningResource",
        "@id": `${siteUrl}/questions/${question.seoSlug}#resource`,
        name: question.questionText,
        description: question.seoDescription || question.explanation.slice(0, 160),
        learningResourceType: "Practice Problem",
        educationalLevel: "Competitive Examination",
        about: question.quiz.subject || "Rajasthan General Knowledge",
        provider: {
          "@type": "Organization",
          name: "Rajasthan Exam Twister",
          url: siteUrl,
        },
      },
      {
        "@type": "Quiz",
        "@id": `${siteUrl}/questions/${question.seoSlug}#quiz`,
        name: question.quiz.title,
        hasPart: {
          "@type": "Question",
          name: question.questionText,
          text: question.questionText,
          acceptedAnswer: {
            "@type": "Answer",
            text: `${correctOptionLetter} ${correctOptionText}`,
            comment: {
              "@type": "Comment",
              text: question.explanation,
            },
          },
          suggestedAnswer: question.options.map((opt, idx) => ({
            "@type": "Answer",
            position: idx + 1,
            text: `${OPTION_LABELS[idx] || ""} ${opt}`,
          })),
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-2 text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-amber-700 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <Link href="/quizzes" className="hover:text-amber-700 transition-colors">
            Quizzes
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <Link
            href={`/quizzes/${question.quiz.slug}`}
            className="hover:text-amber-700 transition-colors truncate max-w-xs"
          >
            {question.quiz.title}
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-slate-900 font-bold">
            Question #{question.order}
          </span>
        </nav>

        {/* Primary Question Card */}
        <article className="bg-white rounded-3xl border border-amber-200/80 shadow-md p-6 sm:p-10 space-y-8">
          {/* Header Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-100 pb-5">
            <div className="flex flex-wrap items-center gap-2">
              {question.quiz.subject && (
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200 font-sans">
                  {question.quiz.subject}
                </span>
              )}
              {question.examSource && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 font-sans">
                  {question.examSource}
                </span>
              )}
              {question.quiz.examTags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-600 border border-slate-200"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold font-sans">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verified Answer</span>
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#0B132B] text-amber-400 font-black text-sm flex items-center justify-center shrink-0 mt-0.5 font-heading">
                Q{question.order}
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B132B] leading-relaxed font-devanagari">
                {question.questionText}
              </h1>
            </div>

            {question.questionTextEn && (
              <p className="text-sm text-slate-600 font-medium pl-11 italic font-sans">
                {question.questionTextEn}
              </p>
            )}
          </div>

          {/* MCQ Options List */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-heading block">
              Options (विकल्प)
            </span>
            <div className="grid grid-cols-1 gap-2.5">
              {question.options.map((optText, idx) => {
                const isCorrect = idx === question.correctOptionIndex;
                const label = OPTION_LABELS[idx] || `(${idx + 1})`;

                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                      isCorrect
                        ? "bg-emerald-50/70 border-emerald-400 text-emerald-950 font-bold shadow-xs"
                        : "bg-slate-50/50 border-slate-200/80 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 font-heading ${
                          isCorrect
                            ? "bg-emerald-600 text-white"
                            : "bg-white text-slate-600 border border-slate-200"
                        }`}
                      >
                        {label}
                      </span>
                      <span className="text-sm font-semibold font-devanagari">
                        {optText}
                      </span>
                    </div>

                    {isCorrect && (
                      <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 shrink-0 font-heading">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="hidden sm:inline">Correct Answer</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Verified Correct Answer Highlight Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-50 to-transparent border-2 border-emerald-400/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5 font-heading">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Verified Correct Answer (प्रमाणित उत्तर)</span>
              </span>
              {question.verificationSource && (
                <span className="text-[11px] font-medium text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                  स्रोत: {question.verificationSource}
                </span>
              )}
            </div>
            <p className="text-base sm:text-lg font-black text-emerald-950 font-devanagari">
              {correctOptionLetter} {correctOptionText}
            </p>
          </div>

          {/* Detailed Authentic Explanation Block */}
          <div className="p-6 rounded-2xl bg-amber-50/60 border border-amber-200/90 space-y-3">
            <div className="flex items-center gap-2 text-amber-900 border-b border-amber-200/60 pb-2.5">
              <BookOpen className="w-4 h-4 text-amber-700" />
              <h2 className="text-xs font-black uppercase tracking-wider font-heading">
                Detailed Explanation &amp; Key Exam Facts (विस्तृत व्याख्या एवं तथ्य)
              </h2>
            </div>
            <p className="text-sm sm:text-base text-slate-800 leading-relaxed whitespace-pre-line font-devanagari">
              {question.explanation}
            </p>
            {question.reviewedAt && (
              <div className="text-[11px] text-slate-500 pt-2 border-t border-amber-100 flex items-center justify-between">
                <span>Editorial Review: Certified Authentic</span>
                <span>Last Updated: {new Date(question.updatedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>
            )}
          </div>

          {/* Practice Full Quiz CTA */}
          <div className="p-6 rounded-2xl bg-[#0B132B] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-bold uppercase tracking-wider font-heading">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Practice Full Topic Online</span>
              </div>
              <h3 className="text-lg font-black font-heading">
                {question.quiz.title}
              </h3>
              <p className="text-xs text-slate-300">
                Attempt the complete topic test with instant scorecard and rank prediction.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/quizzes/${question.quiz.slug}/attempt?part=1`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-md font-heading cursor-pointer"
              >
                <span>Start Practice Test</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Sibling Related Questions Internal Linking */}
          {relatedQuestions.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-heading">
                More Questions from {question.quiz.title}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {relatedQuestions.map((rq) => (
                  <Link
                    key={rq.seoSlug}
                    href={`/questions/${rq.seoSlug}`}
                    className="p-3.5 rounded-xl border border-amber-200/70 hover:border-amber-400 bg-white hover:bg-amber-50/40 transition-all text-xs font-semibold text-slate-800 flex items-center justify-between group shadow-2xs"
                  >
                    <span className="truncate pr-2 font-devanagari">
                      Q{rq.order}. {rq.questionText}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-700 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
