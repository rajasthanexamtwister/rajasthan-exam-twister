"use client";

import { useEffect, useState } from "react";
import { Download, X, Smartphone, Sparkles, CheckCircle2 } from "lucide-react";

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("PWA Service Worker registered successfully:", reg.scope);
        })
        .catch((err) => {
          console.error("PWA Service Worker registration failed:", err);
        });
    }

    // 2. Check if already running in standalone mode (installed)
    if (
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true)
    ) {
      setInstalled(true);
      return;
    }

    // 3. Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Check if user previously dismissed banner in this session
      const dismissed = sessionStorage.getItem("ret_pwa_banner_dismissed");
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 4. Listen for appinstalled event
    const handleAppInstalled = () => {
      setInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setInstalled(true);
      setShowBanner(false);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("ret_pwa_banner_dismissed", "true");
    }
  };

  if (!showBanner || installed) return null;

  return (
    <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 z-50 max-w-md animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-[#0B132B] text-white p-4 sm:p-5 rounded-3xl border border-amber-400/40 shadow-2xl relative overflow-hidden space-y-3">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center shrink-0 shadow-md">
              <Smartphone className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Official App Available</span>
              </div>
              <h3 className="text-sm font-bold text-white leading-tight">
                Install Exam Twister App
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            aria-label="Close Install Prompt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Install the app on your phone for faster access, daily quiz notifications & offline notes reading!
        </p>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleInstallClick}
            className="w-full py-2.5 px-4 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Install App Now</span>
          </button>
        </div>
      </div>
    </div>
  );
}
