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
  const ogTitle = query ? `Search results for "${query}" | Rajasthan Exam Twister` : "Search Exam Notes & Blogs | Rajasthan Exam Twister";
  const description = "Search comprehensive revision handbooks, GK articles, and diagrams for Rajasthan competitive exams.";
  const canonicalUrl = query ? `${siteUrl}/search?q=${encodeURIComponent(query)}` : `${siteUrl}/search`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
  robots: {
    index: false,
    follow: true,
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
    <div className="min-h-screen bg-[#FAF8F5] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Search Header Form */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 font-sans">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>Full-Text Search Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B132B] tracking-tight font-heading">
            Search Rajasthan Exam GK & Notes
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-devanagari">
            हस्तलिखित रिवीज़न नोट्स, करेंट अफेयर्स, ट्रिक्स और परीक्षा सामग्री में तुरंत खोजें।
          </p>

          {/* Search Bar Form */}
          <form action="/search" method="GET" className="relative mt-4 shadow-sm">
            <Search className="w-5 h-5 text-amber-700 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              name="q"
              defaultValue={rawQuery}
              placeholder="Search e.g. Lok Nritya, Aravalli, 1857 Revolution, REET..."
              aria-label="Search Rajasthan Exam Twister"
              className="w-full pl-12 pr-28 py-3.5 text-sm bg-white border-2 border-amber-200/90 rounded-2xl focus:outline-none focus:border-amber-500 shadow-xs transition-all font-medium"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 text-xs font-extrabold text-[#0B132B] bg-amber-500 hover:bg-amber-400 active:bg-amber-600 rounded-xl transition-all shadow-xs font-heading"
            >
              Search
            </button>
          </form>

          {/* Popular Topic Badges */}
          {!rawQuery && (
            <div className="pt-2 flex flex-wrap items-center justify-center gap-1.5 text-xs text-slate-600 font-sans">
              <span className="font-bold text-slate-800">Popular:</span>
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
                  className="px-2.5 py-1 rounded-xl bg-white hover:bg-amber-100 hover:text-amber-950 text-slate-700 border border-amber-200 text-[11px] font-semibold transition-colors shadow-2xs"
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200/80 pb-4">
              <div className="text-xs text-slate-600 font-sans">
                Found <strong className="text-slate-900 font-bold">{searchData.total}</strong> results for &ldquo;
                <span className="font-bold text-amber-800">{rawQuery}</span>&rdquo;
              </div>

              {/* Type Filter Pills */}
              <div className="flex items-center gap-1.5">
                {[
                  { label: `All (${searchData.total})`, value: "ALL" },
                  { label: `Blogs (${searchData.blogsCount})`, value: "blogs" },
                  { label: `Notes (${searchData.notesCount})`, value: "notes" },
                ].map((tab) => (
                  <Link
                    key={tab.value}
                    href={`/search?q=${encodeURIComponent(rawQuery)}&type=${tab.value}`}
                    className={clsx(
                      "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all font-sans",
                      activeTypeFilter === tab.value
                        ? "bg-[#0B132B] text-amber-300 shadow-xs"
                        : "bg-white text-slate-700 hover:bg-amber-50 border border-amber-200"
                    )}
                  >
                    {tab.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Results List */}
            {filteredResults.length === 0 ? (
              <div className="py-20 px-4 text-center rounded-3xl bg-white border border-amber-200 shadow-xs max-w-lg mx-auto space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 mx-auto flex items-center justify-center">
                  <Search className="w-6 h-6 text-amber-700" />
                </div>
                <h2 className="text-base font-bold text-slate-900 font-heading">
                  No results found for &ldquo;{rawQuery}&rdquo;
                </h2>
                <p className="text-xs text-slate-600 max-w-sm mx-auto font-devanagari">
                  कृपया वर्तनी की जांच करें या अन्य कीवर्ड के साथ प्रयास करें।
                </p>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <Link
                    href="/notes"
                    className="px-4 py-2 text-xs font-extrabold text-[#0B132B] bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-xs font-heading"
                  >
                    Browse Notes
                  </Link>
                  <Link
                    href="/blogs"
                    className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-amber-50 border border-amber-200 rounded-xl transition-all font-sans"
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
                      className="bg-white p-6 rounded-2xl border border-amber-200/80 shadow-xs hover:shadow-md hover:border-amber-400 transition-all space-y-3 group"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={clsx(
                              "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-sans",
                              isNote
                                ? "bg-amber-100 text-amber-950 border border-amber-200"
                                : "bg-blue-100 text-blue-950 border border-blue-200"
                            )}
                          >
                            {isNote ? "Revision Note" : "Blog Article"}
                          </span>

                          {item.category?.name && (
                            <span className="text-[11px] font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 font-sans">
                              {item.category.name}
                            </span>
                          )}
                        </div>

                        {item.publishedAt && (
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 font-sans">
                            <Calendar className="w-3 h-3 text-amber-600" />
                            {new Date(item.publishedAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        )}
                      </div>

                      <h2 className="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-2 leading-snug font-heading">
                        <Link href={targetUrl}>{item.title}</Link>
                      </h2>

                      {item.description && (
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-devanagari">
                          {item.description}
                        </p>
                      )}

                      <div className="pt-2 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-500 font-medium font-sans">
                          {item.subject || (isNote ? "Revision Guide" : "Exam Twister")}
                        </span>
                        <Link
                          href={targetUrl}
                          className="font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-all font-heading"
                        >
                          <span>{isNote ? "Study Note" : "Read Article"}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
