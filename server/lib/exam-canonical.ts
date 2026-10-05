/**
 * Canonical Rajasthan Exam Categorization & Tag Normalizer
 * Standardizes granular shift/paper strings into clean, high-level exam categories.
 */

export interface CanonicalExamMapping {
  canonicalName: string;
  slug: string;
  matcher: RegExp;
}

export const CANONICAL_EXAMS: CanonicalExamMapping[] = [
  {
    canonicalName: "CET (Common Eligibility Test)",
    slug: "cet",
    matcher: /\bCET\b|Common\s+Eligibility\s+Test/i,
  },
  {
    canonicalName: "Rajasthan Police (Constable / SI)",
    slug: "rajasthan-police",
    matcher: /Rajasthan\s+Police|Raj\s+Police|Police\s+Constable|Police\s+SI|Sub\s+Inspector/i,
  },
  {
    canonicalName: "REET & 3rd Grade Teacher",
    slug: "reet-3rd-grade",
    matcher: /3rd\s+Grade|REET|Reet|Teacher\s+Gr\s*III|Primary\s+Teacher/i,
  },
  {
    canonicalName: "RPSC 2nd Grade (Sr. Teacher)",
    slug: "rpsc-2nd-grade",
    matcher: /Sr\.?\s*Teacher|2nd\s+Grade|Teacher\s+Gr\s*II|Senior\s+Teacher/i,
  },
  {
    canonicalName: "RPSC 1st Grade & School Lecturer",
    slug: "rpsc-1st-grade-lecturer",
    matcher: /School\s+Lecturer|1st\s+Grade|College\s+Lecturer|Head\s+Master/i,
  },
  {
    canonicalName: "Computer Instructor (BCI / SCI)",
    slug: "computer-instructor",
    matcher: /Basic\s+Computer\s+Instructor|Senior\s+Computer\s+Instructor|\bBCI\b/i,
  },
  {
    canonicalName: "Information Assistant (IA)",
    slug: "information-assistant",
    matcher: /Information\s+Assistant|Suchna\s+Sahayak|\bIA\b/i,
  },
  {
    canonicalName: "Patwar (Patwari Exam)",
    slug: "patwar",
    matcher: /Patwar|Patwari/i,
  },
  {
    canonicalName: "VDO (Gram Sevak)",
    slug: "vdo-gram-sevak",
    matcher: /\bVDO\b|Gram\s+Sevak|Village\s+Development\s+Officer/i,
  },
  {
    canonicalName: "Agriculture Officer (AAO / AO)",
    slug: "agriculture-officer",
    matcher: /Agriculture\s+Officer|Asstt?\.?\s*Agriculture|\bAAO\b|\bAO\b/i,
  },
  {
    canonicalName: "Junior Engineer (JEN)",
    slug: "jen",
    matcher: /\bJEN\b|Junior\s+Engineer/i,
  },
  {
    canonicalName: "RPSC EO & RO",
    slug: "rpsc-eo-ro",
    matcher: /\bEO\s*\/?\s*RO\b|Executive\s+Officer|Revenue\s+Officer/i,
  },
  {
    canonicalName: "Librarian Grade II & III",
    slug: "librarian",
    matcher: /Librarian/i,
  },
  {
    canonicalName: "Forest Guard & Vanpal",
    slug: "forest-guard",
    matcher: /Forest\s+Guard|Vanpal|Vanrakshak/i,
  },
  {
    canonicalName: "JSA (Junior Scientific Assistant)",
    slug: "jsa",
    matcher: /\bJSA\b|Junior\s+Scientific\s+Assistant/i,
  },
  {
    canonicalName: "Statistical Officer & Sanganak",
    slug: "statistical-officer-sanganak",
    matcher: /Statistical\s+Office|Sanganak|संगणक|\bASO\b|COMPILER/i,
  },
  {
    canonicalName: "Protection Officer",
    slug: "protection-officer",
    matcher: /Protection\s+Officer/i,
  },
  {
    canonicalName: "Veterinary Officer",
    slug: "veterinary-officer",
    matcher: /Veterinary\s+Officer/i,
  },
  {
    canonicalName: "Junior Instructor",
    slug: "junior-instructor",
    matcher: /Junior\s+Instructor/i,
  },
  {
    canonicalName: "परिचालक (Conductor)",
    slug: "conductor",
    matcher: /परिचालक|Conductor/i,
  },
  {
    canonicalName: "RSMSSB & RSSB Exams",
    slug: "rsmssb",
    matcher: /\bRSMSSB\b|\bRSSB\b/i,
  },
  {
    canonicalName: "RPSC State Exams",
    slug: "rpsc",
    matcher: /\bRPSC\b/i,
  },
  {
    canonicalName: "Computer Science",
    slug: "computer-science",
    matcher: /Computer\s+Science/i,
  },
];

/**
 * Normalizes a raw exam tag (which may have shift, paper, date) to a clean canonical category
 */
export function normalizeToCanonicalExam(rawTag: string): { name: string; slug: string } {
  const trimmed = rawTag.trim();
  if (!trimmed) {
    return { name: "Other Rajasthan Exams", slug: "other-rajasthan-exams" };
  }

  for (const exam of CANONICAL_EXAMS) {
    if (exam.matcher.test(trimmed)) {
      return { name: exam.canonicalName, slug: exam.slug };
    }
  }

  // Fallback: Clean shift, dates, and brackets from unknown tags
  let cleaned = trimmed
    .replace(/\s*\(\s*SHIFT\s*-\s*[^)]+\)/gi, "")
    .replace(/\s*Shift\s*-\s*\d+/gi, "")
    .replace(/\s*Shift\s*\d+/gi, "")
    .replace(/\s*Paper\s*-\s*\d+/gi, "")
    .replace(/\s*Paper\s*\d+/gi, "")
    .replace(/\s*\(Paper[^)]*\)/gi, "")
    .replace(/\s*\(G\.?K\.?\s*Group[^)]*\)/gi, "")
    .replace(/\s*\(Re-Exam\)/gi, "")
    .replace(/\s*\d{1,2}\s+[A-Za-z]+\s+\d{4}/g, "") // remove explicit dates like 04 February 2023
    .replace(/[-_–—\s]+/g, " ")
    .trim();

  if (!cleaned) {
    cleaned = trimmed;
  }

  const slug = cleaned
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097F]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return { name: cleaned, slug: slug || "general-exam" };
}

/**
 * Builds a regex pattern to match any raw tags under a selected canonical exam name or slug
 */
export function buildExamMatcherRegex(searchExam: string): RegExp {
  const cleanSearch = searchExam.trim().toLowerCase();

  const found = CANONICAL_EXAMS.find(
    (e) => e.slug === cleanSearch || e.canonicalName.toLowerCase() === cleanSearch
  );

  if (found) {
    return found.matcher;
  }

  // Fallback: Escape regex characters
  const escaped = searchExam.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(escaped, "i");
}
