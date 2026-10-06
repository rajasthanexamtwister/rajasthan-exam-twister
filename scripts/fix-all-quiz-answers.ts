import "dotenv/config";
import { connectToDatabase } from "../server/lib/mongodb";
import { Quiz } from "../server/models/Quiz";
import { QuizQuestion } from "../server/models/QuizQuestion";

// Comprehensive normalize function for Devanagari Hindi text
function normalizeHindi(text: string): string {
  if (!text) return "";
  let s = text.toLowerCase().trim();
  // Replace anusvara/anunasika with nasal consonant
  s = s.replace(/[\u0901\u0902]/g, "न");
  // Normalize spelling variants
  s = s.replace(/बुन्दी|बूँदी/g, "बूंदी");
  s = s.replace(/सातुड़ी|सातुड़ी|सातुडी/g, "सातूड़ी");
  s = s.replace(/डूंगरपुर|डुंगरपुर/g, "डूंगरपुर");
  s = s.replace(/चितौडगढ|चितौड़गढ़|चित्तौडगढ़/g, "चित्तौड़गढ़");
  s = s.replace(/बाॅंसवाडा|बाॅंसवाड़ा|बांसवाडा/g, "बांसवाड़ा");
  s = s.replace(/हनुमानगढ/g, "हनुमानगढ़");
  s = s.replace(/प्रतापगढ/g, "प्रतापगढ़");
  s = s.replace(/राजसंमद/g, "राजसमंद");
  s = s.replace(/झुन्झुनु|झून्झूनु|झुंझुनू/g, "झुंझुनूं");
  s = s.replace(/चुरू/g, "चूरू");
  s = s.replace(/रक्षाबन्धन/g, "रक्षानबंधन");
  s = s.replace(/त्योहार|त्योंहार/g, "त्यौहार");
  s = s.replace(/अष्ठमी/g, "अष्टमी");
  s = s.replace(/गनगौर/g, "गणगौर");
  s = s.replace(/चैथ/g, "चौथ");
  s = s.replace(/दुसरा/g, "दूसरा");
  s = s.replace(/पुर्व/g, "पूर्व");
  s = s.replace(/न्युनतम/g, "न्यूनतम");
  // Strip non-alphanumeric Devanagari/English characters
  s = s.replace(/[^a-zA-Z0-9\u0900-\u097F]/g, "");
  return s;
}

// Stop words that should NOT count as positive matches in explanations
const GENERIC_STOP_WORDS = new Set([
  "राजस्थान", "जिला", "जिले", "जिलों", "संभाग", "सम्भाग", "क्षेत्र", "राज्य", "भारत",
  "त्यौहार", "त्योहार", "त्योंहार", "पर्व", "उत्सव", "दिन", "तिथि", "माह", "महीना",
  "महीने", "पक्ष", "शुक्ल", "कृष्ण", "कृष्णा", "शुक्ला", "पूर्णिमा", "अमावस्या",
  "एकादशी", "तृतीया", "तृतीय", "चतुर्थी", "पंचमी", "षष्ठी", "सप्तमी", "अष्टमी",
  "नवमी", "दशमी", "द्वादशी", "त्रयोदशी", "प्रतिपदा", "वर्ष", "कमेटी", "प्रथा", "रस्म",
  "उत्तर", "दक्षिण", "पूर्व", "पश्चिम", "पूर्वी", "पश्चिमी", "उत्तरी", "दक्षिणी",
  "सही", "गलत", "कथन", "निम्नलिखित", "निम्न", "उपरोक्त", "सभी", "दोनों", "केवल"
]);

/**
 * High-precision matcher between options and explanation
 */
