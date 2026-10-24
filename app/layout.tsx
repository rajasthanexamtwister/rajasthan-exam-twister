import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, Outfit, Noto_Sans_Devanagari } from "next/font/google";
import { getSiteUrl } from "@/server/lib/seo";
import { OFFICIAL_SOCIAL_URLS } from "@/server/lib/social-links";
import { PublicSessionProvider } from "@/components/providers/session-provider";
import { GoogleConsentScripts } from "@/components/privacy/google-consent-scripts";
import { ConsentBanner } from "@/components/privacy/consent-banner";
import "./globals.css";

const headingFont = Outfit({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-heading",
  display: "swap",
  preload: true,
});

const bodyFont = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
});

const devanagariFont = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["500", "700"],
  variable: "--font-devanagari",
  display: "swap",
  preload: true,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0B132B",
};

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Rajasthan Exam Twister | Rajasthan GK, Notes, Quizzes & Current Affairs",
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
    "google-adsense-account": "ca-pub-1617995815866036",
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
    title: "Rajasthan Exam Twister | Rajasthan GK, Notes, Quizzes & Current Affairs",
    description:
      "High-yield Rajasthan GK revision notes, current affairs blogs, infographic handbooks, and mock quizzes for REET, RPSC, CET, RSSB, Rajasthan Police, and state competitive exams.",
    images: [
      {
        url: "/brand/banner.png",
        width: 1200,
        height: 630,
        alt: "Rajasthan Exam Twister: Sawaal Seedha Nahi, Soch Tedhi Karo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rajasthan Exam Twister | Rajasthan GK, Notes, Quizzes & Current Affairs",
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
          "Rajasthan Exam Twister | High-yield Rajasthan GK revision notes, current affairs blogs, infographic handbooks, and mock quizzes for REET, RPSC, CET, RSSB, Rajasthan Police, and state competitive exams.",
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
        {/* PWA Web App Manifest & Mobile App Meta Tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0B132B" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Exam Twister" />

        {/* Resource Preconnect Hints */}
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* High-Priority LCP Banner Preload */}
        <link rel="preload" as="image" href="/brand/banner-mobile.webp" media="(max-width: 768px)" type="image/webp" />
        <link rel="preload" as="image" href="/brand/banner.webp" media="(min-width: 769px)" type="image/webp" />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased bg-[#FAF8F5] text-slate-900 selection:bg-amber-200 selection:text-amber-950">
        {/* Google Consent Mode v2 & Google Analytics 4 Script */}
        <GoogleConsentScripts />

        {/* Google AdSense Script - afterInteractive ensures review bot & crawlers detect script immediately */}
        <Script
          id="google-adsense"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1617995815866036"
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />

        {/* Infolinks Ad Script - lazyOnload strategy prevents blocking FCP, LCP, and TBT */}
        <Script id="infolinks-config" strategy="lazyOnload">
          {`var infolinks_pid = 3448758; var infolinks_wsid = 0;`}
        </Script>
        <Script
          id="infolinks-main"
          src="https://resources.infolinks.com/js/infolinks_main.js"
          strategy="lazyOnload"
        />

        {/* Site-wide Organization + WebSite structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <PublicSessionProvider>
          {children}
        </PublicSessionProvider>
        <ConsentBanner />
      </body>
    </html>
  );
}
