import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import { connectToDatabase } from "../server/lib/mongodb";
import { Quiz } from "../server/models/Quiz";
import { QuizQuestion } from "../server/models/QuizQuestion";

interface QuestionItem {
  globalIndex: number;
  questionText: string;
  options: string[];
  providedExamTag: string | null;
  explanation: string;
  correctOptionIndex: number;
}

const pilot10Questions: QuestionItem[] = [
  {
    globalIndex: 1,
    questionText: "हिन्दुओं की सामाजिक एंव धार्मिक संस्कृति में कितनं संस्कार सम्पन करवाये जाते है-",
    options: ["16", "21", "18", "20"],
    providedExamTag: null,
    explanation: "हिन्दू धर्म में गर्भाधान से लेकर अन्त्येष्टि तक कुल 16 संस्कारों (षोडश संस्कार) का उल्लेख है।",
    correctOptionIndex: 0,
  },
  {
    globalIndex: 2,
    questionText: "किस जाती में बच्चे के जनेऊ डालनें की प्रथा है-",
    options: ["शुद्र", "क्षत्रिय", "वेश्य", "ब्राह्यण"],
    providedExamTag: null,
    explanation: "उपनयन (जनेऊ) संस्कार द्विजों (विशेषतः ब्राह्मण वर्ण) में बालकों को ब्रह्मचर्य एवं विद्यारम्भ में दीक्षित करने हेतु किया जाता है।",
    correctOptionIndex: 3,
  },
  {
    globalIndex: 3,
    questionText: "राजस्थान में विवाह के उपरान्त जब पत्नी के स्थाई तौर पा लडके वाले अपने घर लाते है तो वह है-",
    options: ["पगड़ी", "मौसर", "गौना", "सामेल"],
    providedExamTag: null,
    explanation: "राजस्थान में विवाह के पश्चात् वधू को विधिवत एवं स्थायी रूप से ससुराल लाने की रस्म को 'गौना' (मुकलावा / आणौ) कहते हैं।",
    correctOptionIndex: 2,
  },
  {
    globalIndex: 4,
    questionText: "मृत्यु के तिसरे दिन मृतक की हड्डियो को इकट्ठा किया जाता है-",
    options: ["फूज चुनना", "पिण्डदान", "तीये की बैठक", "श्राद्ध"],
    providedExamTag: null,
    explanation: "दाह-संस्कार के तीसरे दिन मृतक की अस्थियों को संचित कर गंगा या पवित्र जलाशयों में विसर्जन हेतु एकत्रित करना 'फूल चुनना' कहलाता है।",
    correctOptionIndex: 0,
  },
  {
    globalIndex: 5,
    questionText: "हिन्दु कानून का पोषक किस प्रथा को माना जाता है-",
    options: ["ग्यारहवां", "मोसर", "अन्त्येष्टि", "पगड़ी दस्तूर"],
    providedExamTag: null,
    explanation: "पिता की मृत्यु के पश्चात् सामाजिक व पारिवारिक उत्तरदायित्व तथा उत्तराधिकार हस्तांतरण हेतु बड़े पुत्र को पगड़ी पहनाने की रस्म 'पगड़ी दस्तूर' कहलाती है।",
    correctOptionIndex: 3,
  },
  {
    globalIndex: 6,
    questionText: "वह जाति कौनसी है जिसके लोग पालकी उठाने का कार्य करते है-",
    options: ["सिरवी", "कहार", "बंधारा", "मीरासी"],
    providedExamTag: null,
    explanation: "राजस्थानी सामाजिक व्यवस्था में कहार (मेहरा) जाति के लोग पारंपरिक रूप से पालकी व डोली उठाने का कार्य करते थे।",
    correctOptionIndex: 1,
  },
  {
    globalIndex: 7,
    questionText: "मुसलमानों के किस त्यौहार के दिन ताजिए निकाले जाते है-",
    options: ["मोहर्रम", "ईदु उल जुहा", "शब्बे बारात", "ईद उल फितर"],
    providedExamTag: null,
    explanation: "इस्लामी कैलेण्डर के पहले माह मोहर्रम की 10 तारीख (आशूरा) को हजरत इमाम हुसैन की शहादत की याद में ताजिए निकाले जाते हैं।",
    correctOptionIndex: 0,
  },
  {
    globalIndex: 8,
    questionText: "राजस्थान में 'कुकड़ी की रस्म' किस जनजाति में प्रचलित है-",
    options: ["भील", "सांसी", "डामोर", "मीणा"],
    providedExamTag: "Asst. Agriculture Officer 2018",
    explanation: "सांसी जनजाति में विवाह के उपरांत नववधू के सतीत्व व चरित्र की परीक्षा हेतु 'कूकड़ी की रस्म' प्रचलित है।",
    correctOptionIndex: 1,
  },
  {
    globalIndex: 9,
    questionText: "निम्न में से कौनसी प्रथा मृत्यु से सम्बंधित नहीं है-",
    options: ["बाल मौकलना", "दहलीज", "सातरवाड़ा", "दस्तूर"],
    providedExamTag: null,
    explanation: "'दस्तूर' (या सगाई दस्तूर) वैवाहिक एवं मांगलिक रस्मों से संबंधित है, जबकि बाल मोकलना, दहलीज और सातरवाड़ा मृत्यु से संबंधित शोक रस्में हैं।",
    correctOptionIndex: 3,
  },
  {
    globalIndex: 10,
    questionText: "गर्भावस्था के आठवे माह में गर्भवती स्त्री के स्वास्थ्य की मंगल कामना हेतु कौनसा संस्कार किया जाता है-",
    options: ["सिमन्तोन्नयन", "पुंसवन", "जातकर्म", "सीमंत"],
    providedExamTag: null,
    explanation: "गर्भस्थ शिशु व गर्भवती स्त्री की अमंगलकारी शक्तियों से रक्षा एवं दीर्घायु मंगल कामना हेतु गर्भावस्था के 6ठे से 8वें माह में 'सीमंतोन्नयन' संस्कार किया जाता है।",
    correctOptionIndex: 0,
  },
];

