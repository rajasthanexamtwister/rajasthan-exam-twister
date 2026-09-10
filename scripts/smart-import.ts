/**
 * smart-import.ts
 *
 * One-shot smart importer for the specific file list below.
 *
 * Strategy:
 *   1. Skip node_modules and redirect stubs (files whose body is just
 *      a <meta http-equiv="refresh"> redirect — root-level stubs).
 *   2. For every real file, read FIRST 50 + LAST 50 lines and compute
 *      a "boundary fingerprint" SHA-256.
 *   3. Group files by fingerprint — same fingerprint = LIKELY_DUPLICATE.
 *      From each group keep ONE canonical file (prefer notes/ subfolder,
 *      then longest raw content).
 *   4. Run the EXACT same pipeline as import-service.ts on each winner:
 *      sanitize -> SHA-256 hash -> slug -> DB duplicate check.
 *   5. Save each genuinely new file as a DRAFT Note in MongoDB.
 *
 * Usage:  npx tsx scripts/smart-import.ts [--dry-run]
 *         Add --dry-run to preview without writing to DB.
 */

import path from "path";
import fs from "fs";
import crypto from "crypto";
import dns from "dns";
import * as cheerio from "cheerio";
import slugifyFn from "slugify";
import sanitizeHtml from "sanitize-html";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// Fix Atlas SRV DNS resolution (same as server/lib/mongodb.ts)
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const DRY_RUN = process.argv.includes("--dry-run");
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL not set in .env");
  process.exit(1);
}

