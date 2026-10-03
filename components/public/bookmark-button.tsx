"use client";

import { useState, useEffect } from "react";
import { Star, Check } from "lucide-react";

export interface BookmarkedItem {
  id: string;
  type: "quiz_question" | "note";
  title: string;
  url: string;
  excerpt?: string;
  category?: string;
  savedAt: string;
  questionText?: string;
  options?: string[];
  correctOptionIndex?: number;
  explanation?: string;
}

const STORAGE_KEY = "ret_saved_notebook_items";

export function getBookmarkedItems(): BookmarkedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBookmarkedItems(items: BookmarkedItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error("Failed to save notebook items:", err);
  }
}

interface BookmarkButtonProps {
  item: Omit<BookmarkedItem, "savedAt">;
  className?: string;
  compact?: boolean;
}

export function BookmarkButton({ item, className = "", compact = false }: BookmarkButtonProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    const existing = getBookmarkedItems();
    setIsSaved(existing.some((i) => i.id === item.id));
  }, [item.id]);

  const toggleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const existing = getBookmarkedItems();
    if (isSaved) {
      const updated = existing.filter((i) => i.id !== item.id);
      saveBookmarkedItems(updated);
      setIsSaved(false);
    } else {
      const newItem: BookmarkedItem = {
        ...item,
        savedAt: new Date().toISOString(),
      };
      saveBookmarkedItems([newItem, ...existing]);
      setIsSaved(true);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    }
  };

  if (compact) {
    return (
      <button
        onClick={toggleBookmark}
        className={`p-1.5 rounded-lg transition-all ${
          isSaved
            ? "bg-amber-100 text-amber-700 border border-amber-300"
            : "text-slate-400 hover:text-amber-600 hover:bg-slate-100"
        } ${className}`}
        title={isSaved ? "Saved in Notebook (Click to remove)" : "Save to My Revision Notebook"}
        aria-label="Bookmark question"
      >
        <Star className={`w-4 h-4 ${isSaved ? "fill-amber-500 text-amber-500" : ""}`} />
      </button>
    );
  }

  return (
    <button
      onClick={toggleBookmark}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border shadow-xs ${
        isSaved
          ? "bg-amber-500 text-[#0B132B] border-amber-400 font-bold"
          : "bg-white text-slate-700 border-slate-200 hover:border-amber-400 hover:text-amber-800"
      } ${className}`}
    >
      <Star className={`w-3.5 h-3.5 ${isSaved ? "fill-[#0B132B] text-[#0B132B]" : "text-amber-600"}`} />
      <span>{isSaved ? (justSaved ? "Saved in Notebook!" : "Bookmarked") : "Save to Notebook"}</span>
      {justSaved && <Check className="w-3.5 h-3.5 text-emerald-900" />}
    </button>
  );
}
