import "dotenv/config";
import { connectToDatabase } from "../server/lib/mongodb";
import { Quiz } from "../server/models/Quiz";
import { QuizQuestion } from "../server/models/QuizQuestion";

/**
 * Curated domain ground truth map for Rajasthan GK questions
 * Maps keywords in question text to exact option text or correct index
 */
const RAJASTHAN_GK_FACT_MAP: Array<{
  questionPattern: RegExp;
  correctAnswerPattern: RegExp;
  rationale: string;
}> = [
  // Festivals
  {
    questionPattern: /श्रावण.*पूर्णिमा.*त्यौहार/i,
    correctAnswerPattern: /रक्षाबन्धन|रक्षाबंधन|नारियल पूर्णिमा/i,
    rationale: "श्रावण पूर्णिमा को रक्षाबंधन व नारियल पूर्णिमा मनाई जाती है।",
  },
  {
    questionPattern: /गुलाबी गणगौर/i,
    correctAnswerPattern: /नाथद्वारा/i,
    rationale: "गुलाबी गणगौर चैत्र शुक्ल पंचमी को नाथद्वारा में मनाई जाती है।",
  },
  {
    questionPattern: /कजली तीज.*(कहाँ|कहा|मेला|सवारी)/i,
    correctAnswerPattern: /बूंदी|बूँदी/i,
    rationale: "कजली तीज / सातूड़ी तीज बूंदी की प्रसिद्ध है।",
  },
  {
    questionPattern: /कजली तीज.*तिथि|बड़ी तीज.*मनायी|सातूड़ी तीज.*त्यौहार/i,
    correctAnswerPattern: /भाद्रपद\s*कृष्ण.*तृतीया|भाद्र\s*कृष्ण\s*तृतीय/i,
    rationale: "बड़ी तीज / कजली तीज भाद्रपद कृष्ण तृतीया को मनाई जाती है।",
  },
  {
    questionPattern: /छोटी तीज.*माह|छोटी तीज.*त्यौहार/i,
    correctAnswerPattern: /श्रावण|श्रावण\s*शुक्ल.*तृतीया/i,
    rationale: "छोटी तीज श्रावण शुक्ल तृतीया को मनाई जाती है।",
  },
  {
    questionPattern: /शीतला\s*अष्टमी/i,
    correctAnswerPattern: /चैत्र\s*कृष्ण.*अष्टमी/i,
    rationale: "शीतलाष्टमी चैत्र कृष्ण अष्टमी को मनाई जाती है।",
  },
  {
    questionPattern: /गणगौर.*माह|गणगौर.*त्यौहार.*किस दिन|गणगौर.*तिथि/i,
    correctAnswerPattern: /चैत्र\s*शुक्ल.*तृतीया|चैत्र/i,
    rationale: "गणगौर चैत्र शुक्ल तृतीया को मुख्य रूप से मनाया जाता है।",
  },
  {
    questionPattern: /ईलोजी की सवारी|इलोजी की सवारी|पत्थर\s*मार होली/i,
    correctAnswerPattern: /बाड़मेर|बाड़मेर/i,
    rationale: "इलोजी की सवारी एवं पत्थरमार होली बाड़मेर की प्रसिद्ध है।",
  },
  {
    questionPattern: /तिल चौथ|संकट चौथ|सकट चौथ/i,
    correctAnswerPattern: /माघ\s*कृष्ण.*चतुर्थी|माघ/i,
    rationale: "तिल चौथ (सकट चौथ) माघ कृष्ण चतुर्थी को मनाई जाती है।",
  },
  {
    questionPattern: /करवा चौथ/i,
    correctAnswerPattern: /कार्तिक\s*कृष्ण.*चतुर्थी/i,
    rationale: "करवा चौथ कार्तिक कृष्ण चतुर्थी को मनाई जाती है।",
  },
  {
    questionPattern: /अबूझ सावा|अबूझ\s*मुहूर्त|आखा तीज.*माह/i,
    correctAnswerPattern: /आखा तीज|वैशाख\s*शुक्ल.*तृतीया|वैशाख/i,
    rationale: "अबूझ सावा आखा तीज (वैशाख शुक्ल तृतीया) को माना जाता है।",
  },
  {
    questionPattern: /बछ बारस/i,
    correctAnswerPattern: /भाद्रपद.*कृष्ण.*द्वादशी/i,
    rationale: "बछ बारस भाद्रपद कृष्ण द्वादशी को मनाई जाती है।",
  },
  {
    questionPattern: /सुगंध दशमी|सुगन्ध दशमी/i,
    correctAnswerPattern: /जैन/i,
    rationale: "सुगंध दशमी जैन धर्म का पर्व है।",
  },
  {
    questionPattern: /पर्युषण पर्व/i,
    correctAnswerPattern: /जैन/i,
    rationale: "पर्युषण पर्व जैन समुदाय से संबंधित है।",
  },
  {
    questionPattern: /त्यौहारों का आगमन/i,
    correctAnswerPattern: /श्रावणी तीज|तीज/i,
    rationale: "तीज त्योहारां बावड़ी ले डूबी गणगौर - आगमन श्रावणी तीज से होता है।",
  },
  {
    questionPattern: /त्यौहारों का समापन/i,
    correctAnswerPattern: /गणगौर/i,
    rationale: "तीज त्योहारां बावड़ी ले डूबी गणगौर - समापन गणगौर से होता है।",
  },
  {
    questionPattern: /बिना ईसर की गवर/i,
    correctAnswerPattern: /जैसलमेर/i,
    rationale: "बिना ईसर की गवर केवल जैसलमेर में पूजी जाती है।",
  },
  {
    questionPattern: /धींगा गवर/i,
    correctAnswerPattern: /जोधपुर|उदयपुर/i,
    rationale: "धींगा गवर जोधपुर / उदयपुर का प्रसिद्ध है।",
  },
  {
    questionPattern: /फूलडोल/i,
    correctAnswerPattern: /रामस्नेही|शाहपुरा/i,
    rationale: "फूलडोल महोत्सव रामस्नेही संप्रदाय द्वारा शाहपुरा में मनाया जाता है।",
  },

  // Customs & Rituals (रीति-रिवाज)
  {
    questionPattern: /दूल्हे की बारात.*स्त्रियों द्वारा लोक नाट्य|बारात के घर से चले जाने के बाद/i,
    correctAnswerPattern: /टूटिया|टूट्या|खोड्या/i,
    rationale: "बारात जाने के बाद महिलाओं द्वारा किया जाने वाला स्वांग 'टूटिया' कहलाता है।",
  },
  {
    questionPattern: /पानीवाड़ा संस्कार|पानीवाड़ा/i,
    correctAnswerPattern: /मृत्यु|शोक/i,
    rationale: "पानीवाड़ा दाह-संस्कार के बाद स्नान करने की मृत्यु संबंधी रस्म है।",
  },
  {
    questionPattern: /मौसर|मौसर किसे/i,
    correctAnswerPattern: /मृत्यु\s*भोज|मृत्यु पर भोज|शोक भोज/i,
    rationale: "मौसर मृत्यु भोज को कहा जाता है (जोसर जीवित रहते किया जाने वाला भोज है)।",
  },
  {
    questionPattern: /बढ़ार|बढ़ार/i,
    correctAnswerPattern: /विवाह.*भोज|विवाह के अवसर पर प्रीतिभोज|विवाह पर आयोज्य भोज/i,
    rationale: "बढ़ार विवाह के अवसर पर दिया जाने वाला सामूहिक प्रीतिभोज है।",
  },
  {
    questionPattern: /चिकनी कोथली/i,
    correctAnswerPattern: /विवाह|सगाई/i,
    rationale: "चिकनी कोथली विवाह/सगाई की रस्म है जिसमें वर पक्ष वधू के लिए उपहार भेजता है।",
  },
  {
    questionPattern: /मोकाण/i,
    correctAnswerPattern: /मृत्यु|शोक/i,
    rationale: "मोकाण मृत्यु पर शोक व्यक्त करने जाने की रस्म है।",
  },
  {
    questionPattern: /औलंदी|ओलंन्दी/i,
    correctAnswerPattern: /नववधु के साथ जाने वाला|स्त्री या पुरुष/i,
    rationale: "नववधू के साथ ससुराल जाने वाली कन्या/स्त्री को औलंदी कहा जाता है।",
  },
  {
    questionPattern: /आंणौ|आणो|मुकलावा/i,
    correctAnswerPattern: /दुल्हन को दूसरी बार ससुराल भेजना|गौना/i,
    rationale: "आंणौ (मुकलावा/गौना) विवाह के पश्चात् दुल्हन को दूसरी बार ससुराल भेजने की रस्म है।",
  },
  {
    questionPattern: /नाता प्रथा/i,
    correctAnswerPattern: /पत्नी का अपने पति को छोड़कर किसी अन्य पुरुष के साथ रहना|पुनर्विवाह/i,
    rationale: "नाता प्रथा स्त्री द्वारा पूर्व पति को छोड़कर अन्य पुरुष के साथ रहने की प्रथा है।",
  },
  {
    questionPattern: /डावरिया/i,
    correctAnswerPattern: /दहेज में दी जाने वाली दासियाँ|कुंवारी कन्याएं/i,
    rationale: "राजा-महाराजाओं द्वारा दहेज में दी जाने वाली दासियों को डावरिया कहा जाता था।",
  },
  {
    questionPattern: /शारदा एक्ट|बाल विवाह निरोधक कानून.*प्रणेता/i,
    correctAnswerPattern: /हरविलास|हरबिलास शारदा/i,
    rationale: "1929 के बाल विवाह निरोधक अधिनियम (शारदा एक्ट) के प्रणेता रायबहादुर हरविलास शारदा (अजमेर) थे।",
  },
  {
    questionPattern: /सर्वप्रथम.*डाकन प्रथा/i,
    correctAnswerPattern: /उदयपुर|मेवाड़|1853/i,
    rationale: "डाकन प्रथा पर सर्वप्रथम 1853 में मेवाड़ (खेरवाड़ा) में रोक लगाई गई।",
  },
  {
    questionPattern: /सर्वप्रथम.*सती प्रथा/i,
    correctAnswerPattern: /बूंदी|बूँदी|1822/i,
    rationale: "सती प्रथा पर सर्वप्रथम 1822 में बूंदी राज्य ने रोक लगाई।",
  },
  {
    questionPattern: /सर्वप्रथम.*कन्या वध/i,
    correctAnswerPattern: /कोटा|1833/i,
    rationale: "कन्या वध पर सर्वप्रथम 1833 में कोटा राज्य ने रोक लगाई।",
  },
  {
    questionPattern: /सर्वप्रथम.*त्याग प्रथा/i,
    correctAnswerPattern: /जोधपुर|1841/i,
    rationale: "त्याग प्रथा पर सर्वप्रथम 1841 में जोधपुर (मारवाड़) रियासत ने रोक लगाई।",
  },
  {
    questionPattern: /सर्वप्रथम.*समाधि प्रथा/i,
    correctAnswerPattern: /जयपुर|1844/i,
    rationale: "समाधि प्रथा पर सर्वप्रथम 1844 में जयपुर रियासत ने रोक लगाई।",
  },

  // Districts & Divisions (जिले व संभाग)
  {
    questionPattern: /प्रतापगढ़.*जिला कब|जिला प्रतापगढ़ कब अस्तित्व/i,
    correctAnswerPattern: /2008|26 जनवरी.*2008/i,
    rationale: "33वाँ जिला प्रतापगढ़ 26 जनवरी 2008 को बना।",
  },
  {
    questionPattern: /प्रतापगढ़.*किस कमेटी|प्रतापगढ़ जिला.*सिफारिश/i,
    correctAnswerPattern: /परमेशचन्द|परमेश चन्द/i,
    rationale: "प्रतापगढ़ जिला परमेशचन्द कमेटी की सिफारिश पर बना।",
  },
  {
    questionPattern: /हनुमानगढ़.*गठन कब|गंगानगर से हनुमानगढ़/i,
    correctAnswerPattern: /1994|12.*07.*94|12 जुलाई.*1994/i,
    rationale: "31वाँ जिला हनुमानगढ़ 12 जुलाई 1994 को बना।",
  },
  {
    questionPattern: /करौली जिले का गठन कब/i,
    correctAnswerPattern: /1997|19.*07.*97|19 जुलाई.*1997/i,
    rationale: "32वाँ जिला करौली 19 जुलाई 1997 को बना।",
  },
  {
    questionPattern: /धौलपुर.*गठन कब|धौलपुर.*जिला कब बना/i,
    correctAnswerPattern: /1982|15 अप्रैल.*1982/i,
    rationale: "27वाँ जिला धौलपुर 15 अप्रैल 1982 को बना।",
  },
  {
    questionPattern: /दौसा.*गठन कब|दौसा.*जिला कब बना/i,
    correctAnswerPattern: /1991|10 अप्रैल.*1991/i,
    rationale: "29वाँ जिला दौसा 10 अप्रैल 1991 को बना।",
  },
  {
    questionPattern: /धनुषाकार.*आकृति/i,
    correctAnswerPattern: /दौसा/i,
    rationale: "दौसा जिले की आकृति धनुषाकार है।",
  },
  {
    questionPattern: /जैसलमेर.*धौलपुर जिले से कितना बड़ा/i,
    correctAnswerPattern: /12\.66/i,
    rationale: "जैसलमेर (38401 वर्ग किमी) धौलपुर (3033 वर्ग किमी) से 12.66 गुना बड़ा है।",
  },
  {
    questionPattern: /संभागीय व्यवस्था की शुरूआत दुबारा|संभागीय व्यवस्था को कब पुनर्जीवित/i,
    correctAnswerPattern: /1987|15 जनवरी.*1987|हरि देव जोशी/i,
    rationale: "15 जनवरी 1987 को हरिदेव जोशी सरकार द्वारा संभागीय व्यवस्था पुनः शुरू की गई।",
  },
  {
    questionPattern: /संभागीय व्यवस्था को समाप्त|संभागीय व्यवस्था को बंद/i,
    correctAnswerPattern: /1962|अप्रैल.*1962|मोहनलाल सुखाड़िया/i,
    rationale: "अप्रैल 1962 में मोहनलाल सुखाड़िया सरकार द्वारा संभागीय व्यवस्था समाप्त की गई।",
  },
  {
    questionPattern: /छठा संभाग अजमेर कब/i,
    correctAnswerPattern: /1987/i,
    rationale: "1987 में छठा संभाग अजमेर बना।",
  },
  {
    questionPattern: /7वाँ संभाग भरतपुर कब|सातवां संभाग भरतपुर/i,
    correctAnswerPattern: /2005|4 जून.*2005/i,
    rationale: "4 जून 2005 को 7वाँ संभाग भरतपुर बना।",
  },
  {
    questionPattern: /मुख्यालय का नाम उस जिले के नाम से भिन्न/i,
    correctAnswerPattern: /राजसमन्द|राजसमंद/i,
    rationale: "राजसमंद जिले का जिला मुख्यालय 'राजनगर' है।",
  },

  // Borders (राजस्थान की सीमा)
  {
    questionPattern: /रेडक्लिफ रेखा की राजस्थान में लम्बाई/i,
    correctAnswerPattern: /1070/i,
    rationale: "राजस्थान में अन्तर्राष्ट्रीय सीमा (रेडक्लिफ रेखा) की लंबाई 1070 किमी है।",
  },
  {
    questionPattern: /राजस्थान की कुल स्थलीय सीमा/i,
    correctAnswerPattern: /5920/i,
    rationale: "राजस्थान की कुल स्थलीय सीमा 5920 किमी है (1070 अन्तर्राष्ट्रीय + 4850 अन्तर्राज्यीय)।",
  },
  {
    questionPattern: /राजस्थान की कुल अन्तर्राज्यीय सीमा/i,
    correctAnswerPattern: /4850/i,
    rationale: "राजस्थान की कुल अन्तर्राज्यीय सीमा 4850 किमी है।",
  },
  {
    questionPattern: /पाकिस्तान के साथ सर्वाधिक लम्बी सीमा/i,
    correctAnswerPattern: /जैसलमेर/i,
    rationale: "जैसलमेर पाकिस्तान के साथ सर्वाधिक 464 किमी सीमा बनाता है।",
  },
  {
    questionPattern: /पाकिस्तान के साथ सबसे छोटी सीमा|न्यूनतम अन्तर्राष्ट्रीय सीमा/i,
    correctAnswerPattern: /बीकानेर/i,
    rationale: "बीकानेर पाकिस्तान के साथ न्यूनतम 168 किमी सीमा बनाता है।",
  },
  {
    questionPattern: /सर्वाधिक अन्तर्राज्यीय सीमा बनाने वाला जिला/i,
    correctAnswerPattern: /झालावाड़|झालावाड़/i,
    rationale: "झालावाड़ मध्य प्रदेश के साथ सर्वाधिक (520 किमी) अन्तर्राज्यीय सीमा बनाता है।",
  },
  {
    questionPattern: /न्यूनतम अन्तर्राज्यीय सीमा बनाने वाला जिला/i,
    correctAnswerPattern: /बाड़मेर|बाड़मेर/i,
    rationale: "बाड़मेर गुजरात के साथ न्यूनतम (14 किमी) अन्तर्राज्यीय सीमा बनाता है।",
  },
];

