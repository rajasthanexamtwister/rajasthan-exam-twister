import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Blog } from "@/server/models/Blog";
import { Note } from "@/server/models/Note";
import { Category } from "@/server/models/Category";
import { Quiz } from "@/server/models/Quiz";
import { getSiteUrl } from "@/server/lib/seo";
import { SOCIAL_LINKS, OFFICIAL_SOCIAL_URLS } from "@/server/lib/social-links";
import {
  Search,
  BookOpen,
  FileText,
  CheckSquare,
  Sparkles,
  FolderTree,
  ArrowRight,
  Clock,
  Calendar,
  Image as ImageIcon,
  Flame,
  Send,
  Bookmark,
  Trophy,
  HelpCircle,
  GraduationCap,
  ShoppingBag,
  Star,
  ExternalLink,
} from "lucide-react";
import clsx from "clsx";
import affiliateConfig from "@/config/affiliate-books.json";

export const revalidate = 60;

export const metadata: Metadata = {
  title: {
    absolute: "Rajasthan Exam Twister | Rajasthan GK, Notes, Quizzes & Current Affairs",
  },
  description:
    "High-yield Rajasthan GK, Rajasthan notes, current affairs blogs, infographic handbooks, and mock quizzes for REET, RPSC, CET, RSSB, and Rajasthan Police exam preparation on Rajasthan Exam Twister.",
  alternates: {
    canonical: getSiteUrl(),
  },
  openGraph: {
    title: "Rajasthan Exam Twister | Rajasthan GK, Notes, Quizzes & Current Affairs",
    description:
      "High-yield Rajasthan GK revision notes, current affairs blogs, infographic handbooks, and mock quizzes for REET, RPSC, CET, RSSB, and Rajasthan Police exam preparation.",
    url: getSiteUrl(),
    type: "website",
    images: [
      {
        url: "/brand/banner.png",
        width: 1200,
        height: 630,
        alt: "Rajasthan Exam Twister - Sawaal Seedha Nahi, Soch Tedhi Karo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rajasthan Exam Twister | Rajasthan GK, Notes, Quizzes & Current Affairs",
    description:
      "High-yield Rajasthan GK revision notes, current affairs blogs, infographic handbooks, and mock quizzes for REET, RPSC, CET, RSSB, and Rajasthan Police exam preparation.",
    images: ["/brand/banner.png"],
  },
};

export default async function HomePage() {
  let recentBlogs: any[] = [];
  let recentNotes: any[] = [];
  let categories: any[] = [];
  let publishedQuizzesCount = 0;

  try {
    await connectToDatabase();

    const [blogs, notes, cats, quizzesCount] = await Promise.all([
      Blog.find({ status: "PUBLISHED" })
        .populate("categoryId", "name slug")
        .sort({ publishedAt: -1, createdAt: -1 })
        .limit(6)
        .lean(),
      Note.find({ status: "PUBLISHED" })
        .populate("categoryId", "name slug")
        .sort({ publishedAt: -1, createdAt: -1 })
        .limit(6)
        .lean(),
      Category.find().sort({ name: 1 }).lean(),
      Quiz.countDocuments({ status: "PUBLISHED" }),
    ]);

    recentBlogs = blogs;
    recentNotes = notes;
    categories = cats;
    publishedQuizzesCount = quizzesCount;
  } catch (err) {
    console.warn("HomePage: Database fetch failed or unavailable during static build, using fallback:", err);
  }

  const siteUrl = getSiteUrl();

  // Structured Data (JSON-LD) for WebSite with SearchAction + Organization with real social links
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "Rajasthan Exam Twister",
        description: "Master Rajasthan GK notes, current affairs blogs, and mock quizzes for state recruitment exams.",
        publisher: {
          "@id": `${siteUrl}/#organization`,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteUrl}/search?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "Rajasthan Exam Twister",
        url: siteUrl,
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/brand/logo.png`,
          width: 512,
          height: 512,
        },
        slogan: "सवाल सीधा नहीं, सोच टेढ़ी करो!",
        sameAs: OFFICIAL_SOCIAL_URLS,
      },
    ],
  };

  return (
    <div className="space-y-12 sm:space-y-16 pb-20">
      {/* Inject JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 1. Hero Section: Editorial Gazette with Direct Free Quiz Action */}
      <section className="relative overflow-hidden bg-[#0B132B] text-white border-b border-amber-500/20 pt-8 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8">
        {/* Subtle decorative glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/15 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-6xl mx-auto space-y-8 relative z-10">
          {/* Official Banner Graphic Frame (Optimized for Mobile LCP & Zero CLS) */}
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-400/40 bg-slate-950 aspect-[2.5/1] w-full">
            <picture>
              <source media="(max-width: 768px)" srcSet="/brand/banner-mobile.webp" type="image/webp" />
              <source media="(min-width: 769px)" srcSet="/brand/banner.webp" type="image/webp" />
              <img
                src="/brand/banner-mobile.webp"
                alt="Rajasthan Exam Twister - Sawaal Seedha Nahi, Soch Tedhi Karo - Exam Preparation Banner"
                width={1983}
                height={793}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="w-full h-full object-cover object-center"
              />
            </picture>
          </div>

          {/* Hero Content & Primary Call-to-Actions */}
          <div className="text-center max-w-3xl mx-auto space-y-5">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-bold shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-devanagari">राजस्थान प्रतियोगी परीक्षा अध्ययन एवं मॉक टेस्ट पोर्टल</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight font-heading">
              Rajasthan Exam Twister | High-Yield GK & Test Series
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed font-devanagari">
              REET, RPSC RAS, RSSB CET, राजस्थान पुलिस SI, पटवारी एवं राज्य परीक्षाओं के लिए निःशुल्क ऑनलाइन मॉक टेस्ट, विस्तृत व्याख्या एवं रिवीज़न हैंडबुक्स।
            </p>

            {/* Primary Action Buttons (Spotlighting Free Test Series & Quizzes) */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/test-series"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 active:scale-95 text-[#0B132B] text-sm font-extrabold shadow-lg shadow-amber-500/20 transition-all font-heading"
              >
                <Trophy className="w-4 h-4 text-[#0B132B]" />
                <span>ऑनलाइन टेस्ट सीरीज़ (Test Series)</span>
                <ArrowRight className="w-4 h-4 text-[#0B132B]" />
              </Link>

              <Link
                href="/quizzes"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-95 text-white border border-white/20 text-sm font-bold transition-all"
              >
                <Flame className="w-4 h-4 text-amber-400" />
                <span>फ्री टॉपिक क्विज़</span>
              </Link>

              <Link
                href="/notes"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-95 text-white border border-white/20 text-sm font-bold transition-all"
              >
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>रिवीज़न नोट्स</span>
              </Link>
            </div>

            {/* Search Bar with Accessible Form Controls */}
            <div className="max-w-xl mx-auto pt-3">
              <form action="/search" method="GET" className="relative flex items-center shadow-lg">
                <Search className="w-5 h-5 text-amber-700 absolute left-4 pointer-events-none" />
                <input
                  type="text"
                  name="q"
                  placeholder="Search Rajasthan GK, history, notes, or topics..."
                  aria-label="Search content across Rajasthan Exam Twister"
                  className="w-full pl-12 pr-28 py-3.5 text-xs sm:text-sm bg-white text-slate-950 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all placeholder:text-slate-400 font-medium"
                />
                <button
                  type="submit"
                  className="absolute right-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-[#0B132B] text-xs font-bold rounded-xl transition-all shadow-xs"
                >
                  Search
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Core Study Modules Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0B132B] tracking-tight font-heading">
                Quick Access Hub (प्रमुख अध्ययन भाग)
              </h2>
              <p className="text-xs text-slate-600 font-devanagari">
                सीधे अपने पसंदीदा अध्ययन मॉड्यूल या टेस्ट सीरीज का चयन करें।
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {/* 1: Test Series (Primary Spotlight) */}
            <Link
              href="/test-series"
              className="p-4 rounded-2xl bg-gradient-to-b from-amber-50/90 to-white border-2 border-amber-400/80 shadow-xs hover:shadow-md hover:border-amber-500 transition-all flex flex-col items-center text-center space-y-2 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 bg-amber-500 text-[#0B132B] font-extrabold text-[8px] uppercase px-2 py-0.5 rounded-bl-lg tracking-wider font-heading">
                Full Mocks
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-500 text-[#0B132B] flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                <Trophy className="w-5 h-5" />
              </div>
              <span className="text-xs font-extrabold text-slate-900 group-hover:text-amber-800 transition-colors font-heading">
                Test Series
              </span>
              <span className="text-[11px] text-amber-900 font-bold">
                RAS &bull; REET &bull; CET
              </span>
            </Link>

            {/* 2: Quizzes */}
            <Link
              href="/quizzes"
              className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-amber-500 transition-all flex flex-col items-center text-center space-y-2 group"
            >
              <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                <CheckSquare className="w-5 h-5 text-amber-700" />
              </div>
              <span className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors font-heading">
                Mock Quizzes
              </span>
              <span className="text-[11px] text-slate-600 font-medium">
                {publishedQuizzesCount > 0 ? `${publishedQuizzesCount} Topics` : "Free Practice"}
              </span>
            </Link>

            {/* 2: Notes */}
            <Link
              href="/notes"
              className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-amber-500 transition-all flex flex-col items-center text-center space-y-2 group"
            >
              <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpen className="w-5 h-5 text-amber-700" />
              </div>
              <span className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors font-heading">
                Exam Notes
              </span>
              <span className="text-[11px] text-slate-600 font-medium">Revision Sheets</span>
            </Link>

            {/* 3: Blogs & Current Affairs */}
            <Link
              href="/blogs"
              className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-amber-500 transition-all flex flex-col items-center text-center space-y-2 group"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5 text-blue-700" />
              </div>
              <span className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors font-heading">
                Articles & GK
              </span>
              <span className="text-[11px] text-slate-600 font-medium">Current Affairs</span>
            </Link>

            {/* 4: Categories */}
            <Link
              href="/categories"
              className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-amber-500 transition-all flex flex-col items-center text-center space-y-2 group"
            >
              <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FolderTree className="w-5 h-5 text-purple-700" />
              </div>
              <span className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors font-heading">
                All Categories
              </span>
              <span className="text-[11px] text-slate-600 font-medium">Subject Directory</span>
            </Link>

            {/* 5: Revision Notebook */}
            <Link
              href="/notebook"
              className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-amber-500 transition-all flex flex-col items-center text-center space-y-2 group"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Bookmark className="w-5 h-5 text-emerald-700" />
              </div>
              <span className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors font-heading">
                My Notebook
              </span>
              <span className="text-[11px] text-slate-600 font-medium">Saved Questions</span>
            </Link>

            {/* 6: State Leaderboard */}
            <Link
              href="/leaderboard"
              className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-amber-500 transition-all flex flex-col items-center text-center space-y-2 group"
            >
              <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Trophy className="w-5 h-5 text-rose-700" />
              </div>
              <span className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors font-heading">
                Leaderboard
              </span>
              <span className="text-[11px] text-slate-600 font-medium">Top Rankers</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Popular Exam Streams & Syllabus Pills */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#FFFDF9] rounded-3xl border border-amber-200/80 p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#0B132B] font-heading flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-amber-700" />
                  <span>Popular Exam Streams & Syllabus</span>
                </h3>
                <p className="text-xs text-slate-600 font-devanagari">
                  अपनी परीक्षा के अनुसार विषयवार नोट्स एवं टेस्ट सीरीज चुनें।
                </p>
              </div>
              <Link
                href="/categories"
                className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 shrink-0"
              >
                <span>View All Categories</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {categories.map((cat) => (
                <Link
                  key={cat._id.toString()}
                  href={`/notes?category=${cat.slug}`}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-amber-100/80 hover:text-amber-950 text-slate-700 border border-amber-200/80 transition-all hover:border-amber-400 shadow-2xs"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Community Banner Strip: Join Telegram Channel */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-[#0B132B] via-[#111C38] to-[#0B132B] border border-amber-400/30 p-6 sm:p-8 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 text-xs font-bold">
              <Send className="w-3.5 h-3.5" />
              <span>Rajasthan Aspirants Telegram Community</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold font-heading">
              Join 10,000+ Students for Daily GK Polls & Notes
            </h3>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed font-devanagari">
              RPSC एवं RSSB परीक्षा अलर्ट, दैनिक वस्तुनिष्ठ प्रश्नोत्तरी और हस्तलिखित रिवीज़न PDF शीट्स तुरंत प्राप्त करें।
            </p>
          </div>

          <a
            href={SOCIAL_LINKS.telegram.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-900/30 whitespace-nowrap transition-all hover:scale-105 active:scale-95 shrink-0 font-heading"
          >
            <Send className="w-4 h-4" />
            <span>Join Official Telegram</span>
          </a>
        </div>
      </section>

      {/* 4. Latest Revision Notes Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#0B132B] tracking-tight flex items-center gap-2 font-heading">
              <span>Latest Revision Notes</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 font-sans">
                High-Yield
              </span>
            </h2>
            <p className="text-xs text-slate-600 font-devanagari">
              परीक्षा उपयोगी त्वरित रिवीज़न हैंडबुक्स एवं माइंड मैप्स।
            </p>
          </div>
          <Link
            href="/notes"
            className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
          >
            <span>All Notes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentNotes.length === 0 ? (
          <div className="bg-white rounded-3xl border border-amber-200/70 p-10 text-center space-y-2">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No notes published yet</h3>
            <p className="text-xs text-slate-500">
              Exam notes and revision sheets will appear here once published.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentNotes.map((note, idx) => {
              const categoryName = (note.categoryId as unknown as { name?: string })?.name;
              const isFirst = idx === 0;

              return (
                <article
                  key={note._id.toString()}
                  className={clsx(
                    "rounded-2xl p-6 transition-all flex flex-col justify-between group shadow-xs hover:shadow-md",
                    isFirst
                      ? "bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white border-2 border-amber-300 relative overflow-hidden"
                      : "bg-white border border-amber-200/70 hover:border-amber-400"
                  )}
                >
                  {isFirst && (
                    <div className="absolute top-0 right-0 bg-amber-500 text-[#0B132B] font-extrabold text-[9px] uppercase px-3 py-0.5 rounded-bl-xl tracking-wider shadow-xs flex items-center gap-1 font-heading">
                      <Flame className="w-3 h-3" />
                      <span>Featured Note</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200/80 font-sans">
                        {note.subject || categoryName || "Revision Note"}
                      </span>
                      {note.imageIds && note.imageIds.length > 0 && (
                        <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                          {note.imageIds.length} {note.imageIds.length === 1 ? "sheet" : "sheets"}
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/notes/${note.slug}`}
                      className="block font-extrabold text-base text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-2 font-heading leading-snug"
                    >
                      {note.title}
                    </Link>

                    {note.content && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-devanagari">
                        {note.content.replace(/<[^>]*>/g, " ")}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-amber-100 mt-4 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-600 font-medium">
                      {note.publishedAt
                        ? new Date(note.publishedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "Published"}
                    </span>
                    <Link
                      href={`/notes/${note.slug}`}
                      aria-label={`Study revision note: ${note.title}`}
                      className="font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-all"
                    >
                      <span>Study Note</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. Recent Blogs & Current Affairs Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#0B132B] tracking-tight font-heading">
              Recent Articles & Current Affairs
            </h2>
            <p className="text-xs text-slate-600 font-devanagari">
              नवीनतम परीक्षा अधिसूचनाएं, पाठ्यक्रम विश्लेषण एवं करेंट अफेयर्स।
            </p>
          </div>
          <Link
            href="/blogs"
            className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
          >
            <span>All Articles</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentBlogs.length === 0 ? (
          <div className="bg-white rounded-3xl border border-amber-200/70 p-10 text-center space-y-2">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No articles published yet</h3>
            <p className="text-xs text-slate-500">
              Current affairs and exam prep blogs will appear here once published.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentBlogs.map((blog) => (
              <article
                key={blog._id.toString()}
                className="bg-white rounded-2xl border border-amber-200/70 p-6 shadow-xs hover:shadow-md hover:border-amber-400 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      {blog.readingTime || 1} min read
                    </span>
                    {blog.publishedAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-amber-600" />
                        {new Date(blog.publishedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/blogs/${blog.slug}`}
                    className="block font-extrabold text-base text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-2 font-heading leading-snug"
                  >
                    {blog.title}
                  </Link>

                  {blog.excerpt && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-devanagari">
                      {blog.excerpt}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-amber-100 mt-4 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-semibold">{blog.author || "Admin"}</span>
                  <Link
                    href={`/blogs/${blog.slug}`}
                    aria-label={`Read article: ${blog.title}`}
                    className="font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-all"
                  >
                    <span>Read Article</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* 6. Curated Exam Preparation Books & Study Guides */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-amber-200/80">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-950 border border-amber-300">
              <ShoppingBag className="w-3.5 h-3.5 text-amber-700" />
              <span>Recommended Study Resources</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0B132B] font-heading tracking-tight">
              राजस्थान परीक्षाओं हेतु अनुशंसित पुस्तकें
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-devanagari">
              RPSC, RSSB, REET और CET की प्रामाणिक तैयारी हेतु चुनिंदा सर्वश्रेष्ठ पुस्तकें
            </p>
          </div>

          <Link
            href="/books"
            className="inline-flex items-center gap-1.5 font-extrabold text-xs text-amber-800 hover:text-amber-900 bg-amber-100/80 hover:bg-amber-200/80 px-4 py-2 rounded-xl transition-all self-start sm:self-auto shrink-0 font-heading"
          >
            <span>सभी पुस्तकें देखें (View All Books)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(affiliateConfig.recommendedBooks).map(([key, book]) => (
            <div
              key={key}
              className="bg-white rounded-3xl p-6 border border-amber-200/70 hover:border-amber-400/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                    {book.tag}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-full">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                    <span>4.8</span>
                  </div>
                </div>

                <h3 className="font-bold text-sm text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-2">
                  {book.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {book.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100">
                <a
                  href={book.link}
                  target="_blank"
                  rel="sponsored nofollow noopener"
                  className="w-full inline-flex items-center justify-center gap-1.5 bg-[#FF9900] hover:bg-[#e88b00] active:scale-[0.99] text-slate-950 font-bold px-3 py-2.5 rounded-xl text-xs transition-all shadow-xs"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-slate-950" />
                  <span>Amazon पर देखें</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Callout Strip: Free Practice Tests */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#FFFDF9] rounded-3xl border-2 border-amber-400/80 p-8 sm:p-10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-950 border border-amber-300">
              <Flame className="w-3.5 h-3.5 text-amber-700" />
              <span>Rajasthan Mock Test Series</span>
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-[#0B132B] font-heading">
              अपनी तैयारी को परखें : बिल्कुल निःशुल्क
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl font-devanagari">
              वास्तविक परीक्षा पैटर्न पर आधारित प्रश्नोत्तरी, नेगेटिव मार्किंग और विस्तृत व्याख्या के साथ अभी टेस्ट शुरू करें।
            </p>
          </div>

          <Link
            href="/quizzes"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-[#0B132B] font-extrabold text-sm shadow-md transition-all shrink-0 font-heading"
          >
            <CheckSquare className="w-4 h-4" />
            <span>सभी मॉक टेस्ट देखें (All Quizzes)</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
