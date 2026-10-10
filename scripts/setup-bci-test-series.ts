import "dotenv/config";
import { connectToDatabase } from "../server/lib/mongodb";
import { Quiz } from "../server/models/Quiz";
import { QuizQuestion } from "../server/models/QuizQuestion";
import { TestSeries } from "../server/models/TestSeries";

async function setupBciTestSeries() {
  await connectToDatabase();

  console.log("Publishing and linking BCI tests...");

  // 1. Publish bci-sci-paper-1st and bci-sci-computer-instructor-paper-2
  const paper1 = await Quiz.findOneAndUpdate(
    { slug: "bci-sci-paper-1st" },
    {
      status: "PUBLISHED",
      totalQuestions: 100,
      category: "bci",
      targetExams: ["Computer Instructor (BCI / SCI)", "BCI", "SCI"],
      tags: ["BCI", "SCI", "Computer Instructor", "Paper 1", "General Studies"],
    },
    { new: true }
  );

  const paper2 = await Quiz.findOneAndUpdate(
    { slug: "bci-sci-computer-instructor-paper-2" },
    {
      status: "PUBLISHED",
      totalQuestions: 100,
      category: "bci",
      targetExams: ["Computer Instructor (BCI / SCI)", "BCI", "SCI"],
      tags: ["BCI", "SCI", "Computer Instructor", "Paper 2", "Computer Science"],
    },
    { new: true }
  );

  const pyqPaper1 = await Quiz.findOne({ slug: "rsmssb-basic-computer-instructor-bci-exam-18-june-2022-paper-1" });
  const pyqPaper2 = await Quiz.findOne({ slug: "papers-rsmssb-bci-2022-paper-2" });

  console.log("Paper 1 Quiz:", paper1?._id?.toString(), paper1?.title);
  console.log("Paper 2 Quiz:", paper2?._id?.toString(), paper2?.title);

  const quizzesList = [];

  if (paper1) {
    quizzesList.push({
      quizId: paper1._id,
      title: "Pre BCI/SCI Paper-1st Mock Test (General Studies & Aptitude)",
      testType: "FULL_MOCK" as const,
      order: 1,
      isFreeDemo: true, // 100% Free Demo
      durationMinutes: 120,
      totalQuestions: 100,
      totalMarks: 100,
    });
  }

  if (paper2) {
    quizzesList.push({
      quizId: paper2._id,
      title: "BCI / SCI Computer Instructor Paper-2 Mock Test (Computer Science)",
      testType: "FULL_MOCK" as const,
      order: 2,
      isFreeDemo: false,
      durationMinutes: 120,
      totalQuestions: 100,
      totalMarks: 100,
    });
  }

  if (pyqPaper1) {
    quizzesList.push({
      quizId: pyqPaper1._id,
      title: "RSMSSB BCI 2022 Official Exam Paper-1 (PYQ)",
      testType: "SECTIONAL" as const,
      order: 3,
      isFreeDemo: false,
      durationMinutes: 120,
      totalQuestions: 91,
      totalMarks: 100,
    });
  }

  if (pyqPaper2) {
    quizzesList.push({
      quizId: pyqPaper2._id,
      title: "RSMSSB BCI 2022 Official Exam Paper-2 (PYQ)",
      testType: "SECTIONAL" as const,
      order: 4,
      isFreeDemo: false,
      durationMinutes: 120,
      totalQuestions: 95,
      totalMarks: 100,
    });
  }

  const bciSeriesData = {
    title: "Rajasthan Computer Instructor (BCI / SCI) Mock Test Series 2026",
    slug: "bci-sci-computer-instructor-test-series",
    description:
      "Full-length exam-oriented mock tests and previous year question papers for RSMSSB Basic & Senior Computer Instructor (BCI/SCI) Paper-1 and Paper-2.",
    targetExam: "Computer Instructor (BCI / SCI)",
    examCategorySlug: "bci",
    features: [
      "Complete Coverage of Paper-1 (General Ability) and Paper-2 (Computer Science)",
      "Strict negative marking (1/3rd) as per RSMSSB pattern",
      "Detailed Hindi & English technical explanations",
      "Instant All-Rajasthan Rank and Performance Analysis",
    ],
    totalTestsCount: quizzesList.length,
    freeTestsCount: 1,
    totalQuestionsCount: quizzesList.reduce((acc, q) => acc + q.totalQuestions, 0),
    language: "Hindi & English (Bilingual)",
    enrolledCount: 2640,
    rating: 4.9,
    status: "PUBLISHED",
    quizzes: quizzesList,
  };

  const updatedSeries = await TestSeries.findOneAndUpdate(
    { slug: bciSeriesData.slug },
    bciSeriesData,
    { upsert: true, new: true }
  );

  console.log("✅ BCI Test Series Created / Updated Successfully:");
  console.log("Title:", updatedSeries.title);
  console.log("Slug:", updatedSeries.slug);
  console.log("Quizzes Count:", updatedSeries.quizzes.length);

  process.exit(0);
}

setupBciTestSeries().catch((err) => {
  console.error("Error setting up BCI test series:", err);
  process.exit(1);
});
