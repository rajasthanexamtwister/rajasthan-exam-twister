import "dotenv/config";
import mongoose from "mongoose";
import { connectToDatabase } from "../server/lib/mongodb";
import { Category } from "../server/models/Category";
import { Quiz } from "../server/models/Quiz";
import { Note } from "../server/models/Note";

async function main() {
  await connectToDatabase();

  console.log("=== 1. ALL CATEGORIES IN DB ===");
  const allCategories = await Category.find({}).lean();
  console.log(
    allCategories.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      slug: c.slug,
      createdAt: c.createdAt,
    }))
  );

  console.log("\n=== 2. CHECK FOR EXISTING 'rajasthan-ka-itihas' SLUG ===");
  const existingItihasSlug = await Category.findOne({ slug: "rajasthan-ka-itihas" }).lean();
  console.log("Category with slug 'rajasthan-ka-itihas':", existingItihasSlug);

  console.log("\n=== 3. CHECK THE UNTITLED CATEGORY RECORD ===");
  const untitledCat = await Category.findById("6acf4053760a3cfef19d23f1").lean();
  console.log("Untitled category record:", untitledCat);

  console.log("\n=== 4. QUIZZES REFERENCING THIS CATEGORY ID ===");
  const quizzesById = await Quiz.find({ categoryId: "6acf4053760a3cfef19d23f1" }).select("title slug subject").lean();
  console.log(`Found ${quizzesById.length} quizzes referencing categoryId 6acf4053760a3cfef19d23f1:`);
  console.log(quizzesById);

  console.log("\n=== 5. QUIZZES WITH SUBJECT 'राजस्थान का इतिहास' OR 'rajasthan-ka-itihas' ===");
  const quizzesBySubject = await Quiz.find({
    $or: [{ subject: "राजस्थान का इतिहास" }, { subjectSlug: "rajasthan-ka-itihas" }],
  })
    .select("title slug subject subjectSlug categoryId")
    .lean();
  console.log(`Found ${quizzesBySubject.length} quizzes by subject/subjectSlug:`);
  quizzesBySubject.slice(0, 5).forEach((q) => console.log(`- ${q.title} (slug: ${q.slug}, categoryId: ${q.categoryId})`));

  console.log("\n=== 6. NOTES REFERENCING THIS CATEGORY ===");
  const notes = await Note.find({
    $or: [{ categoryId: "6acf4053760a3cfef19d23f1" }, { subject: "राजस्थान का इतिहास" }],
  })
    .select("title slug subject categoryId")
    .lean();
  console.log(`Found ${notes.length} notes referencing this category/subject.`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
