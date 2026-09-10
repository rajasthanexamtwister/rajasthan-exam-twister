"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { FolderTree, Plus, Edit2, Trash2, Loader2, AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";

interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [nameInput, setNameInput] = useState("");
  const [slugInput, setSlugInput] = useState("");
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [editName, setEditName] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    try {
      setActionLoading(true);
      setError(null);
      const res = await fetch("/api/categories", {
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
        setError(data.error?.message || "Failed to create category");
        return;
      }

      setNameInput("");
      setSlugInput("");
      await fetchCategories();
    } catch (err) {
      console.error("Create category error:", err);
      setError("Network error while creating category");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editName.trim()) return;

    try {
      setActionLoading(true);
      setError(null);
      const res = await fetch(`/api/categories/${editingCategory._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-requested-with": "ret-admin",
        },
        body: JSON.stringify({ name: editName.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || "Failed to update category");
        return;
      }

      setEditingCategory(null);
      setEditName("");
      await fetchCategories();
    } catch (err) {
      console.error("Update category error:", err);
      setError("Network error while updating category");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      setActionLoading(true);
      setError(null);
      const res = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
        headers: { "x-requested-with": "ret-admin" },
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || "Failed to delete category");
        return;
      }

      await fetchCategories();
    } catch (err) {
      console.error("Delete category error:", err);
      setError("Network error while deleting category");
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
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
              Taxonomy
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {categories.length} categories
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Exam Categories</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize blogs and revision notes by exam syllabus topics (REET, RPSC, CET, GK, etc.)
          </p>
        </div>

        <button
          onClick={() => fetchCategories()}
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

      {/* Grid: Create Form & Categories List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Create Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Plus className="w-4 h-4 text-amber-600" />
            Add New Category
          </h2>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Rajasthan History"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                required
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Custom Slug (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. rajasthan-history"
                value={slugInput}
                onChange={(e) => setSlugInput(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={actionLoading || !nameInput.trim()}
              className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Create Category</span>
            </button>
          </form>
        </div>

        {/* Categories List */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Existing Categories
            </h2>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="py-16 text-center px-4">
              <FolderTree className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">No categories added yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {categories.map((cat) => (
                <li
                  key={cat._id}
                  className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
                >
                  {editingCategory?._id === cat._id ? (
                    <form onSubmit={handleUpdate} className="flex-1 flex items-center gap-2 mr-3">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 text-xs p-1.5 border border-amber-500 rounded-lg focus:outline-none bg-white"
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="px-2.5 py-1.5 bg-amber-500 text-slate-950 text-xs font-bold rounded-lg shadow-sm"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCategory(null)}
                        className="px-2.5 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg"
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <div>
                      <div className="font-bold text-sm text-slate-900">{cat.name}</div>
                      <div className="text-xs font-mono text-slate-400">/{cat.slug}</div>
                    </div>
                  )}

                  {!editingCategory || editingCategory._id !== cat._id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategory(cat);
                          setEditName(cat.name);
                        }}
                        className="p-1.5 text-slate-500 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition-colors"
                        title="Rename category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat._id)}
                        disabled={actionLoading}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete category (blocked if in use)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
