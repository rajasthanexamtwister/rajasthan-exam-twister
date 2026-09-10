import Link from "next/link";
import { BlogRepository } from "@/server/repositories/blog";
import { CategoryRepository } from "@/server/repositories/category";
import { Clock, Calendar, ArrowRight, FileText, User, Sparkles, Filter, X } from "lucide-react";
import type { Metadata } from "next";
import clsx from "clsx";

import { getSiteUrl } from "@/server/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Blogs & Current Affairs — Rajasthan Exam Twister",
  description: "Latest exam updates, GK articles, and preparation strategies for Rajasthan competitive examinations.",
  alternates: {
    canonical: `${getSiteUrl()}/blogs`,
  },
  openGraph: {
    title: "Blogs & Current Affairs — Rajasthan Exam Twister",
    description: "Latest exam updates, GK articles, and preparation strategies for Rajasthan competitive examinations.",
    url: `${getSiteUrl()}/blogs`,
  },
};

interface BlogsPageProps {
  searchParams: {
    page?: string;
    category?: string;
    tag?: string;
  };
}

export default async function PublicBlogsPage({ searchParams }: BlogsPageProps) {
  const page = parseInt(searchParams.page || "1", 10) || 1;
  const activeCategory = searchParams.category || "";
  const activeTag = searchParams.tag || "";

  const [{ blogs, pagination }, categories] = await Promise.all([
    BlogRepository.list(
      {
        page,
        pageSize: 12,
        categorySlug: activeCategory,
        tagSlug: activeTag,
      },
      false
    ),
    CategoryRepository.list(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header Banner */}
      <div className="space-y-3 text-center sm:text-left border-b border-slate-200 pb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span>Articles & Current Affairs</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Rajasthan Exam Preparation Blogs
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          High-yield articles, exam notifications, and syllabus breakdowns curated specifically for Rajasthan state aspirants.
        </p>
      </div>

      {/* Category Browsing Chips */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5" />
          <span>Browse by Subject / Exam Category</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
          <Link
            href="/blogs"
            className={clsx(
              "px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
              !activeCategory
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            )}
          >
            All Categories
          </Link>

          {categories.map((cat) => (
            <Link
              key={cat._id.toString()}
              href={`/blogs?category=${cat.slug}`}
              className={clsx(
                "px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                activeCategory === cat.slug
                  ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              )}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Active Filter Indicator */}
        {(activeCategory || activeTag) && (
          <div className="flex items-center gap-2 pt-1 text-xs">
            <span className="text-slate-500">Filtered by:</span>
            {activeCategory && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-medium">
                Category: {activeCategory}
                <Link href="/blogs" className="hover:text-red-700 ml-0.5">
                  <X className="w-3 h-3" />
                </Link>
              </span>
            )}
            {activeTag && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 font-medium">
                Tag: #{activeTag}
                <Link href="/blogs" className="hover:text-red-700 ml-0.5">
                  <X className="w-3 h-3" />
                </Link>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Blog Cards Grid */}
      {blogs.length === 0 ? (
        <div className="py-24 px-4 text-center rounded-3xl bg-white border border-slate-200 shadow-sm max-w-lg mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">No blog articles found</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeCategory || activeTag
              ? `No articles match the current filter. Try selecting another category or view all blogs.`
              : "New articles and current affairs are being curated. Please check back soon!"}
          </p>
          {(activeCategory || activeTag) && (
            <div className="pt-2">
              <Link
                href="/blogs"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-sm"
              >
                Clear Filters
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog) => (
            <article
              key={blog._id.toString()}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col group"
            >
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
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
                    className="block font-bold text-lg text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-2"
                  >
                    {blog.title}
                  </Link>

                  {blog.excerpt && (
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {blog.excerpt}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {blog.author || "Admin"}
                  </span>
                  <Link
                    href={`/blogs/${blog.slug}`}
                    className="text-xs font-semibold text-amber-600 group-hover:text-amber-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-all"
                  >
                    Read Article
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => {
            const params = new URLSearchParams();
            if (activeCategory) params.set("category", activeCategory);
            if (activeTag) params.set("tag", activeTag);
            params.set("page", p.toString());

            return (
              <Link
                key={p}
                href={`/blogs?${params.toString()}`}
                className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-bold transition-all ${
                  page === p
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {p}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
