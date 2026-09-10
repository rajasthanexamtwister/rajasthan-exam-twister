import { Metadata } from "next";
import Link from "next/link";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Blog } from "@/server/models/Blog";
import { Note } from "@/server/models/Note";
import { Category } from "@/server/models/Category";
import { Quiz } from "@/server/models/Quiz";
import { getSiteUrl } from "@/server/lib/seo";
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
  Award,
  Layers,
} from "lucide-react";
import clsx from "clsx";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Rajasthan Exam Twister — Master Revision Guides & Exam Notes",
  description:
    "High-yield Rajasthan GK notes, current affairs blogs, infographic handbooks, and interactive mock quizzes for REET, RPSC, CET, Police SI, and state exams.",
  alternates: {
    canonical: getSiteUrl(),
  },
  openGraph: {
    title: "Rajasthan Exam Twister — Master Revision Guides & Exam Notes",
    description:
      "High-yield GK handbooks, current affairs blogs, and fast revision sheets for Rajasthan competitive exams.",
    url: getSiteUrl(),
    type: "website",
  },
};

export default async function HomePage() {
  await connectToDatabase();

  const [recentBlogs, recentNotes, categories, publishedQuizzesCount] = await Promise.all([
    Blog.find({ status: "PUBLISHED" })
      .populate("categoryId", "name slug")
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(6)
      .lean()
      .catch(() => []),
    Note.find({ status: "PUBLISHED" })
      .populate("categoryId", "name slug")
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(6)
      .lean()
      .catch(() => []),
    Category.find().sort({ name: 1 }).limit(10).lean().catch(() => []),
    Quiz.countDocuments({ status: "PUBLISHED" }).catch(() => 0),
  ]);

  return (
    <div className="space-y-14 sm:space-y-16 pb-16">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent border-b border-slate-200/80 pt-12 pb-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>Rajasthan State Exam Preparation Portal</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            Master Revision Guides & Exam Notes for Rajasthan Aspirants
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Rajasthan GK notes, exam prep blogs, and current affairs — all in one place. Handcrafted for REET, RPSC, CET, Police SI, and competitive exams.
          </p>

          {/* Prominent Search Bar */}
          <div className="max-w-xl mx-auto pt-2">
            <form action="/search" method="GET" className="relative flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                name="q"
                placeholder="Search Rajasthan GK, history, notes, or topics..."
                className="w-full pl-11 pr-28 py-3.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="absolute right-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 2. Quick Access Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Quick Access Hub
            </h2>
            <p className="text-xs text-slate-500">
              Jump directly to core study modules and active syllabus streams.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* Core Section 1: Notes */}
            <Link
              href="/notes"
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-300 transition-all flex flex-col items-center text-center space-y-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpen className="w-5 h-5 text-amber-700" />
              </div>
              <span className="text-xs font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                Exam Notes
              </span>
              <span className="text-[10px] text-slate-400">Infographic Sheets</span>
            </Link>

            {/* Core Section 2: Blogs */}
            <Link
              href="/blogs"
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col items-center text-center space-y-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5 text-blue-700" />
              </div>
              <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                Articles & GK
              </span>
              <span className="text-[10px] text-slate-400">Current Affairs</span>
            </Link>

            {/* Core Section 3: Categories */}
            <Link
              href="/categories"
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-300 transition-all flex flex-col items-center text-center space-y-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FolderTree className="w-5 h-5 text-purple-700" />
              </div>
              <span className="text-xs font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                Categories
              </span>
              <span className="text-[10px] text-slate-400">Subject Directory</span>
            </Link>

            {/* Core Section 4: Quizzes */}
            <Link
              href="/quizzes"
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col items-center text-center space-y-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckSquare className="w-5 h-5 text-emerald-700" />
              </div>
              <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                Mock Quizzes
              </span>
              <span className="text-[10px] text-slate-400">
                {publishedQuizzesCount > 0 ? `${publishedQuizzesCount} Active Tests` : "Test Series"}
              </span>
            </Link>

            {/* Core Section 5: AI Quiz Tool */}
            <Link
              href="/quiz-tools/create"
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-300 transition-all flex flex-col items-center text-center space-y-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/80 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-xs font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                AI Quiz Tool
              </span>
              <span className="text-[10px] text-slate-400">Convert Papers</span>
            </Link>

            {/* Core Section 6: Search All */}
            <Link
              href="/search"
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col items-center text-center space-y-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Search className="w-5 h-5 text-slate-600" />
              </div>
              <span className="text-xs font-bold text-slate-900 group-hover:text-slate-600 transition-colors">
                Search Hub
              </span>
              <span className="text-[10px] text-slate-400">Topic Explorer</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Browse by Category Stream Pills */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Popular Exam Streams & Syllabus
                </h3>
                <p className="text-xs text-slate-500">
                  Explore notes and articles filtered by subject category.
                </p>
              </div>
              <Link
                href="/categories"
                className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 shrink-0"
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
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-amber-50 hover:text-amber-900 text-slate-700 border border-slate-200/80 transition-all hover:border-amber-300"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. Recent Notes Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Latest Revision Notes
            </h2>
            <p className="text-xs text-slate-500">
              High-yield visual infographics and summary sheets for state exams.
            </p>
          </div>
          <Link
            href="/notes"
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            <span>All Notes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentNotes.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-2">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No notes published yet</h3>
            <p className="text-xs text-slate-500">
              Exam notes and revision sheets will appear here once published.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentNotes.map((note) => {
              const categoryName = (note.categoryId as unknown as { name?: string })?.name;

              return (
                <article
                  key={note._id.toString()}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200/60">
                        {note.subject || categoryName || "Revision Note"}
                      </span>
                      {note.imageIds && note.imageIds.length > 0 && (
                        <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                          {note.imageIds.length} {note.imageIds.length === 1 ? "sheet" : "sheets"}
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/notes/${note.slug}`}
                      className="block font-bold text-base text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-2"
                    >
                      {note.title}
                    </Link>

                    {note.content && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {note.content.replace(/<[^>]*>/g, " ")}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs">
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
                      className="font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-all"
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
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Recent Articles & Current Affairs
            </h2>
            <p className="text-xs text-slate-500">
              Exam notifications, syllabus breakdowns, and GK articles.
            </p>
          </div>
          <Link
            href="/blogs"
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            <span>All Articles</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentBlogs.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-2">
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
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1">
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
                    className="block font-bold text-base text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-2"
                  >
                    {blog.title}
                  </Link>

                  {blog.excerpt && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {blog.excerpt}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs">
                  <span className="text-slate-500">{blog.author || "Admin"}</span>
                  <Link
                    href={`/blogs/${blog.slug}`}
                    className="font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-all"
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
