"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import { ContentRenderer } from "@/components/content/content-renderer";
import { NoteImageUploader, NoteImageItem } from "@/components/admin/note-image-uploader";
import {
  Save,
  Send,
  Eye,
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileText,
  Paperclip,
  UploadCloud,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

interface Category {
  _id: string;
  name: string;
}

interface Tag {
  _id: string;
  name: string;
}

interface NoteData {
  _id?: string;
  title: string;
  slug?: string;
  subject?: string;
  content?: string;
  categoryId?: string | { _id: string; name: string };
  tagIds?: string[] | Array<{ _id: string; name: string }>;
  imageIds?: NoteImageItem[] | string[];
  pdfMediaId?: { _id: string; url: string } | string;
  source?: string;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

interface NoteFormProps {
  initialData?: NoteData;
  isEdit?: boolean;
}

export function NoteForm({ initialData, isEdit }: NoteFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initialData?.title || "");
  const [subject, setSubject] = useState(initialData?.subject || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [source, setSource] = useState(initialData?.source || "");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED">(
    initialData?.status || "DRAFT"
  );

  const initialCatId = typeof initialData?.categoryId === "object"
    ? initialData.categoryId._id
    : initialData?.categoryId || "";
  const [categoryId, setCategoryId] = useState<string>(initialCatId);

  const initialTagIds = Array.isArray(initialData?.tagIds)
    ? initialData.tagIds.map((t) => (typeof t === "object" ? t._id : t))
    : [];
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialTagIds);

  const [images, setImages] = useState<NoteImageItem[]>(() => {
    if (!initialData?.imageIds || !Array.isArray(initialData.imageIds)) return [];
    return initialData.imageIds.map((img: unknown) => {
      if (typeof img === "object" && img !== null) {
        const item = img as NoteImageItem;
        return {
          _id: item._id,
          url: item.url,
          altText: item.altText,
          caption: item.caption,
        };
      }
      return { _id: String(img), url: "" };
    });
  });

  const initialPdfUrl = typeof initialData?.pdfMediaId === "object"
    ? initialData.pdfMediaId.url
    : "";
  const initialPdfId = typeof initialData?.pdfMediaId === "object"
    ? initialData.pdfMediaId._id
    : (typeof initialData?.pdfMediaId === "string" ? initialData.pdfMediaId : "");

  const [pdfMediaId, setPdfMediaId] = useState<string>(initialPdfId);
  const [pdfUrl, setPdfUrl] = useState<string>(initialPdfUrl);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(console.error);

    fetch("/api/tags")
      .then((res) => res.json())
      .then((data) => setAvailableTags(data.tags || []))
      .catch(console.error);
  }, []);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPdf(true);
      setError(null);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("altText", file.name);

      const res = await fetch("/api/media", {
        method: "POST",
        headers: { "x-requested-with": "ret-admin" },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || "Failed to upload PDF");
        return;
      }

      if (data.media) {
        setPdfMediaId(data.media._id);
        setPdfUrl(data.media.url);
      }
    } catch (err) {
      console.error("PDF upload error:", err);
      setError("Network error while uploading PDF");
    } finally {
      setUploadingPdf(false);
      e.target.value = "";
    }
  };

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter((id) => id !== tagId));
    } else {
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
  };

  const handleSave = async (publishImmediately: boolean = false) => {
    setError(null);

    if (!title.trim()) {
      setError("Please enter a note title");
      return;
    }

    const hasText = !!content.replace(/<[^>]*>/g, "").trim();
    const hasImages = images.length > 0;

    if (publishImmediately && !hasText && !hasImages) {
      setError("Note requires either text content or at least one image to be published");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: title.trim(),
        subject: subject.trim() || undefined,
        content: content || "",
        categoryId: categoryId || undefined,
        tagIds: selectedTagIds,
        imageIds: images.map((img) => img._id),
        pdfMediaId: pdfMediaId || undefined,
        source: source.trim() || undefined,
      };

      let res;
      if (isEdit && initialData?._id) {
        res = await fetch(`/api/notes/${initialData._id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-requested-with": "ret-admin",
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/notes", {
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
        setError(data.error?.message || "Failed to save note");
        return;
      }

      const noteId = isEdit ? initialData?._id : data.note?._id;

      if (publishImmediately && noteId) {
        const pubRes = await fetch(`/api/notes/${noteId}/publish`, {
          method: "POST",
          headers: { "x-requested-with": "ret-admin" },
        });
        if (!pubRes.ok) {
          const pubData = await pubRes.json();
          alert(pubData.error?.message || "Saved as draft, but failed to publish");
        }
      }

      router.push("/admin/notes");
      router.refresh();
    } catch (err) {
      console.error("Save error:", err);
      setError("Network error while saving note");
    } finally {
      setSaving(false);
    }
  };

  const handleUnpublish = async () => {
    if (!initialData?._id) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/notes/${initialData._id}/unpublish`, {
        method: "POST",
        headers: { "x-requested-with": "ret-admin" },
      });
      if (res.ok) {
        setStatus("DRAFT");
        router.push("/admin/notes");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error?.message || "Failed to unpublish note");
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
            href="/admin/notes"
            className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
            title="Back to notes list"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">
              {isEdit ? "Edit Revision Note" : "Create Master Revision Note"}
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
              <span>{images.length} images attached</span>
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
              <span>Unpublish</span>
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
            <span>{isEdit && status === "PUBLISHED" ? "Update Live" : "Publish Note"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Title, Subject, Editor, Ordered Images */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Subject Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Note Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Rajasthan Lok Nritya (Folk Dances) Master Revision Handbook"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-lg sm:text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 focus:outline-none focus:border-amber-500 placeholder:text-slate-300"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject / Topic Area
                </label>
                <input
                  type="text"
                  placeholder="e.g. Art & Culture, History, Geography"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Source / Reference Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. RBSE Class 10 / Rajasthan Sahitya Academy"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Ordered Image Uploader Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Ordered Infographic & Notes Images
                </h2>
                <p className="text-xs text-slate-500">
                  Drag / reorder images. For image-only notes, text content can remain brief or empty.
                </p>
              </div>
            </div>
            <NoteImageUploader images={images} onChange={setImages} />
          </div>

          {/* Tiptap Text Content Editor */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Note Content & Key Points (HTML Supported)
                </h2>
                <p className="text-xs text-slate-500">
                  Written summaries, tables, memory tricks, and bullet notes.
                </p>
              </div>
            </div>
            <TiptapEditor content={content} onChange={setContent} />
          </div>
        </div>

        {/* Right Sidebar: Category, Tags, PDF Attach */}
        <div className="space-y-6">
          {/* Category Selector Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Exam Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            >
              <option value="">-- Select Category --</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags Selector Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Topics & Tags
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1">
              {availableTags.length === 0 ? (
                <p className="text-xs text-slate-400">No tags available yet.</p>
              ) : (
                availableTags.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag._id);
                  return (
                    <button
                      type="button"
                      key={tag._id}
                      onClick={() => toggleTag(tag._id)}
                      className={clsx(
                        "px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                        isSelected
                          ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      )}
                    >
                      {tag.name}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* PDF Attachment Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              PDF Handbook Attachment
            </label>
            {pdfUrl ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-800 truncate">
                  <Paperclip className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="truncate">Attached PDF Handbook</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPdfMediaId("");
                    setPdfUrl("");
                  }}
                  className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                  title="Remove PDF"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-200 hover:border-amber-400 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-amber-50/20 transition-all text-center">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handlePdfUpload}
                  disabled={uploadingPdf}
                  className="hidden"
                />
                {uploadingPdf ? (
                  <Loader2 className="w-5 h-5 animate-spin text-amber-600 mb-1" />
                ) : (
                  <UploadCloud className="w-5 h-5 text-amber-600 mb-1" />
                )}
                <span className="text-xs font-semibold text-slate-800">
                  {uploadingPdf ? "Uploading PDF..." : "Attach PDF Guide (Max 15MB)"}
                </span>
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Live Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-100 text-amber-800">
                  Live Public Preview
                </span>
                <span className="text-xs text-slate-500">Note Detail State</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Close Preview
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto space-y-6">
              <div className="space-y-3 pb-6 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  {subject && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-blue-50 text-blue-800 border border-blue-200">
                      {subject}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {title || "Untitled Note"}
                </h1>
              </div>

              {/* Ordered Images Rendering */}
              {images.length > 0 && (
                <div className="space-y-6">
                  {images.map((img, i) => (
                    <figure key={img._id + "-" + i} className="space-y-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.altText || title}
                        className="w-full rounded-2xl border border-slate-200 shadow-sm"
                      />
                      {img.caption && (
                        <figcaption className="text-xs text-slate-500 text-center italic">
                          {img.caption}
                        </figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              )}

              {/* Text content rendering */}
              <ContentRenderer content={content} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
