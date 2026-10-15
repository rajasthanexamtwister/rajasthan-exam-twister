import React from "react";
import clsx from "clsx";
import { AdSenseUnit } from "@/components/public/adsense-unit";

interface ContentRendererProps {
  content: string;
  className?: string;
  inArticleAdSlotId?: string;
}

const contentStyles = [
  "content-renderer max-w-full min-w-0 text-slate-800 leading-relaxed break-words [overflow-wrap:anywhere]",
  "space-y-4 [&>h2]:text-xl sm:[&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-slate-900 [&>h2]:mt-8 [&>h2]:mb-4 [&>h2]:border-b [&>h2]:border-slate-200 [&>h2]:pb-2 [&>h2]:break-words",
  "[&>h3]:text-lg sm:[&>h3]:text-xl [&>h3]:font-bold [&>h3]:text-slate-900 [&>h3]:mt-6 [&>h3]:mb-3 [&>h3]:break-words",
  "[&>h4]:text-base sm:[&>h4]:text-lg [&>h4]:font-semibold [&>h4]:text-slate-800 [&>h4]:mt-4 [&>h4]:mb-2 [&>h4]:break-words",
  "[&>p]:text-sm sm:[&>p]:text-base [&>p]:leading-relaxed sm:[&>p]:leading-7 [&>p]:text-slate-700 [&>p]:my-3 [&>p]:break-words",
  "[&>ul]:list-disc [&>ul]:pl-5 sm:[&>ul]:pl-6 [&>ul]:my-4 [&>ul]:space-y-1.5 [&>ul>li]:text-slate-700 [&>ul>li]:break-words",
  "[&>ol]:list-decimal [&>ol]:pl-5 sm:[&>ol]:pl-6 [&>ol]:my-4 [&>ol]:space-y-1.5 [&>ol>li]:text-slate-700 [&>ol>li]:break-words",
  "[&>blockquote]:border-l-4 [&>blockquote]:border-amber-500 [&>blockquote]:pl-4 [&>blockquote]:py-1.5 [&>blockquote]:my-4 [&>blockquote]:italic [&>blockquote]:text-slate-600 [&>blockquote]:bg-amber-50/50 [&>blockquote]:rounded-r-lg [&>blockquote]:break-words",
  "[&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:p-3 sm:[&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:my-4 [&_pre]:text-xs sm:[&_pre]:text-sm [&_pre]:whitespace-pre-wrap sm:[&_pre]:whitespace-pre",
  "[&_code]:bg-slate-100 [&_code]:text-amber-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs sm:[&_code]:text-sm [&_code]:font-mono [&_code]:break-all",
  "[&_table]:block [&_table]:w-full [&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:border-collapse [&_table]:my-6 [&_table]:border [&_table]:border-slate-300 [&_table]:rounded-lg",
  "[&_th]:bg-slate-100 [&_th]:border [&_th]:border-slate-300 [&_th]:px-2.5 sm:[&_th]:px-4 [&_th]:py-2 [&_th]:text-left [&_th]:text-xs [&_th]:font-bold [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-slate-800 [&_th]:break-words",
  "[&_td]:border [&_td]:border-slate-300 [&_td]:px-2.5 sm:[&_td]:px-4 [&_td]:py-2 [&_td]:text-xs sm:[&_td]:text-sm [&_td]:text-slate-700 [&_td]:break-words",
  "[&_tr:nth-child(even)]:bg-slate-50/70",
  "[&_img]:max-w-full [&_img]:h-auto [&_img]:w-full sm:[&_img]:w-auto [&_img]:mx-auto [&_img]:rounded-2xl [&_img]:my-6 [&_img]:shadow-md [&_img]:object-contain [&_img]:bg-slate-100",
  "[&_a]:text-amber-600 [&_a]:underline [&_a]:decoration-amber-400 [&_a]:underline-offset-2 hover:[&_a]:text-amber-700 [&_a]:break-words",
  "[&>hr]:my-8 [&>hr]:border-slate-200",
].join(" ");

export function ContentRenderer({ content, className, inArticleAdSlotId }: ContentRendererProps) {
  if (!content) {
    return (
      <div className="py-8 text-center text-slate-400 italic text-sm">
        No content available.
      </div>
    );
  }

  // If inArticleAdSlotId is provided, manual ads are enabled, and content is sufficiently long (> 600 characters)
  const isManualAdsEnabled = process.env.NEXT_PUBLIC_ENABLE_MANUAL_ADS === "true";
  if (isManualAdsEnabled && inArticleAdSlotId && content.length > 600) {
    const h2Regex = /<h2[\s>]/gi;
    let match;
    let count = 0;
    let splitIndex = -1;

    while ((match = h2Regex.exec(content)) !== null) {
      count++;
      if (count === 2) {
        splitIndex = match.index;
        break;
      }
    }

    // Fallback: If no 2nd <h2>, try after 3rd paragraph
    if (splitIndex === -1) {
      const pRegex = /<\/p>/gi;
      let pCount = 0;
      while ((match = pRegex.exec(content)) !== null) {
        pCount++;
        if (pCount === 3) {
          splitIndex = match.index + 4;
          break;
        }
      }
    }

    if (splitIndex !== -1) {
      const part1 = content.slice(0, splitIndex);
      const part2 = content.slice(splitIndex);

      return (
        <div className="space-y-6">
          <div
            className={clsx(contentStyles, className)}
            dangerouslySetInnerHTML={{ __html: part1 }}
          />

          <div className="print:hidden my-6">
            <AdSenseUnit
              slotId={inArticleAdSlotId}
              adLayout="in-article"
              adFormat="fluid"
              style={{ textAlign: "center" }}
              label="Sponsored"
            />
          </div>

          <div
            className={clsx(contentStyles, className)}
            dangerouslySetInnerHTML={{ __html: part2 }}
          />
        </div>
      );
    }
  }

  return (
    <div
      className={clsx(contentStyles, className)}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
