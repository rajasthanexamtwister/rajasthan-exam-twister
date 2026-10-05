"use client";

import React from "react";
import { openConsentPreferences } from "./consent-utils";

interface CookieSettingsButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function CookieSettingsButton({
  className = "text-slate-300 hover:text-amber-300 transition-colors text-left text-xs inline-flex items-center gap-1 cursor-pointer",
  children = "Cookie Settings",
}: CookieSettingsButtonProps) {
  return (
    <button
      type="button"
      onClick={openConsentPreferences}
      className={className}
      aria-label="Manage cookie and privacy settings"
    >
      {children}
    </button>
  );
}
