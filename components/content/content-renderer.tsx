import React from "react";
import clsx from "clsx";

interface ContentRendererProps {
  content: string;
  className?: string;
}

export function ContentRenderer({ content, className }: ContentRendererProps) {
  if (!content) {
    return (
      <div className="py-8 text-center text-slate-400 italic text-sm">
        No content available.
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "content-renderer max-w-none text-slate-800 leading-relaxed",
        "space-y-4 [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-slate-900 [&>h2]:mt-8 [&>h2]:mb-4 [&>h2]:border-b [&>h2]:border-slate-200 [&>h2]:pb-2",
        "[&>h3]:text-xl [&>h3]:font-bold [&>h3]:text-slate-900 [&>h3]:mt-6 [&>h3]:mb-3",
        "[&>h4]:text-lg [&>h4]:font-semibold [&>h4]:text-slate-800 [&>h4]:mt-4 [&>h4]:mb-2",
        "[&>p]:text-base [&>p]:leading-7 [&>p]:text-slate-700 [&>p]:my-3",
        "[&>ul]:list-disc [&>ul]:pl-6 [&>ul]:my-4 [&>ul]:space-y-1.5 [&>ul>li]:text-slate-700",
        "[&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:my-4 [&>ol]:space-y-1.5 [&>ol>li]:text-slate-700",
        "[&>blockquote]:border-l-4 [&>blockquote]:border-amber-500 [&>blockquote]:pl-4 [&>blockquote]:py-1.5 [&>blockquote]:my-4 [&>blockquote]:italic [&>blockquote]:text-slate-600 [&>blockquote]:bg-amber-50/50 [&>blockquote]:rounded-r-lg",
        "[&>pre]:bg-slate-900 [&>pre]:text-slate-100 [&>pre]:p-4 [&>pre]:rounded-xl [&>pre]:overflow-x-auto [&>pre]:my-4 [&>pre]:text-sm",
        "[&>code]:bg-slate-100 [&>code]:text-amber-800 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-sm [&>code]:font-mono",
        "[&>table]:w-full [&>table]:border-collapse [&>table]:my-6 [&>table]:border [&>table]:border-slate-300 [&>table]:rounded-lg [&>table]:overflow-hidden",
        "[&_th]:bg-slate-100 [&_th]:border [&_th]:border-slate-300 [&_th]:px-4 [&_th]:py-2.5 [&_th]:text-left [&_th]:text-xs [&_th]:font-bold [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-slate-800",
        "[&_td]:border [&_td]:border-slate-300 [&_td]:px-4 [&_td]:py-2.5 [&_td]:text-sm [&_td]:text-slate-700",
        "[&_tr:nth-child(even)]:bg-slate-50/70",
        "[&>img]:rounded-xl [&>img]:my-6 [&>img]:shadow-md [&>img]:w-full [&>img]:max-h-[500px] [&>img]:object-contain [&>img]:bg-slate-100",
        "[&_a]:text-amber-600 [&_a]:underline [&_a]:decoration-amber-400 [&_a]:underline-offset-2 hover:[&_a]:text-amber-700",
        "[&>hr]:my-8 [&>hr]:border-slate-200",
        className
      )}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
