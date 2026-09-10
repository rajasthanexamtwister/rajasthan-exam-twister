"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Tag as TagIcon, Plus, Trash2, Loader2, AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";

interface TagItem {
  _id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export default function AdminTagsPage() {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [nameInput, setNameInput] = useState("");
  const [slugInput, setSlugInput] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/tags");
      if (res.ok) {
        const data = await res.json();
        setTags(data.tags || []);
      }
    } catch (err) {
      console.error("Failed to fetch tags:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    try {
      setActionLoading(true);
      setError(null);
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-requested-with": "ret-admin",
        },
        body: JSON.stringify({
          name: nameInput.trim(),
          slug: slugInput.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || "Failed to create tag");
        return;
      }

      setNameInput("");
      setSlugInput("");
      await fetchTags();
    } catch (err) {
      console.error("Create tag error:", err);
      setError("Network error while creating tag");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tag? It will be automatically detached from all blogs and notes.")) return;

    try {
      setActionLoading(true);
      setError(null);
      const res = await fetch(`/api/tags/${id}`, {
        method: "DELETE",
        headers: { "x-requested-with": "ret-admin" },
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || "Failed to delete tag");
        return;
      }

      await fetchTags();
    } catch (err) {
      console.error("Delete tag error:", err);
      setError("Network error while deleting tag");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Dashboard
            </Link>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
              Taxonomy
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {tags.length} tags
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Topic Tags</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Freeform keywords and topics attached to exam notes and articles
          </p>
        </div>

        <button
          onClick={() => fetchTags()}
          className="p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors self-start sm:self-auto"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-red-800 font-medium">{error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Create Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-600" />
            Add New Tag
          </h2>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tag Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Current Affairs 2026"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                required
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Custom Slug (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. current-affairs-2026"
                value={slugInput}
                onChange={(e) => setSlugInput(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={actionLoading || !nameInput.trim()}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Create Tag</span>
            </button>
          </form>
        </div>

        {/* Tags List */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Available Tags
          </h2>

          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Loading tags...</p>
            </div>
          ) : tags.length === 0 ? (
            <div className="py-16 text-center px-4">
              <TagIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">No tags created yet</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {tags.map((tag) => (
                <div
                  key={tag._id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all text-xs font-medium text-slate-800 group"
                >
                  <TagIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                  <span>{tag.name}</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(tag._id)}
                    disabled={actionLoading}
                    className="text-slate-400 hover:text-red-600 p-0.5 rounded transition-colors"
                    title="Delete tag"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
