import Link from "next/link";
import Image from "next/image";
import { BlogRepository } from "@/server/repositories/blog";
import { CategoryRepository } from "@/server/repositories/category";
import { Clock, Calendar, ArrowRight, FileText, User, Sparkles, Filter, X } from "lucide-react";
import type { Metadata } from "next";
import clsx from "clsx";

import { getSiteUrl } from "@/server/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Blogs & Current Affairs",
  description: "Latest exam updates, GK articles, and preparation strategies for Rajasthan competitive examinations.",
  alternates: {
    canonical: `${getSiteUrl()}/blogs`,
  },
  openGraph: {
    title: "Blogs & Current Affairs | Rajasthan Exam Twister",
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
    <div className="min-h-screen bg-[#FAF8F5] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header Banner */}
        <div className="space-y-3 text-center sm:text-left border-b border-amber-200/80 pb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 font-sans">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>Articles & Current Affairs</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B132B] tracking-tight font-heading">
            Rajasthan Exam Preparation Blogs & GK
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl font-devanagari">
            नवीनतम परीक्षा अलर्ट्स, पाठ्यक्रम विश्लेषण, करेंट अफेयर्स एवं राजस्थान सामान्य ज्ञान विशेष लेख।
          </p>
        </div>

        {/* Category Browsing Chips */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider font-sans">
            <Filter className="w-3.5 h-3.5 text-amber-700" />
            <span>Browse by Subject / Exam Category</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Link
              href="/blogs"
              className={clsx(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all font-sans",
                !activeCategory
                  ? "bg-[#0B132B] text-amber-300 shadow-xs"
                  : "bg-white text-slate-700 hover:bg-amber-50/80 border border-amber-200/80"
              )}
            >
              All Categories
            </Link>

            {categories.map((cat) => (
              <Link
                key={cat._id.toString()}
                href={`/blogs?category=${cat.slug}`}
                className={clsx(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all font-sans",
                  activeCategory === cat.slug
                    ? "bg-amber-500 text-[#0B132B] shadow-xs"
                    : "bg-white text-slate-700 hover:bg-amber-50/80 border border-amber-200/80"
                )}
              >
                {cat.name}
              </Link>
            ))}
          </div>

          {/* Active Filter Indicator */}
          {(activeCategory || activeTag) && (
            <div className="flex items-center gap-2 pt-1 text-xs font-sans">
              <span className="text-slate-600 font-medium">Filtered by:</span>
              {activeCategory && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 font-medium border border-amber-200">
                  Category: {activeCategory}
                  <Link href="/blogs" className="hover:text-red-700 ml-0.5">
                    <X className="w-3 h-3" />
                  </Link>
                </span>
              )}
              {activeTag && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-950 font-medium border border-blue-200">
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
          <div className="py-20 px-4 text-center rounded-3xl bg-white border border-amber-200/80 shadow-xs max-w-lg mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 mx-auto flex items-center justify-center">
              <FileText className="w-6 h-6 text-amber-700" />
            </div>
            <h2 className="text-base font-bold text-slate-900 font-heading">No blog articles found</h2>
            <p className="text-xs text-slate-600 max-w-sm mx-auto font-devanagari">
              {activeCategory || activeTag
                ? `वर्तमान फ़िल्टर के अनुसार कोई लेख उपलब्ध नहीं हैं। कृपया अन्य श्रेणी चुनें।`
                : "नए परीक्षा लेख एवं करेंट अफेयर्स जल्द ही प्रकाशित किए जाएंगे।"}
            </p>
            {(activeCategory || activeTag) && (
              <div className="pt-2">
                <Link
                  href="/blogs"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#0B132B] bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-xs font-heading"
                >
                  Clear Filters
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => {
              const coverImageDoc = blog.coverImageId as unknown as { url?: string; altText?: string } | undefined;
              const categoryDoc = blog.categoryId as unknown as { name?: string; slug?: string } | undefined;

              return (
                <article
                  key={blog._id.toString()}
                  className="bg-white rounded-2xl border border-amber-200/80 overflow-hidden shadow-xs hover:shadow-md hover:border-amber-400 transition-all flex flex-col justify-between group"
                >
                  {coverImageDoc?.url && (
                    <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden">
                      <Image
                        src={coverImageDoc.url}
                        alt={coverImageDoc.altText || blog.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-600 font-sans">
                        {categoryDoc?.name ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-950 border border-amber-200">
                            {categoryDoc.name}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                            General GK
                          </span>
                        )}

                        <span className="flex items-center gap-1 font-medium text-slate-500">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          {blog.readingTime || 1} min read
                        </span>
                      </div>

                      <Link
                        href={`/blogs/${blog.slug}`}
                        className="block font-extrabold text-base text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-2 leading-snug font-heading"
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
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 font-sans">
                        <Calendar className="w-3 h-3 text-amber-600" />
                        {blog.publishedAt
                          ? new Date(blog.publishedAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "Published"}
                      </span>

                      <Link
                        href={`/blogs/${blog.slug}`}
                        aria-label={`Read article: ${blog.title}`}
                        className="font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-all font-heading"
                      >
                        <span>Read Article</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-6">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => {
              const params = new URLSearchParams();
              if (activeCategory) params.set("category", activeCategory);
              if (activeTag) params.set("tag", activeTag);
              params.set("page", p.toString());

              return (
                <Link
                  key={p}
                  href={`/blogs?${params.toString()}`}
                  className={clsx(
                    "w-9 h-9 rounded-xl text-xs font-bold flex items-center justify-center transition-all font-sans",
                    p === page
                      ? "bg-amber-500 text-[#0B132B] shadow-xs font-extrabold"
                      : "bg-white text-slate-700 border border-amber-200 hover:bg-amber-50"
                  )}
                >
                  {p}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
