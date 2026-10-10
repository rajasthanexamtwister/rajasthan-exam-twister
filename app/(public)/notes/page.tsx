import Link from "next/link";
import { NoteRepository } from "@/server/repositories/note";
import { CategoryRepository } from "@/server/repositories/category";
import { BookOpen, FileText, Image as ImageIcon, Calendar, ArrowRight, Filter, X, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import clsx from "clsx";

import { getSiteUrl } from "@/server/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Revision Notes & Handbooks",
  description: "Comprehensive revision notes, infographics, and PDF handbooks for Rajasthan competitive exams (RAS, REET, CET, Patwar, Police).",
  alternates: {
    canonical: `${getSiteUrl()}/notes`,
  },
  openGraph: {
    title: "Revision Notes & Handbooks | Rajasthan Exam Twister",
    description: "Comprehensive revision notes, infographics, and PDF handbooks for Rajasthan competitive exams.",
    url: `${getSiteUrl()}/notes`,
  },
};

interface NotesPageProps {
  searchParams: {
    page?: string;
    category?: string;
    tag?: string;
    subject?: string;
    q?: string;
  };
}

export default async function PublicNotesPage({ searchParams }: NotesPageProps) {
  const page = parseInt(searchParams.page || "1", 10) || 1;
  const activeCategory = searchParams.category || "";
  const activeTag = searchParams.tag || "";
  const activeSubject = searchParams.subject || "";

  const [{ notes, pagination }, categories] = await Promise.all([
    NoteRepository.list(
      {
        page,
        pageSize: 12,
        categorySlug: activeCategory,
        tagSlug: activeTag,
        subject: activeSubject,
        search: searchParams.q,
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
            <BookOpen className="w-3.5 h-3.5 text-amber-700" />
            <span>Master Revision Notes</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B132B] tracking-tight font-heading">
            Rajasthan Competitive Exam Notes & Handbooks
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl font-devanagari">
            परीक्षा उपयोगी त्वरित रिवीज़न हैंडबुक्स, मेमोरी चार्ट्स, विषयवार सारांश नोट्स एवं डाउनलोड योग्य PDF शीट्स।
          </p>
        </div>

        {/* Category Browsing Chips */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider font-sans">
            <Filter className="w-3.5 h-3.5 text-amber-700" />
            <span>Browse Notes by Exam Category</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Link
              href="/notes"
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
                href={`/notes?category=${cat.slug}`}
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
          {(activeCategory || activeTag || activeSubject) && (
            <div className="flex items-center gap-2 pt-1 text-xs">
              <span className="text-slate-600 font-medium">Filtered by:</span>
              {activeCategory && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 font-medium border border-amber-200">
                  Category: {activeCategory}
                  <Link href="/notes" className="hover:text-red-700 ml-0.5">
                    <X className="w-3 h-3" />
                  </Link>
                </span>
              )}
              {activeTag && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-950 font-medium border border-blue-200">
                  Tag: #{activeTag}
                  <Link href="/notes" className="hover:text-red-700 ml-0.5">
                    <X className="w-3 h-3" />
                  </Link>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Notes Cards Grid */}
        {notes.length === 0 ? (
          <div className="py-20 px-4 text-center rounded-3xl bg-white border border-amber-200/80 shadow-xs max-w-lg mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 mx-auto flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-amber-700" />
            </div>
            <h2 className="text-base font-bold text-slate-900 font-heading">No revision notes found</h2>
            <p className="text-xs text-slate-600 max-w-sm mx-auto font-devanagari">
              {activeCategory || activeTag || activeSubject
                ? "वर्तमान फ़िल्टर के अनुसार कोई नोट्स उपलब्ध नहीं हैं। कृपया अन्य श्रेणी चुनें।"
                : "परीक्षा उपयोगी रिवीज़न नोट्स जल्द ही उपलब्ध कराए जाएंगे।"}
            </p>
            {(activeCategory || activeTag || activeSubject) && (
              <div className="pt-2">
                <Link
                  href="/notes"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#0B132B] bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-xs font-heading"
                >
                  Clear Filters
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => {
              const categoryDoc = note.categoryId as unknown as { _id?: string; name?: string; slug?: string };
              const tagDocs = (note.tagIds as unknown as Array<{ _id?: string; name?: string }>) || [];
              const images = (note.imageIds as unknown as Array<{ url: string }>) || [];

              return (
                <article
                  key={note._id.toString()}
                  className="bg-white rounded-2xl border border-amber-200/80 p-6 shadow-xs hover:shadow-md hover:border-amber-400 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                      {categoryDoc?.name && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-950 border border-amber-200 font-sans">
                          {categoryDoc.name}
                        </span>
                      )}

                      {images.length > 0 && (
                        <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                          {images.length} {images.length === 1 ? "sheet" : "sheets"}
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/notes/${note.slug}`}
                      className="block font-extrabold text-base text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-2 leading-snug font-heading"
                    >
                      {note.title}
                    </Link>

                    {note.content && (
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed font-devanagari">
                        {note.content.replace(/<[^>]*>/g, " ")}
                      </p>
                    )}

                    {tagDocs.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap pt-1">
                        {tagDocs.slice(0, 3).map((tag) => (
                          <span
                            key={tag._id?.toString() || tag.name}
                            className="text-[10px] text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200"
                          >
                            #{tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-amber-100 mt-4 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-amber-600" />
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
                      className="font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-all font-heading"
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

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-6">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => {
              const params = new URLSearchParams();
              if (activeCategory) params.set("category", activeCategory);
              if (activeTag) params.set("tag", activeTag);
              if (activeSubject) params.set("subject", activeSubject);
              params.set("page", p.toString());

              return (
                <Link
                  key={p}
                  href={`/notes?${params.toString()}`}
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
