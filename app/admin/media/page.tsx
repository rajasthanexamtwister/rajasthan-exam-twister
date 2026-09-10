"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  UploadCloud,
  Image as ImageIcon,
  FileText,
  Clock,
  Trash2,
  Edit2,
  Copy,
  Check,
  X,
  Loader2,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Save,
  CheckCircle2,
} from "lucide-react";
import clsx from "clsx";

interface MediaItem {
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

export default function AdminMediaPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [mimeFilter, setMimeFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selected item for edit panel
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [editAltText, setEditAltText] = useState("");
  const [editCaption, setEditCaption] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editMessage, setEditMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Delete states
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<MediaItem | null>(null);

  // Direct upload states
  const [uploading, setUploading] = useState(false);

  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (mimeFilter !== "ALL") params.set("mimeType", mimeFilter);
      params.set("page", page.toString());
      params.set("pageSize", "24");

      const res = await fetch(`/api/media?${params.toString()}`, {
        headers: { "x-requested-with": "ret-admin" },
      });

      if (res.ok) {
        const data = await res.json();
        setMediaList(data.media || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Failed to load media list:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, mimeFilter, page]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleSelectItem = (item: MediaItem) => {
    setSelectedItem(item);
    setEditAltText(item.altText || "");
    setEditCaption(item.caption || "");
    setEditMessage(null);
    setDeleteError(null);
  };

  const handleSaveEdit = async () => {
    if (!selectedItem) return;

    try {
      setSavingEdit(true);
      setEditMessage(null);

      const res = await fetch(`/api/media/${selectedItem._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-requested-with": "ret-admin",
        },
        body: JSON.stringify({
          altText: editAltText,
          caption: editCaption,
        }),
      });

      const data = await res.json();
      if (res.ok && data.media) {
        setSelectedItem(data.media);
        setMediaList((prev) =>
          prev.map((m) => (m._id === data.media._id ? data.media : m))
        );
        setEditMessage({ text: "Media metadata updated successfully", type: "success" });
      } else {
        setEditMessage({ text: data.error?.message || "Failed to update media", type: "error" });
      }
    } catch (err) {
      console.error("Save edit error:", err);
      setEditMessage({ text: "Network error while updating media", type: "error" });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    try {
      setUploading(true);
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("altText", file.name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " "));

        const res = await fetch("/api/media", {
          method: "POST",
          headers: { "x-requested-with": "ret-admin" },
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json();
          alert(errData.error?.message || `Failed to upload ${file.name}`);
        }
      }
      await fetchMedia();
    } catch (err) {
      console.error("Upload error:", err);
      alert("Network error during file upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      setDeleteError(null);

      const res = await fetch(`/api/media/${id}`, {
        method: "DELETE",
        headers: { "x-requested-with": "ret-admin" },
      });

      const data = await res.json();
      if (res.ok) {
        setMediaList((prev) => prev.filter((m) => m._id !== id));
        setSelectedItem(null);
        setConfirmDeleteModal(null);
        await fetchMedia();
      } else {
        setDeleteError(data.error?.message || "Failed to delete media asset");
      }
    } catch (err) {
      console.error("Delete error:", err);
      setDeleteError("Network error while deleting media asset");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(window.location.origin + url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
              Media Asset Library
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {totalCount} {totalCount === 1 ? "asset" : "assets"} stored
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Manage Media & Infographics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Central repository for exam infographics, maps, diagrams, and printable revision PDF handbooks
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchMedia()}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            title="Refresh assets"
          >
            <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
          </button>

          <label className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-sm cursor-pointer">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleDirectUpload}
              disabled={uploading}
              className="hidden"
            />
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UploadCloud className="w-4 h-4" />
            )}
            <span>{uploading ? "Uploading..." : "Upload Media"}</span>
          </label>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        {/* Type Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 md:pb-0">
          {[
            { label: "All Assets", value: "ALL" },
            { label: "Infographics & Images", value: "images" },
            { label: "PDF Handbooks", value: "pdfs" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setMimeFilter(tab.value);
                setPage(1);
              }}
              className={clsx(
                "px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
                mimeFilter === tab.value
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by alt text or name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Main Grid View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        {loading ? (
          <div className="py-24 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-3" />
            <p className="text-sm text-slate-500 font-medium">Loading media assets...</p>
          </div>
        ) : mediaList.length === 0 ? (
          <div className="py-24 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <ImageIcon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No media assets found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || mimeFilter !== "ALL"
                ? "No media matching the current search criteria."
                : "Upload diagrams, maps, or PDF handbooks to populate your media library."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {mediaList.map((item) => {
              const isPdf = item.mimeType === "application/pdf";
              const isSelected = selectedItem?._id === item._id;

              return (
                <div
                  key={item._id}
                  onClick={() => handleSelectItem(item)}
                  className={clsx(
                    "group relative flex flex-col bg-slate-50 border rounded-2xl p-2.5 transition-all cursor-pointer overflow-hidden shadow-sm",
                    isSelected
                      ? "ring-2 ring-amber-500 border-amber-500 bg-amber-50/20"
                      : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                  )}
                >
                  <div className="w-full h-32 rounded-xl bg-white border border-slate-100 overflow-hidden flex items-center justify-center relative">
                    {isPdf ? (
                      <div className="flex flex-col items-center justify-center text-blue-600 space-y-1">
                        <FileText className="w-10 h-10" />
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded text-blue-700">
                          PDF
                        </span>
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.url}
                        alt={item.altText || "Media Thumbnail"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    )}
                  </div>

                  <div className="w-full mt-2 space-y-0.5">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {item.altText || "Untitled Asset"}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>{item.fileSize ? `${Math.round(item.fileSize / 1024)} KB` : "—"}</span>
                      <span>
                        {new Date(item.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6 border-t border-slate-100">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={clsx(
                  "w-8 h-8 flex items-center justify-center rounded-xl text-xs font-bold transition-all",
                  page === p
                    ? "bg-amber-500 text-slate-950 shadow-sm"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Edit Drawer Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 sm:px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 rounded-t-2xl">
              <div>
                <h3 className="text-base font-bold text-slate-900">Asset Details & Metadata</h3>
                <p className="text-xs text-slate-500 font-mono">{selectedItem.mimeType}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Preview Box */}
              <div className="w-full max-h-64 rounded-2xl bg-slate-50 border border-slate-200 p-3 flex items-center justify-center overflow-hidden">
                {selectedItem.mimeType === "application/pdf" ? (
                  <div className="flex flex-col items-center gap-2 text-center py-6">
                    <FileText className="w-14 h-14 text-blue-600" />
                    <a
                      href={selectedItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:underline"
                    >
                      <span>Open PDF in new tab</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedItem.url}
                    alt={selectedItem.altText || "Preview"}
                    className="max-h-56 max-w-full object-contain rounded-xl"
                  />
                )}
              </div>

              {/* Edit Feedback Message */}
              {editMessage && (
                <div
                  className={clsx(
                    "p-3 rounded-xl text-xs flex items-center gap-2",
                    editMessage.type === "success"
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                      : "bg-red-50 border border-red-200 text-red-800"
                  )}
                >
                  {editMessage.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{editMessage.text}</span>
                </div>
              )}

              {/* Editable Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Alt Text (Accessibility & SEO)
                  </label>
                  <input
                    type="text"
                    value={editAltText}
                    onChange={(e) => setEditAltText(e.target.value)}
                    placeholder="Descriptive image explanation..."
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Caption (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={editCaption}
                    onChange={(e) => setEditCaption(e.target.value)}
                    placeholder="Figure caption displayed beneath diagram..."
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white resize-none"
                  />
                </div>
              </div>

              {/* Read-Only Metadata & URL */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">File Size</span>
                    <span className="font-semibold text-slate-800">
                      {selectedItem.fileSize ? `${(selectedItem.fileSize / 1024).toFixed(1)} KB` : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">MIME Type</span>
                    <span className="font-semibold text-slate-800">{selectedItem.mimeType}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Dimensions</span>
                    <span className="font-semibold text-slate-800">
                      {selectedItem.width && selectedItem.height
                        ? `${selectedItem.width} × ${selectedItem.height}`
                        : "Vector / Document"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Uploaded</span>
                    <span className="font-semibold text-slate-800">
                      {new Date(selectedItem.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-slate-500 truncate">{selectedItem.url}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(selectedItem.url)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUrl ? "Copied" : "Copy URL"}</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteModal(selectedItem)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Asset</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={savingEdit}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-sm"
                  >
                    {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal with In-Use Error Details */}
      {confirmDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Media Asset</h3>
                <p className="text-xs text-slate-500">This action permanently deletes the file</p>
              </div>
            </div>

            {deleteError ? (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-1">
                <p className="font-bold">Deletion Blocked:</p>
                <p>{deleteError}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to permanently delete &quot;{confirmDeleteModal.altText || "this asset"}&quot;? If this file is in use by any blog or revision note, deletion will be safely blocked.
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmDeleteModal(null);
                  setDeleteError(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {deleteError ? "Understood" : "Cancel"}
              </button>
              {!deleteError && (
                <button
                  type="button"
                  onClick={() => handleDelete(confirmDeleteModal._id)}
                  disabled={deletingId === confirmDeleteModal._id}
                  className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                >
                  {deletingId === confirmDeleteModal._id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Permanently Delete</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
