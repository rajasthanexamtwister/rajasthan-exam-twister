import fs from "fs";
import path from "path";

// Enhanced Hindi typo dictionary & normalizer
export function fixHindiTypos(text: string): string {
  if (!text) return "";
  let s = text;
  s = s.replace(/[ \t]{2,}/g, " ");
  s = s.replace(/\s+([,.:;?!])/g, "$1");
  s = s.replace(/\s*\|\s*/g, " | ");

  const replacements: [RegExp, string][] = [
    [/श्रीगंगानर/g, "श्रीगंगानगर"],
    [/गंगानर/g, "गंगानगर"],
    [/गुजराज/g, "गुजरात"],
    [/जगती है/g, "लगती है"],
    [/अन्र्राष्ट्रीय/g, "अन्तर्राष्ट्रीय"],
    [/अन्तराज्जीय/g, "अन्तर्राज्यीय"],
    [/अन्तर्राज्जीय/g, "अन्तर्राज्यीय"],
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
    [/जिल कौनसे/g, "जिले कौनसे"],
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

export function parseJileSambhagMarkdown(): ParsedQuestion[] {
  const mdPath = path.join(
    process.cwd(),
    "question-bank/newQuestions/rajasthan-grography/राजस्थान के जिले व संभाग.md"
  );

  if (!fs.existsSync(mdPath)) {
    throw new Error(`File not found: ${mdPath}`);
  }

  const content = fs.readFileSync(mdPath, "utf-8");
  const lines = content.split(/\r?\n/).map((l) => l.trim());

  const questions: ParsedQuestion[] = [];
  let currentQuiz = "राजस्थान के जिले व संभाग Quiz 1";
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
        if (/^[A-D]$/.test(l)) break;

        if (
          /Exam|LECTURER|CET|Officer|Police|Patwar|20\d\d|Paper|Shift|Gram Sevak|VDO|Librarian|COMPILER|JSA|Teacher|JEN|Platoon|Jamadar|Instructor|Stenographer|Computor/i.test(l) &&
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

        if (/^[A-D]$/.test(l)) {
          i++;
          const optLines: string[] = [];
          while (i < lines.length) {
            const nextL = lines[i];
            if (
              /^[A-D]$/.test(nextL) ||
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
  console.log(`🚀 GENERATING SEED JSON FOR: राजस्थान के जिले व संभाग`);
  console.log(`======================================================`);

  const parsed = parseJileSambhagMarkdown();
  console.log(`✅ Parsed ${parsed.length} questions from markdown.`);

  const outputPayload = {
    subject: "Rajasthan Geography",
    topic: "राजस्थान के जिले व संभाग",
    slug: "rajasthan-ke-jile-va-sambhag",
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

  const outPath = path.join(outDir, "rajasthan-geography-jile-sambhag.json");
  fs.writeFileSync(outPath, JSON.stringify(outputPayload, null, 2), "utf-8");

  console.log(`✨ Successfully generated verified seed JSON at:`);
  console.log(`   ${outPath}`);
  console.log(`======================================================\n`);
}

run();
