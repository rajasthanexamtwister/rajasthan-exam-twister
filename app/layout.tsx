import type { Metadata } from "next";
import Script from "next/script";
import { Sora, Plus_Jakarta_Sans, Noto_Sans_Devanagari } from "next/font/google";
import { getSiteUrl } from "@/server/lib/seo";
import { OFFICIAL_SOCIAL_URLS } from "@/server/lib/social-links";
import { PublicSessionProvider } from "@/components/providers/session-provider";
import "./globals.css";

const headingFont = Sora({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
});

const bodyFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const devanagariFont = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "600", "700"],
  variable: "--font-devanagari",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Rajasthan Exam Twister — Rajasthan GK, Notes, Quizzes & Current Affairs",
    template: "%s | Rajasthan Exam Twister",
  },
  description:
    "High-yield Rajasthan GK revision notes, current affairs blogs, infographic handbooks, and mock quizzes for REET, RPSC, CET, RSSB, Rajasthan Police, and state exam preparation.",
  keywords: [
    "Rajasthan Exam Twister",
    "Rajasthan GK Notes",
    "RPSC Exam Prep",
    "REET Level 1 Level 2",
    "Rajasthan Current Affairs",
    "CET Rajasthan Mock Test",
    "RSSB Exam Prep",
    "Rajasthan Police Constable SI",
    "Rajasthan History Culture Geography",
  ],
  authors: [{ name: "Rajasthan Exam Twister Team" }],
  verification: {
    google: "google1bcce2823966edb8",
  },
  other: {
    "google-adsense-account": "ca-pub-8986858563387447",
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: "Rajasthan Exam Twister",
    title: "Rajasthan Exam Twister — Rajasthan GK, Notes, Quizzes & Current Affairs",
    description:
      "High-yield Rajasthan GK revision notes, current affairs blogs, infographic handbooks, and mock quizzes for REET, RPSC, CET, RSSB, Rajasthan Police, and state competitive exams.",
    images: [
      {
        url: "/brand/banner.png",
        width: 1200,
        height: 630,
        alt: "Rajasthan Exam Twister - Sawaal Seedha Nahi, Soch Tedhi Karo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rajasthan Exam Twister — Rajasthan GK, Notes, Quizzes & Current Affairs",
    description:
      "High-yield Rajasthan GK revision notes, current affairs blogs, infographic handbooks, and mock quizzes for REET, RPSC, CET, RSSB, Rajasthan Police, and state competitive exams.",
    images: ["/brand/banner.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteUrl = getSiteUrl();

  // Organization + WebSite JSON-LD for Google Knowledge Panel & brand discoverability
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "Rajasthan Exam Twister",
        url: siteUrl,
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/brand/logo.png`,
          width: 512,
          height: 512,
        },
        sameAs: OFFICIAL_SOCIAL_URLS,
        description:
          "Rajasthan Exam Twister — High-yield Rajasthan GK revision notes, current affairs blogs, infographic handbooks, and mock quizzes for REET, RPSC, CET, RSSB, Rajasthan Police, and state competitive exams.",
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "Rajasthan Exam Twister",
        publisher: { "@id": `${siteUrl}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteUrl}/search?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
        inLanguage: ["hi", "en"],
      },
    ],
  };

  return (
    <html
      lang="hi"
      className={`${headingFont.variable} ${bodyFont.variable} ${devanagariFont.variable} h-full`}
    >
      <head>
        {/* Resource Preconnect Hints & LCP Hero Banner Preload */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" />
        <link
          rel="preload"
          as="image"
          href="/brand/banner.webp"
          type="image/webp"
          // @ts-ignore
          fetchPriority="high"
        />

        {/* Google AdSense Script (Non-render-blocking lazyOnload) */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8986858563387447"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased bg-[#FAF8F5] text-slate-900 selection:bg-amber-200 selection:text-amber-950">
        {/* Site-wide Organization + WebSite structured data for Google brand recognition */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <PublicSessionProvider>
          {children}
        </PublicSessionProvider>
      </body>
    </html>
  );
}
