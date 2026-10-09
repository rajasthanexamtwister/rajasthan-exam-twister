"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Sparkles,
  Download,
  Copy,
  Check,
  Share2,
  Twitter,
  Instagram,
  Music,
  Calendar,
  Layers,
  History,
  CheckCircle2,
  ExternalLink,
  PlusCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Send,
  Eye,
  FileText,
  Trash2,
  Cloud,
  AlertTriangle,
  Zap,
  Database,
  CheckCheck,
} from "lucide-react";
import { SocialCanvasPreview } from "@/components/admin/social-canvas-preview";

interface Option {
  key: string;
  text: string;
  isCorrect?: boolean;
}

interface Song {
  title: string;
  mood: string;
  tag: string;
}

interface PostItem {
  id: string;
  date: string;
  examName: string;
  subject: string;
  topic: string;
  questionText: string;
  questionTextEn?: string;
  options: Option[];
  correctOption: string;
  explanation: string;
  instagramImageUrl: string;
  twitterImageUrl: string;
  cloudinaryReelPublicId?: string;
  cloudinaryTwitterPublicId?: string;
  instagramCaption: string;
  pinnedComment: string;
  suggestedSongs: Song[];
  tweetText: string;
  status: {
    instagramUploaded: boolean;
    instagramUploadedAt: string | null;
    twitterPosted: boolean;
    twitterPostedAt: string | null;
  };
  createdAt: string;
}

interface StorageStats {
  total: number;
  unuploaded: number;
  fullyUploaded: number;
  cloudinaryConfigured: boolean;
  warning: string | null;
  hasUnuploadedBacklog: boolean;
  storageLimitReached: boolean;
}

