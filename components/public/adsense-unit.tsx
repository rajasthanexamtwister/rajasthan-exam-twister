"use client";

import { useEffect, useRef, useState } from "react";

interface AdSenseUnitProps {
  slotId: string;
  adFormat?: string;
  adLayout?: string;
  fullWidthResponsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  label?: string;
  minHeight?: number;
}

/**
 * Google AdSense policy strictly permits only "Advertisements" or "Sponsored Links" (or "Sponsored").
 * Disallowed labels such as "Recommended For You", "Partners", etc. are strictly sanitized.
 */
function sanitizeAdLabel(label?: string): string {
  if (!label) return "Advertisements";
  const trimmed = label.trim().toLowerCase();
  if (trimmed === "sponsored" || trimmed === "sponsored links") {
    return "Sponsored";
  }
  return "Advertisements";
}

export function AdSenseUnit({
  slotId,
  adFormat = "auto",
  adLayout,
  fullWidthResponsive = true,
  className = "",
  style,
  label = "Advertisements",
  minHeight = 100,
}: AdSenseUnitProps) {
  const adRef = useRef<HTMLModElement | null>(null);
  const isPushed = useRef(false);
  const [adLoaded, setAdLoaded] = useState(false);

  // Manual ad slots are suppressed during initial AdSense site review.
  // The primary Auto-Ads script in app/layout.tsx remains active for verification.
  const isManualAdsEnabled = process.env.NEXT_PUBLIC_ENABLE_MANUAL_ADS === "true";

  useEffect(() => {
    if (!isManualAdsEnabled) return;

    try {
      if (typeof window !== "undefined" && adRef.current && !isPushed.current) {
        if (!adRef.current.hasAttribute("data-adsbygoogle-status")) {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          isPushed.current = true;
        }
      }
    } catch (err) {
      console.warn("AdSense push notice:", err);
    }
  }, [isManualAdsEnabled]);

  // If manual ads are disabled during site review, render nothing (no empty bordered box)
  if (!isManualAdsEnabled) {
    return null;
  }

  const compliantLabel = sanitizeAdLabel(label);

  return (
    <div
      className={`my-6 mx-auto w-full text-center overflow-hidden rounded-2xl border border-amber-200/60 bg-[#FAF8F5]/80 p-2 sm:p-3 shadow-2xs ${className}`}
    >
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 font-sans">
        {compliantLabel}
      </div>
      <div
        className="w-full flex justify-center items-center overflow-hidden"
        style={{ minHeight: `${minHeight}px` }}
      >
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: "block", width: "100%", ...style }}
          data-ad-client="ca-pub-8986858563387447"
          data-ad-slot={slotId}
          data-ad-format={adFormat}
          {...(adLayout ? { "data-ad-layout": adLayout } : {})}
          data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
        />
      </div>
    </div>
  );
}

