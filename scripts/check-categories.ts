import "dotenv/config";
import { connectToDatabase } from "../server/lib/mongodb";
import { Category } from "../server/models/Category";
import { Quiz } from "../server/models/Quiz";

async function main() {
  await connectToDatabase();
  const categories = await Category.find({}).lean();
  console.log("=== EXISTING CATEGORIES ===");
  console.log(JSON.stringify(categories.map(c => ({ id: c._id, name: c.name, slug: c.slug })), null, 2));

  const hindiQuizzes = await Quiz.find({ $or: [{ subject: /हिन्दी/i }, { title: /भाषा/i }] }).select("title slug subject").lean();
  console.log("\n=== EXISTING HINDI/BHASHA QUIZZES ===");
  console.log(JSON.stringify(hindiQuizzes, null, 2));

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
