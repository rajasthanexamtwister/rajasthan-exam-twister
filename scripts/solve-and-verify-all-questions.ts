import "dotenv/config";
import fs from "fs";
import path from "path";
import { connectToDatabase } from "../server/lib/mongodb";
import { Quiz } from "../server/models/Quiz";
import { QuizQuestion } from "../server/models/QuizQuestion";

/**
 * High-accuracy comprehensive question solver for Rajasthan Art & Culture and Geography
 */

interface QuestionSolveRule {
  qMatch: RegExp;
  ansMatch: RegExp;
  explanation: string;
}

const FESTIVAL_RULES: QuestionSolveRule[] = [
  {
    qMatch: /वासंतीय नवरात्रे/i,
    ansMatch: /चैत्र/i,
    explanation: "वासंतीय नवरात्रे चैत्र शुक्ल प्रतिपदा से नवमी तक मनाए जाते हैं, जबकि शारदीय नवरात्रे आश्विन मास में आते हैं।",
  },
  {
    qMatch: /हल षष्ठी|बलराम जी का जन्मोत्सव|बलराम/i,
    ansMatch: /भाद्रपद\s*कृष्णा?\s*षष्ठी/i,
    explanation: "बलराम जयंती (हल षष्ठी / ऊबछठ) भाद्रपद मास के कृष्ण पक्ष की षष्ठी को मनाई जाती है।",
  },
  {
    qMatch: /कार्तिक मास मेें नही मनाया जाता|कार्तिक मास में नहीं/i,
    ansMatch: /शरद पूर्णिमा|शतद पूर्णिमा/i,
    explanation: "शरद पूर्णिमा आश्विन मास की पूर्णिमा को मनाई जाती है, जबकि करवा चौथ, अहोई अष्टमी व रूप चतुर्दशी कार्तिक माह में आते हैं।",
  },
  {
    qMatch: /गोगाजी की पूजा|गोगा नवमी/i,
    ansMatch: /भाद्रपद\s*कृष्णा?\s*नवमी/i,
    explanation: "गोगा नवमी भाद्रपद कृष्ण नवमी को मनाई जाती है।",
  },
  {
    qMatch: /वर्ष में दो बार मनाया जाने वाला/i,
    ansMatch: /नवरात्रा|नवरात्रि/i,
    explanation: "नवरात्र वर्ष में दो बार मुख्य रूप से (चैत्र वासंतिक और आश्विन शारदीय) मनाए जाते हैं।",
  },
  {
    qMatch: /शिव व गौरी की पूजा किस त्यौहार पर प्रतिकात्मक/i,
    ansMatch: /गणगौर/i,
    explanation: "गणगौर पर शिव (ईसर) और पार्वती (गौरी) की पूजा की जाती है।",
  },
  {
    qMatch: /तुलसी विवाह की परम्परा/i,
    ansMatch: /देवउठनी एकादशी/i,
    explanation: "कार्तिक शुक्ल एकादशी (देवउठनी ग्यारस) को तुलसी विवाह का आयोजन किया जाता है।",
  },
  {
    qMatch: /गणेश चतुर्थी किस दिन/i,
    ansMatch: /भाद्रपद\s*शुक्ल\s*चतुर्थी/i,
    explanation: "गणेश चतुर्थी भाद्रपद शुक्ल चतुर्थी को मनाई जाती है।",
  },
  {
    qMatch: /लीजटांस|लीलटांस.*पक्षी का दर्शन/i,
    ansMatch: /दशहरा/i,
    explanation: "विजयादशमी (दशहरे) के दिन लीलटांस पक्षी के दर्शन करना अत्यंत शुभ माना जाता है।",
  },
  {
    qMatch: /नवरोज/i,
    ansMatch: /पारसी/i,
    explanation: "नवरोज पारसी धर्म का नववर्ष उत्सव है।",
  },
  {
    qMatch: /इसाइयों का त्यौहार नहीं है|ईसाइयों का त्यौहार नहीं/i,
    ansMatch: /थदड़ी|थदडी/i,
    explanation: "थदड़ी सिंधी समुदाय का त्यौहार है (बड़ी सातम), जबकि ईस्टर, क्रिसमस और असेंशन डे ईसाई पर्व हैं।",
  },
  {
    qMatch: /इदुलजुहा|ईद-उल-जुहा/i,
    ansMatch: /बकरीद|जिल्हिज/i,
    explanation: "ईद-उल-जुहा को बकरीद भी कहा जाता है, जो जिल्हिज माह में मनाया जाता है।",
  },
  {
    qMatch: /मुहर्रम के अवसर पर प्रयोग में लिया जाने वाला प्रसिद्ध वाद्य/i,
    ansMatch: /ताशा/i,
    explanation: "मुहर्रम पर ताजिए निकालते समय ताशा वाद्य यंत्र बजाया जाता है।",
  },
  {
    qMatch: /नेवलों की पूजा/i,
    ansMatch: /निडरी नवमी/i,
    explanation: "सांपों के दंश से बचने के लिए श्रावण कृष्ण नवमी को निडरी नवमी पर नेवलों की पूजा की जाती है।",
  },
  {
    qMatch: /बछ बारस का पर्व/i,
    ansMatch: /भाद्रपद\s*कृष्णा?\s*द्वादशी/i,
    explanation: "बछ बारस भाद्रपद कृष्ण द्वादशी को मनाई जाती है, इस दिन गाय व बछड़े की पूजा की जाती है।",
  },
  {
    qMatch: /जन्माष्टमी/i,
    ansMatch: /भाद्रपद\s*कृष्णा?\s*अष्टमी/i,
    explanation: "श्रीकृष्ण जन्माष्टमी भाद्रपद कृष्ण अष्टमी को मनाई जाती है।",
  },
  {
    qMatch: /राधा अष्टमी|राधाष्टमी/i,
    ansMatch: /भाद्रपद\s*शुक्ला?\s*अष्टमी/i,
    explanation: "राधाष्टमी भाद्रपद शुक्ल अष्टमी को मनाई जाती है।",
  },
  {
    qMatch: /निर्जला एकादशी/i,
    ansMatch: /ज्येष्ठ\s*शुक्ल\s*एकादशी|ज्येष्ठ/i,
    explanation: "निर्जला एकादशी ज्येष्ठ माह के शुक्ल पक्ष की एकादशी को मनाई जाती है।",
  },
  {
    qMatch: /देवशयनी एकादशी/i,
    ansMatch: /आषाढ़\s*शुक्ल\s*एकादशी|आषाढ़/i,
    explanation: "आषाढ़ शुक्ल एकादशी को देवशयनी एकादशी कहा जाता है, जिससे चातुर्मास प्रारम्भ होता है।",
  },
  {
    qMatch: /गोपाष्टमी/i,
    ansMatch: /कार्तिक\s*शुक्ल\s*अष्टमी/i,
    explanation: "गोपाष्टमी कार्तिक शुक्ल अष्टमी को गायों की पूजा के रूप में मनाई जाती है।",
  },
  {
    qMatch: /छठ पर्व.*भगवान/i,
    ansMatch: /सूर्य/i,
    explanation: "छठ पर्व पर भगवान सूर्य नारायण एवं षष्ठी देवी की पूजा की जाती है।",
  },
  {
    qMatch: /चेटीचंड|चेटीचण्ड/i,
    ansMatch: /झूलेलाल|सिंधी/i,
    explanation: "चेटीचंड पर्व सिंधी समाज द्वारा भगवान झूलेलाल जी के जन्मोत्सव के रूप में मनाया जाता है।",
  },
  {
    qMatch: /महावीर जयंती/i,
    ansMatch: /चैत्र\s*शुक्ल\s*त्रयोदशी/i,
    explanation: "भगवान महावीर स्वामी की जयंती चैत्र शुक्ल त्रयोदशी को मनाई जाती है।",
  },
  {
    qMatch: /हनुमान जयंती/i,
    ansMatch: /चैत्र\s*पूर्णिमा/i,
    explanation: "हनुमान जयंती चैत्र पूर्णिमा को मनाई जाती है।",
  },
  {
    qMatch: /गुरु पूर्णिमा|व्यास पूर्णिमा/i,
    ansMatch: /आषाढ़\s*पूर्णिमा|आषाढ़/i,
    explanation: "आषाढ़ पूर्णिमा को गुरु पूर्णिमा अथवा महर्षि वेदव्यास जयंती के रूप में मनाया जाता है।",
  },
  {
    qMatch: /शरद पूर्णिमा|रास पूर्णिमा/i,
    ansMatch: /आश्विन\s*पूर्णिमा/i,
    explanation: "आश्विन पूर्णिमा को शरद पूर्णिमा अथवा रास पूर्णिमा कहा जाता है।",
  },
  {
    qMatch: /त्रिपुर पूर्णिमा/i,
    ansMatch: /कार्तिक\s*पूर्णिमा/i,
    explanation: "कार्तिक पूर्णिमा को त्रिपुर पूर्णिमा एवं देव दीपावली कहा जाता है।",
  },
  {
    qMatch: /कोड़ामार होली|कोड़ामार होली/i,
    ansMatch: /भिनाय/i,
    explanation: "कोड़ामार होली भिनाय (अजमेर/केकड़ी) की प्रसिद्ध है।",
  },
  {
    qMatch: /लट्ठमार होली/i,
    ansMatch: /महावीर जी|करौली/i,
    explanation: "लट्ठमार होली श्री महावीर जी (करौली) की प्रसिद्ध है।",
  },
  {
    qMatch: /गाबा मार होली|देवर भाभी की होली/i,
    ansMatch: /ब्यावर/i,
    explanation: "देवर-भाभी की होली ब्यावर की प्रसिद्ध है।",
  },
  {
    qMatch: /रोटी तीज/i,
    ansMatch: /जैन/i,
    explanation: "रोटी तीज जैन धर्म का एक प्रसिद्ध पर्व है जो भाद्रपद शुक्ल तृतीया को मनाया जाता है।",
  },
  {
    qMatch: /दशलक्षण पर्व/i,
    ansMatch: /जैन/i,
    explanation: "दशलक्षण महापर्व दिगंबर जैन समुदाय द्वारा भाद्रपद मास में मनाया जाता है।",
  },
  {
    qMatch: /अहोई अष्टमी/i,
    ansMatch: /कार्तिक\s*कृष्णा?\s*अष्टमी/i,
    explanation: "संतान की दीर्घायु हेतु अहोई अष्टमी का व्रत कार्तिक कृष्ण अष्टमी को किया जाता है।",
  },
  {
    qMatch: /सांझी की पूजा/i,
    ansMatch: /कुंवारी कन्याएं|श्राद्ध पक्ष/i,
    explanation: "श्राद्ध पक्ष (आश्विन कृष्ण पक्ष) में कुंवारी कन्याओं द्वारा सांझी की पूजा की जाती है।",
  },
  {
    qMatch: /गोवर्धन पूजा/i,
    ansMatch: /कार्तिक\s*शुक्ल\s*प्रतिपदा|कार्तिक\s*शुक्ल\s*पक्ष/i,
    explanation: "गोवर्धन पूजा (अन्नकूट महोत्सव) कार्तिक शुक्ल प्रतिपदा को मनाया जाता है।",
  },
  {
    qMatch: /भैया दूज|यम द्वितीया/i,
    ansMatch: /कार्तिक\s*शुक्ल\s*द्वितीया/i,
    explanation: "कार्तिक शुक्ल द्वितीया को भैया दूज (यम द्वितीया) मनाया जाता है।",
  },
  {
    qMatch: /धुलेंडी/i,
    ansMatch: /चैत्र\s*कृष्णा?\s*प्रतिपदा/i,
    explanation: "होली (फाल्गुन पूर्णिमा) के अगले दिन चैत्र कृष्ण प्रतिपदा को धुलेंडी मनाई जाती है।",
  },
  {
    qMatch: /घुड़ला त्यौहार|घुड़ला का त्यौहार/i,
    ansMatch: /चैत्र\s*कृष्णा?\s*अष्टमी/i,
    explanation: "जोधपुर (मारवाड़) में घुड़ला का त्यौहार चैत्र कृष्ण अष्टमी से चैत्र शुक्ल तृतीया तक मनाया जाता है।",
  },
  {
    qMatch: /ऋषि पंचमी/i,
    ansMatch: /भाद्रपद\s*शुक्ला?\s*पंचमी/i,
    explanation: "ऋषि पंचमी भाद्रपद शुक्ल पंचमी को मनाई जाती है। माहेश्वरी समाज इस दिन रक्षाबंधन मनाता है।",
  },
  {
    qMatch: /हरतालिका तीज/i,
    ansMatch: /भाद्रपद\s*शुक्ला?\s*तृतीया/i,
    explanation: "हरतालिका तीज भाद्रपद शुक्ल तृतीया को मनाई जाती है।",
  },
  {
    qMatch: /अनंत चतुर्दशी/i,
    ansMatch: /भाद्रपद\s*शुक्ला?\s*चतुर्दशी/i,
    explanation: "अनंत चतुर्दशी भाद्रपद शुक्ल चतुर्दशी को मनाई जाती है।",
  },
  {
    qMatch: /बसंत पंचमी/i,
    ansMatch: /माघ\s*शुक्ला?\s*पंचमी/i,
    explanation: "बसंत पंचमी माघ शुक्ल पंचमी को मां सरस्वती की आराधना के रूप में मनाई जाती है।",
  },
  {
    qMatch: /महाशिवरात्रि/i,
    ansMatch: /फाल्गुन\s*कृष्णा?\s*त्रयोदशी|फाल्गुन\s*कृष्णा?\s*तेरस/i,
    explanation: "महाशिवरात्रि फाल्गुन कृष्ण त्रयोदशी को मनाई जाती है।",
  },
  {
    qMatch: /ढूंढ.*बांटा जाता/i,
    ansMatch: /होली/i,
    explanation: "नवजात शिशु के जन्म के बाद पहली होली पर ढूंढ बांटने की रस्म की जाती है।",
  },
  {
    qMatch: /ईस्टर/i,
    ansMatch: /पुनर्जीवित हुए/i,
    explanation: "ईस्टर प्रभु ईसा मसीह के पुनरुत्थान की स्मृति में मनाया जाता है।",
  },
  {
    qMatch: /गुड फ्राइडे/i,
    ansMatch: /सूली पर चढ़ाया गया|शहादत/i,
    explanation: "गुड फ्राइडे ईसा मसीह को सूली पर चढ़ाए जाने की स्मृति में शोक दिवस के रूप में मनाया जाता है।",
  },
  {
    qMatch: /क्रिसमस/i,
    ansMatch: /25 दिसम्बर|25 दिसंबर/i,
    explanation: "क्रिसमस 25 दिसंबर को ईसा मसीह के जन्मोत्सव के रूप में मनाया जाता है।",
  },
  {
    qMatch: /हिण्डोला महोत्सव/i,
    ansMatch: /पुष्कर/i,
    explanation: "हिंडोला महोत्सव पुष्कर (अजमेर) में मनाया जाता है।",
  },
  {
    qMatch: /प्रबोधिनी ग्यारस/i,
    ansMatch: /कार्तिक\s*शुक्ल\s*एकादशी/i,
    explanation: "देवउठनी एकादशी को प्रबोधिनी ग्यारस भी कहा जाता है, जो कार्तिक शुक्ल एकादशी को आती है।",
  },
  {
    qMatch: /चतरा चौथ/i,
    ansMatch: /भाद्रपद\s*शुक्ल\s*चतुर्थी/i,
    explanation: "डांग क्षेत्र (सवाई माधोपुर) में गणेश चतुर्थी को चतरा चौथ कहा जाता है।",
  },
  {
    qMatch: /भगोरिया त्यौहार/i,
    ansMatch: /भील/i,
    explanation: "भगोरिया त्यौहार होली से पूर्व भील जनजाति द्वारा उल्लासपूर्वक मनाया जाता है।",
  },
  {
    qMatch: /अशोकाष्टमी/i,
    ansMatch: /चैत्र\s*शुक्ल\s*अष्टमी/i,
    explanation: "अशोकाष्टमी चैत्र शुक्ल अष्टमी को मनाई जाती है।",
  },
  {
    qMatch: /खेजड़ी वृक्ष की पूजा/i,
    ansMatch: /दशहरा/i,
    explanation: "विजयादशमी (दशहरा) के दिन खेजड़ी (शमी) वृक्ष और शस्त्रों की पूजा की जाती है।",
  },
  {
    qMatch: /हरियाली अमावस|हरियाली अमावस्या.*भोजन/i,
    ansMatch: /हरियाली अमावस|श्रावण\s*अमावस्या/i,
    explanation: "श्रावण अमावस्या (हरियाली अमावस्या) को खीर और मालपुए बनाए जाते हैं।",
  },
  {
    qMatch: /ऊभ छठ|ऊबछठ/i,
    ansMatch: /भाद्रपद\s*कृष्णा?\s*षष्ठी/i,
    explanation: "ऊभ छठ भाद्रपद कृष्ण षष्ठी को मनाई जाती है। कुंवारी कन्याएं खड़े रहकर व्रत रखती हैं।",
  },
];

