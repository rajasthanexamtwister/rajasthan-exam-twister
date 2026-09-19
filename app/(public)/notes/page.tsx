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
    title: "Revision Notes & Handbooks — Rajasthan Exam Twister",
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header Banner */}
      <div className="space-y-3 text-center sm:text-left border-b border-slate-200 pb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
          <BookOpen className="w-3.5 h-3.5 text-amber-700" />
          <span>Master Revision Notes</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Rajasthan Competitive Exam Notes & Handbooks
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          High-yield visual infographics, memory tables, subject-wise summary notes, and downloadable PDF handbooks.
        </p>
      </div>

      {/* Category Browsing Chips */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5" />
          <span>Browse Notes by Exam Category</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
          <Link
            href="/notes"
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
              href={`/notes?category=${cat.slug}`}
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
        {(activeCategory || activeTag || activeSubject) && (
          <div className="flex items-center gap-2 pt-1 text-xs">
            <span className="text-slate-500">Filtered by:</span>
            {activeCategory && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-medium">
                Category: {activeCategory}
                <Link href="/notes" className="hover:text-red-700 ml-0.5">
                  <X className="w-3 h-3" />
                </Link>
              </span>
            )}
            {activeTag && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 font-medium">
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
        <div className="py-24 px-4 text-center rounded-3xl bg-white border border-slate-200 shadow-sm max-w-lg mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">No revision notes found</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeCategory || activeTag || activeSubject
              ? "No notes match the current filter. Try selecting another category or clear filters."
              : "Exam notes and visual handbooks are being compiled. Please check back shortly!"}
          </p>
          {(activeCategory || activeTag || activeSubject) && (
            <div className="pt-2">
              <Link
                href="/notes"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-sm"
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
            const hasPdf = !!note.pdfMediaId;

            return (
              <article
                key={note._id.toString()}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col group"
              >
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    {/* Badges / Subject / Category */}
                    <div className="flex flex-wrap items-center gap-2">
                      {note.subject && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                          {note.subject}
                        </span>
                      )}
                      {categoryDoc?.name && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                          {categoryDoc.name}
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/notes/${note.slug}`}
                      className="block font-bold text-lg text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-2 leading-snug"
                    >
                      {note.title}
                    </Link>

                    {/* Meta stats: Infographics count, PDF attach, Tags */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                      {images.length > 0 && (
                        <span className="flex items-center gap-1 font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>{images.length} {images.length === 1 ? "infographic" : "infographics"}</span>
                        </span>
                      )}
                      {hasPdf && (
                        <span className="flex items-center gap-1 font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                          <FileText className="w-3.5 h-3.5" />
                          <span>PDF Available</span>
                        </span>
                      )}
                    </div>

                    {tagDocs.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {tagDocs.slice(0, 3).map((tag) => (
                          <span
                            key={tag._id?.toString() || tag.name}
                            className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md"
                          >
                            #{tag.name}
                          </span>
                        ))}
                        {tagDocs.length > 3 && (
                          <span className="text-[10px] text-slate-400 self-center">
                            +{tagDocs.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
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
                      className="text-xs font-semibold text-amber-600 group-hover:text-amber-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-all"
                    >
                      View Note
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
        <div className="flex items-center justify-center gap-2 pt-6">
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
