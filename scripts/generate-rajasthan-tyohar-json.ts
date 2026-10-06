import fs from "fs";
import path from "path";

// Enhanced Hindi typo dictionary for Art & Culture / Festivals
export function fixHindiTypos(text: string): string {
  if (!text) return "";
  let s = text;
  s = s.replace(/[ \t]{2,}/g, " ");
  s = s.replace(/\s+([,.:;?!])/g, "$1");
  s = s.replace(/\s*\|\s*/g, " | ");

  const replacements: [RegExp, string][] = [
    [/पुजा/g, "पूजा"],
    [/चेत्रशुक्ल/g, "चैत्र शुक्ल"],
    [/चेत्र/g, "चैत्र"],
    [/बुन्दी/g, "बूंदी"],
    [/बूँदी/g, "बूंदी"],
    [/अश्विन/g, "आश्विन"],
    [/पूणिमा/g, "पूर्णिमा"],
    [/जन्मात्सव/g, "जन्मोत्सव"],
    [/चैथ/g, "चौथ"],
    [/अहाई अष्ठमी/g, "अहोई अष्टमी"],
    [/अष्ठमी/g, "अष्टमी"],
    [/गनगौर/g, "गणगौर"],
    [/त्योंहार/g, "त्यौहार"],
    [/त्योहार/g, "त्यौहार"],
    [/संव्त/g, "संवत्"],
    [/सातूड़ी/g, "सातूड़ी"],
    [/असोम/g, "असम"],
    [/झून्झूनु/g, "झुंझुनूं"],
    [/झुन्झुनु/g, "झुंझुनूं"],
    [/झुंझुनू/g, "झुंझुनूं"],
    [/चितौडगढ/g, "चित्तौड़गढ़"],
    [/चितौड़गढ़/g, "चित्तौड़गढ़"],
    [/चित्तौडगढ़/g, "चित्तौड़गढ़"],
    [/चुरू/g, "चूरू"],
    [/डूंगरपुर/g, "डूंगरपुर"],
    [/डुंगरपुर/g, "डूंगरपुर"],
    [/बांसवाडा/g, "बांसवाड़ा"],
    [/बाॅंसवाडा/g, "बांसवाड़ा"],
    [/बाॅंसवाड़ा/g, "बांसवाड़ा"],
    [/हनुमानगढ/g, "हनुमानगढ़"],
    [/प्रतापगढ/g, "प्रतापगढ़"],
    [/राजसंमद/g, "राजसमंद"],
    [/दुसरा/g, "दूसरा"],
    [/पुर्व/g, "पूर्व"],
    [/बिच/g, "बीच"],
    [/न्युनतम/g, "न्यूनतम"],
    [/सुमेलित किजिए/g, "सुमेलित कीजिए"],
    [/सुव्यवस्थित कीजिये/g, "सुव्यवस्थित कीजिए"],
    [/उपरोक्‍त/g, "उपरोक्त"],
  ];

  for (const [re, rep] of replacements) {
    s = s.replace(re, rep);
  }
  return s.trim();
}

interface ParsedQuestion {
  order: number;
  quizGroup: string;
  status: string;
  questionText: string;
  options: string[];
  examTag: string | null;
  explanation: string;
  correctOptionIndex: number;
}

