import type { Metadata } from "next";
import { Sora, Plus_Jakarta_Sans, Noto_Sans_Devanagari } from "next/font/google";
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
    icon: "/brand/logo.png",
    shortcut: "/brand/logo.png",
    apple: "/brand/logo.png",
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
  return (
    <html
      lang="hi"
      className={`${headingFont.variable} ${bodyFont.variable} ${devanagariFont.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-sans antialiased bg-[#FAF8F5] text-slate-900 selection:bg-amber-200 selection:text-amber-950">
        {children}
      </body>
    </html>
  );
}
