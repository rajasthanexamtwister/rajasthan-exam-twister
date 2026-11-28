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

  const isBoosterOrTest =
    Boolean((quiz as any).isPersonalizedBooster) ||
    quiz.slug.startsWith("booster-") ||
    /alternative-name-but-same-questions|^\[?test\]?/i.test(quiz.title);

  return {
    title,
    description,
    ...(isBoosterOrTest
      ? {
          robots: {
            index: false,
            follow: false,
          },
        }
      : {}),
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
import { connectToDatabase } from "@/server/lib/mongodb";
import { QuizQuestion } from "@/server/models/QuizQuestion";

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

export default async function QuizIntroPage({ params }: QuizPageProps) {
  const siteUrl = getSiteUrl();
  const quiz = await QuizService.getPublicQuizBySlug(params.slug);
  if (!quiz) {
    notFound();
  }

  let sampleQuestions: Array<{
    _id: string;
    order: number;
    questionText: string;
    options: string[];
    correctOptionIndex: number;
    explanation?: string;
    verificationSource?: string;
  }> = [];

  try {
    await connectToDatabase();
    const docs = await QuizQuestion.find({ quizId: quiz.id })
      .sort({ order: 1 })
      .limit(3)
      .select("order questionText options correctOptionIndex explanation verificationSource")
      .lean();
    sampleQuestions = docs.map((q: any) => ({
      _id: q._id.toString(),
      order: q.order,
      questionText: q.questionText,
      options: q.options || [],
      correctOptionIndex: q.correctOptionIndex,
      explanation: q.explanation,
      verificationSource: q.verificationSource,
    }));
  } catch (err) {
    console.warn("QuizIntroPage: Unable to load sample questions:", err);
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

        {/* Sample Solved Questions Preview (Readable without login) */}
        {sampleQuestions.length > 0 && (
          <section className="bg-white rounded-3xl border border-amber-200/80 shadow-sm p-6 sm:p-8 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 pb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-[#0B132B] font-heading flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  <span>हल किए हुए नमूना प्रश्न (Sample Solved Questions)</span>
                </h2>
                <p className="text-xs text-slate-600 font-devanagari mt-0.5">
                  क्विज़ शुरू करने से पहले बिना लॉगिन किए पेपर के स्तर, सही उत्तर और भ्रामक विकल्पों की व्याख्या पढ़ें।
                </p>
              </div>
              {sampleQuestions.some((q) => q.verificationSource) && (
                <a
                  href="https://rssb.rajasthan.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold hover:bg-emerald-100 transition-colors shrink-0"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Board Final Answer Key Verified</span>
                </a>
              )}
            </div>

            <div className="space-y-4">
              {sampleQuestions.map((q, idx) => {
                const correctLetter = OPTION_LETTERS[q.correctOptionIndex] || "A";
                const correctText = q.options[q.correctOptionIndex] || "";

                return (
                  <article
                    key={q._id}
                    className="p-5 rounded-2xl bg-[#FAF8F5] border border-amber-200/70 space-y-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="px-2.5 py-0.5 rounded-lg bg-[#0B132B] text-amber-300 text-xs font-bold shrink-0 mt-0.5">
                        Q{idx + 1}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug font-devanagari">
                        {q.questionText}
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = optIdx === q.correctOptionIndex;
                        return (
                          <div
                            key={optIdx}
                            className={`px-3 py-2 rounded-xl text-xs border flex items-center gap-2 font-devanagari ${
                              isCorrect
                                ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-bold"
                                : "bg-white border-slate-200 text-slate-700"
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${
                                isCorrect
                                  ? "bg-emerald-600 text-white"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {OPTION_LETTERS[optIdx] || optIdx + 1}
                            </span>
                            <span>{opt}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-emerald-200/80 text-xs text-slate-700 space-y-1.5 font-devanagari leading-relaxed whitespace-pre-line">
                      <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          सही उत्तर: ({correctLetter}) {correctText}
                        </span>
                      </div>
                      {q.explanation && <p className="text-slate-700">{q.explanation}</p>}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
