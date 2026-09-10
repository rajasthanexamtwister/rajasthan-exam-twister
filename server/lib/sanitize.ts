import sanitizeHtml from "sanitize-html";

export const ALLOWED_TAGS = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "p",
  "a",
  "ul",
  "ol",
  "li",
  "b",
  "i",
  "strong",
  "em",
  "strike",
  "code",
  "hr",
  "br",
  "div",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "pre",
  "img",
  "span",
];

export const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions["allowedAttributes"] = {
  a: ["href", "name", "target", "rel"],
  img: ["src", "alt", "title", "width", "height", "loading", "class"],
  table: ["class", "border"],
  th: ["colspan", "rowspan", "scope", "class"],
  td: ["colspan", "rowspan", "class"],
  span: ["class"],
  div: ["class"],
  code: ["class"],
  pre: ["class"],
};

export interface SanitizeOptions {
  demoteH1?: boolean;
}

export function sanitizeContentHtml(rawHtml: string, options: SanitizeOptions = { demoteH1: true }): string {
  if (!rawHtml) return "";
  const shouldDemoteH1 = options.demoteH1 !== false;

  const transformTags: Record<string, string | sanitizeHtml.Transformer> = {
    a: (tagName, attribs) => {
      return {
        tagName: "a",
        attribs: {
          ...attribs,
          rel: "noopener noreferrer",
        },
      };
    },
  };

  if (shouldDemoteH1) {
    transformTags.h1 = "h2";
  }

  return sanitizeHtml(rawHtml, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ["http", "https", "mailto", "tel", "data"],
    transformTags,
    exclusiveFilter: (frame) => {
      // Strip empty/unwanted scripts, styles, iframes, objects, embeds
      return (
        frame.tag === "script" ||
        frame.tag === "style" ||
        frame.tag === "iframe" ||
        frame.tag === "object" ||
        frame.tag === "embed"
      );
    },
  });
}

export function calculateReadingTime(html: string): number {
  if (!html) return 1;
  const text = html.replace(/<[^>]*>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const wordsPerMinute = 200;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}