// ── File list ──────────────────────────────────────────────────────────────
const FILE_LIST = [
  "notes/gk/art-culture/rajasthan-hastkala-master-revision.html",
  "notes/gk/art-culture/rajasthani-shabdavali-master-revision.html",
  "notes/gk/art-culture/rajasthan-nritya-master-handbook.html",
  "notes/gk/art-culture/rajasthan-aabhushan-veshbhusha-master-handbook.html",
  "notes/gk/art-culture/rajasthan-mela-revision-guide.html",
  "notes/gk/art-culture/rajasthan-festival-revision-sheet.html",
  "notes/pedagogy/calendar-revision-sheet.html",
  "notes/gk/geography/rajasthan-lakes-revision-sheet.html",
  "node_modules/lz-string/tests/SpecRunner.html",        // SKIP - node_modules
  "node_modules/tslib/tslib.html",                       // SKIP - node_modules
  "node_modules/tslib/tslib.es6.html",                   // SKIP - node_modules
  "notes/computer-science/bci-computer-science-master-revision.html",
  "notes/gk/geography/bci-gk-master-revision.html",
  "index.html",                                          // SKIP - site root
  "notes/gk/history/prachin-sabhytaye-very-short-notes.html",
  "notes/gk/geography/science-general-knowledge-master-revision-handbook.html",
  "notes/gk/art-culture/rajasthan-mela-tyohar-combined.html",
  "notes/gk/art-culture/rajasthan-lok-sanskriti-mela-tyohar-master-handbook.html",
  "notes/gk/geography/rajasthan-jal-sansadhan-group-revision-sheet.html",
  "question-bank/papers/rsmssb-bci-reasoning-math-practice-paper.html", // SKIP - question bank
  "notes/gk/geography/rajasthan-krishi-pashupalan-van-vanyajeev-group-4-revision-sheet.html",
  "notes/computer-science/foc.html",
  "notes/gk/history/chauhan-vansh-master-revision.html",
  "notes/gk/geography/rajasthan-transport-and-research-centres-master-revision.html",
  "notes/gk/history/rajasthan-riyasatein-british-sandhiyan-handbook.html",
  "notes/gk/history/rajasthan-madhyakalin-prashasan-master-notes.html",
  "notes/computer-science/networking-master-revision-sheet.html",
  "notes/computer-science/dsa-master-revision-handbook.html",
  "notes/gk/geography/rajasthan-budget-current-affairs-master-handbook.html",
  "notes/gk/history/1857-kranti-rajasthan-master-notes.html",
  "notes/gk/history/rajasthan-kisan-andolan-master-notes.html",
  "notes/gk/art-culture/rajasthani-sahitya-master-revision-handbook.html",
  "notes/pedagogy/group-revision-sheet-education-it.html",
  "notes/gk/geography/rajasthan-physical-geography-master-revision-sheet.html",
  "notes/computer-science/bci-tech-master-revision.html",
  "rajasthan_gk_districts_divisions_master_revision.html",    // root stub
  "rajasthan_lakes_revision_sheet.html",                      // root stub
  "राजस्थान_GK_Master_Revision_Handbook.html",               // root stub
  "Rajasthani_Muhavare_Master_Revision.html",                 // root stub
  "Rajasthan_Chitra_Shailiya_Master_Notes.html",              // root stub
  "Rajasthan_RitiRiwaj_Master_Revision_Handbook.html",        // root stub
  "Rajasthan_Bhasha_Boliyan_Master_Revision_Handbook.html",   // root stub
  "Rajasthani_Shabdavali_Master_Revision.html",               // root stub
  "rajasthan_nritya_master_handbook.html",                    // root stub
  "rajasthan_hastkala_master_revision.html",                  // root stub
  "Rajasthan_Aabhushan_Veshbhusha_Master_Handbook.html",      // root stub
  "Rajasthan_Mela_Tyohar_Combined.html",                      // root stub
  "Rajasthan_Mela_Revision_Guide.html",                       // root stub
  "rajasthan_festival_revision_sheet.html",                   // root stub
  "gurjar_pratihar_master_revision.html",                     // root stub (no notes/ version in list but may be standalone)
  "kachwaha_vansh_master_revision.html",                      // root stub
  "rajasthan_anya_rajvansh_master_revision.html",             // root stub
  "rajasthan_ekikaran_revision_sheet.html",                   // root stub
  "prachin_sabhytaye_very_short_notes.html",                  // root stub
  "bci_pedagogy_master_revision.html",                        // root stub
  "bci_programming_master_revision.html",                     // root stub
  "computer_fundamentals_master_revision.html",               // root stub
  "bci_file_os_virus_master_revision.html",                   // root stub
  "FOC.html",                                                 // root stub
  "dccn.html",                                                // root stub
  "notes/computer-science/computer-fundamentals-master-revision.html",
  "notes/computer-science/dbms-master-revision-handbook.html",
  "duplicate/bci-master-revision-handbook-dup3-v2.html",      // SKIP - duplicate folder
  "duplicate/bci-master-revision-handbook-dup2-v2.html",      // SKIP - duplicate folder
  "notes/gk/history/rathore-vansh-master-revision.html",
  "duplicate/bci-master-revision-handbook-dup1-v2.html",      // SKIP - duplicate folder
  "notes/gk/history/rajasthan-anya-rajvansh-master-revision.html",
  "notes/gk/history/kachwaha-vansh-master-revision.html",
  "notes/pedagogy/bci-pedagogy-master-revision.html",
  "notes/computer-science/bci-file-os-virus-master-revision.html",
  "duplicate/bci-master-revision-handbook-dup3.html",         // SKIP - duplicate folder
  "notes/gk/geography/rajasthan-gk-districts-divisions-master-revision.html",
  "notes/gk/history/gurjar-pratihar-master-revision.html",
  "notes/computer-science/bci-programming-master-revision.html",
  "duplicate/bci-master-revision-handbook-dup0-v2.html",      // SKIP - duplicate folder
  "notes/gk/geography/rajasthan-gk-master-revision-handbook.html",
  "notes/computer-science/dccn.html",
  "notes/gk/history/rajasthan-ekikaran-revision-sheet.html",
  "notes/gk/art-culture/rajasthani-muhavare-master-revision.html",
  "notes/gk/art-culture/rajasthan-bhasha-boliyan-master-revision-handbook.html",
  "notes/gk/art-culture/rajasthan-ritiriwaj-master-revision-handbook.html",
  "duplicate/bci-master-revision-handbook-dup.html",          // SKIP - duplicate folder
  "notes/computer-science/ms-powerpoint-master-revision.html",
  "notes/gk/history/mewar-guhil-vansh-master-handbook.html",
  "duplicate/bci-tech-master-revision-duplicate.html",        // SKIP - duplicate folder
  "duplicate/bci-master-revision-handbook-dup2.html",         // SKIP - duplicate folder
  "duplicate/bci-master-revision-handbook-dup1.html",         // SKIP - duplicate folder
  "notes/computer-science/sad-master-revision.html",
  "duplicate/bci-master-revision-handbook-qa-dup.html",       // SKIP - duplicate folder
  "notes/gk/art-culture/rajasthan-chitra-shailiya-master-notes.html",
  "notes/gk/art-culture/rajasthan-riti-rivaj-master-revision-partial.html",
];

const PROJECT_ROOT = process.cwd();

// Files/folders to skip entirely
const SKIP_PREFIXES = ["node_modules/", "duplicate/", "question-bank/", "index.html"];

// ── Helpers (same as import pipeline) ─────────────────────────────────────

function slugify(text: string): string {
  if (!text) return "untitled";
  return slugifyFn(text, { lower: true, strict: true, trim: true }) || "untitled";
}

