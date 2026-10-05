import fs from "fs";
import path from "path";

interface QuestionDetail {
  globalIndex: number;
  quizGroup: string;
  questionNumber: number;
  questionText: string;
  options: string[];
  providedExamTag?: string;
  providedExplanation?: string;
  format: "MCQ" | "Statement" | "Matching";
  correctOptionIndex: number;
  verificationSource: string;
}

const filePath = path.join(
  process.cwd(),
  "question-bank/newQuestions/rajasthan-art-and-culture/राजस्थान में रीति -रिवाज एवं प्रथाएं.md"
);

function parseAllQuestions(): QuestionDetail[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/);

  const results: QuestionDetail[] = [];
  let currentQuizGroup = "राजस्थान में रीति -रिवाज एवं प्रथाएं Quiz 1";
  let globalCount = 0;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    if (line.includes("Quiz 1")) currentQuizGroup = "राजस्थान में रीति -रिवाज एवं प्रथाएं Quiz 1";
    else if (line.includes("Quiz 2")) currentQuizGroup = "राजस्थान में रीति -रिवाज एवं प्रथाएं Quiz 2";
    else if (line.includes("Quiz 3")) currentQuizGroup = "राजस्थान में रीति -रिवाज एवं प्रथाएं Quiz 3";
    else if (line.includes("Quiz 4")) currentQuizGroup = "राजस्थान में रीति -रिवाज एवं प्रथाएं Quiz 4";
    else if (line.includes("Quiz 5")) currentQuizGroup = "राजस्थान में रीति -रिवाज एवं प्रथाएं Quiz 5";

    if (/^प्रश्न\s+\d+/i.test(line)) {
      globalCount++;
      const qNumMatch = line.match(/^प्रश्न\s+(\d+)/i);
      const qNum = qNumMatch ? parseInt(qNumMatch[1], 10) : globalCount;

      i++;
      let rawStatus: string | undefined = undefined;
      if (i < lines.length && (lines[i].trim() === "सही उत्तर" || lines[i].trim() === "गलत उत्तर")) {
        rawStatus = lines[i].trim();
        i++;
      }

      const qTextLines: string[] = [];
      let examTag: string | undefined = undefined;

      while (i < lines.length) {
        const l = lines[i].trim();
        if (/^[A-D]$/.test(l)) break;

        if (
          /Exam|LECTURER|CET|Officer|Police|Patwar|20\d\d|Paper|Shift|Gram Sevak|VDO|Librarian|COMPILER|JSA/i.test(l) &&
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
      const options: string[] = [];

      while (i < lines.length) {
        const l = lines[i].trim();
        if (l.startsWith("💡") || l.includes("व्याख्या") || /^प्रश्न\s+\d+/i.test(l) || l.includes("Quiz")) {
          break;
        }

        if (/^[A-D]$/.test(l)) {
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

      let explanation: string | undefined = undefined;
      if (i < lines.length && (lines[i].trim().startsWith("💡") || lines[i].trim().includes("व्याख्या"))) {
        i++;
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

      let format: "MCQ" | "Statement" | "Matching" = "MCQ";
      if (questionText.includes("कथन") || questionText.includes("कारण")) {
        format = "Statement";
      } else if (questionText.includes("सुमेलित") || questionText.includes("युग्म")) {
        format = "Matching";
      }

      results.push({
        globalIndex: globalCount,
        quizGroup: currentQuizGroup,
        questionNumber: qNum,
        questionText,
        options,
        providedExamTag: examTag,
        providedExplanation: explanation,
        format,
        correctOptionIndex: 0,
        verificationSource: examTag ? `Verified Exam PYQ (${examTag})` : "Verified Rajasthan Culture Reference",
      });
      continue;
    }
    i++;
  }

  return results;
}

const allParsed = parseAllQuestions();
// Exclude first 10 questions (already imported)
const remaining = allParsed.slice(10);

console.log(`TotalParsed: ${allParsed.length}`);
console.log(`Remaining to process: ${remaining.length}`);

// Group by quiz group
const groups: Record<string, QuestionDetail[]> = {};
remaining.forEach((q) => {
  if (!groups[q.quizGroup]) groups[q.quizGroup] = [];
  groups[q.quizGroup].push(q);
});

Object.entries(groups).forEach(([groupName, items]) => {
  console.log(`\n=== ${groupName} (${items.length} questions) ===`);
  items.slice(0, 3).forEach((item) => {
    console.log(`Q${item.questionNumber}: ${item.questionText.slice(0, 60)}...`);
    console.log(`   Options: ${item.options.length} | ExamTag: ${item.providedExamTag || "null"}`);
  });
});
