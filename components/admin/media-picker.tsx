"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  UploadCloud,
  Check,
  X,
  FileText,
  Loader2,
  Image as ImageIcon,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import clsx from "clsx";

export interface MediaItem {
  _id: string;
  url: string;
  altText?: string;
  caption?: string;
  width?: number;
  height?: number;
  fileSize?: number;
  mimeType: string;
  createdAt: string;
}

interface MediaPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: MediaItem) => void;
  acceptedType?: "image" | "pdf" | "all";
  title?: string;
}

export function MediaPicker({
  isOpen,
  onClose,
  onSelect,
  acceptedType = "all",
  title = "Select from Media Library",
}: MediaPickerProps) {
  const [activeTab, setActiveTab] = useState<"library" | "upload">("library");
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mimeFilter, setMimeFilter] = useState<string>(
    acceptedType === "image" ? "images" : acceptedType === "pdf" ? "pdfs" : "ALL"
  );
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Direct upload states
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [customAlt, setCustomAlt] = useState("");

  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (mimeFilter !== "ALL") params.set("mimeType", mimeFilter);
      params.set("page", page.toString());
      params.set("pageSize", "18");

      const res = await fetch(`/api/media?${params.toString()}`, {
        headers: { "x-requested-with": "ret-admin" },
      });
      if (res.ok) {
        const data = await res.json();
        setMediaList(data.media || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to load media for picker:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, mimeFilter, page]);

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
    }
  }, [isOpen, fetchMedia]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadError(null);

      const formData = new FormData();
      formData.append("file", file);
      if (customAlt.trim()) {
        formData.append("altText", customAlt.trim());
      }

      const res = await fetch("/api/media", {
        method: "POST",
        headers: { "x-requested-with": "ret-admin" },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error?.message || "Failed to upload file");
        return;
      }

      if (data.media) {
        onSelect(data.media);
        onClose();
      }
    } catch (err) {
      console.error("Upload error:", err);
      setUploadError("Network error during file upload");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 font-bold">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500">Pick an existing asset or upload a new file</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-100">
          <button
            type="button"
            onClick={() => setActiveTab("library")}
            className={clsx(
              "pb-3 text-xs font-bold transition-all border-b-2",
              activeTab === "library"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            Media Library
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={clsx(
              "pb-3 text-xs font-bold transition-all border-b-2",
              activeTab === "upload"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            Direct Upload
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === "library" ? (
            <div className="space-y-4">
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by alt text or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>

                {acceptedType === "all" && (
                  <div className="flex items-center gap-1 self-end sm:self-auto">
                    {[
                      { label: "All", value: "ALL" },
                      { label: "Images", value: "images" },
                      { label: "PDFs", value: "pdfs" },
                    ].map((tab) => (
                      <button
                        key={tab.value}
                        type="button"
                        onClick={() => setMimeFilter(tab.value)}
                        className={clsx(
                          "px-3 py-1 rounded-lg text-xs font-semibold transition-all",
                          mimeFilter === tab.value
                            ? "bg-slate-900 text-white"
                            : "text-slate-600 hover:bg-slate-100"
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Grid of Media Assets */}
              {loading ? (
                <div className="py-20 text-center flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
                  <p className="text-xs text-slate-500">Loading library assets...</p>
                </div>
              ) : mediaList.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                  <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-800">No media found</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Upload an asset or adjust your search filter.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {mediaList.map((item) => {
                    const isPdf = item.mimeType === "application/pdf";
                    return (
                      <button
                        key={item._id}
                        type="button"
                        onClick={() => {
                          onSelect(item);
                          onClose();
                        }}
                        className="group relative flex flex-col items-center bg-slate-50 hover:bg-amber-50/50 border border-slate-200 hover:border-amber-400 rounded-xl p-2 transition-all text-left overflow-hidden shadow-sm"
                      >
                        <div className="w-full h-24 rounded-lg bg-white border border-slate-100 overflow-hidden flex items-center justify-center relative">
                          {isPdf ? (
                            <FileText className="w-8 h-8 text-blue-600" />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.url}
                              alt={item.altText || "Thumbnail"}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          )}
                        </div>

                        <div className="w-full mt-1.5 space-y-0.5">
                          <p className="text-[11px] font-bold text-slate-800 truncate">
                            {item.altText || "Untitled Asset"}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {item.fileSize ? `${Math.round(item.fileSize / 1024)} KB` : "-"}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 text-xs font-semibold rounded-lg border border-slate-200 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-slate-500 font-medium">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1 text-xs font-semibold rounded-lg border border-slate-200 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Direct Upload Tab */
            <div className="space-y-4 max-w-lg mx-auto py-6">
              {uploadError && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 flex items-start gap-2.5 text-xs text-red-800">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Alt Text / Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rajasthan District Map / Physical Divisions"
                  value={customAlt}
                  onChange={(e) => setCustomAlt(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <label className="border-2 border-dashed border-slate-300 hover:border-amber-400 bg-slate-50 hover:bg-amber-50/20 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all text-center">
                <input
                  type="file"
                  accept={
                    acceptedType === "image"
                      ? "image/jpeg,image/png,image/webp"
                      : acceptedType === "pdf"
                      ? "application/pdf"
                      : "image/jpeg,image/png,image/webp,application/pdf"
                  }
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
                {uploading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
                ) : (
                  <UploadCloud className="w-8 h-8 text-amber-500 mb-2" />
                )}
                <p className="text-sm font-bold text-slate-900">
                  {uploading ? "Uploading file..." : "Click to select file to upload"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Max 5MB for images (JPEG, PNG, WebP) / Max 15MB for PDF
                </p>
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
