import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { NoteRepository } from "@/server/repositories/note";
import { ContentRenderer } from "@/components/content/content-renderer";
import { TelegramBannerCard } from "@/components/public/telegram-banner-card";
import { AudioSummaryPlayer } from "@/components/public/audio-summary-player";
import { BookmarkButton } from "@/components/public/bookmark-button";
import { BrandedPdfDownloader } from "@/components/public/branded-pdf-downloader";
import { generateMetaDescription, getSiteUrl } from "@/server/lib/seo";
import { SocialShare } from "@/components/public/social-share";
import { PrintNoteButton } from "@/components/public/print-note-button";
import {
  BookOpen,
  Calendar,
  ArrowLeft,
  Download,
  FileText,
  Tag as TagIcon,
  Sparkles,
  Layers,
  ArrowRight,
  RefreshCw,
  ImageIcon,
} from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface NoteDetailPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: NoteDetailPageProps): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  const note = await NoteRepository.findBySlug(params.slug);
  if (!note || note.status !== "PUBLISHED") {
    return {
      title: "Revision Note Not Found — Rajasthan Exam Twister",
      description: "The requested revision note could not be found.",
    };
  }

  const title = note.title;
  const ogTitle = `${note.title} | Rajasthan Exam Twister`;
  const description = generateMetaDescription(
    note.content,
    null,
    null,
    155
  );
  const canonicalUrl = `${siteUrl}/notes/${note.slug}`;

  const imageDocs = (note.imageIds as unknown as Array<{ url?: string }>) || [];
  const ogImageUrl = imageDocs[0]?.url || `${siteUrl}/brand/banner.png`;

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
      type: "article",
      publishedTime: note.publishedAt?.toISOString(),
      modifiedTime: note.updatedAt?.toISOString() || note.publishedAt?.toISOString(),
      images: [
        {
          url: ogImageUrl,
          alt: note.title,
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

export default async function NoteDetailPage({ params }: NoteDetailPageProps) {
  const siteUrl = getSiteUrl();
  const note = await NoteRepository.findBySlug(params.slug);

  if (!note || note.status !== "PUBLISHED") {
    notFound();
  }

  const categoryDoc = note.categoryId as unknown as { _id?: string; name?: string; slug?: string } | undefined;
  const tagDocs = (note.tagIds as unknown as Array<{ _id?: string; name?: string }>) || [];
  const images = (note.imageIds as unknown as Array<{
    _id?: string;
    url: string;
    altText?: string;
    caption?: string;
    width?: number;
    height?: number;
  }>) || [];
  const pdfDoc = note.pdfMediaId as unknown as {
    _id?: string;
    url?: string;
    fileSize?: number;
    altText?: string;
  } | undefined;

  // Query "More in Category" related notes
  let relatedNotes: Array<{
    _id: unknown;
    title: string;
    slug: string;
    subject?: string;
    publishedAt?: Date;
  }> = [];

  if (note.categoryId) {
    try {
      relatedNotes = (await NoteRepository.findRelatedByCategory(note.categoryId, note._id, 3)) as typeof relatedNotes;
    } catch (err) {
      console.error("Failed to load related notes:", err);
    }
  }

  const description = generateMetaDescription(note.content, null, null, 155);
  const primaryImage = images[0]?.url || `${siteUrl}/brand/banner.png`;

  // Check if updated meaningfully (> 24 hours difference)
  const isUpdated =
    note.updatedAt &&
    note.publishedAt &&
    new Date(note.updatedAt).getTime() - new Date(note.publishedAt).getTime() > 24 * 60 * 60 * 1000;

  // JSON-LD Structured Data: BreadcrumbList + LearningResource
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
            name: "Notes",
            item: `${siteUrl}/notes`,
          },
          ...(categoryDoc?.name
            ? [
                {
                  "@type": "ListItem",
                  position: 3,
                  name: categoryDoc.name,
                  item: `${siteUrl}/notes?category=${categoryDoc.slug}`,
                },
                {
                  "@type": "ListItem",
                  position: 4,
                  name: note.title,
                  item: `${siteUrl}/notes/${note.slug}`,
                },
              ]
            : [
                {
                  "@type": "ListItem",
                  position: 3,
                  name: note.title,
                  item: `${siteUrl}/notes/${note.slug}`,
                },
              ]),
        ],
      },
      {
        "@type": "LearningResource",
        name: note.title,
        description,
        learningResourceType: "Study Guide / Revision Notes",
        educationalLevel: "Competitive Examination (REET, RPSC, CET, Police)",
        teaches: note.subject || "Rajasthan General Knowledge",
        image: primaryImage,
        datePublished: note.publishedAt?.toISOString(),
        dateModified: note.updatedAt?.toISOString() || note.publishedAt?.toISOString(),
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
          "@id": `${siteUrl}/notes/${note.slug}`,
        },
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

      <article className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8 min-w-0">
        {/* Structured Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1.5 sm:gap-2 text-xs text-slate-500 font-medium print:hidden">
          <Link href="/" className="hover:text-amber-700 transition-colors">
            Home
          </Link>
          <span className="text-amber-300">/</span>
          <Link href="/notes" className="hover:text-amber-700 transition-colors">
            Notes
          </Link>
          {categoryDoc?.name && (
            <>
              <span className="text-amber-300">/</span>
              <Link
                href={`/notes?category=${categoryDoc.slug}`}
                className="hover:text-amber-700 transition-colors"
              >
                {categoryDoc.name}
              </Link>
            </>
          )}
          <span className="text-amber-300">/</span>
          <span className="text-slate-800 font-bold truncate max-w-[140px] sm:max-w-md">
            {note.title}
          </span>
        </nav>

        {/* Note Header (Exactly one <h1> per page) */}
        <header className="space-y-4 border-b border-amber-200/80 pb-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {note.subject && (
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                  {note.subject}
                </span>
              )}
              {note.source && (
                <span className="px-2.5 py-1 rounded-full text-xs text-slate-500 bg-amber-50/80 border border-amber-200/60">
                  Ref: {note.source}
                </span>
              )}
            </div>

            {/* Action Buttons: PDF Download + Bookmark */}
            <div className="flex items-center gap-2 flex-wrap">
              <BookmarkButton
                item={{
                  id: String(note._id || note.slug),
                  type: "note",
                  title: note.title,
                  url: `/notes/${note.slug}`,
                  excerpt: note.content?.slice(0, 150),
                  category: categoryDoc?.name || note.subject,
                }}
              />
              <BrandedPdfDownloader noteTitle={note.title} />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0B132B] tracking-tight leading-tight">
            {note.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-2">
            {note.publishedAt && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <time dateTime={new Date(note.publishedAt).toISOString()}>
                  {new Date(note.publishedAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
              </div>
            )}
            {isUpdated && note.updatedAt && (
              <>
                <span>•</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
                  <RefreshCw className="w-3 h-3 text-emerald-600" />
                  Updated {new Date(note.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </>
            )}
            {images.length > 0 && (
              <>
                <span>•</span>
                <span className="text-amber-800 font-bold">
                  {images.length} {images.length === 1 ? "infographic diagram" : "infographic diagrams"}
                </span>
              </>
            )}
          </div>

          {/* PDF Download Link Banner if attached */}
          {pdfDoc?.url && (
            <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-800 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Download Printable PDF Revision Guide</h2>
                  <p className="text-xs text-slate-600">
                    {pdfDoc.fileSize
                      ? `${(pdfDoc.fileSize / (1024 * 1024)).toFixed(2)} MB PDF file`
                      : "High-yield revision handbook for offline study"}
                  </p>
                </div>
              </div>
              <a
                href={pdfDoc.url}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#0B132B] bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-sm shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </a>
            </div>
          )}

          {/* Social Share Bar */}
          <div className="print:hidden">
            <SocialShare
              title={note.title}
              category={categoryDoc?.name || note.subject}
            />
          </div>
        </header>

        {/* Ordered Infographic Gallery (Preserves insertion order) */}
        {images.length > 0 && (
          <section className="space-y-6" aria-label="Infographic Diagrams">
            {images.map((img, idx) => (
              <figure
                key={img._id?.toString() || `${img.url}-${idx}`}
                className="bg-white p-3 sm:p-4 rounded-3xl border border-amber-200/80 shadow-xs space-y-3"
              >
                <div className="relative w-full overflow-hidden rounded-2xl border border-amber-100 bg-[#FAF8F5] min-h-[250px] max-h-[800px] flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.altText || `${note.title} infographic revision sheet ${idx + 1}`}
                    className="w-full h-auto object-contain max-h-[800px] mx-auto"
                    loading={idx === 0 ? "eager" : "lazy"}
                  />
                </div>
                {img.caption && (
                  <figcaption className="text-xs font-medium text-slate-600 text-center px-4 py-1">
                    {img.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </section>
        )}

        {/* Audio AI Voice Summary Player */}
        <div className="print:hidden">
          <AudioSummaryPlayer
            textToRead={note.content || note.title}
            title={`${note.title} — Audio Summary`}
          />
        </div>

        {/* Main Text Content via Shared ContentRenderer */}
        {note.content && (
          <section className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-10 border border-amber-200/80 shadow-xs study-sheet-content min-w-0 max-w-full">
            <ContentRenderer content={note.content} />
          </section>
        )}

        {/* High-Converting Telegram Channel Lead Magnet */}
        <div className="print:hidden">
          <TelegramBannerCard
            title="राजस्थान प्रतियोगी परीक्षाओं के संपूर्ण PDF नोट्स पाने के लिए जुड़ें"
            description="REET, RPSC, CET, Patwar व Rajasthan Police परीक्षा हेतु डेली 10 फ्री क्विज़ पोल, हस्तलिखित नोट्स व मॉडल पेपर्स टेलीग्राम पर प्राप्त करें।"
          />
        </div>

        {/* More in Category Section (Internal Linking Hub) */}
        {relatedNotes.length > 0 && categoryDoc && (
          <section className="space-y-4 pt-6 print:hidden">
            <div className="flex items-center justify-between border-b border-amber-200 pb-3">
              <h2 className="text-lg font-bold text-[#0B132B] flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-700" />
                <span>More in {categoryDoc.name}</span>
              </h2>
              <Link
                href={`/notes?category=${categoryDoc.slug}`}
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedNotes.map((related) => (
                <Link
                  key={related._id ? String(related._id) : related.slug}
                  href={`/notes/${related.slug}`}
                  className="p-4 rounded-2xl bg-white border border-amber-200/70 hover:border-amber-400 hover:shadow-xs transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-1.5">
                    {related.subject && (
                      <span className="inline-block text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                        {related.subject}
                      </span>
                    )}
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-2">
                      {related.title}
                    </h3>
                  </div>
                  <div className="pt-3 text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                    <span>View note</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Tags Footer */}
        {tagDocs.length > 0 && (
          <div className="pt-4 border-t border-amber-200 space-y-2 print:hidden">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <TagIcon className="w-3.5 h-3.5 text-amber-700" />
              <span>Related Topics & Syllabus Tags</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tagDocs.map((tag) => (
                <Link
                  key={tag._id?.toString() || tag.name}
                  href={`/notes?tag=${tag.name}`}
                  className="px-3 py-1 text-xs font-semibold bg-white hover:bg-amber-50 border border-amber-200 text-slate-800 rounded-xl shadow-xs transition-colors"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="bg-[#0B132B] text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md border border-amber-500/20 print:hidden">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-amber-400 font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Rajasthan Exam Twister</span>
            </div>
            <h2 className="text-lg font-bold">Comprehensive Preparation for Rajasthan Exams</h2>
            <p className="text-xs text-slate-300 max-w-md">
              Review detailed blog breakdowns, previous year papers, and topical revision handbooks.
            </p>
          </div>

          <Link
            href="/blogs"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0B132B] font-bold text-xs shadow-md shadow-amber-500/20 whitespace-nowrap transition-all"
          >
            <BookOpen className="w-4 h-4" />
            <span>Browse Blogs</span>
          </Link>
        </div>
      </article>
    </>
  );
}
