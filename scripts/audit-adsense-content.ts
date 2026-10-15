import "dotenv/config";
import { connectToDatabase } from "../server/lib/mongodb";
import { Blog } from "../server/models/Blog";
import { Note } from "../server/models/Note";
import { Quiz } from "../server/models/Quiz";
import { QuizQuestion } from "../server/models/QuizQuestion";

async function main() {
  await connectToDatabase();

  console.log("=== CONTENT INVENTORY AUDIT FOR ADSENSE ===");

  // 1. Blogs
  const blogs = await Blog.find({ status: "PUBLISHED" }).select("title slug content excerpt wordCount publishedAt").lean();
  console.log(`\n--- PUBLISHED BLOGS: ${blogs.length} ---`);
  blogs.forEach((b: any, i: number) => {
    const rawLen = (b.content || "").replace(/<[^>]*>/g, "").trim().length;
    const approxWords = (b.content || "").replace(/<[^>]*>/g, "").trim().split(/\s+/).length;
    console.log(`${i + 1}. [${b.slug}] ${b.title}`);
    console.log(`   Words: ~${approxWords} | Length: ${rawLen} chars | Published: ${b.publishedAt}`);
  });

  // 2. Notes
  const notes = await Note.find({ status: "PUBLISHED" }).select("title slug content images publishedAt").lean();
  console.log(`\n--- PUBLISHED NOTES: ${notes.length} ---`);
  notes.forEach((n: any, i: number) => {
    const rawLen = (n.content || "").replace(/<[^>]*>/g, "").trim().length;
    const approxWords = (n.content || "").replace(/<[^>]*>/g, "").trim().split(/\s+/).length;
    console.log(`${i + 1}. [${n.slug}] ${n.title}`);
    console.log(`   Words: ~${approxWords} | Images: ${n.images?.length || 0} | Published: ${n.publishedAt}`);
  });

  // 3. Quizzes
  const quizzes = await Quiz.find({ status: "PUBLISHED" }).select("title slug subject difficulty questionCount").lean();
  console.log(`\n--- PUBLISHED QUIZZES: ${quizzes.length} ---`);
  for (const q of quizzes) {
    const qCount = await QuizQuestion.countDocuments({ quizId: q._id });
    console.log(`- [${(q as any).slug}] ${(q as any).title} (Subject: ${(q as any).subject || "N/A"}, Questions: ${qCount})`);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