function determineBestOption(
  questionText: string,
  options: string[],
  explanation: string
): { bestIndex: number; confidence: "high" | "medium" | "low"; rationale: string } {
  if (!explanation || options.length === 0) {
    return { bestIndex: 0, confidence: "low", rationale: "No explanation" };
  }

  const normExp = normalizeHindi(explanation);
  const isNegativeQuestion = /नहीं|असंगत|गलत|भिन्न|अशुद्ध|अयोग्य/i.test(questionText);

  const scores = options.map((opt, idx) => {
    let score = 0;
    const rawWords = opt.split(/[\s,–—\-.\/()]+/).map((w) => w.trim()).filter((w) => w.length > 0);
    const meaningfulWords = rawWords.filter((w) => !GENERIC_STOP_WORDS.has(w));

    // Full option normalized
    const normOpt = normalizeHindi(opt);

    // 1. Full option exact normalized match in explanation
    if (normOpt.length >= 3 && normExp.includes(normOpt)) {
      score += normOpt.length * 5;
    }

    // 2. Meaningful words match in explanation
    for (const w of meaningfulWords) {
      const normW = normalizeHindi(w);
      if (normW.length >= 2 && normExp.includes(normW)) {
        score += normW.length * 3;
      }
    }

    // 3. Check for specific phrases like "सही उत्तर C", "विकल्प 3", "3.", etc.
    const char = String.fromCharCode(65 + idx); // A, B, C, D
    const num = (idx + 1).toString(); // 1, 2, 3, 4
    if (
      new RegExp(`(?:विकल्प|उत्तर|Option|Ans(?:wer)?)[\\s:]*${char}\\b`, "i").test(explanation) ||
      new RegExp(`(?:विकल्प|उत्तर)[\\s:]*${num}\\b`, "i").test(explanation)
    ) {
      score += 100;
    }

    return { idx, opt, score };
  });

  scores.sort((a, b) => b.score - a.score);

  if (scores[0].score > 0 && scores[0].score > (scores[1]?.score || 0)) {
    return {
      bestIndex: scores[0].idx,
      confidence: "high",
      rationale: `Matched option '${scores[0].opt}' (score: ${scores[0].score})`,
    };
  }

  // Fallback: Check if explanation explicitly names an option
  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    if (explanation.includes(`: ${opt}`) || explanation.includes(`- ${opt}`) || explanation.includes(`है: ${opt}`)) {
      return { bestIndex: i, confidence: "high", rationale: `Exact explanation definition '${opt}'` };
    }
  }

  return { bestIndex: scores[0].idx, confidence: "medium", rationale: `Top score: ${scores[0].score}` };
}

async function fixAllQuizzes() {
  await connectToDatabase();

  const targetSlugs = [
    "rajasthan-me-tyohar",
    "rajasthan-ke-jile-va-sambhag",
    "rajasthan-ki-seema",
    "rajasthan-me-reeti-riwaj-avam-prathayein",
  ];

  console.log(`\n======================================================`);
  console.log(`🔧 RE-EVALUATING & FIXING ALL TOPIC QUIZ ANSWER KEYS`);
  console.log(`======================================================\n`);

  let totalCorrected = 0;
  let totalChecked = 0;

  for (const slug of targetSlugs) {
    const quiz = await Quiz.findOne({ slug });
    if (!quiz) {
      console.warn(`Quiz with slug ${slug} not found!`);
      continue;
    }

    const questions = await QuizQuestion.find({ quizId: quiz._id }).sort({ order: 1 });
    console.log(`\n------------------------------------------------------`);
    console.log(`Processing: "${quiz.title}" (${questions.length} questions)`);
    console.log(`------------------------------------------------------`);

    let quizCorrected = 0;

    for (const q of questions) {
      totalChecked++;
      const { bestIndex, confidence, rationale } = determineBestOption(
        q.questionText,
        q.options,
        q.explanation
      );

      if (bestIndex !== q.correctOptionIndex) {
        const oldChar = String.fromCharCode(65 + q.correctOptionIndex);
        const newChar = String.fromCharCode(65 + bestIndex);
        const oldOpt = q.options[q.correctOptionIndex];
        const newOpt = q.options[bestIndex];

        // Specific high-confidence corrections
        console.log(`\n✏️ Q#${q.order}: ${q.questionText.slice(0, 60)}...`);
        console.log(`   Old Answer: [${oldChar}] ${oldOpt}`);
        console.log(`   New Answer: [${newChar}] ${newOpt}`);
        console.log(`   Rationale: ${rationale} (${confidence} confidence)`);

        q.correctOptionIndex = bestIndex;
        await q.save();
        quizCorrected++;
        totalCorrected++;
      }
    }

    console.log(`\n✅ Finished "${quiz.title}": ${quizCorrected} / ${questions.length} questions corrected.`);
  }

  console.log(`\n======================================================`);
  console.log(`🎉 ALL QUIZ ANSWER KEYS AUDITED & UPDATED`);
  console.log(`   Total Questions Audited: ${totalChecked}`);
  console.log(`   Total Answer Keys Corrected: ${totalCorrected}`);
  console.log(`======================================================\n`);
}

fixAllQuizzes()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fix error:", err);
    process.exit(1);
  });
