import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import fs from "fs";
import path from "path";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Blog } from "@/server/models/Blog";
import { Media } from "@/server/models/Media";
import { Admin } from "@/server/models/Admin";

const ARTIFACT_DIR = `C:\\Users\\Chirag Bhoi\\.gemini\\antigravity-ide\\brain\\9193921d-a096-4ad2-9662-388c74d73020`;
const BRAND_DIR = path.join(process.cwd(), "public", "brand");

// Mapping generated artifact image to public/brand filename and blog topics
const BANNER_DEFINITIONS = [
  {
    artifactPattern: "rajasthan_history_banner",
    targetFilename: "rajasthan-forts-history.jpg",
    altText: "Rajasthan Forts, Monuments & Ancient History Comprehensive Guide",
    caption: "Rajasthan History & Architecture Notes — Rajasthan Exam Twister",
    slugKeywords: ["durg", "kile", "lok", "mele", "history", "itihas"],
  },
  {
    artifactPattern: "rajasthan_geography_banner",
    targetFilename: "rajasthan-geography-maps.jpg",
    altText: "Rajasthan Geography, 50 Districts, Rivers & Lakes Study Notes",
    caption: "Rajasthan Geography & Map Guide — Rajasthan Exam Twister",
    slugKeywords: ["50", "nadiyan", "jheelein", "khanij", "geography", "bhugol"],
  },
  {
    artifactPattern: "rajasthan_art_culture_banner",
    targetFilename: "rajasthan-art-culture.jpg",
    altText: "Rajasthan Art, Culture, Folk Dances, Handicrafts & Tribes Guide",
    caption: "Rajasthan Art & Culture Study Notes — Rajasthan Exam Twister",
    slugKeywords: ["art-culture", "art-ki", "janjati", "nritya", "kala", "sanskriti"],
  },
  {
    artifactPattern: "rajasthan_economy_budget_banner",
    targetFilename: "rajasthan-economy-budget.jpg",
    altText: "Rajasthan Economy, Budget 2026-27 & Government Welfare Schemes",
    caption: "Rajasthan Economy & Budget Guide — Rajasthan Exam Twister",
    slugKeywords: ["2026-27", "2025-26", "yojana", "2026-ka", "economy", "budget", "arthvyavastha"],
  },
  {
    artifactPattern: "rajasthan_polity_banner",
    targetFilename: "rajasthan-polity-governance.jpg",
    altText: "Rajasthan Polity, Governance, Vidhan Sabha & High Court Notes",
    caption: "Rajasthan Polity & Administrative Setup — Rajasthan Exam Twister",
    slugKeywords: ["polity", "rajyavastha", "vidhan-sabha", "samvidhan"],
  },
  {
    artifactPattern: "rajasthan_recruitment_exam_banner",
    targetFilename: "rajasthan-rpsc-recruitment.jpg",
    altText: "Rajasthan Competitive Recruitment Exams (REET, RAS, Teacher, Police, VDO, CET) Preparation",
    caption: "Rajasthan Recruitment & Exam Preparation Notes — Rajasthan Exam Twister",
    slugKeywords: ["reet", "1st-2nd", "cet-2026", "recruitment", "pet-exam", "vdo", "ras", "preparation", "exam-rajasthan"],
  },
];

async function main() {
  console.log("Connecting to database...");
  await connectToDatabase();

  // Find admin user to attribute media
  let admin = await Admin.findOne();
  const adminId = admin ? admin._id : null;

  if (!fs.existsSync(BRAND_DIR)) {
    fs.mkdirSync(BRAND_DIR, { recursive: true });
  }

  // Find files in artifact dir
  const artifactFiles = fs.readdirSync(ARTIFACT_DIR);

  const mediaMap: Record<string, any> = {};

  for (const banner of BANNER_DEFINITIONS) {
    const matchedFile = artifactFiles.find((f) => f.startsWith(banner.artifactPattern) && f.endsWith(".jpg"));
    if (!matchedFile) {
      console.warn(`Warning: Could not find artifact file matching ${banner.artifactPattern}`);
      continue;
    }

    const srcPath = path.join(ARTIFACT_DIR, matchedFile);
    const destPath = path.join(BRAND_DIR, banner.targetFilename);
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${matchedFile} -> public/brand/${banner.targetFilename}`);

    const publicUrl = `/brand/${banner.targetFilename}`;

    // Create or find Media document in MongoDB
    let mediaDoc = await Media.findOne({ url: publicUrl });
    if (!mediaDoc) {
      mediaDoc = await Media.create({
        filename: banner.targetFilename,
        url: publicUrl,
        mimeType: "image/jpeg",
        size: fs.statSync(destPath).size,
        dimensions: { width: 1200, height: 675 },
        altText: banner.altText,
        caption: banner.caption,
        folder: "brand",
        uploadedBy: adminId,
      });
      console.log(`Created Media document for ${banner.targetFilename} (ID: ${mediaDoc._id})`);
    } else {
      mediaDoc.altText = banner.altText;
      mediaDoc.caption = banner.caption;
      mediaDoc.dimensions = { width: 1200, height: 675 };
      await mediaDoc.save();
      console.log(`Updated existing Media document for ${banner.targetFilename}`);
    }

    mediaMap[banner.targetFilename] = mediaDoc;
  }

  // Now retrieve all blogs
  const allBlogs = await Blog.find({});
  console.log(`Total blogs found in database: ${allBlogs.length}`);

  let updatedCount = 0;

  for (const blog of allBlogs) {
    if (blog.coverImageId) {
      console.log(`- Skipping blog already having coverImage: ${blog.slug}`);
      continue;
    }

    // Determine the best banner matching slug keywords
    let matchedBanner = BANNER_DEFINITIONS.find((b) =>
      b.slugKeywords.some((keyword) => blog.slug.toLowerCase().includes(keyword.toLowerCase()))
    );

    // Default fallback banner if not specifically matched
    if (!matchedBanner) {
      matchedBanner = BANNER_DEFINITIONS.find((b) => b.targetFilename === "rajasthan-rpsc-recruitment.jpg");
    }

    if (matchedBanner && mediaMap[matchedBanner.targetFilename]) {
      const media = mediaMap[matchedBanner.targetFilename];
      blog.coverImageId = media._id;
      await blog.save();
      console.log(`+ Attached [${matchedBanner.targetFilename}] to blog: ${blog.slug}`);
      updatedCount++;
    }
  }

  console.log(`\nSuccessfully updated ${updatedCount} blogs with responsive featured cover images!`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Error updating blog cover images:", err);
  process.exit(1);
});
