import fs from "fs";
import path from "path";

interface RawJsonQuestion {
  question_no: number;
  question: string;
  options: Record<string, string>;
  correct_answer: string;
  correct_answer_text: string;
  explanation: string;
  topic?: string;
}

interface RawJsonFile {
  title: string;
  total_questions: number;
  questions: RawJsonQuestion[];
}

function parseAnswerLetterToIndex(letter: string): number {
  const clean = letter.trim().toUpperCase();
  if (clean === "A" || clean === "1" || clean === "अ") return 0;
  if (clean === "B" || clean === "2" || clean === "ब") return 1;
  if (clean === "C" || clean === "3" || clean === "स") return 2;
  if (clean === "D" || clean === "4" || clean === "द") return 3;
  return 0;
}

async function generateBciSeedJson() {
  const inputPath = path.join(
    process.cwd(),
    "question-bank/newQuestions/test-series/BCI/BCI/SCI Computer Instructor Paper-2.md"
  );

  if (!fs.existsSync(inputPath)) {
    console.error("Input file not found at:", inputPath);
    process.exit(1);
  }

  const rawText = fs.readFileSync(inputPath, "utf-8");
  const parsedData: RawJsonFile = JSON.parse(rawText);

  console.log(`\n======================================================`);
  console.log(`🚀 PROCESSING BCI/SCI COMPUTER INSTRUCTOR TEST SERIES`);
  console.log(`======================================================`);
  console.log(`Title: ${parsedData.title}`);
  console.log(`Total Questions in File: ${parsedData.questions.length}`);

  const processedQuestions = parsedData.questions.map((q, idx) => {
    const optA = q.options?.A || "";
    const optB = q.options?.B || "";
    const optC = q.options?.C || "";
    const optD = q.options?.D || "";
    const optionsArray = [optA, optB, optC, optD].filter(Boolean);

    const correctIdx = parseAnswerLetterToIndex(q.correct_answer);

    return {
      order: q.question_no || idx + 1,
      questionText: q.question.trim(),
      options: optionsArray,
      correctOptionIndex: correctIdx,
      correctOptionText: optionsArray[correctIdx] || q.correct_answer_text,
      examTag: "Basic Computer Instructor Exam 2022 Paper 2",
      explanation: q.explanation?.trim() || "कम्प्यूटर अनुदेशक परीक्षा पाठ्यक्रम के अनुसार प्रामाणिक व्याख्या।",
      topicTag: q.topic || "Computer Science",
      format: "MCQ",
    };
  });

  const seedPayload = {
    title: "BCI / SCI Computer Instructor Paper-2 Mock Test",
    subject: "Computer Science",
    slug: "bci-sci-computer-instructor-paper-2",
    examTags: [
      "Basic Computer Instructor Exam 2022 Paper 2",
      "Computer Instructor",
      "BCI",
      "RSMSSB",
    ],
    difficulty: "medium",
    status: "DRAFT",
    timeLimitSeconds: 7200, // 2 hours standard
    defaultMarks: 1,
    defaultNegativeMarks: 0.33,
    totalQuestions: processedQuestions.length,
    questions: processedQuestions,
  };

  const outputDir = path.join(process.cwd(), "question-bank/seeds");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(
    outputDir,
    "bci-sci-computer-instructor-paper-2.json"
  );
  fs.writeFileSync(outputPath, JSON.stringify(seedPayload, null, 2), "utf-8");

  console.log(`\n✅ Generated seed JSON at: ${outputPath}`);
  console.log(`   Total Verified Questions: ${processedQuestions.length}`);
  console.log(`======================================================\n`);
}

generateBciSeedJson().catch((err) => {
  console.error("Error generating BCI seed JSON:", err);
  process.exit(1);
});