function detectTitle(fileName: string, $: cheerio.CheerioAPI): { title: string; shouldRemoveH1: boolean } {
  const titleTagText = $("title").first().text().trim();
  const firstH1Text = $("h1").first().text().trim();
  if (titleTagText) return { title: titleTagText, shouldRemoveH1: false };
  if (firstH1Text) return { title: firstH1Text, shouldRemoveH1: true };
  const cleanName = path.basename(fileName, path.extname(fileName)).replace(/[-_]+/g, " ").trim();
  return {
    title: cleanName ? cleanName.charAt(0).toUpperCase() + cleanName.slice(1) : "Untitled Imported Note",
    shouldRemoveH1: false,
  };
}

function sanitizeBody(rawHtml: string): string {
  if (!rawHtml) return "";
  return sanitizeHtml(rawHtml, {
    allowedTags: ["h1","h2","h3","h4","h5","h6","blockquote","p","a","ul","ol","li","b","i","strong","em","strike","code","hr","br","div","table","thead","tbody","tr","th","td","pre","img","span"],
    allowedAttributes: {
      a: ["href","name","target","rel"],
      img: ["src","alt","title","width","height","loading","class"],
      table: ["class","border"], th: ["colspan","rowspan","scope","class"],
      td: ["colspan","rowspan","class"], span: ["class"], div: ["class"],
      code: ["class"], pre: ["class"],
    },
    allowedSchemes: ["http","https","mailto","tel","data"],
    transformTags: {
      h1: "h2",
      a: (t: string, a: Record<string,string>) => ({ tagName:"a", attribs: {...a, rel:"noopener noreferrer"} }),
    },
    exclusiveFilter: (f: sanitizeHtml.IFrame) => ["script","style","iframe","object","embed"].includes(f.tag),
  });
}

function isRedirectStub(rawHtml: string): boolean {
  // Root-level stubs just have a <meta http-equiv="refresh"> and nothing else
  return rawHtml.includes('http-equiv="refresh"') || rawHtml.includes("http-equiv='refresh'");
}

function boundaryFingerprint(lines: string[]): string {
  const first50 = lines.slice(0, 50).join("\n");
  const last50 = lines.slice(-50).join("\n");
  return crypto.createHash("sha256").update(first50 + "\x00" + last50).digest("hex");
}

// ── Mongoose models (minimal) ─────────────────────────────────────────────

const NoteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    contentHash: { type: String, unique: true, sparse: true },
    status: { type: String, enum: ["DRAFT","PUBLISHED","ARCHIVED"], default: "DRAFT" },
    subject: String,
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    tagIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tag" }],
    imageIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Media" }],
    importJobId: { type: mongoose.Schema.Types.ObjectId, ref: "ImportJob" },
    isEditedSinceImport: { type: Boolean, default: false },
  },
  { collection: "notes", timestamps: true }
);

const Note = mongoose.models["Note"] || mongoose.model("Note", NoteSchema);

async function isSlugTaken(slug: string): Promise<boolean> {
  return (await Note.countDocuments({ slug })) > 0;
}

async function hashExists(hash: string): Promise<boolean> {
  return (await Note.countDocuments({ contentHash: hash })) > 0;
}

async function makeUniqueSlug(base: string): Promise<string> {
  let candidate = base;
  let n = 2;
  while (await isSlugTaken(candidate)) {
    candidate = `${base}-${n++}`;
  }
  return candidate;
}

// Prefer filename-based slug when title slug is too generic or too short.
// Hindi titles like "राजस्थान हस्तकला — Master Revision Handbook" get stripped
// to just "master-revision-handbook" by slugify — not useful as a URL.
const GENERIC_SLUG_PATTERNS = /^(master-revision-handbook|untitled|gk|handbook|revision-sheet|revision-handbook|master-handbook|notes?|page)(-[0-9]+)?$/;

function smartSlug(title: string, filePath: string): string {
  const titleSlug = slugify(title);
  const fileBase = path.basename(filePath, path.extname(filePath));
  const fileSlug = slugify(fileBase);

  // Use filename slug when:
  //   (a) title slug is generically named, OR
  //   (b) title slug is very short (< 8 chars), meaning Hindi content was stripped
  if (
    titleSlug === "untitled" ||
    titleSlug.length < 8 ||
    GENERIC_SLUG_PATTERNS.test(titleSlug)
  ) {
    return fileSlug || titleSlug;
  }
  return titleSlug;
}


// ── Infer subject from folder path ────────────────────────────────────────

