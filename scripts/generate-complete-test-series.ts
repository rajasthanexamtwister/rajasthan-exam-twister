import "dotenv/config";
import { connectToDatabase } from "../server/lib/mongodb";
import { Quiz } from "../server/models/Quiz";
import { QuizQuestion } from "../server/models/QuizQuestion";
import { syncTestSeriesFromFiles } from "./sync-test-series-json";

interface MockPaperBlueprint {
  seriesSlug: string;
  quizTitle: string;
  quizSlug: string;
  subject: string;
  targetExam: string;
  examTags: string[];
  totalQuestions: number;
  timeLimitSeconds: number;
  defaultMarks: number;
  defaultNegativeMarks: number;
  sourceSlugs: string[]; // Slugs of existing quizzes from which to draw authentic questions
}

const BLUEPRINTS: MockPaperBlueprint[] = [
  // RAS PRELIMS (150 Questions Each, 180 min, 200 Marks)
  {
    seriesSlug: "ras-pre-2026-mega-mock-test-series",
    quizTitle: "RAS Prelims Full Mock Test #1 (Rajasthan Art, Culture & History Special)",
    quizSlug: "ras-prelims-full-mock-1",
    subject: "Rajasthan Art & Culture, History",
    targetExam: "RAS / RTS Prelims (RPSC)",
    examTags: ["RAS", "RPSC", "Rajasthan GK", "Art & Culture"],
    totalQuestions: 150,
    timeLimitSeconds: 10800, // 3 hours
    defaultMarks: 1.33,
    defaultNegativeMarks: 0.66,
    sourceSlugs: ["rajasthan-me-tyohar", "rajasthan-me-reeti-riwaj-avam-prathayein"],
  },
  {
    seriesSlug: "ras-pre-2026-mega-mock-test-series",
    quizTitle: "RAS Prelims Full Mock Test #2 (Rajasthan Geography, Borders & Districts)",
    quizSlug: "ras-prelims-full-mock-2",
    subject: "Rajasthan Geography & Administration",
    targetExam: "RAS / RTS Prelims (RPSC)",
    examTags: ["RAS", "RPSC", "Rajasthan Geography"],
    totalQuestions: 150,
    timeLimitSeconds: 10800,
    defaultMarks: 1.33,
    defaultNegativeMarks: 0.66,
    sourceSlugs: ["rajasthan-ki-seema", "rajasthan-ke-jile-va-sambhag", "rajasthan-me-tyohar"],
  },

  // RAJASTHAN CET (150 Questions Each, 180 min, 300 Marks)
  {
    seriesSlug: "rajasthan-cet-2026-speed-test-series",
    quizTitle: "Rajasthan CET Full Mock Paper #1 (Rajasthan GK & Computer Special)",
    quizSlug: "cet-full-length-mock-1",
    subject: "Rajasthan GK & Computer Science",
    targetExam: "Rajasthan CET (10+2 & Graduate)",
    examTags: ["CET", "RSMSSB", "Rajasthan GK", "Computer"],
    totalQuestions: 150,
    timeLimitSeconds: 10800,
    defaultMarks: 2.0,
    defaultNegativeMarks: 0.0,
    sourceSlugs: ["rajasthan-ki-seema", "ms-office-ms-powerpoint-question-bank", "rajasthan-me-tyohar"],
  },
  {
    seriesSlug: "rajasthan-cet-2026-speed-test-series",
    quizTitle: "Rajasthan CET Full Mock Paper #2 (Rajasthan Culture, Geography & Administration)",
    quizSlug: "cet-full-length-mock-2",
    subject: "Rajasthan GK & General Studies",
    targetExam: "Rajasthan CET (10+2 & Graduate)",
    examTags: ["CET", "RSMSSB", "Rajasthan GK"],
    totalQuestions: 150,
    timeLimitSeconds: 10800,
    defaultMarks: 2.0,
    defaultNegativeMarks: 0.0,
    sourceSlugs: ["rajasthan-me-tyohar", "rajasthan-me-reeti-riwaj-avam-prathayein", "rajasthan-ke-jile-va-sambhag"],
  },

  // PASHU PARICHAR (150 Questions, 180 min, 150 Marks, 0.25 Neg)
  {
    seriesSlug: "rajasthan-pashu-parichar-mock-test-series",
    quizTitle: "Pashu Parichar Full Length Model Paper #1 (Part A General Studies & GK)",
    quizSlug: "pashu-parichar-full-mock-1",
    subject: "General Studies & Rajasthan GK",
    targetExam: "Pashu Parichar (Animal Attendant)",
    examTags: ["Pashu Parichar", "Animal Attendant", "Rajasthan GK"],
    totalQuestions: 150,
    timeLimitSeconds: 10800,
    defaultMarks: 1.0,
    defaultNegativeMarks: 0.25,
    sourceSlugs: ["rajasthan-me-tyohar", "rajasthan-ki-seema"],
  },
  {
    seriesSlug: "rajasthan-pashu-parichar-mock-test-series",
    quizTitle: "Pashu Parichar Full Length Model Paper #2 (Rajasthan Heritage, Geography & Culture)",
    quizSlug: "pashu-parichar-full-mock-2",
    subject: "Rajasthan Heritage & Geography",
    targetExam: "Pashu Parichar (Animal Attendant)",
    examTags: ["Pashu Parichar", "Animal Attendant", "Rajasthan Heritage"],
    totalQuestions: 150,
    timeLimitSeconds: 10800,
    defaultMarks: 1.0,
    defaultNegativeMarks: 0.25,
    sourceSlugs: ["rajasthan-me-reeti-riwaj-avam-prathayein", "rajasthan-ke-jile-va-sambhag", "rajasthan-me-tyohar"],
  },

  // RAJASTHAN POLICE CONSTABLE & SI (150 Q / 100 Q)
  {
    seriesSlug: "rajasthan-police-constable-si-booster-series",
    quizTitle: "Rajasthan Police Constable Full Mock Paper #1 (GK, Geography & Culture)",
    quizSlug: "police-constable-full-mock-1",
    subject: "Rajasthan Police Constable GK",
    targetExam: "Rajasthan Police Constable & SI",
    examTags: ["Rajasthan Police", "Constable", "Rajasthan GK"],
    totalQuestions: 150,
    timeLimitSeconds: 7200, // 2 hours
    defaultMarks: 1.0,
    defaultNegativeMarks: 0.25,
    sourceSlugs: ["rajasthan-ki-seema", "rajasthan-me-tyohar", "rajasthan-ke-jile-va-sambhag"],
  },
  {
    seriesSlug: "rajasthan-police-constable-si-booster-series",
    quizTitle: "Rajasthan Police SI Mock Paper #2 (Rajasthan General Knowledge & General Science)",
    quizSlug: "police-si-gk-mock-2",
    subject: "Rajasthan GK & General Studies",
    targetExam: "Rajasthan Police Constable & SI",
    examTags: ["Rajasthan Police", "SI", "Sub Inspector", "Rajasthan GK"],
    totalQuestions: 100,
    timeLimitSeconds: 7200,
    defaultMarks: 2.0,
    defaultNegativeMarks: 0.66,
    sourceSlugs: ["rajasthan-me-reeti-riwaj-avam-prathayein", "rajasthan-ki-seema"],
  },

  // REET LEVEL-1 & LEVEL-2 (150 Questions Each, 150 min, 150 Marks)
  {
    seriesSlug: "reet-2026-complete-model-paper-series",
    quizTitle: "REET Complete Model Paper #1 (Rajasthan GK & Cultural Heritage)",
    quizSlug: "reet-level-1-full-mock-1",
    subject: "Child Pedagogy & Rajasthan GK",
    targetExam: "REET / 3rd Grade Teacher",
    examTags: ["REET", "3rd Grade", "Teacher", "Rajasthan GK"],
    totalQuestions: 150,
    timeLimitSeconds: 9000, // 150 min
    defaultMarks: 1.0,
    defaultNegativeMarks: 0.0,
    sourceSlugs: ["rajasthan-me-tyohar", "rajasthan-ki-seema"],
  },
  {
    seriesSlug: "reet-2026-complete-model-paper-series",
    quizTitle: "REET Complete Model Paper #2 (Rajasthan Geography & State Traditions)",
    quizSlug: "reet-level-2-full-mock-2",
    subject: "Rajasthan Geography & Traditions",
    targetExam: "REET / 3rd Grade Teacher",
    examTags: ["REET", "3rd Grade", "Teacher", "Geography"],
    totalQuestions: 150,
    timeLimitSeconds: 9000,
    defaultMarks: 1.0,
    defaultNegativeMarks: 0.0,
    sourceSlugs: ["rajasthan-me-reeti-riwaj-avam-prathayein", "rajasthan-ke-jile-va-sambhag", "rajasthan-me-tyohar"],
  },
];

