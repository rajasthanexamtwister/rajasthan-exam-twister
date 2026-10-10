import { Metadata } from "next";
import Link from "next/link";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Category } from "@/server/models/Category";
import { Blog } from "@/server/models/Blog";
import { Note } from "@/server/models/Note";
import { getSiteUrl } from "@/server/lib/seo";
import { FolderTree, BookOpen, FileText, ArrowRight, ChevronRight, Sparkles } from "lucide-react";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Exam Categories & Subjects",
  description:
    "Browse Rajasthan competitive exam notes, study guides, and current affairs categorized by subject and syllabus topics.",
  alternates: {
    canonical: `${getSiteUrl()}/categories`,
  },
  openGraph: {
    title: "Exam Categories & Subjects | Rajasthan Exam Twister",
    description:
      "Browse Rajasthan competitive exam notes, study guides, and current affairs categorized by subject and syllabus topics.",
    images: ["/brand/banner.png"],
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
  let categoriesWithCounts: CategoryWithCounts[] = [];

  try {
    await connectToDatabase();

    const categories = await Category.find().sort({ name: 1 }).lean();

    categoriesWithCounts = await Promise.all(
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
  } catch (err) {
    console.warn("PublicCategoriesPage: Database unavailable during static build, using empty fallback:", err);
  }

  const siteUrl = getSiteUrl();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Categories",
        item: `${siteUrl}/categories`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-[#FAF8F5] py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-600 font-semibold font-sans">
            <Link href="/" className="hover:text-amber-700 transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-slate-950 font-extrabold">Categories</span>
          </nav>

          {/* Header Banner */}
          <div className="space-y-3 text-center sm:text-left border-b border-amber-200/80 pb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 font-sans">
              <FolderTree className="w-3.5 h-3.5 text-amber-700" />
              <span>Subject Directory</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B132B] tracking-tight font-heading">
              Browse by Exam Category
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl font-devanagari">
              राजस्थान प्रतियोगी परीक्षा पाठ्यक्रम के अनुसार विषयवार रिवीज़न नोट्स, टेस्ट सीरीज और करेंट अफेयर्स।
            </p>
          </div>

          {/* Categories Grid */}
          {categoriesWithCounts.length === 0 ? (
            <div className="py-20 px-4 text-center rounded-3xl bg-white border border-amber-200 shadow-xs max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
                <FolderTree className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-slate-900 font-heading">No categories found</h2>
              <p className="text-xs text-slate-600 font-devanagari">
                परीक्षा श्रेणियां जल्द ही उपलब्ध कराई जाएंगी।
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoriesWithCounts.map((cat) => {
                const totalItems = cat.blogCount + cat.noteCount;

                return (
                  <div
                    key={cat._id}
                    className="bg-white rounded-2xl border border-amber-200/80 p-6 shadow-xs hover:shadow-md hover:border-amber-400 transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 border border-amber-200/80 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <FolderTree className="w-5 h-5 text-amber-700" />
                        </div>
                        <span className="text-[11px] font-bold text-amber-950 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/80 font-sans">
                          {totalItems} {totalItems === 1 ? "Resource" : "Resources"}
                        </span>
                      </div>

                      <h2 className="text-lg font-bold text-slate-900 group-hover:text-amber-700 transition-colors font-heading">
                        {cat.name}
                      </h2>

                      <div className="flex items-center gap-3 text-xs text-slate-500 pt-1 font-sans">
                        <span className="flex items-center gap-1 font-medium">
                          <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                          {cat.noteCount} Notes
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1 font-medium">
                          <FileText className="w-3.5 h-3.5 text-blue-700" />
                          {cat.blogCount} Articles
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-amber-100 mt-4 flex items-center justify-between gap-2">
                      <Link
                        href={`/notes?category=${cat.slug}`}
                        className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 font-heading"
                      >
                        <span>View Notes</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                      <Link
                        href={`/blogs?category=${cat.slug}`}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors font-sans"
                      >
                        Articles &rarr;
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
