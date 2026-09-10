import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BlogRepository } from "@/server/repositories/blog";
import { ContentRenderer } from "@/components/content/content-renderer";
import { generateMetaDescription, getSiteUrl } from "@/server/lib/seo";
import { Clock, Calendar, ArrowLeft, User, Sparkles, BookOpen, ArrowRight, Layers } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 60;

interface BlogDetailPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  const blog = await BlogRepository.findBySlug(params.slug);
  if (!blog || blog.status !== "PUBLISHED") {
    return {
      title: "Blog Not Found — Rajasthan Exam Twister",
      description: "The requested blog article could not be found.",
    };
  }

  const title = blog.metaTitle || `${blog.title} — Rajasthan Exam Twister`;
  const description = generateMetaDescription(blog.content, blog.metaDescription, blog.excerpt);
  const canonicalUrl = blog.canonicalUrl || `${siteUrl}/blogs/${blog.slug}`;
  
  const coverImageDoc = blog.coverImageId as unknown as { url?: string } | undefined;
  const ogImageUrl = coverImageDoc?.url || `${siteUrl}/og-default.png`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/blogs/${blog.slug}`,
      type: "article",
      publishedTime: blog.publishedAt?.toISOString(),
      modifiedTime: blog.updatedAt?.toISOString() || blog.publishedAt?.toISOString(),
      authors: [blog.author || "Admin"],
      images: [
        {
          url: ogImageUrl,
          alt: blog.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const siteUrl = getSiteUrl();
  const blog = await BlogRepository.findBySlug(params.slug);

  if (!blog || blog.status !== "PUBLISHED") {
    notFound();
  }

  const categoryDoc = blog.categoryId as unknown as { _id?: string; name?: string; slug?: string } | undefined;
  const coverImageDoc = blog.coverImageId as unknown as { url?: string; altText?: string; caption?: string } | undefined;

  // Query "More in Category" related items
  let relatedBlogs: Array<{
    _id: unknown;
    title: string;
    slug: string;
    excerpt?: string;
    readingTime?: number;
    publishedAt?: Date;
  }> = [];

  if (blog.categoryId) {
    try {
      relatedBlogs = (await BlogRepository.findRelatedByCategory(blog.categoryId, blog._id, 3)) as typeof relatedBlogs;
    } catch (err) {
      console.error("Failed to load related blogs:", err);
    }
  }

  const description = generateMetaDescription(blog.content, blog.metaDescription, blog.excerpt);
  const ogImageUrl = coverImageDoc?.url || `${siteUrl}/og-default.png`;

  // JSON-LD Article Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: blog.title,
    description,
    image: ogImageUrl,
    datePublished: blog.publishedAt?.toISOString(),
    dateModified: blog.updatedAt?.toISOString() || blog.publishedAt?.toISOString(),
    author: {
      "@type": "Person",
      name: blog.author || "Admin",
    },
    publisher: {
      "@type": "Organization",
      name: "Rajasthan Exam Twister",
      url: siteUrl,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/blogs/${blog.slug}`,
    },
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Breadcrumbs & Back Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center justify-between text-xs text-slate-500">
          <Link
            href="/blogs"
            className="inline-flex items-center gap-1.5 font-semibold text-slate-700 hover:text-amber-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to all blogs</span>
          </Link>
          {categoryDoc?.name && (
            <Link
              href={`/blogs?category=${categoryDoc.slug}`}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 font-medium transition-colors border border-slate-200/60"
            >
              {categoryDoc.name}
            </Link>
          )}
        </nav>

        {/* Article Header (Exactly one <h1> per page) */}
        <header className="space-y-4 border-b border-slate-200 pb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {blog.title}
          </h1>

          {blog.excerpt && (
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed italic bg-amber-50/60 p-4 rounded-2xl border border-amber-200/60">
              {blog.excerpt}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2">
            <div className="flex items-center gap-1.5 font-medium text-slate-800">
              <User className="w-4 h-4 text-amber-600" />
              <span>{blog.author || "Admin"}</span>
            </div>
            <span>•</span>
            {blog.publishedAt && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <time dateTime={new Date(blog.publishedAt).toISOString()}>
                  {new Date(blog.publishedAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
              </div>
            )}
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{blog.readingTime || 1} min read</span>
            </div>
          </div>

          {/* Cover Image if attached */}
          {coverImageDoc?.url && (
            <figure className="pt-4">
              <div className="relative w-full h-72 sm:h-96 rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
                <Image
                  src={coverImageDoc.url}
                  alt={coverImageDoc.altText || blog.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 896px"
                  priority
                  className="object-cover"
                />
              </div>
              {coverImageDoc.caption && (
                <figcaption className="text-xs text-slate-500 text-center mt-2">
                  {coverImageDoc.caption}
                </figcaption>
              )}
            </figure>
          )}
        </header>

        {/* Main Content Area using Shared ContentRenderer */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm">
          <ContentRenderer content={blog.content} />
        </section>

        {/* More in Category Section (Internal Linking Hub) */}
        {relatedBlogs.length > 0 && categoryDoc && (
          <section className="space-y-4 pt-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-600" />
                <span>More in {categoryDoc.name}</span>
              </h2>
              <Link
                href={`/blogs?category=${categoryDoc.slug}`}
                className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedBlogs.map((related) => (
                <Link
                  key={related._id ? String(related._id) : related.slug}
                  href={`/blogs/${related.slug}`}
                  className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 hover:shadow-sm transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-2">
                      {related.title}
                    </h3>
                    {related.excerpt && (
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {related.excerpt}
                      </p>
                    )}
                  </div>
                  <div className="pt-3 text-[11px] text-amber-600 font-semibold flex items-center gap-1">
                    <span>Read post</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Bottom Call to Action */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-amber-400 font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Rajasthan Exam Twister</span>
            </div>
            <h2 className="text-lg font-bold">Preparing for Rajasthan competitive exams?</h2>
            <p className="text-xs text-slate-300 max-w-md">
              Explore our master revision handbooks and GK notes designed for rapid revision.
            </p>
          </div>

          <Link
            href="/notes"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 whitespace-nowrap transition-all"
          >
            <BookOpen className="w-4 h-4" />
            <span>Browse Exam Notes</span>
          </Link>
        </div>
      </article>
    </>
  );
}