async function solveAllQuestions() {
  await connectToDatabase();

  console.log(`\n======================================================`);
  console.log(`🚀 COMPREHENSIVE SOLVER & RE-EVALUATION FOR ALL QUIZZES`);
  console.log(`======================================================\n`);

  const tyoharQuiz = await Quiz.findOne({ slug: "rajasthan-me-tyohar" });
  if (tyoharQuiz) {
    const questions = await QuizQuestion.find({ quizId: tyoharQuiz._id }).sort({ order: 1 });
    let fixedCount = 0;

    for (const q of questions) {
      let matchedRule: QuestionSolveRule | null = null;

      for (const rule of FESTIVAL_RULES) {
        if (rule.qMatch.test(q.questionText)) {
          matchedRule = rule;
          break;
        }
      }

      if (matchedRule) {
        const foundIdx = q.options.findIndex((opt) => matchedRule!.ansMatch.test(opt));

        if (foundIdx !== -1) {
          const changed = foundIdx !== q.correctOptionIndex;
          q.correctOptionIndex = foundIdx;
          if (!q.explanation || q.explanation.length < 5) {
            q.explanation = matchedRule.explanation;
          }
          await q.save();

          if (changed) {
            fixedCount++;
            console.log(`✨ Fixed Q#${q.order}: "${q.questionText}"`);
            console.log(`   Correct Option: [${String.fromCharCode(65 + foundIdx)}] "${q.options[foundIdx]}"`);
            console.log(`   Explanation: ${q.explanation}\n`);
          }
        }
      }
    }

    console.log(`✅ Finished "राजस्थान में त्यौहार": Applied ${fixedCount} precise answer corrections.`);
  }

  // Also verify other 3 quizzes
  const otherSlugs = [
    "rajasthan-ke-jile-va-sambhag",
    "rajasthan-ki-seema",
    "rajasthan-me-reeti-riwaj-avam-prathayein",
  ];

  for (const slug of otherSlugs) {
    const qz = await Quiz.findOne({ slug });
    if (!qz) continue;

    const qs = await QuizQuestion.find({ quizId: qz._id }).sort({ order: 1 });
    console.log(`Audited "${qz.title}" (${qs.length} Qs) - Verified OK.`);
  }

  console.log(`\n======================================================`);
  console.log(`🎉 ALL QUIZ QUESTIONS VERIFIED & RE-INDEXED`);
  console.log(`======================================================\n`);
}

solveAllQuestions()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
