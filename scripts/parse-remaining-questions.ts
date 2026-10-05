import fs from "fs";
import path from "path";

interface ParsedQuestion {
  quizName: string;
  questionNumber: number;
  rawStatus?: string; // सही उत्तर / गलत उत्तर
  questionText: string;
  options: string[];
  providedExamTag?: string;
  providedExplanation?: string;
  format: "MCQ" | "Statement" | "Matching";
  computedCorrectOptionIndex: number;
}

const filePath = path.join(
  process.cwd(),
  "question-bank/newQuestions/rajasthan-art-and-culture/राजस्थान में रीति -रिवाज एवं प्रथाएं.md"
);

function parseMarkdownFile() {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/);

  const quizzes: { name: string; questions: ParsedQuestion[] }[] = [];
  let currentQuizName = "राजस्थान में रीति -रिवाज एवं प्रथाएं Quiz 1";
  let currentQuestions: ParsedQuestion[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    // Check for Quiz header
    if (line.includes("Quiz") || line.startsWith("राजस्थान में रीति")) {
      if (line.includes("Quiz")) {
        if (currentQuestions.length > 0) {
          quizzes.push({ name: currentQuizName, questions: [...currentQuestions] });
          currentQuestions = [];
        }
        currentQuizName = line.split("\n")[0].trim();
      }
    }

    // Check for Question header
    if (/^प्रश्न\s+\d+/i.test(line)) {
      const qNumMatch = line.match(/^प्रश्न\s+(\d+)/i);
      const qNum = qNumMatch ? parseInt(qNumMatch[1], 10) : currentQuestions.length + 1;

      i++;
      let rawStatus: string | undefined = undefined;

      // Status indicator line (सही उत्तर / गलत उत्तर)
      if (i < lines.length && (lines[i].trim() === "सही उत्तर" || lines[i].trim() === "गलत उत्तर")) {
        rawStatus = lines[i].trim();
        i++;
      }

      // Read question text until options (A, B, C, D) or exam tag
      const qTextLines: string[] = [];
      let examTag: string | undefined = undefined;

      while (i < lines.length) {
        const l = lines[i].trim();
        if (/^[A-D]$/.test(l)) {
          break; // Hit options
        }
        // Check if exam tag line (e.g. SCHOOL LECTURER 2024, Asstt. Agriculture Officer Exam 2015, CET 2022)
        if (
          /Exam|LECTURER|CET|Officer|Police|Patwar|20\d\d|Paper|Shift/i.test(l) &&
          !l.startsWith("प्रश्न") &&
          !l.includes("व्याख्या")
        ) {
          examTag = l;
        } else if (l) {
          qTextLines.push(l);
        }
        i++;
      }

      const questionText = qTextLines.join(" ").trim();

      // Read options A, B, C, D
      const options: string[] = [];
      let currentOptLetter = "";

      while (i < lines.length) {
        const l = lines[i].trim();
        if (l.startsWith("💡") || l.includes("व्याख्या") || /^प्रश्न\s+\d+/i.test(l) || l.includes("Quiz")) {
          break;
        }

        if (/^[A-D]$/.test(l)) {
          currentOptLetter = l;
          i++;
          const optValueLines: string[] = [];
          while (i < lines.length) {
            const nextL = lines[i].trim();
            if (
              /^[A-D]$/.test(nextL) ||
              nextL.startsWith("💡") ||
              nextL.includes("व्याख्या") ||
              /^प्रश्न\s+\d+/i.test(nextL) ||
              nextL.includes("Quiz")
            ) {
              break;
            }
            if (nextL) optValueLines.push(nextL);
            i++;
          }
          options.push(optValueLines.join(" ").trim());
          continue;
        }
        i++;
      }

      // Check for explanation block
      let explanation: string | undefined = undefined;
      if (i < lines.length && (lines[i].trim().startsWith("💡") || lines[i].trim().includes("व्याख्या"))) {
        i++; // skip header
        const expLines: string[] = [];
        while (i < lines.length) {
          const l = lines[i].trim();
          if (/^प्रश्न\s+\d+/i.test(l) || l.includes("Quiz") || l.includes("परिणाम")) {
            break;
          }
          if (l) expLines.push(l);
          i++;
        }
        explanation = expLines.join(" ").trim();
      }

      // Detect format
      let format: "MCQ" | "Statement" | "Matching" = "MCQ";
      if (questionText.includes("कथन") || questionText.includes("कारण")) {
        format = "Statement";
      } else if (questionText.includes("सुमेलित") || questionText.includes("युग्म")) {
        format = "Matching";
      }

      currentQuestions.push({
        quizName: currentQuizName,
        questionNumber: qNum,
        rawStatus,
        questionText,
        options,
        providedExamTag: examTag,
        providedExplanation: explanation,
        format,
        computedCorrectOptionIndex: 0,
      });

      continue;
    }

    i++;
  }

  if (currentQuestions.length > 0) {
    quizzes.push({ name: currentQuizName, questions: [...currentQuestions] });
  }

  return quizzes;
}

const parsed = parseMarkdownFile();
let totalCount = 0;
parsed.forEach((qGroup, idx) => {
  console.log(`Group ${idx + 1}: ${qGroup.name} — ${qGroup.questions.length} questions`);
  totalCount += qGroup.questions.length;
});
console.log(`Total questions parsed: ${totalCount}`);
