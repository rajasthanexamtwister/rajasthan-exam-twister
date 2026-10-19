import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

const DATA_FILE = path.join(process.cwd(), "public", "uploads", "social_posts_history.json");

// Configure Cloudinary if credentials are available
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

// Upload a local file to Cloudinary
async function uploadToCloudinary(
  localRelativePath: string,
  folder: string = "rajasthan_exam_twister/social_kits"
): Promise<{ url: string; publicId: string } | null> {
  const isConfigured = initCloudinary();
  if (!isConfigured) return null;

  try {
    const cleanRel = localRelativePath.replace(/^\//, "");
    const absolutePath = path.join(process.cwd(), "public", cleanRel);
    if (!fs.existsSync(absolutePath)) {
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
            console.error("Cloudinary upload stream error:", error);
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
    console.error("Failed to upload to Cloudinary:", err);
    return null;
  }
}

// Delete image from Cloudinary by public ID
async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  const isConfigured = initCloudinary();
  if (!isConfigured || !publicId) return false;

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result?.result === "ok";
  } catch (err) {
    console.error("Failed to delete from Cloudinary:", err);
    return false;
  }
}

// Helper to ensure social history directory/file exists
function getHistory() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), "utf8");
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading social history:", err);
    return [];
  }
}

function saveHistory(history: any[]) {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(history, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving social history:", err);
  }
}