async function importTopicQuestionBank() {
  await connectToDatabase();
  console.log("Connected to MongoDB database.");

  // Read remaining 131 questions
  const remainingDataPath = path.join(__dirname, "remaining_questions_data.json");
  const rawRemaining = fs.readFileSync(remainingDataPath, "utf-8");
  const remaining131Questions = JSON.parse(rawRemaining);

  const all141Questions: QuestionItem[] = [
    ...pilot10Questions,
    ...remaining131Questions.map((q: any) => ({
      globalIndex: q.globalIndex,
      questionText: q.questionText,
      options: q.options,
      providedExamTag: q.providedExamTag,
      explanation: q.explanation,
      correctOptionIndex: q.correctOptionIndex,
    })),
  ];

  console.log(`Prepared all ${all141Questions.length} questions for the Topic Question Bank.`);

  // Collect verified exam tags
  const examTagsSet = new Set<string>();
  all141Questions.forEach((q) => {
    if (q.providedExamTag) examTagsSet.add(q.providedExamTag);
  });
  const examTags = Array.from(examTagsSet);

  const topicTitle = "राजस्थान में रीति-रिवाज एवं प्रथाएं";
  const topicSlug = "rajasthan-me-reeti-riwaj-avam-prathayein";
  const subject = "Rajasthan Art & Culture";

  // Check if topic quiz already exists
  let quiz = await Quiz.findOne({ slug: topicSlug });

  if (!quiz) {
    quiz = new Quiz({
      title: topicTitle,
      slug: topicSlug,
      subject,
      examTags,
      difficulty: "medium",
      attemptCount: 0,
      status: "DRAFT", // strictly DRAFT
      defaultMarks: 1,
      defaultNegativeMarks: 0.33,
    });
    await quiz.save();
    console.log(`Created new Topic Quiz [DRAFT]: ${quiz._id.toString()} (${topicTitle})`);
  } else {
    quiz.title = topicTitle;
    quiz.subject = subject;
    quiz.examTags = examTags;
    quiz.status = "DRAFT";
    await quiz.save();
    console.log(`Updated existing Topic Quiz [DRAFT]: ${quiz._id.toString()}`);
  }

  // Delete previous questions for this topic quiz to avoid duplicates
  await QuizQuestion.deleteMany({ quizId: quiz._id });
  console.log("Cleared existing question records for this topic quiz.");

  // Clean up any fragmented pilot quiz if it exists
  const fragmentedPilot = await Quiz.findOne({ title: "राजस्थान में रीति -रिवाज एवं प्रथाएं - Practice Quiz 1" });
  if (fragmentedPilot) {
    await QuizQuestion.deleteMany({ quizId: fragmentedPilot._id });
    await Quiz.deleteOne({ _id: fragmentedPilot._id });
    console.log(`Cleaned up obsolete pilot quiz ${fragmentedPilot._id.toString()}`);
  }

  // Insert all 141 questions
  const docs = all141Questions.map((q, idx) => ({
    quizId: quiz!._id,
    order: idx + 1,
    questionText: q.questionText,
    options: q.options,
    correctOptionIndex: q.correctOptionIndex,
    explanation: q.explanation || "",
    marks: 1,
    negativeMarks: 0.33,
  }));

  const inserted = await QuizQuestion.insertMany(docs);
  console.log(`Successfully imported ${inserted.length} verified questions into Topic Question Bank!`);
  console.log(`Quiz ID: ${quiz._id.toString()}`);
  console.log(`Slug: ${topicSlug}`);
  console.log(`Status: DRAFT`);
  console.log(`Total Verified PYQ Tags: ${examTags.length}`);
}

importTopicQuestionBank()
  .then(() => {
    console.log("Topic Question Bank import completed successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Import error:", err);
    process.exit(1);
  });
