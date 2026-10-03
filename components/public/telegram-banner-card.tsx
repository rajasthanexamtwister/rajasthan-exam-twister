import { Send, CheckCircle2, Sparkles, FileText, BookOpen } from "lucide-react";
import { SOCIAL_LINKS } from "@/server/lib/social-links";

interface TelegramBannerCardProps {
  title?: string;
  description?: string;
  compact?: boolean;
}

export function TelegramBannerCard({
  title = "राजस्थान प्रतियोगी परीक्षाओं के डेली फ्री PDF नोट्स व क्विज़",
  description = "RPSC RAS, REET, CET, RSSB एवं Rajasthan Police परीक्षा हेतु नवीनतम हस्तलिखित नोट्स, डेली क्विज़ और ऑफिशियल अपडेट्स पाने के लिए टेलीग्राम चैनल से जुड़ें।",
  compact = false,
}: TelegramBannerCardProps) {
  if (compact) {
    return (
      <div className="my-6 p-4 rounded-2xl bg-gradient-to-r from-sky-950 via-slate-900 to-slate-950 text-white border border-sky-500/30 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Send className="w-5 h-5 -rotate-12" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100">{title}</h3>
            <p className="text-xs text-slate-300">{description}</p>
          </div>
        </div>
        <a
          href={SOCIAL_LINKS.telegram.url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 text-xs font-bold text-white bg-sky-500 hover:bg-sky-400 rounded-xl transition-all shrink-0 flex items-center gap-1.5 shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Join Telegram</span>
        </a>
      </div>
    );
  }

  return (
    <div className="my-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-sky-950 text-white border border-sky-500/30 shadow-xl relative overflow-hidden group">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Official Telegram Community</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white leading-tight font-devanagari">
            {title}
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {description}
          </p>

          <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-300 pt-1 font-medium">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>डेली फ्री क्विज़ पोल</span>
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>हस्तलिखित PDF नोट्स</span>
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>ऑफ़िशियल अपडेट्स</span>
            </span>
          </div>
        </div>

        <div className="shrink-0 w-full md:w-auto">
          <a
            href={SOCIAL_LINKS.telegram.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full md:w-auto px-6 py-3.5 text-sm font-extrabold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 hover:shadow-sky-500/35 hover:-translate-y-0.5"
          >
            <Send className="w-4 h-4 -rotate-12" />
            <span>Telegram चैनल जॉइन करें</span>
          </a>
        </div>
      </div>
    </div>
  );
}