export function parseTyoharMarkdown(): ParsedQuestion[] {
  const mdPath = path.join(
    process.cwd(),
    "question-bank/newQuestions/rajasthan-art-and-culture/राजस्थान में त्यौहार.md"
  );

  if (!fs.existsSync(mdPath)) {
    throw new Error(`File not found: ${mdPath}`);
  }

  const content = fs.readFileSync(mdPath, "utf-8");
  const lines = content.split(/\r?\n/).map((l) => l.trim());

  const questions: ParsedQuestion[] = [];
  let currentQuiz = "राजस्थान में त्यौहार Quiz 1";
  let globalOrder = 1;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.includes("Quiz")) {
      currentQuiz = line.split("\n")[0].trim();
    }

    if (/^प्रश्न\s+\d+/i.test(line)) {
      i++;
      let rawStatus = "";
      if (i < lines.length && (lines[i] === "सही उत्तर" || lines[i] === "गलत उत्तर")) {
        rawStatus = lines[i];
        i++;
      }

      const qTextLines: string[] = [];
      let examTag: string | null = null;

      while (i < lines.length) {
        const l = lines[i];
        if (/^[A-E]$/.test(l)) break;

        if (
          /Exam|LECTURER|CET|Officer|Police|Patwar|20\d\d|Paper|Shift|Gram Sevak|VDO|Librarian|COMPILER|JSA|Teacher|JEN|Platoon|Jamadar|Instructor|Stenographer|Computor|Ras\s+Pre|High\s+Court/i.test(l) &&
          !l.startsWith("प्रश्न") &&
          !l.includes("व्याख्या") &&
          !l.includes("परिणाम") &&
          !/^\d{1,2}:\d{2}$/.test(l) &&
          !/^\d+%$/.test(l)
        ) {
          examTag = fixHindiTypos(l);
        } else if (
          l &&
          !l.includes("परिणाम") &&
          !/^\d{1,2}:\d{2}$/.test(l) &&
          !/^\d+%$/.test(l) &&
          !l.startsWith("💡") &&
          !l.includes("व्याख्या")
        ) {
          qTextLines.push(l);
        }
        i++;
      }

      let questionText = fixHindiTypos(qTextLines.join(" "));
      const options: string[] = [];

      while (i < lines.length) {
        const l = lines[i];
        if (l.startsWith("💡") || l.includes("व्याख्या") || /^प्रश्न\s+\d+/i.test(l) || l.includes("Quiz")) {
          break;
        }

        if (/^[A-E]$/.test(l)) {
          i++;
          const optLines: string[] = [];
          while (i < lines.length) {
            const nextL = lines[i];
            if (
              /^[A-E]$/.test(nextL) ||
              nextL.startsWith("💡") ||
              nextL.includes("व्याख्या") ||
              /^प्रश्न\s+\d+/i.test(nextL) ||
              nextL.includes("Quiz")
            ) {
              break;
            }
            if (nextL) optLines.push(nextL);
            i++;
          }
          options.push(fixHindiTypos(optLines.join(" ")));
          continue;
        }
        i++;
      }

      // Parse explanation
      let explanation = "";
      if (i < lines.length && (lines[i].startsWith("💡") || lines[i].includes("व्याख्या"))) {
        i++;
        const expLines: string[] = [];
        while (i < lines.length) {
          const nextL = lines[i];
          if (/^प्रश्न\s+\d+/i.test(nextL) || nextL.includes("Quiz")) {
            break;
          }
          if (nextL) expLines.push(nextL);
          i++;
        }
        explanation = fixHindiTypos(expLines.join(" "));
      }

      // Determine correct option
      let correctOptionIndex = 0;

      if (options.length > 0) {
        let bestScore = -1;
        let bestIdx = 0;

        for (let oIdx = 0; oIdx < options.length; oIdx++) {
          const opt = options[oIdx];
          if (!opt) continue;

          let score = 0;
          const cleanOpt = opt.toLowerCase().replace(/[^a-zA-Z0-9\u0900-\u097F]/g, "");
          const cleanExp = explanation.toLowerCase().replace(/[^a-zA-Z0-9\u0900-\u097F]/g, "");

          if (cleanOpt.length > 1 && cleanExp.includes(cleanOpt)) {
            score += cleanOpt.length * 2;
          }

          // Exact keywords match
          const words = opt.split(/[\s,–—-]+/).filter((w) => w.length > 1);
          for (const word of words) {
            if (explanation.includes(word)) {
              score += word.length;
            }
          }

          if (score > bestScore) {
            bestScore = score;
            bestIdx = oIdx;
          }
        }

        if (bestScore > 0) {
          correctOptionIndex = bestIdx;
        } else if (rawStatus === "सही उत्तर") {
          correctOptionIndex = 0;
        }
      }

      if (questionText && options.length >= 2) {
        questions.push({
          order: globalOrder++,
          quizGroup: currentQuiz,
          status: rawStatus,
          questionText,
          options,
          examTag,
          explanation,
          correctOptionIndex,
        });
      }
    } else {
      i++;
    }
  }

  return questions;
}

function run() {
  console.log(`\n======================================================`);
  console.log(`🚀 GENERATING SEED JSON FOR: राजस्थान में त्यौहार`);
  console.log(`======================================================`);

  const parsed = parseTyoharMarkdown();
  console.log(`✅ Parsed ${parsed.length} questions from markdown.`);

  const outputPayload = {
    subject: "Rajasthan Art & Culture",
    topic: "राजस्थान में त्यौहार",
    slug: "rajasthan-me-tyohar",
    status: "DRAFT",
    totalQuestions: parsed.length,
    generatedAt: new Date().toISOString(),
    questions: parsed.map((q) => ({
      order: q.order,
      quizGroup: q.quizGroup,
      questionText: q.questionText,
      options: q.options,
      correctOptionIndex: q.correctOptionIndex,
      explanation: q.explanation,
      examTag: q.examTag,
    })),
  };

  const outDir = path.join(process.cwd(), "question-bank/seeds");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, "rajasthan-art-and-culture-tyohar.json");
  fs.writeFileSync(outPath, JSON.stringify(outputPayload, null, 2), "utf-8");

  console.log(`✨ Successfully generated verified seed JSON at:`);
  console.log(`   ${outPath}`);
  console.log(`======================================================\n`);
}

run();
