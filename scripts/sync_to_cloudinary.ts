import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") });

const DATA_FILE = path.join(process.cwd(), "public", "uploads", "social_posts_history.json");

function initCloudinary(): boolean {
  if (process.env.CLOUDINARY_URL) {
    const raw = process.env.CLOUDINARY_URL.replace(/^["']|["']$/g, "").trim();
    const match = raw.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
    if (match) {
      cloudinary.config({
        cloud_name: match[3],
        api_key: match[1],
        api_secret: match[2],
        secure: true,
      });
      return true;
    }
    cloudinary.config({
      cloudinary_url: raw,
    });
    return true;
  }
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME.trim(),
      api_key: process.env.CLOUDINARY_API_KEY.trim(),
      api_secret: process.env.CLOUDINARY_API_SECRET.trim(),
      secure: true,
    });
    return true;
  }
  return false;
}

async function uploadFile(
  localRelPath: string,
  folder: string = "rajasthan_exam_twister/social_kits"
): Promise<{ url: string; publicId: string } | null> {
  try {
    const cleanRel = localRelPath.replace(/^\//, "");
    const absolutePath = path.join(process.cwd(), "public", cleanRel);
    if (!fs.existsSync(absolutePath)) {
      console.warn(`File not found: ${absolutePath}`);
      return null;
    }

    const fileBuffer = fs.readFileSync(absolutePath);
    const baseName = path.parse(cleanRel).name;
    const publicId = `${baseName}_${Date.now()}`;

    return new Promise((resolve) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: "image",
          overwrite: true,
        },
        (error, result?: UploadApiResponse) => {
          if (error || !result) {
            console.error(`Cloudinary upload failed for ${cleanRel}:`, error);
            resolve(null);
          } else {
            resolve({
              url: result.secure_url || result.url,
              publicId: result.public_id,
            });
          }
        }
      );
      uploadStream.end(fileBuffer);
    });
  } catch (err) {
    console.error(`Error uploading ${localRelPath}:`, err);
    return null;
  }
}

async function main() {
  console.log("☁️  Starting Cloudinary Sync for Social Media Kits...");

  const isConfigured = initCloudinary();
  if (!isConfigured) {
    console.error("❌ CLOUDINARY_URL or credentials not found in .env/.env.local!");
    process.exit(1);
  }

  if (!fs.existsSync(DATA_FILE)) {
    console.error(`❌ Data file not found: ${DATA_FILE}`);
    process.exit(1);
  }

  const history = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  console.log(`Found ${history.length} kits in history. Syncing...`);

  let count = 0;
  for (let i = 0; i < history.length; i++) {
    const item = history[i];
    console.log(`[${i + 1}/${history.length}] Uploading Kit #${item.questionNumber || i + 1}...`);

    // Instagram Reel Image
    if (
      item.instagramImageUrl &&
      !item.instagramImageUrl.startsWith("http://res.cloudinary.com") &&
      !item.instagramImageUrl.startsWith("https://res.cloudinary.com")
    ) {
      const res = await uploadFile(item.instagramImageUrl);
      if (res) {
        item.instagramImageUrl = res.url;
        item.cloudinaryReelPublicId = res.publicId;
      }
    }

    // Twitter Card Image
    if (
      item.twitterImageUrl &&
      !item.twitterImageUrl.startsWith("http://res.cloudinary.com") &&
      !item.twitterImageUrl.startsWith("https://res.cloudinary.com")
    ) {
      const res = await uploadFile(item.twitterImageUrl);
      if (res) {
        item.twitterImageUrl = res.url;
        item.cloudinaryTwitterPublicId = res.publicId;
      }
    }

    count++;

    // Sync kit.json if present
    try {
      if (item.relativePaths?.kitJson) {
        const kitPath = path.join(process.cwd(), "public", item.relativePaths.kitJson.replace(/^\//, ""));
        if (fs.existsSync(kitPath)) {
          const kitData = JSON.parse(fs.readFileSync(kitPath, "utf8"));
          kitData.instagramImageUrl = item.instagramImageUrl;
          kitData.twitterImageUrl = item.twitterImageUrl;
          kitData.cloudinaryReelPublicId = item.cloudinaryReelPublicId;
          kitData.cloudinaryTwitterPublicId = item.cloudinaryTwitterPublicId;
          fs.writeFileSync(kitPath, JSON.stringify(kitData, null, 2), "utf8");
        }
      }
    } catch (e) {
      console.error("Failed to sync kit.json", e);
    }
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(history, null, 2), "utf8");
  console.log(`✅ Successfully synced ${count} kits to Cloudinary and updated database!`);
}

main().catch(console.error);
