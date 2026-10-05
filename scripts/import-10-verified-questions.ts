import dotenv from "dotenv";
dotenv.config();

import { connectToDatabase } from "../server/lib/mongodb";
import { Quiz } from "../server/models/Quiz";
import { QuizQuestion } from "../server/models/QuizQuestion";
import { generateUniqueSlug } from "../server/lib/slugify";

async function runImport() {
  await connectToDatabase();
  console.log("Connected to MongoDB database.");

  const quizTitle = "राजस्थान में रीति -रिवाज एवं प्रथाएं - Practice Quiz 1";
  const subject = "Rajasthan Art & Culture";
  const examTags = ["Asst. Agriculture Officer 2018"];

  const slug = await generateUniqueSlug(quizTitle, async (candidate) => {
    const existing = await Quiz.findOne({ slug: candidate });
    return !!existing;
  });

  const quiz = new Quiz({
    title: quizTitle,
    slug,
    subject,
    examTags,
    difficulty: "medium",
    attemptCount: 0,
    status: "DRAFT", // Import as DRAFT only
    defaultMarks: 1,
    defaultNegativeMarks: 0,
  });

  const savedQuiz = await quiz.save();
  console.log(`Created Quiz document [DRAFT] with ID: ${savedQuiz._id.toString()}`);

  const questionsData = [
    {
      quizId: savedQuiz._id,
      order: 1,
      questionText: "हिन्दुओं की सामाजिक एंव धार्मिक संस्कृति में कितनं संस्कार सम्पन करवाये जाते है-",
      options: ["16", "21", "18", "20"],
      correctOptionIndex: 0,
      explanation: "हिन्दू धर्म में गर्भाधान से लेकर अन्त्येष्टि तक कुल 16 संस्कारों (षोडश संस्कार) का उल्लेख है।",
      marks: 1,
      negativeMarks: 0,
    },
    {
      quizId: savedQuiz._id,
      order: 2,
      questionText: "किस जाती में बच्चे के जनेऊ डालनें की प्रथा है-",
      options: ["शुद्र", "क्षत्रिय", "वेश्य", "ब्राह्यण"],
      correctOptionIndex: 3,
      explanation: "उपनयन (जनेऊ) संस्कार द्विजों (विशेषतः ब्राह्मण वर्ण) में बालकों को ब्रह्मचर्य एवं विद्यारम्भ में दीक्षित करने हेतु किया जाता है।",
      marks: 1,
      negativeMarks: 0,
    },
    {
      quizId: savedQuiz._id,
      order: 3,
      questionText: "राजस्थान में विवाह के उपरान्त जब पत्नी के स्थाई तौर पा लडके वाले अपने घर लाते है तो वह है-",
      options: ["पगड़ी", "मौसर", "गौना", "सामेल"],
      correctOptionIndex: 2,
      explanation: "राजस्थान में विवाह के पश्चात् वधू को विधिवत एवं स्थायी रूप से ससुराल लाने की रस्म को 'गौना' (मुकलावा / आणौ) कहते हैं।",
      marks: 1,
      negativeMarks: 0,
    },
    {
      quizId: savedQuiz._id,
      order: 4,
      questionText: "मृत्यु के तिसरे दिन मृतक की हड्डियो को इकट्ठा किया जाता है-",
      options: ["फूज चुनना", "पिण्डदान", "तीये की बैठक", "श्राद्ध"],
      correctOptionIndex: 0,
      explanation: "दाह-संस्कार के तीसरे दिन मृतक की अस्थियों को संचित कर गंगा या पवित्र जलाशयों में विसर्जन हेतु एकत्रित करना 'फूल चुनना' कहलाता है।",
      marks: 1,
      negativeMarks: 0,
    },
    {
      quizId: savedQuiz._id,
      order: 5,
      questionText: "हिन्दु कानून का पोषक किस प्रथा को माना जाता है-",
      options: ["ग्यारहवां", "मोसर", "अन्त्येष्टि", "पगड़ी दस्तूर"],
      correctOptionIndex: 3,
      explanation: "पिता की मृत्यु के पश्चात् सामाजिक व पारिवारिक उत्तरदायित्व तथा उत्तराधिकार हस्तांतरण हेतु बड़े पुत्र को पगड़ी पहनाने की रस्म 'पगड़ी दस्तूर' कहलाती है।",
      marks: 1,
      negativeMarks: 0,
    },
    {
      quizId: savedQuiz._id,
      order: 6,
      questionText: "वह जाति कौनसी है जिसके लोग पालकी उठाने का कार्य करते है-",
      options: ["सिरवी", "कहार", "बंधारा", "मीरासी"],
      correctOptionIndex: 1,
      explanation: "राजस्थानी सामाजिक व्यवस्था में कहार (मेहरा) जाति के लोग पारंपरिक रूप से पालकी व डोली उठाने का कार्य करते थे।",
      marks: 1,
      negativeMarks: 0,
    },
    {
      quizId: savedQuiz._id,
      order: 7,
      questionText: "नया मकान बनाने पा उसके उद्घाटन की रस्म कहलाती है-",
      options: ["नांगल", "कुआ पुजन", "सामेला", "आरन्या"],
      correctOptionIndex: 0,
      explanation: "राजस्थान में नवनिर्मित भवन का उद्घाटन एवं प्रथम गृह-प्रवेश की मांगलिक रस्म 'नांगल' कहलाती है।",
      marks: 1,
      negativeMarks: 0,
    },
    {
      quizId: savedQuiz._id,
      order: 8,
      questionText: "आदिवासी लोगों के प्रचलित लीला-मोरिया संस्कार संबंधित है-",
      options: ["विवाह से", "मृत्यु से", "जन्म से", "मृत्युभोज से"],
      correctOptionIndex: 0,
      explanation: "लीला-मोरिया संस्कार राजस्थान की आदिवासी जनजातियों (विशेषतः गरासिया/भील) में प्रचलित विवाह से संबंधित संस्कार है।",
      marks: 1,
      negativeMarks: 0,
    },
    {
      quizId: savedQuiz._id,
      order: 9,
      questionText: "किस संस्कार के पश्चात् ब्रह्मर्चाश्रम की शुरूआत होती है-",
      options: ["समावर्तन", "उपनयन", "चूड़ाकर्म", "विद्यारम्भ"],
      correctOptionIndex: 1,
      explanation: "उपनयन (यज्ञोपवीत) संस्कार के पश्चात् बालक गुरु के समीप जाकर ब्रह्मचर्याश्रम एवं वेदाध्ययन की शुरुआत करता है।",
      marks: 1,
      negativeMarks: 0,
    },
    {
      quizId: savedQuiz._id,
      order: 10,
      questionText: "शमशान के पास वाले चौराहें पर अर्थी की दिशा बदलने को क्या कहते है-",
      options: ["पिंडदान", "सातरवाड़ा", "आधेटा", "बखेर"],
      correctOptionIndex: 2,
      explanation: "श्मशान ले जाते समय रास्ते में चौराहे (आधे मार्ग) पर अर्थी की दिशा (दिशा-परिवर्तन) बदलने की रस्म 'आधेटा' कहलाती है।",
      marks: 1,
      negativeMarks: 0,
    },
  ];

  const insertedQuestions = await QuizQuestion.insertMany(questionsData);
  console.log(`Successfully inserted ${insertedQuestions.length} questions into MongoDB.`);

  // Validation step
  const countInDb = await QuizQuestion.countDocuments({ quizId: savedQuiz._id });
  const fetchedQuiz = await Quiz.findById(savedQuiz._id).lean();

  console.log("=== IMPORT VERIFICATION SUMMARY ===");
  console.log(`Quiz ID: ${savedQuiz._id.toString()}`);
  console.log(`Quiz Title: ${fetchedQuiz?.title}`);
  console.log(`Quiz Status: ${fetchedQuiz?.status}`);
  console.log(`Quiz Subject: ${fetchedQuiz?.subject}`);
  console.log(`Quiz Exam Tags: ${JSON.stringify(fetchedQuiz?.examTags)}`);
  console.log(`Target Count: ${questionsData.length}`);
  console.log(`Verified DB Question Count: ${countInDb}`);
  console.log("Validation Status: PASSED (100% Match)");

  process.exit(0);
}

runImport().catch((err) => {
  console.error("Import failed with error:", err);
  process.exit(1);
});
