import Link from "next/link";
import clsx from "clsx";
import { SearchService, SearchResultItem } from "@/server/services/search-service";
import {
  Search,
  BookOpen,
  FileText,
  Clock,
  Calendar,
  ArrowRight,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Tag as TagIcon,
} from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface SearchPageProps {
  searchParams: {
    q?: string;
    page?: string;
    type?: string;
  };
}

import { getSiteUrl } from "@/server/lib/seo";

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  const query = searchParams.q?.trim() || "";
  const title = query ? `Search results for "${query}"` : "Search Exam Notes & Blogs";
  const ogTitle = query ? `Search results for "${query}" — Rajasthan Exam Twister` : "Search Exam Notes & Blogs — Rajasthan Exam Twister";
  const description = "Search comprehensive revision handbooks, GK articles, and diagrams for Rajasthan competitive exams.";
  const canonicalUrl = query ? `${siteUrl}/search?q=${encodeURIComponent(query)}` : `${siteUrl}/search`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: ogTitle,
      description,
      url: canonicalUrl,
    },
  };
}


export default async function PublicSearchPage({ searchParams }: SearchPageProps) {
  const rawQuery = searchParams.q?.trim() || "";
  const page = parseInt(searchParams.page || "1", 10) || 1;
  const activeTypeFilter = searchParams.type || "ALL";

  let searchData: {
    total: number;
    results: SearchResultItem[];
    blogsCount: number;
    notesCount: number;
    pagination: {
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
  } | null = null;

  if (rawQuery) {
    try {
      const data = await SearchService.search(rawQuery, { page, pageSize: 20 });
      searchData = data;
    } catch (err) {
      console.error("Search execution error:", err);
    }
  }

  const filteredResults = searchData
    ? searchData.results.filter((item) => {
        if (activeTypeFilter === "blogs") return item.type === "blog";
        if (activeTypeFilter === "notes") return item.type === "note";
        return true;
      })
    : [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Search Header Form */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span>Full-Text Search Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Search Rajasthan Exam GK & Notes
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Instant search across published exam articles, visual handbooks, memory tricks, and syllabus topics.
        </p>

        {/* Search Bar Form */}
        <form action="/search" method="GET" className="relative mt-4">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            name="q"
            defaultValue={rawQuery}
            placeholder="Search e.g. Lok Nritya, Aravalli, 1857 Revolution, REET..."
            className="w-full pl-12 pr-28 py-3.5 text-sm bg-white border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-amber-500 shadow-sm focus:shadow-md transition-all"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-sm shadow-amber-500/20"
          >
            Search
          </button>
        </form>

        {/* Popular Topic Badges */}
        {!rawQuery && (
          <div className="pt-2 flex flex-wrap items-center justify-center gap-1.5 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Popular:</span>
            {[
              "Rajasthan Folk Dances",
              "Aravalli Range",
              "1857 Revolution",
              "Rajasthan Forts",
              "Hadoti Region",
              "REET GK",
            ].map((topic) => (
              <Link
                key={topic}
                href={`/search?q=${encodeURIComponent(topic)}`}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-700 border border-slate-200 text-[11px] transition-colors shadow-2xs"
              >
                {topic}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Results Section */}
      {rawQuery && searchData && (
        <div className="space-y-6">
          {/* Result Count and Type Filter Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="text-xs text-slate-600">
              Found <strong className="text-slate-900">{searchData.total}</strong> results for &ldquo;
              <span className="font-semibold text-slate-900">{rawQuery}</span>&rdquo;
            </div>

            {/* Type Filter Pills */}
            <div className="flex items-center gap-1">
              {[
                { label: `All (${searchData.total})`, value: "ALL" },
                { label: `Blogs (${searchData.blogsCount})`, value: "blogs" },
                { label: `Notes (${searchData.notesCount})`, value: "notes" },
              ].map((tab) => (
                <Link
                  key={tab.value}
                  href={`/search?q=${encodeURIComponent(rawQuery)}&type=${tab.value}`}
                  className={clsx(
                    "px-3 py-1 rounded-lg text-xs font-semibold transition-all",
                    activeTypeFilter === tab.value
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  )}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Results List */}
          {filteredResults.length === 0 ? (
            <div className="py-20 px-4 text-center rounded-3xl bg-white border border-slate-200 shadow-sm max-w-lg mx-auto space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-slate-900">
                No results found for &ldquo;{rawQuery}&rdquo;
              </h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Check for spelling mistakes, try simpler keywords, or browse directly by categories in our blogs or revision notes sections.
              </p>
              <div className="pt-2 flex items-center justify-center gap-3">
                <Link
                  href="/notes"
                  className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all"
                >
                  Browse Notes
                </Link>
                <Link
                  href="/blogs"
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Browse Blogs
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredResults.map((item) => {
                const isNote = item.type === "note";
                const targetUrl = isNote ? `/notes/${item.slug}` : `/blogs/${item.slug}`;

                return (
                  <article
                    key={`${item.type}-${item.id}`}
                    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-300 transition-all space-y-3 group"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={clsx(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            isNote
                              ? "bg-amber-100 text-amber-900 border border-amber-200"
                              : "bg-blue-100 text-blue-900 border border-blue-200"
                          )}
                        >
                          {isNote ? "Revision Note" : "Blog Article"}
                        </span>
                        {item.category && (
                          <span className="text-xs font-medium text-slate-500">
                            in {item.category.name}
                          </span>
                        )}
                        {item.subject && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                            {item.subject}
                          </span>
                        )}
                      </div>

                      {item.publishedAt && (
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            {new Date(item.publishedAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    <Link
                      href={targetUrl}
                      className="block text-lg sm:text-xl font-bold text-slate-900 group-hover:text-amber-600 transition-colors"
                    >
                      {item.title}
                    </Link>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-3 text-slate-400">
                        {isNote && item.imageCount ? (
                          <span className="flex items-center gap-1 text-amber-700">
                            <ImageIcon className="w-3.5 h-3.5" />
                            {item.imageCount} diagram(s)
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {item.readingTime || 1} min read
                          </span>
                        )}
                        {isNote && item.hasPdf && (
                          <span className="flex items-center gap-1 text-blue-700">
                            <FileText className="w-3.5 h-3.5" />
                            PDF Handbook
                          </span>
                        )}
                      </div>

                      <Link
                        href={targetUrl}
                        className="inline-flex items-center gap-1 font-bold text-amber-600 group-hover:text-amber-700 group-hover:translate-x-0.5 transition-all"
                      >
                        <span>{isNote ? "View Note" : "Read Article"}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {searchData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              {Array.from({ length: searchData.pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`/search?q=${encodeURIComponent(rawQuery)}&type=${activeTypeFilter}&page=${p}`}
                  className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-bold transition-all ${
                    page === p
                      ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
