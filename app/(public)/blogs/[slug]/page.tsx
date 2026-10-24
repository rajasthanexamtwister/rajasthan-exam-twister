import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BlogRepository } from "@/server/repositories/blog";
import { ContentRenderer } from "@/components/content/content-renderer";
import { TelegramBannerCard } from "@/components/public/telegram-banner-card";
import { generateMetaDescription, getSiteUrl } from "@/server/lib/seo";
import { SocialShare } from "@/components/public/social-share";
import { AdSenseUnit } from "@/components/public/adsense-unit";
import { Clock, Calendar, ArrowLeft, User, Sparkles, BookOpen, ArrowRight, Layers, RefreshCw } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface BlogDetailPageProps {
  params: {
    slug: string;
  };
}

// Known legacy/mangled blog slug aliases mapped to target database slugs
const BLOG_SLUG_ALIASES: Record<string, string> = {
  "2026-27": "cm-anuprati-coaching-yojana-2026-27",
  "rajasthan-anuprati-coaching-yojana-2026-27": "cm-anuprati-coaching-yojana-2026-27",
};

function resolveBlogSlug(slug: string): string {
  return BLOG_SLUG_ALIASES[slug.toLowerCase()] || slug;
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  const targetSlug = resolveBlogSlug(params.slug);
  const blog = await BlogRepository.findBySlug(targetSlug);
  if (!blog || blog.status !== "PUBLISHED") {
    return {
      title: "Blog Not Found | Rajasthan Exam Twister",
      description: "The requested blog article could not be found.",
    };
  }

  const rawTitle = blog.metaTitle || blog.title;
  const title = rawTitle.includes("[") ? rawTitle : `${rawTitle} [2026 Strategy & Guide]`;
  const ogTitle = blog.metaTitle || `${title} | Rajasthan Exam Twister`;
  const description = generateMetaDescription(blog.content, blog.metaDescription, blog.excerpt);

  // Normalize canonical URL to always use primary siteUrl domain
  let canonicalUrl = `${siteUrl}/blogs/${params.slug}`;
  if (blog.canonicalUrl && blog.canonicalUrl.trim()) {
    try {
      const parsed = new URL(blog.canonicalUrl.trim());
      const primaryUrl = new URL(siteUrl);
      if (parsed.hostname.replace(/^www\./, "") === primaryUrl.hostname.replace(/^www\./, "")) {
        parsed.hostname = primaryUrl.hostname;
        if (parsed.pathname === "/blogs/2026-27" && params.slug !== "2026-27") {
          parsed.pathname = `/blogs/${params.slug}`;
        }
        canonicalUrl = parsed.toString().replace(/\/$/, "");
      } else {
        canonicalUrl = blog.canonicalUrl.trim();
      }
    } catch {
      canonicalUrl = `${siteUrl}/blogs/${params.slug}`;
    }
  }
  
  const coverImageDoc = blog.coverImageId as unknown as { url?: string } | undefined;
  const ogImageUrl = coverImageDoc?.url || `${siteUrl}/brand/banner.png`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: ogTitle,
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
  const targetSlug = resolveBlogSlug(params.slug);
  const blog = await BlogRepository.findBySlug(targetSlug);

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
  const ogImageUrl = coverImageDoc?.url || `${siteUrl}/brand/banner.png`;

  // Check if updated meaningfully (> 24 hours difference)
  const isUpdated =
    blog.updatedAt &&
    blog.publishedAt &&
    new Date(blog.updatedAt).getTime() - new Date(blog.publishedAt).getTime() > 24 * 60 * 60 * 1000;

  // JSON-LD Structured Data: Article + BreadcrumbList
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
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
            name: "Blogs",
            item: `${siteUrl}/blogs`,
          },
          ...(categoryDoc?.name
            ? [
                {
                  "@type": "ListItem",
                  position: 3,
                  name: categoryDoc.name,
                  item: `${siteUrl}/blogs?category=${categoryDoc.slug}`,
                },
                {
                  "@type": "ListItem",
                  position: 4,
                  name: blog.title,
                  item: `${siteUrl}/blogs/${blog.slug}`,
                },
              ]
            : [
                {
                  "@type": "ListItem",
                  position: 3,
                  name: blog.title,
                  item: `${siteUrl}/blogs/${blog.slug}`,
                },
              ]),
        ],
      },
      {
        "@type": "Article",
        headline: blog.title,
        description,
        image: ogImageUrl,
        datePublished: blog.publishedAt?.toISOString(),
        dateModified: blog.updatedAt?.toISOString() || blog.publishedAt?.toISOString(),
        author: {
          "@type": "Person",
          name: blog.author || "Rajasthan Exam Twister Team",
        },
        publisher: {
          "@type": "Organization",
          name: "Rajasthan Exam Twister",
          url: siteUrl,
          logo: {
            "@type": "ImageObject",
            url: `${siteUrl}/brand/logo.png`,
          },
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `${siteUrl}/blogs/${blog.slug}`,
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `What is covered in ${blog.title}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: description,
            },
          },
          {
            "@type": "Question",
            name: `Is ${blog.title} relevant for RPSC, REET & CET 2026 exams?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `Yes, this article is specifically curated according to the latest syllabus for RPSC RAS, REET, CET, RSSB, and Rajasthan Police recruitment exams.`,
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Structured Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-2 text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-amber-700 transition-colors">
            Home
          </Link>
          <span className="text-amber-300">/</span>
          <Link href="/blogs" className="hover:text-amber-700 transition-colors">
            Blogs
          </Link>
          {categoryDoc?.name && (
            <>
              <span className="text-amber-300">/</span>
              <Link
                href={`/blogs?category=${categoryDoc.slug}`}
                className="hover:text-amber-700 transition-colors"
              >
                {categoryDoc.name}
              </Link>
            </>
          )}
          <span className="text-amber-300">/</span>
          <span className="text-slate-800 font-bold truncate max-w-xs sm:max-w-md">
            {blog.title}
          </span>
        </nav>

        {/* Article Header (Exactly one <h1> per page) */}
        <header className="space-y-4 border-b border-amber-200/80 pb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0B132B] tracking-tight leading-tight">
            {blog.title}
          </h1>

          {blog.excerpt && (
            <p className="text-base sm:text-lg text-slate-700 leading-relaxed italic bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80">
              {blog.excerpt}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-2">
            <div className="flex items-center gap-1.5 font-medium text-slate-800">
              <User className="w-4 h-4 text-amber-700" />
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
            {isUpdated && blog.updatedAt && (
              <>
                <span>•</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
                  <RefreshCw className="w-3 h-3 text-emerald-600" />
                  Updated {new Date(blog.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </>
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
              <div className="relative aspect-video sm:aspect-[21/9] w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-amber-200/80 shadow-md bg-slate-100">
                <Image
                  src={coverImageDoc.url}
                  alt={coverImageDoc.altText || blog.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 896px"
                  priority
                  className="object-cover"
                />
              </div>
              {coverImageDoc.caption && (
                <figcaption className="text-xs text-slate-500 text-center mt-2 italic font-medium">
                  {coverImageDoc.caption}
                </figcaption>
              )}
            </figure>
          )}

          {/* Social Share Bar */}
          <SocialShare
            title={blog.title}
            category={categoryDoc?.name}
          />
        </header>

        {/* Ad Unit 1: notes-header-top (Before Content) */}
        <AdSenseUnit slotId="4247851206" label="Sponsored" />

        {/* Main Content Area using Shared ContentRenderer */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 border border-amber-200/70 shadow-xs">
          <ContentRenderer content={blog.content} inArticleAdSlotId="8486548924" />
        </section>

        {/* E-E-A-T Author & Editorial Fact-Check Card */}
        <div className="p-5 sm:p-6 rounded-3xl bg-amber-50/80 border border-amber-200/90 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-2xs">
          <div className="relative w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-amber-400 bg-slate-900 shrink-0">
            <Image
              src="/brand/logo.png"
              alt="Rajasthan Exam Twister Editorial Team"
              width={48}
              height={48}
              className="object-cover w-full h-full"
            />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-[#0B132B] text-sm">
                {blog.author || "Rajasthan Exam Twister Editorial Team"}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 border border-amber-300">
                Curriculum Specialist
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Curated by competitive examination researchers and educators based in Jaipur, Rajasthan. Every question, date, and fact is cross-referenced with official RPSC &amp; RSSB (RSMSSB) notifications and authentic gazette keys.
            </p>
          </div>
          <Link
            href="/about"
            className="text-xs font-bold text-amber-900 hover:text-amber-950 hover:underline shrink-0 pt-1 sm:pt-0"
          >
            Editorial Standards &rarr;
          </Link>
        </div>

        {/* Ad Unit 2: notes-bottom-download (End of Article / Before Telegram & Related) */}
        <AdSenseUnit slotId="1637999739" label="Sponsored" />

        {/* High-Converting Telegram Channel Lead Magnet */}
        <TelegramBannerCard />

        {/* More in Category Section (Internal Linking Hub) */}
        {relatedBlogs.length > 0 && categoryDoc && (
          <section className="space-y-4 pt-6">
            <div className="flex items-center justify-between border-b border-amber-200 pb-3">
              <h2 className="text-lg font-bold text-[#0B132B] flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-700" />
                <span>More in {categoryDoc.name}</span>
              </h2>
              <Link
                href={`/blogs?category=${categoryDoc.slug}`}
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
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
                  className="p-4 rounded-2xl bg-white border border-amber-200/70 hover:border-amber-400 hover:shadow-xs transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-2">
                      {related.title}
                    </h3>
                    {related.excerpt && (
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {related.excerpt}
                      </p>
                    )}
                  </div>
                  <div className="pt-3 text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                    <span>Read post</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Ad Unit 4: Multiplex Grid Recommendations (notes-multiplex-bottom) */}
        <div className="print:hidden">
          <AdSenseUnit
            slotId="6837501896"
            adFormat="autorelaxed"
            label="Advertisements"
            minHeight={250}
          />
        </div>

        {/* Bottom Call to Action */}
        <div className="bg-[#0B132B] text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md border border-amber-500/20">
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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0B132B] font-bold text-xs shadow-md shadow-amber-500/20 whitespace-nowrap transition-all"
          >
            <BookOpen className="w-4 h-4" />
            <span>Browse Exam Notes</span>
          </Link>
        </div>
      </article>
    </>
  );
}
