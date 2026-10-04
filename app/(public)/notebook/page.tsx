"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Star, Trash2, BookOpen, HelpCircle, ArrowRight, CheckCircle2, XCircle, Sparkles, Share2 } from "lucide-react";
import { BookmarkedItem, getBookmarkedItems, saveBookmarkedItems } from "@/components/public/bookmark-button";
import { DailyGoalWidget } from "@/components/public/daily-goal-widget";

export default function PersonalNotebookPage() {
  const [items, setItems] = useState<BookmarkedItem[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "quiz_question" | "note">("all");
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});

  useEffect(() => {
    setItems(getBookmarkedItems());
  }, []);

  const handleRemove = (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    saveBookmarkedItems(updated);
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear your saved revision notebook?")) {
      setItems([]);
      saveBookmarkedItems([]);
    }
  };

  const filteredItems = items.filter((i) => {
    if (activeTab === "all") return true;
    return i.type === activeTab;
  });

  const questionCount = items.filter((i) => i.type === "quiz_question").length;
  const noteCount = items.filter((i) => i.type === "note").length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Student Daily & Weekly Goal Tracker */}
      <DailyGoalWidget />

      {/* Header */}
      <header className="space-y-4 border-b border-amber-200/80 pb-8 text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span>My Personal Revision Notebook</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B132B] tracking-tight">
              मेरा पर्सनल रिवीज़न नोटबुक
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              आपकी कठिन प्रश्नोत्तरी एवं रिवीज़न नोट्स का व्यक्तिगत संकलन। परीक्षा से पूर्व तुरंत दोहराएं।
            </p>
          </div>

          {items.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Notebook</span>
            </button>
          )}
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 pt-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              activeTab === "all"
                ? "bg-[#0B132B] text-white border-[#0B132B] shadow-xs"
                : "bg-white text-slate-700 border-slate-200 hover:border-amber-300"
            }`}
          >
            All Saved ({items.length})
          </button>
          <button
            onClick={() => setActiveTab("quiz_question")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
              activeTab === "quiz_question"
                ? "bg-[#0B132B] text-white border-[#0B132B] shadow-xs"
                : "bg-white text-slate-700 border-slate-200 hover:border-amber-300"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>Saved Questions ({questionCount})</span>
          </button>
          <button
            onClick={() => setActiveTab("note")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
              activeTab === "note"
                ? "bg-[#0B132B] text-white border-[#0B132B] shadow-xs"
                : "bg-white text-slate-700 border-slate-200 hover:border-amber-300"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-500" />
            <span>Saved Notes ({noteCount})</span>
          </button>
        </div>
      </header>

      {/* Main Notebook Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-8 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
            <Star className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">आपका नोटबुक खाली है</h2>
            <p className="text-xs text-slate-600 font-medium max-w-sm mx-auto">
              क्वििज़ या नोट्स पढ़ते समय ⭐ **Save to Notebook** पर क्लिक करें ताकि कठिन प्रश्न यहाँ इकट्ठा हों।
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              href="/quizzes"
              className="px-4 py-2 text-xs font-extrabold text-white bg-amber-700 hover:bg-amber-800 rounded-xl transition-all shadow-xs"
            >
              Explore Quizzes
            </Link>
            <Link
              href="/notes"
              className="px-4 py-2 text-xs font-extrabold text-slate-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition-all"
            >
              Browse Notes
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredItems.map((item, idx) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-6 border border-amber-200/80 shadow-xs space-y-4 relative group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                    {item.type === "quiz_question" ? "Question" : "Revision Note"}
                  </span>
                  {item.category && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                      {item.category}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleRemove(item.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Remove from notebook"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {item.type === "quiz_question" && item.options ? (
                <div className="space-y-4">
                  <h3 className="font-bold text-base text-slate-900 leading-relaxed font-devanagari">
                    {item.questionText || item.title}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {item.options.map((opt, optIdx) => {
                      const isChosen = selectedAnswers[item.id] === optIdx;
                      const isCorrect = item.correctOptionIndex === optIdx;

                      let btnStyle = "bg-slate-50 border-slate-200 text-slate-800 hover:border-amber-300";
                      if (selectedAnswers[item.id] !== undefined) {
                        if (isCorrect) {
                          btnStyle = "bg-emerald-50 border-emerald-400 text-emerald-950 font-bold";
                        } else if (isChosen && !isCorrect) {
                          btnStyle = "bg-rose-50 border-rose-400 text-rose-950 font-bold";
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() =>
                            setSelectedAnswers((prev) => ({
                              ...prev,
                              [item.id]: optIdx,
                            }))
                          }
                          className={`p-3 rounded-2xl text-xs text-left border transition-all flex items-start gap-2.5 ${btnStyle}`}
                        >
                          <span className="w-5 h-5 rounded-md bg-white/80 border border-slate-200 text-slate-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="leading-snug">{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {selectedAnswers[item.id] !== undefined && item.explanation && (
                    <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-slate-800 space-y-1">
                      <span className="font-bold text-amber-900 block">उत्तर व्याख्या (Explanation):</span>
                      <p className="leading-relaxed text-slate-700">{item.explanation}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <h3 className="font-bold text-base text-slate-900">
                    <Link href={item.url} className="hover:text-amber-700 transition-colors">
                      {item.title}
                    </Link>
                  </h3>
                  {item.excerpt && (
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {item.excerpt}
                    </p>
                  )}
                  <div className="pt-2 flex items-center justify-between">
                    <Link
                      href={item.url}
                      className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1"
                    >
                      <span>Read Full Note</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
