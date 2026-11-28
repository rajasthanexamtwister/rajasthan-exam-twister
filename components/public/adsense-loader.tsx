"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

const EXCLUDED_PREFIXES = [
  "/admin",
  "/login",
  "/search",
  "/profile",
  "/notebook",
  "/quiz-tools",
];

/**
 * Loads the AdSense script only on public, content-rich routes.
 * Excludes login/admin, search, user-private pages, and active quiz attempt/result screens
 * so ads never overlap mobile quiz controls or appear on empty/utility pages.
 */
export function AdSenseLoader() {
  const pathname = usePathname() || "/";

  const isExcludedPrefix = EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isQuizInteractiveRoute =
    pathname.startsWith("/quizzes/") &&
    (pathname.endsWith("/attempt") || pathname.endsWith("/result"));

  if (isExcludedPrefix || isQuizInteractiveRoute) {
    return null;
  }

  return (
    <Script
      id="google-adsense"
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1617995815866036"
      strategy="afterInteractive"
      crossOrigin="anonymous"
    />
  );
}
