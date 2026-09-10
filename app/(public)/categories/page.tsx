import { Metadata } from "next";
import Link from "next/link";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Category } from "@/server/models/Category";
import { Blog } from "@/server/models/Blog";
import { Note } from "@/server/models/Note";
import { getSiteUrl } from "@/server/lib/seo";
import { FolderTree, BookOpen, FileText, ArrowRight, Sparkles, ChevronRight } from "lucide-react";
import clsx from "clsx";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Exam Categories & Subjects — Rajasthan Exam Twister",
  description:
    "Browse Rajasthan competitive exam notes, study guides, and current affairs categorized by subject and syllabus topics.",
  alternates: {
    canonical: `${getSiteUrl()}/categories`,
  },
};

interface CategoryWithCounts {
  _id: string;
  name: string;
  slug: string;
  blogCount: number;
  noteCount: number;
}

export default async function PublicCategoriesPage() {
  await connectToDatabase();

  const categories = await Category.find().sort({ name: 1 }).lean();

  const categoriesWithCounts: CategoryWithCounts[] = await Promise.all(
    categories.map(async (cat) => {
      const [blogCount, noteCount] = await Promise.all([
        Blog.countDocuments({ categoryId: cat._id, status: "PUBLISHED" }),
        Note.countDocuments({ categoryId: cat._id, status: "PUBLISHED" }),
      ]);

      return {
        _id: cat._id.toString(),
        name: cat.name,
        slug: cat.slug,
        blogCount,
        noteCount,
      };
    })
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link href="/" className="hover:text-amber-600 transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-bold">Categories</span>
      </nav>

      {/* Header Banner */}
      <div className="space-y-3 text-center sm:text-left border-b border-slate-200 pb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
          <FolderTree className="w-3.5 h-3.5 text-amber-700" />
          <span>Subject Directory</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Browse by Exam Category
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Explore dedicated study materials, revision notes, and current affairs grouped by Rajasthan exam subjects and syllabus categories.
        </p>
      </div>

      {/* Categories Grid */}
      {categoriesWithCounts.length === 0 ? (
        <div className="py-20 px-4 text-center rounded-3xl bg-white border border-slate-200 shadow-sm max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <FolderTree className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">No categories found</h2>
          <p className="text-xs text-slate-500">
            Subject categories and syllabus streams will be listed here as study materials are published.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoriesWithCounts.map((cat) => {
            const totalItems = cat.blogCount + cat.noteCount;

            return (
              <div
                key={cat._id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/60 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FolderTree className="w-5 h-5 text-amber-600" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      {totalItems} {totalItems === 1 ? "Resource" : "Resources"}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                    {cat.name}
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                      {cat.noteCount} Notes
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      {cat.blogCount} Articles
                    </span>
                  </div>
                </div>

                <div className="pt-5 border-t border-slate-100 mt-4 flex items-center justify-between text-xs">
                  <Link
                    href={`/notes?category=${cat.slug}`}
                    className="font-semibold text-slate-700 hover:text-amber-600 transition-colors"
                  >
                    View Notes
                  </Link>
                  <Link
                    href={`/blogs?category=${cat.slug}`}
                    className="font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-all"
                  >
                    <span>Read Blogs</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
