"use client";

import { useState } from "react";
import {
  UploadCloud,
  ChevronUp,
  ChevronDown,
  Trash2,
  ImageIcon,
  Loader2,
  AlertCircle,
} from "lucide-react";
import clsx from "clsx";

import { MediaPicker, MediaItem } from "@/components/admin/media-picker";

export interface NoteImageItem {
  _id: string;
  url: string;
  altText?: string;
  caption?: string;
}

interface NoteImageUploaderProps {
  images: NoteImageItem[];
  onChange: (images: NoteImageItem[]) => void;
}

export function NoteImageUploader({ images, onChange }: NoteImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const handleSelectFromLibrary = (media: MediaItem) => {
    // Prevent adding exact duplicate in the same note if already selected
    const alreadyExists = images.some((img) => img._id === media._id);
    if (alreadyExists) {
      alert("This image is already added to this note.");
      return;
    }

    onChange([
      ...images,
      {
        _id: media._id,
        url: media.url,
        altText: media.altText,
        caption: media.caption,
      },
    ]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    setUploading(true);

    try {
      const uploadedList: NoteImageItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("altText", file.name.replace(/\.[^/.]+$/, ""));

        const res = await fetch("/api/media", {
          method: "POST",
          headers: {
            "x-requested-with": "ret-admin",
          },
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error?.message || `Failed to upload ${file.name}`);
          continue;
        }

        if (data.media) {
          uploadedList.push({
            _id: data.media._id,
            url: data.media.url,
            altText: data.media.altText,
            caption: data.media.caption,
          });
        }
      }

      if (uploadedList.length > 0) {
        onChange([...images, ...uploadedList]);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Network error while uploading images");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const moveImage = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    onChange(updated);
  };

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  };

  const updateMetadata = (index: number, field: "caption" | "altText", value: string) => {
    const updated = [...images];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons: Choose from Library OR Direct Upload */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
        <div className="text-center sm:text-left">
          <h3 className="text-xs font-bold text-slate-900">Add Infographic Diagrams</h3>
          <p className="text-[11px] text-slate-500">Pick from existing media library or upload new files</p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsPickerOpen(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-sm"
          >
            <ImageIcon className="w-4 h-4 text-amber-600" />
            <span>Select from Library</span>
          </button>

          <label className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-sm cursor-pointer">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UploadCloud className="w-4 h-4" />
            )}
            <span>{uploading ? "Uploading..." : "Upload New"}</span>
          </label>
        </div>
      </div>

      <MediaPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleSelectFromLibrary}
        acceptedType="image"
        title="Select Infographic for Note"
      />

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 flex items-start gap-2 text-xs text-red-800">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Ordered Image List */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider px-1">
            <span>Ordered Images ({images.length})</span>
            <span className="text-[11px] lowercase text-slate-400">Order is preserved</span>
          </div>

          <div className="space-y-3">
            {images.map((img, index) => (
              <div
                key={img._id + "-" + index}
                className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4 group"
              >
                {/* Index badge & Reorder controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveImage(index, "up")}
                      disabled={index === 0}
                      className="p-1 text-slate-400 hover:text-slate-900 disabled:opacity-20 rounded hover:bg-slate-100 transition-colors"
                      title="Move up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage(index, "down")}
                      disabled={index === images.length - 1}
                      className="p-1 text-slate-400 hover:text-slate-900 disabled:opacity-20 rounded hover:bg-slate-100 transition-colors"
                      title="Move down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Image Thumbnail */}
                <div className="w-20 h-16 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.altText || "Note Image"}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Caption & Alt Text Inputs */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Alt Text (SEO / Accessibility)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Map of Rajasthan Divisions"
                      value={img.altText || ""}
                      onChange={(e) => updateMetadata(index, "altText", e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Display Caption (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Figure 1.2: Mineral distribution"
                      value={img.caption || ""}
                      onChange={(e) => updateMetadata(index, "caption", e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors self-end sm:self-center shrink-0"
                  title="Remove image from note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
