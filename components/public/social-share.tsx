"use client";

import { useState } from "react";
import { Share2, Check, Send, MessageCircle } from "lucide-react";

interface SocialShareProps {
  title: string;
  url?: string;
  category?: string;
}

export function SocialShare({ title, url, category }: SocialShareProps) {
  const [copied, setCopied] = useState(false);

  // Fallback to window location if url is relative or undefined
  const shareUrl =
    typeof window !== "undefined"
      ? url
        ? url.startsWith("http")
          ? url
          : `${window.location.origin}${url}`
        : window.location.href
      : url || "";

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(
    `📚 *${title}* ${category ? `[${category}]` : ""}\nCheck out this high-yield revision study material on Rajasthan Exam Twister:\n`
  );

  const whatsappLink = `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`;
  const telegramLink = `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
  const twitterLink = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}&hashtags=RajasthanGK,RPSC,REET`;

  const copyToClipboard = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 sm:p-5 my-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-800 font-bold">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
              Share this study resource
            </h4>
            <p className="text-[11px] text-slate-600">
              Help your exam peers & study groups prepare better
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* WhatsApp */}
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all hover:scale-105 active:scale-95"
            aria-label="Share on WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-current" />
            <span>WhatsApp</span>
          </a>

          {/* Telegram */}
          <a
            href={telegramLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold shadow-sm transition-all hover:scale-105 active:scale-95"
            aria-label="Share on Telegram"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Telegram</span>
          </a>

          {/* X / Twitter */}
          <a
            href={twitterLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all hover:scale-105 active:scale-95"
            aria-label="Share on X"
          >
            <span className="font-mono text-xs">𝕏</span>
            <span className="hidden xs:inline">Post</span>
          </a>

          {/* Copy Link */}
          <button
            type="button"
            onClick={copyToClipboard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-sm transition-all hover:border-slate-300"
            aria-label="Copy page link"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