export default function SocialStudioPage() {
  const [history, setHistory] = useState<PostItem[]>([]);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [activePost, setActivePost] = useState<PostItem | null>(null);
  const [activeTab, setActiveTab] = useState<"instagram" | "twitter" | "history">("instagram");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncingCloudinary, setSyncingCloudinary] = useState(false);
  const [cleaningUp, setCleaningUp] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  // Form state for creating a new daily question
  const [newForm, setNewForm] = useState({
    examName: "Rajasthan CET (Sr. Secondary) 2024",
    subject: "सामान्य हिंदी / Hindi Grammar",
    topic: "संधि व समास",
    questionText: "‘प्रत्येक’ शब्द का सही संधि-विच्छेद क्या होगा?",
    questionTextEn: "What is the correct Sandhi-Vichhed for the word 'Pratyek'?",
    optA: "प्रति + एक",
    optB: "प्र + त्येक",
    optC: "प्रत्य + एक",
    optD: "प्रती + एक",
    correctOption: "A",
    explanation: "‘प्रत्येक’ में यण संधि है। प्रति + एक मिलकर प्रत्येक बनता है (इ + ए = ये)।",
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/social-studio");
      const data = await res.json();
      if (data.success) {
        setHistory(data.history || []);
        if (data.history?.length) {
          setActivePost(data.history[0]);
        }
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error("Failed to load social history", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleCopyText = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleCopyImage = async (imgUrl: string, fieldName: string) => {
    try {
      const response = await fetch(imgUrl);
      const blob = await response.blob();
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob,
          }),
        ]);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2500);
      } catch (err) {
        handleDownloadImage(imgUrl, `${fieldName}.jpg`);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2500);
      }
    } catch (err) {
      console.error("Error copying image:", err);
    }
  };

  const handleDownloadImage = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleStatus = async (id: string, platform: "instagram" | "twitter", currentValue: boolean) => {
    const newValue = !currentValue;

    // Optimistic UI update for instantaneous button responsiveness
    setHistory((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const status = { ...item.status };
        if (platform === "instagram") {
          status.instagramUploaded = newValue;
          status.instagramUploadedAt = newValue ? new Date().toISOString() : null;
        } else {
          status.twitterPosted = newValue;
          status.twitterPostedAt = newValue ? new Date().toISOString() : null;
        }
        return { ...item, status };
      })
    );

    if (activePost?.id === id) {
      setActivePost((prev) => {
        if (!prev) return null;
        const status = { ...prev.status };
        if (platform === "instagram") {
          status.instagramUploaded = newValue;
          status.instagramUploadedAt = newValue ? new Date().toISOString() : null;
        } else {
          status.twitterPosted = newValue;
          status.twitterPostedAt = newValue ? new Date().toISOString() : null;
        }
        return { ...prev, status };
      });
    }

    // Sequential Workflow Progression:
    if (newValue === true) {
      if (platform === "instagram") {
        // Step 1: After marking Instagram done -> Switch to Twitter for the same question
        setActiveTab("twitter");
        showToast("✅ Instagram पर मार्क हो गया! अब X (Twitter) पर पोस्ट करें 🚀");
      } else if (platform === "twitter") {
        // Step 2: After marking Twitter done -> Load next question and go to Instagram tab
        const currentIndex = history.findIndex((item) => item.id === id);
        if (currentIndex !== -1 && currentIndex + 1 < history.length) {
          const nextPost = history[currentIndex + 1];
          setActivePost(nextPost);
          setActiveTab("instagram");
          showToast(`🎉 सवाल #${currentIndex + 1} पूरा हुआ! अगला सवाल #${currentIndex + 2} लोड हो गया ➡️`);
        } else {
          showToast("🏆 बधाई हो! सभी सवाल सफलतापूर्वक अपलोड हो चुके हैं!");
        }
      }
    }

    try {
      const res = await fetch("/api/admin/social-studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          id,
          platform,
          value: newValue,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setHistory((prev) => prev.map((item) => (item.id === id ? data.item : item)));
        if (activePost?.id === id && platform !== "twitter") {
          setActivePost(data.item);
        }
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  // Sync to Cloudinary
  const handleSyncCloudinary = async () => {
    try {
      setSyncingCloudinary(true);
      const res = await fetch("/api/admin/social-studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync_cloudinary" }),
      });
      const data = await res.json();
      if (data.success) {
        setHistory(data.history);
        if (data.stats) setStats(data.stats);
        if (activePost) {
          const updatedActive = data.history.find((h: PostItem) => h.id === activePost.id);
          if (updatedActive) setActivePost(updatedActive);
        }
        showToast(data.message || "Cloudinary sync complete!");
      } else {
        alert(data.error || "Failed to sync with Cloudinary.");
      }
    } catch (err: any) {
      alert("Cloudinary sync error: " + err.message);
    } finally {
      setSyncingCloudinary(false);
    }
  };

  // Auto-Cleanup already uploaded images
  const handleCleanupUploaded = async () => {
    if (
      !confirm(
        "क्या आप वाकई उन सभी प्रश्नों की इमेजेस क्लाउड और डिस्क से हटाना चाहते हैं जो Instagram और Twitter पर अपलोड हो चुके हैं?"
      )
    ) {
      return;
    }
    try {
      setCleaningUp(true);
      const res = await fetch("/api/admin/social-studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cleanup_uploaded" }),
      });
      const data = await res.json();
      if (data.success) {
        setHistory(data.history);
        if (data.stats) setStats(data.stats);
        if (data.history.length > 0) {
          setActivePost(data.history[0]);
        } else {
          setActivePost(null);
        }
        showToast(data.message || "Cleaned up uploaded media successfully!");
      }
    } catch (err: any) {
      alert("Cleanup error: " + err.message);
    } finally {
      setCleaningUp(false);
    }
  };

  const handleDeleteItem = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("Are you sure you want to delete this question kit?")) return;
    try {
      const res = await fetch("/api/admin/social-studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_item", id }),
      });
      const data = await res.json();
      if (data.success) {
        setHistory(data.history);
        if (data.stats) setStats(data.stats);
        if (activePost?.id === id) {
          setActivePost(data.history[0] || null);
        }
      }
    } catch (err) {
      console.error("Failed to delete item", err);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm("Are you sure you want to delete all saved question kits and free all storage?")) return;
    try {
      const res = await fetch("/api/admin/social-studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_all" }),
      });
      const data = await res.json();
      if (data.success) {
        setHistory([]);
        if (data.stats) setStats(data.stats);
        setActivePost(null);
      }
    } catch (err) {
      console.error("Failed to delete all items", err);
    }
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/social-studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_custom",
          examName: newForm.examName,
          subject: newForm.subject,
          topic: newForm.topic,
          questionText: newForm.questionText,
          questionTextEn: newForm.questionTextEn,
          options: [
            { key: "A", text: newForm.optA },
            { key: "B", text: newForm.optB },
            { key: "C", text: newForm.optC },
            { key: "D", text: newForm.optD },
          ],
          correctOption: newForm.correctOption,
          explanation: newForm.explanation,
          force: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setHistory((prev) => [data.item, ...prev]);
        if (data.stats) setStats(data.stats);
        setActivePost(data.item);
        setShowNewModal(false);
        showToast("✨ नया सवाल सोशल स्टूडियो में जुड़ गया!");
      } else if (data.needsConfirmation) {
        alert(data.warning);
      }
    } catch (err) {
      console.error("Failed to create post", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-sm font-medium text-slate-600">Loading Social Studio & Storage Status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-amber-500/40 text-xs font-semibold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-4 sm:p-6 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-slate-950 flex items-center gap-1 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" /> AI Daily Studio
            </span>
            <span className="text-xs text-slate-400">CET & Rajasthan Exam Twister</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                stats?.cloudinaryConfigured
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              }`}
            >
              <Cloud className="w-3 h-3" />
              {stats?.cloudinaryConfigured ? "Cloudinary CDN Active" : "Local Storage Mode"}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Today&apos;s Question & Social Media Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Auto-generator with Cloudinary CDN hosting, 1-click Instagram Reel (9:16) & Twitter Cards, and automatic storage lifecycle cleanup.
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={handleSyncCloudinary}
            disabled={syncingCloudinary}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all active:scale-95"
            title="Upload all images to Cloudinary CDN"
          >
            <Cloud className={`w-3.5 h-3.5 ${syncingCloudinary ? "animate-spin" : ""}`} />
            <span>{syncingCloudinary ? "Syncing..." : "Sync Cloudinary"}</span>
          </button>

          {stats && stats.fullyUploaded > 0 && (
            <button
              onClick={handleCleanupUploaded}
              disabled={cleaningUp}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-600 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              title="Delete uploaded images from Cloudinary & disk to save space"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{cleaningUp ? "Cleaning..." : `Clean Uploaded (${stats.fullyUploaded})`}</span>
            </button>
          )}

          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Generate New</span>
          </button>
        </div>
      </div>

      {/* STORAGE & UNUPLOADED WARNING BANNER */}
      {stats && stats.hasUnuploadedBacklog && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-sm">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                <span>⚠️ ध्यान दें: {stats.unuploaded} प्रश्न अपलोड होना बाकी हैं!</span>
                <span className="text-xs font-semibold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                  Pending Upload
                </span>
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                पुराने प्रश्नों को Instagram और Twitter पर पोस्ट करके <b>&apos;Mark Uploaded&apos;</b> करें। नए सवाल जनरेट करते समय स्टोरेज और डेटा को सुरक्षित रखने के लिए यह ज़रूरी है।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <span className="text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-amber-200">
              Total: {stats.total} | Uploaded: {stats.fullyUploaded}
            </span>
          </div>
        </div>
      )}

      {/* Active Question Info Strip */}
      {activePost && (
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-base shrink-0 border border-amber-200">
              Q{history.findIndex((h) => h.id === activePost.id) + 1}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 font-medium mb-0.5">
                <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                  {activePost.examName}
                </span>
                <span>•</span>
                <span>{activePost.subject}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> {activePost.date}
                </span>
                {activePost.instagramImageUrl.startsWith("http") && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                    <Cloud className="w-2.5 h-2.5" /> Cloud CDN
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-slate-800 line-clamp-1">
                {activePost.questionText}
              </p>
            </div>
          </div>

          {/* Quick Upload Status Indicators */}
          <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <button
              onClick={() =>
                handleToggleStatus(activePost.id, "instagram", activePost.status.instagramUploaded)
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                activePost.status.instagramUploaded
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Instagram className="w-3.5 h-3.5" />
              <span>{activePost.status.instagramUploaded ? "Uploaded on Insta ✓" : "Mark Uploaded"}</span>
            </button>

            <button
              onClick={() =>
                handleToggleStatus(activePost.id, "twitter", activePost.status.twitterPosted)
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                activePost.status.twitterPosted
                  ? "bg-blue-50 text-blue-700 border-blue-300 shadow-sm"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Twitter className="w-3.5 h-3.5" />
              <span>{activePost.status.twitterPosted ? "Posted on X ✓" : "Mark Posted"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white p-1.5 rounded-xl shadow-sm">
        <button
          onClick={() => setActiveTab("instagram")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all ${
            activeTab === "instagram"
              ? "bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white shadow-md shadow-rose-500/20"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Instagram className="w-4 h-4" />
          <span>Instagram Reel Kit (9:16)</span>
        </button>

        <button
          onClick={() => setActiveTab("twitter")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all ${
            activeTab === "twitter"
              ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Twitter className="w-4 h-4" />
          <span>X / Twitter Pack</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all ${
            activeTab === "history"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Archives & History ({history.length})</span>
        </button>
      </div>

      {/* MAIN CONTENT AREA */}
      {activePost && (
        <>
          {/* TAB 1: INSTAGRAM REEL (9:16) */}
          {activeTab === "instagram" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: 9:16 AI Image Preview & Download */}
              <div className="lg:col-span-5 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Reel / Story (9:16)
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    1080 × 1920 HD
                  </span>
                </div>

                {/* 9:16 Phone Mockup Container */}
                <div className="relative w-full max-w-[290px] aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-900 bg-slate-950">
                  <Image
                    src={activePost.instagramImageUrl}
                    alt="Instagram Reel Question"
                    fill
                    unoptimized
                    className="object-cover object-center"
                    priority
                  />
                </div>

                {/* Direct Action Buttons Under Image */}
                <div className="w-full grid grid-cols-2 gap-2 mt-4">
                  <button
                    onClick={() =>
                      handleDownloadImage(
                        activePost.instagramImageUrl,
                        `CET_Reel_${activePost.date.replace(/ /g, "_")}.jpg`
                      )
                    }
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow transition-all active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download (9:16)</span>
                  </button>

                  <button
                    onClick={() => handleCopyImage(activePost.instagramImageUrl, "instaImage")}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-bold shadow transition-all active:scale-95"
                  >
                    {copiedField === "instaImage" ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span>{copiedField === "instaImage" ? "Copied!" : "Copy Image"}</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Captions, Pinned Comment & Suggested Audio */}
              <div className="lg:col-span-7 space-y-4">
                {/* 1. Instagram Caption Card */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Instagram className="w-4 h-4 text-rose-500" />
                      <h3 className="text-sm font-bold text-slate-900">Instagram Reel Caption</h3>
                    </div>
                    <button
                      onClick={() => handleCopyText(activePost.instagramCaption, "instaCaption")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold border border-rose-200 transition-colors"
                    >
                      {copiedField === "instaCaption" ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedField === "instaCaption" ? "Copied!" : "Copy Caption"}</span>
                    </button>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 font-sans whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                    {activePost.instagramCaption}
                  </div>
                </div>

                {/* 2. Pinned Comment Card (Answer Reveal) */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <h3 className="text-sm font-bold text-slate-900">
                        Pinned First Comment (Answer Reveal)
                      </h3>
                    </div>
                    <button
                      onClick={() => handleCopyText(activePost.pinnedComment, "pinnedComment")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-bold border border-amber-200 transition-colors"
                    >
                      {copiedField === "pinnedComment" ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedField === "pinnedComment" ? "Copied!" : "Copy Pinned Comment"}</span>
                    </button>
                  </div>

                  <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3.5 text-xs text-slate-800 font-sans whitespace-pre-wrap leading-relaxed">
                    {activePost.pinnedComment}
                  </div>
                </div>

                {/* 3. Recommended Songs / Audio */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Music className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Trending / Matching Audio Suggestions
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {activePost.suggestedSongs.map((song, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-indigo-300 transition-all group"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {song.title}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 block truncate">
                            {song.mood}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopyText(song.title, `song_${idx}`)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors shrink-0"
                          title="Copy Song Name"
                        >
                          {copiedField === `song_${idx}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Upload Checklist Banner */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-emerald-950">
                        Instagram Upload Status
                      </h4>
                      <p className="text-[11px] sm:text-xs text-emerald-800">
                        {activePost.status.instagramUploaded
                          ? `Uploaded on Instagram • ${new Date(
                              activePost.status.instagramUploadedAt || ""
                            ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                          : "Ready to be published on @RajasthanExamTwister"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      handleToggleStatus(activePost.id, "instagram", activePost.status.instagramUploaded)
                    }
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      activePost.status.instagramUploaded
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20"
                    }`}
                  >
                    {activePost.status.instagramUploaded ? "Mark Pending" : "Mark as Uploaded ✓"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: X (TWITTER) PACK */}
          {activeTab === "twitter" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Twitter Card Preview */}
              <div className="lg:col-span-5 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Twitter className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      X / Twitter Card
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    Cropped Focus (1:1)
                  </span>
                </div>

                {/* Twitter Mockup Card */}
                <div className="w-full rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-slate-900 p-3 text-white space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                      RET
                    </div>
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1">
                        Rajasthan Exam Twister <span className="text-blue-400">✓</span>
                      </div>
                      <div className="text-[10px] text-slate-400">@ExamTwisterRJ</div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {activePost.tweetText || activePost.instagramCaption || ""}
                  </p>

                  <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                    <Image
                      src={activePost.twitterImageUrl || activePost.instagramImageUrl}
                      alt="Twitter Question Card"
                      fill
                      unoptimized
                      className="object-cover object-center"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="w-full grid grid-cols-2 gap-2 mt-4">
                  <button
                    onClick={() =>
                      handleDownloadImage(
                        activePost.twitterImageUrl || activePost.instagramImageUrl,
                        `Twitter_CET_${activePost.date.replace(/ /g, "_")}.jpg`
                      )
                    }
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow transition-all active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Image</span>
                  </button>

                  <button
                    onClick={() =>
                      handleCopyImage(
                        activePost.twitterImageUrl || activePost.instagramImageUrl,
                        "twitterImage"
                      )
                    }
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-xs sm:text-sm font-bold shadow transition-all active:scale-95"
                  >
                    {copiedField === "twitterImage" ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span>{copiedField === "twitterImage" ? "Copied!" : "Copy Image"}</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Tweet Copy & Actions */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Twitter className="w-4 h-4 text-blue-500" />
                      <h3 className="text-sm font-bold text-slate-900">Tailored Tweet Copy</h3>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      {(activePost.tweetText || "").length} / 280 chars
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 font-sans whitespace-pre-wrap leading-relaxed min-h-[140px]">
                    {activePost.tweetText || activePost.instagramCaption || ""}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 mt-4">
                    <button
                      onClick={() => handleCopyText(activePost.tweetText || activePost.instagramCaption || "", "tweetText")}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow transition-all active:scale-95"
                    >
                      {copiedField === "tweetText" ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      <span>{copiedField === "tweetText" ? "Copied to Clipboard!" : "Copy Tweet Copy"}</span>
                    </button>

                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                        activePost.tweetText || activePost.instagramCaption || ""
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                    >
                      <Send className="w-4 h-4" />
                      <span>Open & Post on X ↗</span>
                    </a>
                  </div>
                </div>

                {/* Twitter Status Toggle */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                      <Twitter className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-blue-950">
                        X (Twitter) Publishing Status
                      </h4>
                      <p className="text-[11px] sm:text-xs text-blue-800">
                        {activePost.status.twitterPosted
                          ? `Posted on X (Twitter) • ${new Date(
                              activePost.status.twitterPostedAt || ""
                            ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                          : "Not posted yet on Twitter"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      handleToggleStatus(activePost.id, "twitter", activePost.status.twitterPosted)
                    }
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      activePost.status.twitterPosted
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-600/20"
                    }`}
                  >
                    {activePost.status.twitterPosted ? "Mark Pending" : "Mark as Posted ✓"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HISTORY & ARCHIVES */}
          {activeTab === "history" && (
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Generated Questions & Upload Log
                  </h3>
                  <p className="text-xs text-slate-500">
                    Track all questions previously created, their Cloud CDN state, and upload status.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                    Total: {history.length}
                  </span>
                  {stats && stats.unuploaded > 0 && (
                    <span className="text-xs font-bold bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
                      Pending: {stats.unuploaded}
                    </span>
                  )}
                  {stats && stats.fullyUploaded > 0 && (
                    <button
                      onClick={handleCleanupUploaded}
                      disabled={cleaningUp}
                      className="px-3 py-1 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Auto-Clean Uploaded ({stats.fullyUploaded})
                    </button>
                  )}
                  {history.length > 0 && (
                    <button
                      onClick={handleDeleteAll}
                      className="px-3 py-1 rounded-lg text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Clear All
                    </button>
                  )}
                </div>
              </div>

              {history.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No question kits in history. Click &quot;+ Generate New&quot; to create one!
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {history.map((post, pIdx) => (
                    <div
                      key={post.id}
                      className={`py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                        activePost?.id === post.id ? "bg-amber-50/50 -mx-4 px-4 rounded-xl" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative w-12 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-900 shrink-0">
                          <Image
                            src={post.instagramImageUrl}
                            alt="Thumbnail"
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 mb-1">
                            <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                              Q{pIdx + 1} • {post.date}
                            </span>
                            <span>•</span>
                            <span className="text-amber-700 font-medium">{post.examName}</span>
                            <span>•</span>
                            <span>{post.subject}</span>
                            {post.instagramImageUrl.startsWith("http") && (
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 flex items-center gap-0.5">
                                <Cloud className="w-2.5 h-2.5" /> CDN
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-slate-900">{post.questionText}</h4>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleStatus(post.id, "instagram", post.status?.instagramUploaded || false);
                              }}
                              title="Click to toggle Instagram uploaded status"
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm ${
                                post.status?.instagramUploaded
                                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                  : "bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300"
                              }`}
                            >
                              <Instagram className="w-3 h-3" />
                              {post.status?.instagramUploaded ? "Insta Uploaded ✓" : "Mark Insta Uploaded"}
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleStatus(post.id, "twitter", post.status?.twitterPosted || false);
                              }}
                              title="Click to toggle Twitter posted status"
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm ${
                                post.status?.twitterPosted
                                  ? "bg-blue-600 text-white hover:bg-blue-700"
                                  : "bg-sky-100 text-sky-900 hover:bg-sky-200 border border-sky-300"
                              }`}
                            >
                              <Twitter className="w-3 h-3" />
                              {post.status?.twitterPosted ? "X Posted ✓" : "Mark X Posted"}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                        <button
                          onClick={() => {
                            setActivePost(post);
                            setActiveTab("instagram");
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Kit
                        </button>
                        <button
                          onClick={(e) => handleDeleteItem(post.id, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Kit"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* CREATE NEW QUESTION MODAL */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">
                  Generate Daily Social Media Kit
                </h3>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* In-modal Warning if Backlog Exists */}
            {stats && stats.hasUnuploadedBacklog && (
              <div className="mb-3.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">चेतावनी: {stats.unuploaded} प्रश्न अभी अपलोड होने बाकी हैं!</p>
                  <p className="text-[11px] text-amber-800">
                    नया सवाल जोड़ने पर भी पुराना अन-अपलोड डेटा सुरक्षित रहेगा। कृपया अपलोड होने के बाद &apos;Mark Uploaded&apos; अवश्य करें।
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateNew} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Exam / Category
                </label>
                <input
                  type="text"
                  value={newForm.examName}
                  onChange={(e) => setNewForm({ ...newForm, examName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={newForm.subject}
                    onChange={(e) => setNewForm({ ...newForm, subject: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Topic</label>
                  <input
                    type="text"
                    value={newForm.topic}
                    onChange={(e) => setNewForm({ ...newForm, topic: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Question (हिंदी)
                </label>
                <textarea
                  rows={2}
                  value={newForm.questionText}
                  onChange={(e) => setNewForm({ ...newForm, questionText: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Option (A)</label>
                  <input
                    type="text"
                    value={newForm.optA}
                    onChange={(e) => setNewForm({ ...newForm, optA: e.target.value })}
                    className="w-full px-2.5 py-1.5 border rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Option (B)</label>
                  <input
                    type="text"
                    value={newForm.optB}
                    onChange={(e) => setNewForm({ ...newForm, optB: e.target.value })}
                    className="w-full px-2.5 py-1.5 border rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Option (C)</label>
                  <input
                    type="text"
                    value={newForm.optC}
                    onChange={(e) => setNewForm({ ...newForm, optC: e.target.value })}
                    className="w-full px-2.5 py-1.5 border rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Option (D)</label>
                  <input
                    type="text"
                    value={newForm.optD}
                    onChange={(e) => setNewForm({ ...newForm, optD: e.target.value })}
                    className="w-full px-2.5 py-1.5 border rounded-lg text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Correct Option
                  </label>
                  <select
                    value={newForm.correctOption}
                    onChange={(e) => setNewForm({ ...newForm, correctOption: e.target.value })}
                    className="w-full px-2.5 py-2 border rounded-lg text-xs bg-white"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Explanation (व्याख्या)
                  </label>
                  <input
                    type="text"
                    value={newForm.explanation}
                    onChange={(e) => setNewForm({ ...newForm, explanation: e.target.value })}
                    className="w-full px-2.5 py-2 border rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                >
                  ✨ Generate Kit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
