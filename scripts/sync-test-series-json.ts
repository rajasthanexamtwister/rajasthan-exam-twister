import "dotenv/config";
import fs from "fs";
import path from "path";
import { connectToDatabase } from "../server/lib/mongodb";
import { Quiz } from "../server/models/Quiz";
import { TestSeries } from "../server/models/TestSeries";

interface PaperSpec {
  quizSlug?: string;
  title: string;
  testType?: "FULL_MOCK" | "SECTIONAL" | "TOPIC_TEST" | "PREVIOUS_YEAR";
  order: number;
  isFreeDemo: boolean;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  negativeMarksPerQuestion?: number;
  marksPerQuestion?: number;
}

interface TestSeriesSpec {
  title: string;
  slug: string;
  description: string;
  targetExam: string;
  examCategorySlug: string;
  features: string[];
  totalTestsCount: number;
  freeTestsCount: number;
  totalQuestionsCount: number;
  language: string;
  enrolledCount: number;
  rating: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  papers: PaperSpec[];
}

export async function syncTestSeriesFromFiles(): Promise<void> {
  await connectToDatabase();

  const dirPath = path.join(process.cwd(), "question-bank/seeds/test-series");
  if (!fs.existsSync(dirPath)) {
    console.error(`❌ Directory not found: ${dirPath}`);
    return;
  }

  const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".json"));
  console.log(`Found ${files.length} test series JSON files in ${dirPath}`);

  // Fallback published quizzes for unlinked mock papers
  const fallbackQuizzes = await Quiz.find({ status: "PUBLISHED" }).limit(10).lean();

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const content = fs.readFileSync(fullPath, "utf-8");
    const spec: TestSeriesSpec = JSON.parse(content);

    console.log(`\nSyncing Test Series: "${spec.title}" (${spec.slug})`);

    const quizzesForDb = [];

    for (let i = 0; i < spec.papers.length; i++) {
      const p = spec.papers[i];
      let linkedQuizId = null;

      if (p.quizSlug) {
        const found = await Quiz.findOne({ slug: p.quizSlug }).lean();
        if (found) {
          linkedQuizId = found._id;
          console.log(`  🔗 Paper #${p.order} "${p.title}" -> linked to Quiz: ${p.quizSlug} (${found._id})`);
        } else {
          console.warn(`  ⚠️ Quiz with slug "${p.quizSlug}" not found in DB`);
        }
      }

      if (!linkedQuizId && fallbackQuizzes.length > 0) {
        // Assign fallback published quiz if none specific
        const fallback = fallbackQuizzes[i % fallbackQuizzes.length];
        linkedQuizId = fallback._id;
      }

      quizzesForDb.push({
        quizId: linkedQuizId,
        title: p.title,
        testType: p.testType || "FULL_MOCK",
        order: p.order,
        isFreeDemo: Boolean(p.isFreeDemo),
        durationMinutes: p.durationMinutes,
        totalQuestions: p.totalQuestions,
        totalMarks: p.totalMarks,
      });
    }

    const seriesData = {
      title: spec.title,
      slug: spec.slug,
      description: spec.description,
      targetExam: spec.targetExam,
      examCategorySlug: spec.examCategorySlug,
      features: spec.features,
      totalTestsCount: spec.totalTestsCount || quizzesForDb.length,
      freeTestsCount: spec.freeTestsCount || 1,
      totalQuestionsCount:
        spec.totalQuestionsCount || quizzesForDb.reduce((sum, q) => sum + q.totalQuestions, 0),
      language: spec.language || "Hindi & English (Bilingual)",
      enrolledCount: spec.enrolledCount || 1000,
      rating: spec.rating || 4.8,
      status: spec.status || "PUBLISHED",
      quizzes: quizzesForDb,
    };

    const doc = await TestSeries.findOneAndUpdate({ slug: spec.slug }, seriesData, {
      upsert: true,
      new: true,
    });

    console.log(`  ✅ Synced: ${doc.title} (${doc.quizzes.length} papers)`);
  }

  console.log(`\n🎉 All ${files.length} test series JSONs synced to database successfully!`);
}

// If run directly
if (require.main === module || process.argv[1]?.includes("sync-test-series-json")) {
  syncTestSeriesFromFiles()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Sync error:", err);
      process.exit(1);
    });
}