async function deepVerifyAndFix() {
  await connectToDatabase();

  const slugs = [
    "rajasthan-me-tyohar",
    "rajasthan-ke-jile-va-sambhag",
    "rajasthan-ki-seema",
    "rajasthan-me-reeti-riwaj-avam-prathayein",
  ];

  console.log(`\n======================================================`);
  console.log(`🔍 RUNNING DEEP FACTUAL VERIFICATION ON ALL 4 QUIZZES`);
  console.log(`======================================================\n`);

  let totalFixes = 0;

  for (const slug of slugs) {
    const quiz = await Quiz.findOne({ slug });
    if (!quiz) continue;

    const questions = await QuizQuestion.find({ quizId: quiz._id }).sort({ order: 1 });
    let quizFixes = 0;

    for (const q of questions) {
      let matchedRule = null;

      for (const rule of RAJASTHAN_GK_FACT_MAP) {
        if (rule.questionPattern.test(q.questionText)) {
          matchedRule = rule;
          break;
        }
      }

      if (matchedRule) {
        // Find which option matches the rule's answer pattern
        const targetOptIdx = q.options.findIndex((opt) => matchedRule!.correctAnswerPattern.test(opt));

        if (targetOptIdx !== -1 && targetOptIdx !== q.correctOptionIndex) {
          const oldChar = String.fromCharCode(65 + q.correctOptionIndex);
          const newChar = String.fromCharCode(65 + targetOptIdx);

          console.log(`🎯 FACT-MATCH CORRECTION in "${quiz.title}" (Q#${q.order}):`);
          console.log(`   Question: ${q.questionText}`);
          console.log(`   Old: [${oldChar}] "${q.options[q.correctOptionIndex]}"`);
          console.log(`   New: [${newChar}] "${q.options[targetOptIdx]}"`);
          console.log(`   Rule Rationale: ${matchedRule.rationale}\n`);

          q.correctOptionIndex = targetOptIdx;
          await q.save();
          quizFixes++;
          totalFixes++;
        }
      }
    }

    console.log(`✅ "${quiz.title}": Applied ${quizFixes} fact-verified corrections.`);
  }

  console.log(`\n======================================================`);
  console.log(`🎉 DEEP FACTUAL VERIFICATION COMPLETE (Total Applied: ${totalFixes})`);
  console.log(`======================================================\n`);
}

deepVerifyAndFix()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
