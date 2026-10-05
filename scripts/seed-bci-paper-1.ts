import "dotenv/config";
import fs from "fs";
import path from "path";
import { connectToDatabase } from "../server/lib/mongodb";
import { Quiz } from "../server/models/Quiz";
import { QuizQuestion } from "../server/models/QuizQuestion";
import { computeQuestionFingerprint } from "../server/services/question-bank-automation/parser";

const OPTION_KEYS = ["A", "B", "C", "D", "E"] as const;

async function seedBciPaper1() {
  await connectToDatabase();

  console.log(`\n======================================================`);
  console.log(`🚀 SEEDING PRE BCI/SCI PAPER-1ST TEST SERIES`);
  console.log(`======================================================`);

  const jsonPath = path.join(
    process.cwd(),
    "question-bank/newQuestions/test-series/BCI/BCI/paper-1st.json"
  );

  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ File not found at: ${jsonPath}`);
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  const rawQuestions: any[] = rawData.questions || [];

  console.log(`Found ${rawQuestions.length} questions in paper-1st.json`);

  const title = "Pre BCI/SCI Paper-1st Mock Test";
  const slug = "bci-sci-paper-1st";
  const subject = "General Studies & Aptitude";
  const examTags = [
    "Computer Instructor (BCI / SCI)",
    "BCI / SCI",
    "Computer Science",
    "Rajasthan Exams",
  ];
  const difficulty = "medium";
  const timeLimitSeconds = 7200; // 2 hours

  // Transform raw questions
  const parsedQuestions = rawQuestions.map((q, idx) => {
    const rawOptions = q.options || {};
    // Ensure all 4-5 options are extracted
    const options: string[] = [];
    for (const key of OPTION_KEYS) {
      if (rawOptions[key] !== undefined && rawOptions[key] !== null) {
        options.push(String(rawOptions[key]).trim());
      }
    }

    // Determine correctOptionIndex (0-indexed)
    let correctOptionIndex = -1;
    if (q.correct_option) {
      const char = String(q.correct_option).trim().toUpperCase();
      correctOptionIndex = OPTION_KEYS.indexOf(char as any);
    }

    if (correctOptionIndex === -1 && q.correct_answer) {
      const ansText = String(q.correct_answer).trim().toLowerCase();
      correctOptionIndex = options.findIndex(
        (opt) => opt.toLowerCase() === ansText
      );
    }

    if (correctOptionIndex < 0 || correctOptionIndex >= options.length) {
      console.warn(
        `⚠️ Warning: Question #${q.question_no || idx + 1} has invalid correctOptionIndex (${correctOptionIndex}). Defaulting to 0.`
      );
      correctOptionIndex = 0;
    }

    return {
      questionText: String(q.question).trim(),
      options,
      correctOptionIndex,
      explanation: String(q.explanation || "").trim(),
      topic: q.topic || "General Aptitude",
    };
  });

  // 1. Find or create Quiz document
  let quiz = await Quiz.findOne({
    $or: [{ slug }, { title }],
  });

  if (!quiz) {
    quiz = new Quiz({
      title,
      slug,
      subject,
      examTags,
      difficulty,
      attemptCount: 0,
      status: "DRAFT",
      timeLimitSeconds,
      defaultMarks: 1,
      defaultNegativeMarks: 0.33,
    });
    await quiz.save();
    console.log(`✨ Created new Quiz document in DB: ID ${quiz._id} (Status: ${quiz.status})`);
  } else {
    console.log(`ℹ️ Found existing Quiz document in DB: ID ${quiz._id} (Status: ${quiz.status})`);
    quiz.subject = subject;
    quiz.examTags = examTags;
    quiz.title = title;
    await quiz.save();
  }

  // 2. Prevent duplicates by checking existing questions
  const existingQuestions = await QuizQuestion.find({ quizId: quiz._id }).lean();
  const existingFingerprints = new Set(
    existingQuestions.map((q) => computeQuestionFingerprint(q.questionText, q.options))
  );

  const nonDuplicates: any[] = [];
  let duplicateCount = 0;

  for (const q of parsedQuestions) {
    const fp = computeQuestionFingerprint(q.questionText, q.options);
    if (existingFingerprints.has(fp)) {
      duplicateCount++;
    } else {
      nonDuplicates.push(q);
      existingFingerprints.add(fp);
    }
  }

  // 3. Insert non-duplicate questions
  let importedCount = 0;
  if (nonDuplicates.length > 0) {
    const startOrder = existingQuestions.length;
    const docs = nonDuplicates.map((q, idx) => ({
      quizId: quiz!._id,
      order: startOrder + idx + 1,
      questionText: q.questionText,
      options: q.options,
      correctOptionIndex: q.correctOptionIndex,
      explanation: q.explanation || "",
      marks: 1,
      negativeMarks: 0.33,
    }));

    const inserted = await QuizQuestion.insertMany(docs);
    importedCount = inserted.length;
  }

  const totalInQuiz = existingQuestions.length + importedCount;

  console.log(`\n======================================================`);
  console.log(`🎉 TEST SERIES SEEDING COMPLETE`);
  console.log(`======================================================`);
  console.log(`Quiz ID: ${quiz._id}`);
  console.log(`Title: ${quiz.title}`);
  console.log(`Status: ${quiz.status}`);
  console.log(`New Questions Seeded: ${importedCount}`);
  console.log(`Duplicates Skipped: ${duplicateCount}`);
  console.log(`Total Questions in Quiz: ${totalInQuiz}`);
  console.log(`======================================================\n`);
}

seedBciPaper1()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal Seeding Error:", err);
    process.exit(1);
  });
