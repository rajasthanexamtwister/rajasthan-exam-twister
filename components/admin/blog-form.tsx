"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import { ContentRenderer } from "@/components/content/content-renderer";
import {
  Save,
  Send,
  Eye,
  ArrowLeft,
  Loader2,
  Clock,
  Sparkles,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { MediaPicker, MediaItem } from "@/components/admin/media-picker";

interface BlogData {
  _id?: string;
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  coverImageId?: string | { _id: string; url: string };
  categoryId?: string;
  tagIds?: string[];
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  author?: string;
  readingTime?: number;
  publishedAt?: string;
}

interface BlogFormProps {
  initialData?: BlogData;
  isEdit?: boolean;
}

export function BlogForm({ initialData, isEdit }: BlogFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
  const [author, setAuthor] = useState(initialData?.author || "Admin");
  const [metaTitle, setMetaTitle] = useState(initialData?.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(initialData?.metaDescription || "");
  const [canonicalUrl, setCanonicalUrl] = useState(initialData?.canonicalUrl || "");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED">(
    initialData?.status || "DRAFT"
  );

  const initialCoverId = typeof initialData?.coverImageId === "object"
    ? initialData.coverImageId._id
    : initialData?.coverImageId || "";
  const initialCoverUrl = typeof initialData?.coverImageId === "object"
    ? initialData.coverImageId.url
    : "";

  const [coverImageId, setCoverImageId] = useState<string>(initialCoverId);
  const [coverImageUrl, setCoverImageUrl] = useState<string>(initialCoverUrl);
  const [isCoverPickerOpen, setIsCoverPickerOpen] = useState(false);

  const [showSeo, setShowSeo] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Estimated reading time
  const wordCount = content.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  const estReadingTime = Math.max(1, Math.ceil(wordCount / 200));

  const handleSave = async (publishImmediately: boolean = false) => {
    setError(null);
    setFieldErrors({});

    if (!title.trim()) {
      setError("Please enter a blog title");
      setFieldErrors({ title: "Title is required" });
      return;
    }

    if (publishImmediately && (!content || !content.replace(/<[^>]*>/g, "").trim())) {
      setError("Cannot publish a blog with empty content");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: title.trim(),
        content,
        coverImageId: coverImageId || undefined,
        excerpt: excerpt.trim() || undefined,
        author: author.trim() || undefined,
        metaTitle: metaTitle.trim() || undefined,
        metaDescription: metaDescription.trim() || undefined,
        canonicalUrl: canonicalUrl.trim() || undefined,
      };

      let res;
      if (isEdit && initialData?._id) {
        res = await fetch(`/api/blogs/${initialData._id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-requested-with": "ret-admin",
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/blogs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-requested-with": "ret-admin",
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || "Failed to save blog");
        if (data.error?.fields) setFieldErrors(data.error.fields);
        return;
      }

      const blogId = isEdit ? initialData?._id : data.blog?._id;

      if (publishImmediately && blogId) {
        const pubRes = await fetch(`/api/blogs/${blogId}/publish`, {
          method: "POST",
          headers: { "x-requested-with": "ret-admin" },
        });
        if (!pubRes.ok) {
          const pubData = await pubRes.json();
          alert(pubData.error?.message || "Saved as draft, but failed to publish");
        }
      }

      router.push("/admin/blogs");
      router.refresh();
    } catch (err) {
      console.error("Save error:", err);
      setError("Network error while saving blog");
    } finally {
      setSaving(false);
    }
  };

  const handleUnpublish = async () => {
    if (!initialData?._id) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/blogs/${initialData._id}/unpublish`, {
        method: "POST",
        headers: { "x-requested-with": "ret-admin" },
      });
      if (res.ok) {
        setStatus("DRAFT");
        router.push("/admin/blogs");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error?.message || "Failed to unpublish");
      }
    } catch (err) {
      console.error("Unpublish error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:px-6 rounded-2xl border border-slate-200 shadow-sm sticky top-0 z-40 backdrop-blur-md bg-white/95">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/blogs"
            className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
            title="Back to blogs list"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">
              {isEdit ? "Edit Blog Article" : "Write New Blog"}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span
                className={clsx(
                  "font-semibold",
                  status === "PUBLISHED" ? "text-emerald-600" : "text-amber-600"
                )}
              >
                {status}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                ~{estReadingTime} min read
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-sm"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            <span>Preview</span>
          </button>

          {status === "PUBLISHED" && isEdit && (
            <button
              type="button"
              onClick={handleUnpublish}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors"
            >
              <span>Unpublish to Draft</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors shadow-sm disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-colors shadow-sm shadow-amber-500/20 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>{isEdit && status === "PUBLISHED" ? "Update Live" : "Publish Article"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {/* Main Grid: Editor & Metadata Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title Input Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Article Title
            </label>
            <input
              type="text"
              placeholder="e.g. REET 2026 Rajasthan GK & History Complete Revision Strategy"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xl md:text-2xl font-bold text-slate-900 border-b border-slate-200 pb-2 focus:outline-none focus:border-amber-500 placeholder:text-slate-300 transition-colors"
            />
            {fieldErrors.title && (
              <p className="text-xs text-red-500 font-medium">{fieldErrors.title}</p>
            )}

            {initialData?.slug && (
              <p className="text-xs text-slate-400 font-mono">
                Slug: /blogs/{initialData.slug}
              </p>
            )}
          </div>

          {/* Tiptap Rich Text Editor */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Article Body (HTML Supported)
              </label>
              <span className="text-xs text-slate-400 font-mono">
                {wordCount} words
              </span>
            </div>
            <TiptapEditor content={content} onChange={setContent} />
          </div>
        </div>

        {/* Sidebar Column: Cover Image, Excerpt, Meta, Author */}
        <div className="space-y-6">
          {/* Cover Image Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Featured Cover Image
            </label>

            {coverImageUrl ? (
              <div className="space-y-2">
                <div className="w-full h-36 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverImageUrl}
                    alt="Cover Image"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCoverImageId("");
                      setCoverImageUrl("");
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-slate-900/80 text-white hover:bg-red-600 rounded-lg transition-colors"
                    title="Remove cover image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCoverPickerOpen(true)}
                  className="w-full py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
                >
                  Change Cover Image
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsCoverPickerOpen(true)}
                className="w-full border-2 border-dashed border-slate-200 hover:border-amber-400 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50 hover:bg-amber-50/20 transition-all text-center group"
              >
                <ImageIcon className="w-6 h-6 text-slate-400 group-hover:text-amber-600 mb-1 transition-colors" />
                <span className="text-xs font-bold text-slate-800">Choose Cover Image</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Select from media library or upload</span>
              </button>
            )}
          </div>

          <MediaPicker
            isOpen={isCoverPickerOpen}
            onClose={() => setIsCoverPickerOpen(false)}
            onSelect={(media) => {
              setCoverImageId(media._id);
              setCoverImageUrl(media.url);
            }}
            acceptedType="image"
            title="Select Blog Cover Image"
          />

          {/* Summary / Excerpt Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Brief Excerpt / Summary
            </label>
            <textarea
              rows={3}
              placeholder="Short description displayed on blog list cards and search snippets (max ~160 words)..."
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full text-xs text-slate-800 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white resize-none transition-all"
            />
          </div>

          {/* Author info */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Author Name
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Author name (default: Admin)"
              className="w-full text-xs text-slate-800 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
            />
          </div>

          {/* Collapsible SEO Settings */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSeo(!showSeo)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  SEO & Search Settings
                </span>
              </div>
              {showSeo ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showSeo && (
              <div className="p-4 pt-0 space-y-3 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="Custom search title (defaults to article title)"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Meta Description
                  </label>
                  <textarea
                    rows={2}
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="Custom description snippet for Google results..."
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Canonical URL
                  </label>
                  <input
                    type="text"
                    value={canonicalUrl}
                    onChange={(e) => setCanonicalUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Preview Modal (reusing ContentRenderer) */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-100 text-amber-800">
                  Live Public Preview
                </span>
                <span className="text-xs text-slate-500">Unsaved State</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Close Preview
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-6">
              <div className="space-y-3 pb-6 border-b border-slate-200">
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {title || "Untitled Article"}
                </h1>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>By {author || "Admin"}</span>
                  <span>•</span>
                  <span>{new Date().toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
                  <span>•</span>
                  <span>~{estReadingTime} min read</span>
                </div>
                {excerpt && (
                  <p className="text-sm text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {excerpt}
                  </p>
                )}
              </div>

              {/* Shared Content Renderer */}
              <ContentRenderer content={content} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
