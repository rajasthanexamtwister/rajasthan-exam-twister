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
  Users,
} from "lucide-react";
import clsx from "clsx";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Rajasthan Exam Twister — Master Revision Guides & Exam Notes",
  description:
    "High-yield Rajasthan GK revision notes, current affairs blogs, infographic handbooks, and interactive mock quizzes for REET, RPSC, CET, Police SI, and state exams.",
  alternates: {
    canonical: getSiteUrl(),
  },
  openGraph: {
    title: "Rajasthan Exam Twister — Master Revision Guides & Exam Notes",
    description:
      "High-yield GK handbooks, current affairs blogs, and fast revision sheets for Rajasthan competitive exams.",
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

  const featuredNote = recentNotes[0];
  const otherNotes = recentNotes.slice(1);

  return (
    <div className="space-y-12 sm:space-y-16 pb-20">
      {/* Inject JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 1. Hero Section with Optimized Brand Banner */}
      <section className="relative overflow-hidden bg-[#0B132B] text-white border-b border-amber-500/20 pt-8 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8">
        {/* Subtle decorative glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/15 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-6xl mx-auto space-y-8 relative z-10">
          {/* Banner Graphic Frame with high-priority next/image */}
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-400/40 bg-slate-950 aspect-[21/9] sm:aspect-[2.8/1] w-full">
            <Image
              src="/brand/banner.png"
              alt="Rajasthan Exam Twister - Sawaal Seedha Nahi, Soch Tedhi Karo - Exam Preparation Banner"
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1152px"
              className="object-cover object-center"
            />
          </div>

          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Rajasthan Competitive Exam Study Hub</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              Master Revision Guides & Exam Notes for Rajasthan Aspirants
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Rajasthan GK notes, exam prep blogs, and current affairs — all in one place. Handcrafted for REET, RPSC, CET, Police SI, and state exams.
            </p>

            {/* Prominent Search Bar */}
            <div className="max-w-xl mx-auto pt-2">
              <form action="/search" method="GET" className="relative flex items-center shadow-lg">
                <Search className="w-5 h-5 text-amber-700 absolute left-4 pointer-events-none" />
                <input
                  type="text"
                  name="q"
                  placeholder="Search Rajasthan GK, history, notes, or topics..."
                  className="w-full pl-12 pr-28 py-3.5 text-xs sm:text-sm bg-white text-slate-950 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all placeholder:text-slate-400 font-medium"
                />
                <button
                  type="submit"
                  className="absolute right-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-[#0B132B] text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  Search
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Quick Access Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0B132B] tracking-tight">
                Quick Access Hub
              </h2>
              <p className="text-xs text-slate-500">
                Jump directly to core study modules and active syllabus streams.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {/* 1: Notes */}
            <Link
              href="/notes"
              className="p-4 rounded-2xl bg-white border border-amber-200/70 shadow-xs hover:shadow-md hover:border-amber-400 transition-all flex flex-col items-center text-center space-y-2 group"
            >
              <div className="w-11 h-11 rounded-xl bg-amber-100/80 text-amber-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpen className="w-5 h-5 text-amber-700" />
              </div>
              <span className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                Exam Notes
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Revision Sheets</span>
            </Link>

            {/* 2: Blogs */}
            <Link
              href="/blogs"
              className="p-4 rounded-2xl bg-white border border-amber-200/70 shadow-xs hover:shadow-md hover:border-amber-400 transition-all flex flex-col items-center text-center space-y-2 group"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5 text-blue-700" />
              </div>
              <span className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                Articles & GK
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Current Affairs</span>
            </Link>

            {/* 3: Categories */}
            <Link
              href="/categories"
              className="p-4 rounded-2xl bg-white border border-amber-200/70 shadow-xs hover:shadow-md hover:border-amber-400 transition-all flex flex-col items-center text-center space-y-2 group"
            >
              <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FolderTree className="w-5 h-5 text-purple-700" />
              </div>
              <span className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                Categories
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Subject Directory</span>
            </Link>

            {/* 4: Quizzes */}
            <Link
              href="/quizzes"
              className="p-4 rounded-2xl bg-white border border-amber-200/70 shadow-xs hover:shadow-md hover:border-amber-400 transition-all flex flex-col items-center text-center space-y-2 group"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckSquare className="w-5 h-5 text-emerald-700" />
              </div>
              <span className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                Mock Quizzes
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {publishedQuizzesCount > 0 ? `${publishedQuizzesCount} Active Tests` : "Test Series"}
              </span>
            </Link>

            {/* 5: AI Quiz Tool */}
            <Link
              href="/quiz-tools/create"
              className="p-4 rounded-2xl bg-white border border-amber-200/70 shadow-xs hover:shadow-md hover:border-amber-400 transition-all flex flex-col items-center text-center space-y-2 group"
            >
              <div className="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5 text-amber-700" />
              </div>
              <span className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                AI Quiz Tool
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Convert Papers</span>
            </Link>

            {/* 6: Search Hub */}
            <Link
              href="/search"
              className="p-4 rounded-2xl bg-white border border-amber-200/70 shadow-xs hover:shadow-md hover:border-amber-400 transition-all flex flex-col items-center text-center space-y-2 group"
            >
              <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Search className="w-5 h-5 text-slate-700" />
              </div>
              <span className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                Search Hub
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Topic Explorer</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Popular Exam Streams Pills */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#FFFDF9] rounded-3xl border border-amber-200/80 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#0B132B]">
                  Popular Exam Streams & Syllabus
                </h3>
                <p className="text-xs text-slate-500">
                  Explore notes and articles filtered by subject category.
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
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-amber-100/70 hover:text-amber-950 text-slate-700 border border-amber-200/70 transition-all hover:border-amber-400 shadow-xs"
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
            <h3 className="text-lg sm:text-xl font-bold">
              Join 10,000+ Students for Daily GK Polls & Notes
            </h3>
            <p className="text-xs text-slate-300 max-w-xl">
              Get instant updates on RPSC & RSSB notifications, daily MCQ quizzes, and downloadable PDF revision sheets directly on Telegram.
            </p>
          </div>

          <a
            href={SOCIAL_LINKS.telegram.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-lg shadow-sky-500/25 whitespace-nowrap transition-all hover:scale-105 active:scale-95 shrink-0"
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
            <h2 className="text-xl sm:text-2xl font-black text-[#0B132B] tracking-tight flex items-center gap-2">
              <span>Latest Revision Notes</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                High-Yield
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              High-yield visual infographics and summary sheets for state exams.
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
                    <div className="absolute top-0 right-0 bg-amber-500 text-[#0B132B] font-extrabold text-[9px] uppercase px-3 py-0.5 rounded-bl-xl tracking-wider shadow-xs flex items-center gap-1">
                      <Flame className="w-3 h-3" />
                      <span>Featured Note</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200/80">
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
                      className="block font-extrabold text-base text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-2"
                    >
                      {note.title}
                    </Link>

                    {note.content && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {note.content.replace(/<[^>]*>/g, " ")}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-amber-100 mt-4 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">
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
            <h2 className="text-xl sm:text-2xl font-black text-[#0B132B] tracking-tight">
              Recent Articles & Current Affairs
            </h2>
            <p className="text-xs text-slate-500">
              Exam notifications, syllabus breakdowns, and GK articles.
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
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1 font-medium text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      {blog.readingTime || 1} min read
                    </span>
                    {blog.publishedAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
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
                    className="block font-extrabold text-base text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-2"
                  >
                    {blog.title}
                  </Link>

                  {blog.excerpt && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {blog.excerpt}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-amber-100 mt-4 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">{blog.author || "Admin"}</span>
                  <Link
                    href={`/blogs/${blog.slug}`}
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
    </div>
  );
}
