import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "public", "uploads", "social_posts_history.json");

// Helper to ensure social history directory/file exists
function getHistory() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
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
    fs.writeFileSync(DATA_FILE, JSON.stringify(history, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving social history:", err);
  }
}

export async function GET(req: NextRequest) {
  const history = getHistory();
  return NextResponse.json({ success: true, history });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    const history = getHistory();

    if (action === "delete_item") {
      const { id } = body;
      const filtered = history.filter((item: any) => item.id !== id);
      saveHistory(filtered);
      return NextResponse.json({ success: true, history: filtered });
    }

    if (action === "delete_all") {
      saveHistory([]);
      return NextResponse.json({ success: true, history: [] });
    }

    if (action === "update_status") {
      const { id, platform, value } = body;
      const index = history.findIndex((item: any) => item.id === id);
      if (index !== -1) {
        if (platform === "instagram") {
          history[index].status.instagramUploaded = value;
          history[index].status.instagramUploadedAt = value ? new Date().toISOString() : null;
        } else if (platform === "twitter") {
          history[index].status.twitterPosted = value;
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
              fs.writeFileSync(kitFullPath, JSON.stringify(kitData, null, 2), "utf8");
            }
          }
        } catch (e) {
          console.error("Failed to sync kit.json status", e);
        }

        return NextResponse.json({ success: true, item: history[index] });
      }
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

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
      } = body;

      const id = "post-" + Date.now();
      const optA = options?.find((o: any) => o.key === "A")?.text || "A";
      const optB = options?.find((o: any) => o.key === "B")?.text || "B";
      const optC = options?.find((o: any) => o.key === "C")?.text || "C";
      const optD = options?.find((o: any) => o.key === "D")?.text || "D";

      const instagramCaption = `🎯 ${examName} - Daily Special Question! 📚\n\n${questionText}\n${questionTextEn ? `(${questionTextEn})\n` : ""}\n(A) ${optA}\n(B) ${optB}\n(C) ${optC}\n(D) ${optD}\n\n🧠 बिना Google किए कमेंट में अपना A/B/C/D उत्तर बताएँ! 👇\n📌 सही उत्तर और विस्तृत व्याख्या पहले कमेंट (Pinned Comment) में देखें!\n\n---\n🔥 रोज़ाना राजस्थान CET, REET, LDC और RPSC के महत्वपूर्ण प्रश्नों के लिए फॉलो करें:\n👉 @RajasthanExamTwister\n\n#RajasthanGK #RajasthanCET #CET2024 #RSSB #RPSC #RajasthanExams #ExamTwister #StudyMotivation #RajasthanGovtJobs`;

      const pinnedComment = `📌 सही उत्तर: (${correctOption || "D"}) ✅\n\n📖 व्याख्या:\n${explanation || "विस्तृत व्याख्या जल्द अपडेट की जाएगी।"}\n\n🎯 क्या आपका उत्तर सही था? कमेंट में लाइक और शेयर करें!`;

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
        correctOption: correctOption || "D",
        explanation: explanation || "",
        instagramImageUrl: "/uploads/cet_q1_insta_reel.jpg",
        twitterImageUrl: "/uploads/cet_q1_twitter_card.jpg",
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

      return NextResponse.json({ success: true, item: newPost });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("Social studio error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