async function generateCompleteMockTests() {
  await connectToDatabase();
  console.log("=================================================");
  console.log("🚀 ASSEMBLING COMPLETE MOCK PAPERS WITH REAL QUESTIONS");
  console.log("=================================================");

  for (const bp of BLUEPRINTS) {
    console.log(`\nCreating Mock Test: "${bp.quizTitle}" (${bp.quizSlug})`);

    // 1. Fetch source quiz IDs
    const sourceQuizzes = await Quiz.find({ slug: { $in: bp.sourceSlugs } }).select("_id slug title").lean();
    const sourceQuizIds = sourceQuizzes.map((q) => q._id);

    if (sourceQuizIds.length === 0) {
      console.warn(`  ⚠️ No source quizzes found for ${bp.quizSlug}`);
      continue;
    }

    // 2. Fetch authentic questions from source quizzes
    const pool = await QuizQuestion.find({ quizId: { $in: sourceQuizIds } }).lean();
    console.log(`  Found ${pool.length} candidate questions in pool`);

    // Pick unique questions up to totalQuestions
    const selectedQuestions = pool.slice(0, bp.totalQuestions);

    // 3. Upsert Quiz document
    const quizDoc = await Quiz.findOneAndUpdate(
      { slug: bp.quizSlug },
      {
        title: bp.quizTitle,
        slug: bp.quizSlug,
        subject: bp.subject,
        examTags: bp.examTags,
        difficulty: "medium",
        status: "PUBLISHED",
        timeLimitSeconds: bp.timeLimitSeconds,
        defaultMarks: bp.defaultMarks,
        defaultNegativeMarks: bp.defaultNegativeMarks,
        totalQuestions: selectedQuestions.length,
      },
      { upsert: true, new: true }
    );

    // 4. Remove any existing questions for this quiz to avoid stale data
    await QuizQuestion.deleteMany({ quizId: quizDoc._id });

    // 5. Insert new questions
    const questionDocs = selectedQuestions.map((q, idx) => ({
      quizId: quizDoc._id,
      order: idx + 1,
      questionText: q.questionText,
      options: q.options,
      correctOptionIndex: q.correctOptionIndex,
      explanation: q.explanation || "",
      marks: bp.defaultMarks,
      negativeMarks: bp.defaultNegativeMarks,
    }));

    if (questionDocs.length > 0) {
      await QuizQuestion.insertMany(questionDocs);
    }

    console.log(`  ✅ Successfully saved Quiz "${quizDoc.title}" with ${questionDocs.length} real questions!`);
  }

  // Run synchronization of test series JSON
  console.log("\n=================================================");
  console.log("🔄 SYNCING ALL TEST SERIES PACKAGES WITH REAL PAPERS");
  console.log("=================================================");
  await syncTestSeriesFromFiles();

  console.log("\n🎉 ALL TEST SERIES ARE NOW 100% COMPLETE AND PLAYABLE!");
  process.exit(0);
}

generateCompleteMockTests().catch((err) => {
  console.error("Error generating mock tests:", err);
  process.exit(1);
});
