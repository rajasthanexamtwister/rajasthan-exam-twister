import type { Metadata } from "next";
import { Sora, Plus_Jakarta_Sans, Noto_Sans_Devanagari } from "next/font/google";
import { getSiteUrl } from "@/server/lib/seo";
import { PublicSessionProvider } from "@/components/providers/session-provider";
import "./globals.css";

const headingFont = Sora({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
});

const bodyFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const devanagariFont = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-devanagari",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://rajasthanexamtwister.com"),
  title: {
    default: "Rajasthan Exam Twister — Master Rajasthan GK & Competitive Exam Revision",
    template: "%s | Rajasthan Exam Twister",
  },
  description:
    "Master Rajasthan GK revision notes, exam prep blog articles, current affairs, and mock quizzes for REET, RPSC, CET, Rajasthan Police, and state recruitment exams.",
  keywords: [
    "Rajasthan GK Notes",
    "RPSC Exam Prep",
    "REET Level 1 Level 2",
    "Rajasthan Current Affairs",
    "CET Rajasthan Mock Test",
    "Rajasthan History Culture Geography",
  ],
  authors: [{ name: "Rajasthan Exam Twister Team" }],
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
    title: "Rajasthan Exam Twister — Master Rajasthan GK & Revision",
    description:
      "Comprehensive notes, blogs, and master revision guides for REET, RPSC, CET, Rajasthan Police, and state competitive exams.",
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
    title: "Rajasthan Exam Twister — Master Rajasthan GK & Revision",
    description:
      "Comprehensive notes, blogs, and master revision guides for REET, RPSC, CET, Rajasthan Police, and state competitive exams.",
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
        sameAs: [
          "https://t.me/+9lJuoxlqJdsxMDY1",
          "https://www.instagram.com/examtwister/",
          "https://x.com/examtwister",
          "https://www.youtube.com/@ExamTwister",
        ],
        description:
          "Rajasthan Exam Twister — Comprehensive GK revision handbooks, exam notes, current affairs blogs, and mock quizzes for REET, RPSC, CET, Police SI, and Rajasthan state competitive exams.",
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