function inferSubject(relPath: string): string {
  if (relPath.includes("/history/")) return "Rajasthan History";
  if (relPath.includes("/art-culture/")) return "Rajasthan Art & Culture";
  if (relPath.includes("/geography/")) return "Rajasthan Geography";
  if (relPath.includes("/computer-science/")) return "Computer Science";
  if (relPath.includes("/pedagogy/")) return "Pedagogy";
  return "";
}

// ── Main ──────────────────────────────────────────────────────────────────

interface FileRecord {
  relPath: string;
  absPath: string;
  rawHtml: string;
  lines: string[];
  fingerprint: string;
}

interface Result {
  file: string;
  status: "SAVED" | "DUPLICATE_IN_LIST" | "DUPLICATE_IN_DB" | "SKIPPED" | "EMPTY" | "ERROR";
  title?: string;
  slug?: string;
  reason?: string;
}

async function main() {
  console.log("\n=== Smart Import Script ===");
  console.log("Mode: " + (DRY_RUN ? "DRY RUN (no DB writes)" : "LIVE (will write to DB)"));

  // Step 1: Load + classify files
  const records: FileRecord[] = [];
  const skipped: Result[] = [];

  for (const rel of FILE_LIST) {
    // Skip by prefix
    if (SKIP_PREFIXES.some((p) => rel.startsWith(p))) {
      skipped.push({ file: rel, status: "SKIPPED", reason: "Excluded folder/file" });
      continue;
    }

    const absPath = path.join(PROJECT_ROOT, rel);
    if (!fs.existsSync(absPath)) {
      skipped.push({ file: rel, status: "SKIPPED", reason: "File not found" });
      continue;
    }

    let rawHtml: string;
    try {
      rawHtml = fs.readFileSync(absPath, "utf-8");
    } catch (e) {
      skipped.push({ file: rel, status: "ERROR", reason: "Read error: " + String(e) });
      continue;
    }

    // Skip redirect stubs
    if (isRedirectStub(rawHtml)) {
      skipped.push({ file: rel, status: "SKIPPED", reason: "Redirect stub (meta refresh)" });
      continue;
    }

    const lines = rawHtml.split("\n");
    const fp = boundaryFingerprint(lines);
    records.push({ relPath: rel, absPath, rawHtml, lines, fingerprint: fp });
  }

  console.log("\nTotal files in list: " + FILE_LIST.length);
  console.log("Skipped (node_modules/duplicate/stub/missing): " + skipped.length);
  console.log("Candidates to process: " + records.length);

  // Step 2: Group by boundary fingerprint -> dedup within list
  const fpGroups = new Map<string, FileRecord[]>();
  for (const r of records) {
    const group = fpGroups.get(r.fingerprint) || [];
    group.push(r);
    fpGroups.set(r.fingerprint, group);
  }

  const listDuplicates: Result[] = [];
  const canonical: FileRecord[] = [];

  for (const [fp, group] of Array.from(fpGroups.entries())) {
    if (group.length === 1) {
      canonical.push(group[0]);
      continue;
    }

    // Multiple files with same boundary fingerprint: keep the best one
    // Priority: (1) notes/ subfolder path, (2) longest raw content
    const sorted = [...group].sort((a, b) => {
      const aInNotes = a.relPath.startsWith("notes/") ? 0 : 1;
      const bInNotes = b.relPath.startsWith("notes/") ? 0 : 1;
      if (aInNotes !== bInNotes) return aInNotes - bInNotes;
      return b.rawHtml.length - a.rawHtml.length;
    });

    canonical.push(sorted[0]);
    for (const dup of sorted.slice(1)) {
      listDuplicates.push({
        file: dup.relPath,
        status: "DUPLICATE_IN_LIST",
        reason: `Same first+last 50 lines as canonical file: ${sorted[0].relPath}`,
      });
    }
  }

  console.log("\nDuplicates within the list (same boundary fingerprint): " + listDuplicates.length);
  listDuplicates.forEach((d) => console.log("  DUP  " + d.file + "\n       -> " + d.reason));
  console.log("\nUnique candidates after list-dedup: " + canonical.length);

  // Step 3: Connect to DB + process canonical files
  console.log("\nConnecting to database...");
  await mongoose.connect(DATABASE_URL!);
  console.log("Connected.\n");

  const results: Result[] = [];
  let savedCount = 0;
  let dbDupCount = 0;
  let emptyCount = 0;
  let errorCount = 0;

  for (let i = 0; i < canonical.length; i++) {
    const rec = canonical[i];
    process.stdout.write(`\r  [${i + 1}/${canonical.length}] Processing: ${rec.relPath.slice(0, 60)}...`);

    try {
      // Parse with cheerio
      const $ = cheerio.load(rec.rawHtml);
      const { title, shouldRemoveH1 } = detectTitle(rec.relPath, $);
      if (shouldRemoveH1) $("h1").first().remove();

      const bodyRaw = $("body").length ? $("body").html() || "" : $.html();
      const sanitized = sanitizeBody(bodyRaw);
      const plainText = sanitized.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

      if (plainText.length < 20) {
        results.push({ file: rec.relPath, status: "EMPTY", title, reason: `Only ${plainText.length} chars after sanitize` });
        emptyCount++;
        continue;
      }

      const contentHash = crypto.createHash("sha256").update(sanitized.trim()).digest("hex");
      // Use smartSlug: falls back to filename when title slug is too generic/short
      const baseSlug = smartSlug(title, rec.relPath);

      // DB duplicate checks
      if (await hashExists(contentHash)) {
        results.push({ file: rec.relPath, status: "DUPLICATE_IN_DB", title, slug: baseSlug, reason: "Content hash already in DB" });
        dbDupCount++;
        continue;
      }
      const uniqueSlug = await makeUniqueSlug(baseSlug);
      const subject = inferSubject(rec.relPath);

      if (!DRY_RUN) {
        await Note.create({
          title, slug: uniqueSlug, content: sanitized, contentHash,
          status: "DRAFT", subject: subject || undefined,
          isEditedSinceImport: false,
        });
      }
      results.push({ file: rec.relPath, status: "SAVED", title, slug: uniqueSlug,
        reason: uniqueSlug !== baseSlug ? `Slug suffixed (${baseSlug} was taken)` : undefined });
      savedCount++;

    } catch (err) {
      results.push({ file: rec.relPath, status: "ERROR", reason: String(err) });
      errorCount++;
    }
  }

  process.stdout.write("\n");
  await mongoose.disconnect();

  // Final Report
  const sep = "=".repeat(70);
  console.log("\n" + sep);
  console.log(DRY_RUN ? "  SMART IMPORT -- DRY RUN RESULTS" : "  SMART IMPORT -- COMPLETE");
  console.log(sep);
  console.log("  Files in list        : " + FILE_LIST.length);
  console.log("  Skipped (stubs/excl) : " + skipped.length);
  console.log("  Duplicates in list   : " + listDuplicates.length);
  console.log("  Duplicates in DB     : " + dbDupCount);
  console.log("  Empty/broken         : " + emptyCount);
  console.log("  Errors               : " + errorCount);
  console.log("  " + (DRY_RUN ? "Would save" : "SAVED") + " as DRAFT   : " + savedCount);
  console.log(sep);

  if (results.filter(r => r.status === "SAVED").length > 0) {
    console.log("\n[SAVED as DRAFT]:");
    results.filter(r => r.status === "SAVED").forEach(r =>
      console.log('  + ' + r.slug + '\n    "' + r.title + '"' + (r.reason ? " [" + r.reason + "]" : ""))
    );
  }

  if (dbDupCount > 0) {
    console.log("\n[DUPLICATE_IN_DB] (already imported, skipped):");
    results.filter(r => r.status === "DUPLICATE_IN_DB").forEach(r =>
      console.log("  = " + r.file + "\n    -> " + r.reason)
    );
  }

  if (emptyCount > 0) {
    console.log("\n[EMPTY/BROKEN]:");
    results.filter(r => r.status === "EMPTY").forEach(r =>
      console.log("  ! " + r.file + " -> " + r.reason)
    );
  }

  if (errorCount > 0) {
    console.log("\n[ERRORS]:");
    results.filter(r => r.status === "ERROR").forEach(r =>
      console.log("  X " + r.file + " -> " + r.reason)
    );
  }

  // Write JSON report
  const reportPath = path.resolve(process.cwd(), "scripts", "smart-import-report.json");
  fs.writeFileSync(reportPath, JSON.stringify({
    runAt: new Date().toISOString(),
    dryRun: DRY_RUN,
    summary: { total: FILE_LIST.length, saved: savedCount, skipped: skipped.length, listDuplicates: listDuplicates.length, dbDuplicates: dbDupCount, empty: emptyCount, errors: errorCount },
    saved: results.filter(r => r.status === "SAVED"),
    listDuplicates,
    dbDuplicates: results.filter(r => r.status === "DUPLICATE_IN_DB"),
    empty: results.filter(r => r.status === "EMPTY"),
    skipped,
    errors: results.filter(r => r.status === "ERROR"),
  }, null, 2), "utf-8");
  console.log("\nReport written to: " + reportPath + "\n");
}

main().catch((err) => { console.error("\nFATAL:", err); process.exit(1); });