// Get storage summary and unuploaded warning flags
function getStorageStats(history: any[]) {
  const isConfigured = initCloudinary();
  const total = history.length;
  const unuploaded = history.filter(
    (h: any) => !h.status?.instagramUploaded
  ).length;
  const fullyUploaded = history.filter(
    (h: any) => h.status?.instagramUploaded
  ).length;

  // Track the most recently uploaded question
  const uploadedItems = history
    .filter((h: any) => h.status?.instagramUploaded)
    .sort((a: any, b: any) => {
      const timeA = new Date(a.status?.instagramUploadedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.status?.instagramUploadedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });

  const lastUploaded = uploadedItems.length > 0 ? {
    id: uploadedItems[0].id,
    questionNumber: uploadedItems[0].questionNumber,
    questionText: uploadedItems[0].questionText,
    date: uploadedItems[0].date,
    uploadedAt: uploadedItems[0].status?.instagramUploadedAt,
  } : null;

  let warning: string | null = null;
  if (unuploaded > 0) {
    warning = `पेंडिंग कतार: आपके पास ${unuploaded} सवाल बाकी हैं। जैसे ही आप 'Mark Uploaded' करेंगे, वह पेंडिंग लिस्ट से हट जाएगा और इतिहास में सुरक्षित रहेगा।`;
  } else if (total > 0 && unuploaded === 0) {
    warning = `शानदार! सभी ${total} सवाल इंस्टाग्राम पर अपलोड हो चुके हैं। कोई भी पेंडिंग सवाल नहीं बचा है।`;
  }

  return {
    total,
    unuploaded,
    fullyUploaded,
    lastUploaded,
    cloudinaryConfigured: isConfigured,
    warning,
    hasUnuploadedBacklog: unuploaded > 0,
    storageLimitReached: total >= 50,
  };
}

export async function GET(req: NextRequest) {
  const history = getHistory();
  const stats = getStorageStats(history);
  return NextResponse.json({ success: true, history, stats });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;
    const history = getHistory();

    // 1. SYNC ALL LOCAL IMAGES TO CLOUDINARY
    if (action === "sync_cloudinary") {
      const isConfigured = initCloudinary();
      if (!isConfigured) {
        return NextResponse.json(
          {
            success: false,
            error: "Cloudinary credentials (CLOUDINARY_URL or CLOUD_NAME/KEY/SECRET) not found in environment.",
          },
          { status: 400 }
        );
      }

      let updatedCount = 0;
      for (const item of history) {
        let modified = false;

        // Upload Instagram Reel image if local
        if (
          item.instagramImageUrl &&
          !item.instagramImageUrl.startsWith("http://res.cloudinary.com") &&
          !item.instagramImageUrl.startsWith("https://res.cloudinary.com")
        ) {
          const res = await uploadToCloudinary(item.instagramImageUrl);
          if (res) {
            item.instagramImageUrl = res.url;
            item.cloudinaryReelPublicId = res.publicId;
            modified = true;
          }
        }

        // Upload Twitter image if local
        if (
          item.twitterImageUrl &&
          !item.twitterImageUrl.startsWith("http://res.cloudinary.com") &&
          !item.twitterImageUrl.startsWith("https://res.cloudinary.com")
        ) {
          const res = await uploadToCloudinary(item.twitterImageUrl);
          if (res) {
            item.twitterImageUrl = res.url;
            item.cloudinaryTwitterPublicId = res.publicId;
            modified = true;
          }
        }

        if (modified) {
          updatedCount++;
          // Update individual kit.json if present
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
      }

      saveHistory(history);
      const stats = getStorageStats(history);
      return NextResponse.json({
        success: true,
        message: `Successfully uploaded ${updatedCount} kit images to Cloudinary!`,
        updatedCount,
        history,
        stats,
      });
    }

    // 2. AUTO-CLEANUP UPLOADED IMAGES
    if (action === "cleanup_uploaded") {
      let cleanedCount = 0;
      const remainingHistory: any[] = [];

      for (const item of history) {
        const isFullyUploaded =
          item.status?.instagramUploaded && item.status?.twitterPosted;

        if (isFullyUploaded) {
          // Delete from Cloudinary
          if (item.cloudinaryReelPublicId) {
            await deleteFromCloudinary(item.cloudinaryReelPublicId);
          }
          if (item.cloudinaryTwitterPublicId) {
            await deleteFromCloudinary(item.cloudinaryTwitterPublicId);
          }

          // Delete local files
          try {
            if (item.relativePaths?.reelImage) {
              const reelPath = path.join(process.cwd(), "public", item.relativePaths.reelImage.replace(/^\//, ""));
              if (fs.existsSync(reelPath)) fs.unlinkSync(reelPath);
            }
            if (item.relativePaths?.twitterImage) {
              const twPath = path.join(process.cwd(), "public", item.relativePaths.twitterImage.replace(/^\//, ""));
              if (fs.existsSync(twPath)) fs.unlinkSync(twPath);
            }
          } catch (e) {
            console.error("Failed to delete local files:", e);
          }

          cleanedCount++;
        } else {
          remainingHistory.push(item);
        }
      }

      saveHistory(remainingHistory);
      const stats = getStorageStats(remainingHistory);
      return NextResponse.json({
        success: true,
        message: `Cleaned up ${cleanedCount} uploaded questions and deleted their images from Cloudinary & storage.`,
        cleanedCount,
        history: remainingHistory,
        stats,
      });
    }

    // 3. DELETE SINGLE ITEM
    if (action === "delete_item") {
      const { id } = body;
      const target = history.find((item: any) => item.id === id);

      if (target) {
        // Delete from Cloudinary
        if (target.cloudinaryReelPublicId) {
          await deleteFromCloudinary(target.cloudinaryReelPublicId);
        }
        if (target.cloudinaryTwitterPublicId) {
          await deleteFromCloudinary(target.cloudinaryTwitterPublicId);
        }

        // Delete local folder
        try {
          if (target.relativePaths?.kitJson) {
            const kitDir = path.dirname(
              path.join(process.cwd(), "public", target.relativePaths.kitJson.replace(/^\//, ""))
            );
            if (fs.existsSync(kitDir)) {
              fs.rmSync(kitDir, { recursive: true, force: true });
            }
          }
        } catch (e) {
          console.error("Failed to delete local folder:", e);
        }
      }

      const filtered = history.filter((item: any) => item.id !== id);
      saveHistory(filtered);
      const stats = getStorageStats(filtered);
      return NextResponse.json({ success: true, history: filtered, stats });
    }

    // 4. DELETE ALL ITEMS
    if (action === "delete_all") {
      for (const item of history) {
        if (item.cloudinaryReelPublicId) {
          await deleteFromCloudinary(item.cloudinaryReelPublicId);
        }
        if (item.cloudinaryTwitterPublicId) {
          await deleteFromCloudinary(item.cloudinaryTwitterPublicId);
        }
      }

      saveHistory([]);
      const stats = getStorageStats([]);
      return NextResponse.json({ success: true, history: [], stats });
    }

    // 5. UPDATE STATUS (Mark Uploaded)
    if (action === "update_status") {
      const { id, platform, value } = body;
      const index = history.findIndex((item: any) => item.id === id);
      if (index !== -1) {
        if (!history[index].status) {
          history[index].status = {
            instagramUploaded: false,
            instagramUploadedAt: null,
            twitterPosted: false,
            twitterPostedAt: null,
          };
        }
        if (platform === "instagram") {
          history[index].status.instagramUploaded = Boolean(value);
          history[index].status.instagramUploadedAt = value ? new Date().toISOString() : null;
          if (value && !history[index].uploadSequence) {
            const alreadyUploadedCount = history.filter((h: any) => h.status?.instagramUploaded).length;
            history[index].uploadSequence = alreadyUploadedCount;
          }
        } else if (platform === "twitter") {
          history[index].status.twitterPosted = Boolean(value);
          history[index].status.twitterPostedAt = value ? new Date().toISOString() : null;
        }
        saveHistory(history);

        // Also update individual kit.json if path is present
        try {
          const kitRelPath = history[index].relativePaths?.kitJson;
          if (kitRelPath) {
            const kitFullPath = path.join(process.cwd(), "public", kitRelPath.replace(/^\//, ""));
            if (fs.existsSync(kitFullPath)) {
              const kitData = JSON.parse(fs.readFileSync(kitFullPath, "utf8"));
              kitData.status = history[index].status;
              if (history[index].uploadSequence) {
                kitData.uploadSequence = history[index].uploadSequence;
              }
              fs.writeFileSync(kitFullPath, JSON.stringify(kitData, null, 2), "utf8");
            }
          }
        } catch (e) {
          console.error("Failed to sync kit.json status", e);
        }

        const stats = getStorageStats(history);
        const isFullyUploaded = Boolean(
          history[index].status.instagramUploaded && history[index].status.twitterPosted
        );

        return NextResponse.json({
          success: true,
          item: history[index],
          isFullyUploaded,
          stats,
        });
      }
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

    // 6. CREATE CUSTOM KIT WITH CLOUDINARY UPLOAD & DUPLICATE PREVENTION
    if (action === "create_custom" || action === "generate_kit") {
      const {
        questionText,
        questionTextEn,
        options,
        correctOption,
        explanation,
        examName = "Rajasthan CET / RSMSSB 2024",
        subject = "Rajasthan GK / सामान्य ज्ञान",
        topic = "General GK",
        date = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        force = false,
      } = body;

      if (!questionText || questionText.trim().length < 5) {
        return NextResponse.json(
          { success: false, error: "कृपया एक वैध प्रश्न दर्ज करें (कम से कम 5 अक्षर)!" },
          { status: 400 }
        );
      }

      // STRICT DUPLICATE PREVENTION GUARD
      const cleanNewText = questionText.trim().toLowerCase().replace(/[^\w\s\u0900-\u097F]/gi, "");
      const duplicateFound = history.find((h: any) => {
        const cleanExisting = (h.questionText || "").trim().toLowerCase().replace(/[^\w\s\u0900-\u097F]/gi, "");
        return cleanExisting.length > 5 && (cleanExisting === cleanNewText || cleanExisting.includes(cleanNewText) || cleanNewText.includes(cleanExisting));
      });

      if (duplicateFound) {
        return NextResponse.json(
          {
            success: false,
            error: `डुप्लीकेट अलर्ट: यह प्रश्न पहले से मौजूद है (#${duplicateFound.id} - ${duplicateFound.date})! एक ही सवाल दोबारा पोस्ट नहीं किया जा सकता।`,
            duplicateItem: duplicateFound,
          },
          { status: 400 }
        );
      }

      const stats = getStorageStats(history);

      // Warning check if unuploaded backlog exists and force is not set
      if (!force && stats.unuploaded >= 30) {
        return NextResponse.json(
          {
            success: false,
            needsConfirmation: true,
            warning: `चेतावनी: आपके पास पहले से ${stats.unuploaded} अन-अपलोड प्रश्न हैं! नया प्रश्न जोड़ने से पहले पुराने प्रश्नों को इंस्टाग्राम/ट्विटर पर पोस्ट करें या मार्क करें ताकि स्टोरेज ओवरफ्लो न हो।`,
            stats,
          },
          { status: 400 }
        );
      }

      const id = "post-" + Date.now();
      const optA = options?.find((o: any) => o.key === "A")?.text || "A";
      const optB = options?.find((o: any) => o.key === "B")?.text || "B";
      const optC = options?.find((o: any) => o.key === "C")?.text || "C";
      const optD = options?.find((o: any) => o.key === "D")?.text || "D";

      const instagramCaption = `🎯 ${examName} - Daily Special Question! 📚\n\n${questionText}\n${
        questionTextEn ? `(${questionTextEn})\n` : ""
      }\n(A) ${optA}\n(B) ${optB}\n(C) ${optC}\n(D) ${optD}\n\n🧠 बिना Google किए कमेंट में अपना A/B/C/D उत्तर बताएँ! 👇\n📌 सही उत्तर और विस्तृत व्याख्या पहले कमेंट (Pinned Comment) में देखें!\n\n---\n🔥 रोज़ाना राजस्थान CET, REET, LDC और RPSC के महत्वपूर्ण प्रश्नों के लिए फॉलो करें:\n👉 @RajasthanExamTwister\n\n#RajasthanGK #RajasthanCET #CET2024 #RSSB #RPSC #RajasthanExams #ExamTwister #StudyMotivation #RajasthanGovtJobs`;

      const pinnedComment = `📌 सही उत्तर: (${correctOption || "A"}) ✅\n\n📖 व्याख्या:\n${
        explanation || "विस्तृत व्याख्या जल्द अपडेट की जाएगी।"
      }\n\n🎯 क्या आपका उत्तर सही था? कमेंट में लाइक और शेयर करें!`;

      const tweetText = `📚 ${examName} Question:\n\n${questionText}\n\nA) ${optA}\nB) ${optB}\nC) ${optC}\nD) ${optD}\n\n💡 बिना Google किए सही उत्तर कमेंट में बताएं! 👇\n\n#RajasthanGK #CET2024 #RajasthanCET #RSSB #ExamTwister`;

      const newPost = {
        id,
        date,
        examName,
        subject,
        topic,
        questionText,
        questionTextEn: questionTextEn || "",
        options: options || [
          { key: "A", text: optA },
          { key: "B", text: optB },
          { key: "C", text: optC },
          { key: "D", text: optD, isCorrect: true },
        ],
        correctOption: correctOption || "A",
        explanation: explanation || "",
        instagramImageUrl: "/uploads/social-kits/rajasthan-cet-sr-secondary/2024/question-1/reel_9_16.jpg",
        twitterImageUrl: "/uploads/social-kits/rajasthan-cet-sr-secondary/2024/question-1/twitter_card.jpg",
        instagramCaption,
        pinnedComment,
        suggestedSongs: [
          { title: "Aarambh Hai Prachand (Beats)", mood: "High Energy / Exam Motivation", tag: "Motivational" },
          { title: "Rajasthan Dhol Beats (Fast Bass)", mood: "High Engagement / Reel Trend", tag: "Trending" },
          { title: "Kesariya Balam Heritage Fusion", mood: "Cultural / Royal Rajasthan", tag: "Folk" },
          { title: "Midnight Study Lo-Fi Chill Beats", mood: "Focused Study Session", tag: "Lo-Fi" },
        ],
        tweetText,
        status: {
          instagramUploaded: false,
          instagramUploadedAt: null,
          twitterPosted: false,
          twitterPostedAt: null,
        },
        createdAt: new Date().toISOString(),
      };

      history.unshift(newPost);
      saveHistory(history);

      const updatedStats = getStorageStats(history);
      return NextResponse.json({ success: true, item: newPost, stats: updatedStats });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("Social studio error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
