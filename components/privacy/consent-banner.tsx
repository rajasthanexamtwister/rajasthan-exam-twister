"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, Cookie, Check, X, Settings2 } from "lucide-react";
import {
  getStoredConsent,
  saveStoredConsent,
  OPEN_CONSENT_EVENT,
} from "./consent-utils";

export function ConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analyticsChoice, setAnalyticsChoice] = useState(true);
  const [advertisingChoice, setAdvertisingChoice] = useState(true);

  useEffect(() => {
    setMounted(true);
    const existing = getStoredConsent();
    if (!existing) {
      setIsOpen(true);
    } else {
      setAnalyticsChoice(existing.analytics);
      setAdvertisingChoice(existing.advertising);
    }

    const handleOpenModal = () => {
      const current = getStoredConsent();
      if (current) {
        setAnalyticsChoice(current.analytics);
        setAdvertisingChoice(current.advertising);
      }
      setShowPreferences(true);
      setIsOpen(true);
    };

    window.addEventListener(OPEN_CONSENT_EVENT, handleOpenModal);
    return () => {
      window.removeEventListener(OPEN_CONSENT_EVENT, handleOpenModal);
    };
  }, []);

  if (!mounted || !isOpen) {
    return null;
  }

  const handleAcceptAll = () => {
    saveStoredConsent({ analytics: true, advertising: true });
    setIsOpen(false);
    setShowPreferences(false);
  };

  const handleRejectAll = () => {
    saveStoredConsent({ analytics: false, advertising: false });
    setIsOpen(false);
    setShowPreferences(false);
  };

  const handleSavePreferences = () => {
    saveStoredConsent({
      analytics: analyticsChoice,
      advertising: advertisingChoice,
    });
    setIsOpen(false);
    setShowPreferences(false);
  };

  return (
    <section
      aria-label="Cookie & Privacy Consent"
      role={showPreferences ? "dialog" : undefined}
      aria-modal={showPreferences ? "true" : undefined}
      className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-4 md:p-6 pointer-events-none"
    >
      <div className="max-w-4xl mx-auto pointer-events-auto bg-[#0B132B]/95 backdrop-blur-md border border-slate-700/80 text-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 transition-all duration-300">
        {!showPreferences ? (
          /* Simple Banner View */
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1 pr-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm sm:text-base">
                <Cookie className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span>Cookie & Privacy Preferences</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                We use cookies and similar technologies to understand website usage and support educational advertising.
                You can choose whether to allow analytics and advertising cookies. Learn more in our{" "}
                <Link
                  href="/privacy-policy"
                  className="text-amber-300 underline hover:text-amber-200 transition-colors font-medium"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0 justify-end pt-2 md:pt-0">
              <button
                type="button"
                onClick={() => setShowPreferences(true)}
                className="flex-1 md:flex-none px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Settings2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Manage</span>
              </button>
              <button
                type="button"
                onClick={handleRejectAll}
                className="flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5 text-rose-400" />
                <span>Reject All</span>
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="w-full sm:w-auto flex-1 md:flex-none px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Accept All</span>
              </button>
            </div>
          </div>
        ) : (
          /* Granular Preferences View */
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Customize Cookie & Tracking Preferences
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPreferences(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Close preferences"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Customize which cookies and data categories you consent to. Essential cookies are required for basic site operations like login and security.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Category 1: Essential */}
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-white">Essential (Required)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                      Always On
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Necessary for user login, authentication, and core security functions.
                  </p>
                </div>
              </div>

              {/* Category 2: Analytics */}
              <label className="p-3 bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700/60 flex flex-col justify-between cursor-pointer transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-white">Analytics Cookies</span>
                    <input
                      type="checkbox"
                      checked={analyticsChoice}
                      onChange={(e) => setAnalyticsChoice(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-amber-400 focus:ring-offset-0 cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Helps us understand how students use our quizzes and notes to improve content quality.
                  </p>
                </div>
              </label>

              {/* Category 3: Advertising */}
              <label className="p-3 bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700/60 flex flex-col justify-between cursor-pointer transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-white">Advertising Cookies</span>
                    <input
                      type="checkbox"
                      checked={advertisingChoice}
                      onChange={(e) => setAdvertisingChoice(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-amber-400 focus:ring-offset-0 cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Used by Google AdSense to show relevant, non-intrusive educational advertisements.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <Link
                href="/privacy-policy"
                className="text-xs text-amber-300 hover:underline"
              >
                Read our complete Privacy Policy &rarr;
              </Link>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRejectAll}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-all cursor-pointer"
                >
                  Reject All
                </button>
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all cursor-pointer"
                >
                  Save Choices
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
