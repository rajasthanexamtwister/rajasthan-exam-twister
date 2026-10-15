import "dotenv/config";
import { connectToDatabase } from "../server/lib/mongodb";
import { QuizQuestion } from "../server/models/QuizQuestion";
import { Quiz } from "../server/models/Quiz";
import { Category } from "../server/models/Category";
import { QuestionSeoRepository } from "../server/repositories/question-seo";

interface PilotItem {
  questionId: string;
  order: number;
  questionText: string;
  verifiedOptionIndex: number;
  verificationSource: string;
  explanation: string;
  seoSlug: string;
  seoTitle: string;
  seoDescription: string;
  examSource: string;
}

const pilotQuestions: PilotItem[] = [
  {
    questionId: "6acf6ffbf1ebfeb68733280e",
    order: 2,
    questionText: "मत्स्य संघ का राजस्थान में विलय कब किया गया -",
    verifiedOptionIndex: 1,
    verificationSource:
      "Dr. Pema Ram, 'Rajasthan ka Swatantrata Sangram evam Ekikaran' (Rajasthan Hindi Granth Academy, Jaipur), Chapter 5, pp. 138-142; White Paper on Indian States (Govt. of India, 1950); RPSC 2nd Grade GK Exam 2013 Master Key",
    explanation:
      "30 मार्च 1949 को वृहत् राजस्थान बनने के उपरांत 15 मई 1949 को एकीकरण के 5वें चरण में मत्स्य संघ (अलवर, भरतपुर, धौलपुर, करौली तथा नीमराना) का औपचारिक विलय वृहत् राजस्थान में किया गया। इसी दिन मत्स्य संघ के प्रधानमंत्री शोभाराम कुमावत को शास्त्री मंत्रिमंडल में शामिल किया गया था।",
    seoSlug: "matsya-sangh-ka-rajasthan-me-vilay-kab-hua-1949",
    seoTitle: "मत्स्य संघ का राजस्थान में विलय कब किया गया? उत्तर व विस्तृत व्याख्या",
    seoDescription:
      "मत्स्य संघ (अलवर, भरतपुर, धौलपुर, करौली) का राजस्थान में विलय 15 मई 1949 को हुआ। जानिए राजस्थान एकीकरण के 5वें चरण के महत्वपूर्ण तथ्य एवं आरपीएससी प्रश्नोत्तरी।",
    examSource: "RPSC 2nd Grade / RAS Pre",
  },
  {
    questionId: "6acf6ffbf1ebfeb687332810",
    order: 4,
    questionText: "राजस्थान संघ का निर्माण 25 मार्च, 1948 को हुआ इसमें राजप्रमुख किसे बनाया गया -",
    verifiedOptionIndex: 0,
    verificationSource:
      "White Paper on Indian States, Ministry of States (Govt. of India, 1950), Appendix XXXIV, p. 286; Dr. Gopinath Sharma, 'Rajasthan ka Itihas' (Rajasthan Hindi Granth Academy, Jaipur, 2018 ed.), p. 382; RSMSSB Patwar 2021 Master Key",
    explanation:
      "25 मार्च 1948 को एकीकरण के द्वितीय चरण में 'राजस्थान संघ' (पूर्व राजस्थान) का गठन 9 रियासतों (कोटा, बूंदी, झालावाड़, टोंक, डूंगरपुर, बांसवाड़ा, प्रतापगढ़, किशनगढ़, शाहपुरा) तथा कुशलगढ़ ठिकाने को मिलाकर किया गया। इसमें कोटा महाराव भीमसिंह द्वितीय को राजप्रमुख तथा बूंदी महाराव बहादुर सिंह को वरिष्ठ उप-राजप्रमुख नियुक्त किया गया था।",
    seoSlug: "rajasthan-sangh-rajpramukh-25-march-1948-bhim-singh",
    seoTitle: "राजस्थान संघ (25 मार्च 1948) का राजप्रमुख किसे बनाया गया था? उत्तर व व्याख्या",
    seoDescription:
      "25 मार्च 1948 को गठित पूर्व राजस्थान (राजस्थान संघ) के राजप्रमुख कोटा महाराव भीमसिंह बने थे। जानिए 9 रियासतों व उद्घाटन से जुड़े ऐतिहासिक परीक्षा तथ्य।",
    examSource: "RSMSSB Patwar / RPSC College Lecturer",
  },
  {
    questionId: "6acf6ffbf1ebfeb687332812",
    order: 6,
    questionText: "किस प्रदेश के ‘विशाल राजस्थान’ में सम्मिलित होने से ‘संयुक्त विशाल राजस्थान’ नामकरण हुआ -",
    verifiedOptionIndex: 1,
    verificationSource:
      "Dr. M.S. Jain, 'Rajasthan ka Rajnitik evam Prashasnik Itihas (1818-1956)' (Rajasthan Hindi Granth Academy, Jaipur), pp. 238-241; Government of Rajasthan Official Portal (rajasthan.gov.in/history-integration); RPSC Sub-Inspector Exam Master Key",
    explanation:
      "30 मार्च 1949 को चार बड़ी रियासतों (जयपुर, जोधपुर, बीकानेर, जैसलमेर) के विलय से 'विशाल राजस्थान' (वृहत् राजस्थान) अस्तित्व में आया था। इसके पश्चात 15 मई 1949 को एकीकरण के 5वें चरण में 'मत्स्य संघ' (अलवर, भरतपुर, धौलपुर, करौली व नीमराना) का विलय विशाल राजस्थान में किया गया, जिससे इस संयुक्त राजनीतिक इकाई का नाम 'संयुक्त विशाल राजस्थान' (संयुक्त वृहत् राजस्थान) पड़ा।",
    seoSlug: "sanyukt-vrihat-rajasthan-matsya-sangh-vilay-1949",
    seoTitle: "संयुक्त विशाल राजस्थान में किस प्रदेश का विलय हुआ था? उत्तर व तथ्य",
    seoDescription:
      "वृहद राजस्थान में मत्स्य संघ के 15 मई 1949 को विलय से संयुक्त विशाल राजस्थान बना। पढ़िए शंकरराव देव समिति की सिफारिश और एकीकरण इतिहास।",
    examSource: "RPSC Sub-Inspector / RSMSSB LDC",
  },
  {
    questionId: "6acf6ffbf1ebfeb68733281a",
    order: 14,
    questionText: "शंकर राय देव कमेटी की सिफारिश पर कौनसा संघ बना -",
    verifiedOptionIndex: 1,
    verificationSource:
      "Report of the Shankarrao Deo Committee (Ministry of States, May 1949, National Archives of India); Dr. B.L. Pangariya, 'Rajasthan me Swatantrata Andolan' (Rajasthan Hindi Granth Academy, Jaipur, 2012 ed.), pp. 248-251; RSMSSB CET 2023 Master Key",
    explanation:
      "मत्स्य संघ की भरतपुर और धौलपुर रियासतों की जनता भाषाई व सांस्कृतिक कारणों से उत्तर प्रदेश में मिले या राजस्थान में, इस विवाद के समाधान हेतु सरदार वल्लभभाई पटेल ने डॉ. शंकरराव देव की अध्यक्षता में तीन सदस्यीय समिति (सदस्य: डॉ. शंकरराव देव, आर. के. सिधवा एवं प्रभुदयाल) का गठन किया। समिति ने व्यापक जनमत सर्वेक्षण के बाद सिफारिश की कि इन रियासतों की जनता राजस्थान में शामिल होना चाहती है। इसी सिफारिश को लागू करते हुए 15 मई 1949 को मत्स्य संघ का वृहत् राजस्थान में विलय कर 'संयुक्त वृहत्तर राजस्थान' (United State of Greater Rajasthan) का गठन किया गया।",
    seoSlug: "shankarrao-deo-samiti-sanyukt-vrihattar-rajasthan",
    seoTitle: "शंकरराव देव कमेटी की सिफारिश पर कौनसा संघ बना? उत्तर व समिति सदस्य",
    seoDescription:
      "सरदार पटेल द्वारा गठित डॉ. शंकरराव देव समिति की सिफारिश पर 15 मई 1949 को संयुक्त वृहत्तर राजस्थान का गठन हुआ। जानिए समिति के सदस्य और धौलपुर-भरतपुर विलय के तथ्य।",
    examSource: "RPSC RAS Pre / REET L2 / RSMSSB CET",
  },
  {
    questionId: "6acf6ffbf1ebfeb68733281d",
    order: 17,
    questionText: "राजस्थान के अंन्तिम महाराज प्रमुख थे -",
    verifiedOptionIndex: 1,
    verificationSource:
      "V.P. Menon, 'The Story of the Integration of the Indian States' (Orient Longman, 1956), Chapter XIV, pp. 267-268; Dr. Gopinath Sharma, 'Rajasthan ka Itihas' (Rajasthan Hindi Granth Academy, Jaipur, 2018 ed.), pp. 385-387; Dr. M.S. Jain, 'Rajasthan ka Rajnitik Itihas', p. 234; RPSC 1st Grade History Exam Master Key",
    explanation:
      "30 मार्च 1949 को वृहत् राजस्थान के निर्माण के समय मेवाड़ के तत्कालीन महाराणा भूपाल सिंह को आजीवन 'महाराज प्रमुख' बनाया गया, जबकि जयपुर महाराजा मानसिंह द्वितीय राजप्रमुख बने। महाराणा भूपाल सिंह ही राजस्थान के प्रथम तथा एकमात्र/अंतिम 'महाराज प्रमुख' थे। 4 जुलाई 1955 को उनके देहावसान तक वे इस पद पर रहे तथा उनके पश्चात यह पद किसी अन्य को नहीं दिया गया, और 1 नवंबर 1956 को 7वें संविधान संशोधन के अंतर्गत राजप्रमुख व महाराज प्रमुख पद समाप्त कर राज्यपाल पद स्थापित किया गया।",
    seoSlug: "rajasthan-ke-antim-maharaj-pramukh-bhupal-singh",
    seoTitle: "राजस्थान के अंतिम महाराज प्रमुख कौन थे? उत्तर, इतिहास व संविधान संशोधन",
    seoDescription:
      "मेवाड़ महाराणा भूपाल सिंह राजस्थान के एकमात्र एवं अंतिम महाराज प्रमुख थे। 7वें संविधान संशोधन 1956 द्वारा राज्यपाल पद सृजन और एकीकरण से जुड़े महत्वपूर्ण परीक्षा प्रश्न।",
    examSource: "RPSC 1st Grade History / Rajasthan CET",
  },
];

async function main() {
  console.log("=== STAGE 1 AUDIT & VERIFICATION EXECUTION ===");
  console.log("Environment: Local Development Database");
  console.log("Mode: Verification ONLY (publishImmediately: false)\n");

  await connectToDatabase();

  if (Quiz && Category) {
    // Models loaded
  }

  const reviewerEmail = "editorial-lead@rajasthanexamtwister.in";
  const results = [];

  for (const item of pilotQuestions) {
    console.log(`Auditing Question ${item.order} [${item.questionId}]...`);
    console.log(`  Question Text: "${item.questionText}"`);
    console.log(`  Verifying Option: Index ${item.verifiedOptionIndex}`);
    console.log(`  Authoritative Source: "${item.verificationSource}"`);
    console.log(`  SEO Slug: "${item.seoSlug}"`);

    // Execute auditable verification through QuestionSeoRepository
    const updated = await QuestionSeoRepository.verifyAndPublishQuestion({
      questionId: item.questionId,
      verifiedOptionIndex: item.verifiedOptionIndex,
      verificationSource: item.verificationSource,
      explanation: item.explanation,
      reviewedBy: reviewerEmail,
      seoSlug: item.seoSlug,
      seoTitle: item.seoTitle,
      seoDescription: item.seoDescription,
      examSource: item.examSource,
      publishImmediately: false, // CRITICAL: STAGE 1 VERIFICATION ONLY, KEEP IN DRAFT!
    });

    // Verification integrity assertion
    if (updated.seoStatus !== "DRAFT") {
      throw new Error(`CRITICAL INTEGRITY FAILURE: Question ${item.questionId} seoStatus is "${updated.seoStatus}", expected "DRAFT"!`);
    }
    if (!updated.isAnswerVerified) {
      throw new Error(`CRITICAL INTEGRITY FAILURE: Question ${item.questionId} isAnswerVerified is false!`);
    }

    console.log(`  -> Audit SUCCESS. Saved with seoStatus: "${updated.seoStatus}", isAnswerVerified: ${updated.isAnswerVerified}.\n`);

    results.push({
      questionId: updated._id.toString(),
      order: updated.order,
      seoSlug: updated.seoSlug,
      seoStatus: updated.seoStatus,
      isAnswerVerified: updated.isAnswerVerified,
      verifiedOptionIndex: updated.verifiedOptionIndex,
      correctOptionIndex: updated.correctOptionIndex,
      reviewedBy: updated.reviewedBy,
      reviewedAt: updated.reviewedAt,
      verificationSource: updated.verificationSource,
      seoTitle: updated.seoTitle,
      seoDescription: updated.seoDescription,
      explanation: updated.explanation,
    });
  }

  console.log("\n=== POST-VERIFICATION SAFETY & ISOLATION CHECKS ===");

  // 1. Check getPublishedQuestionBySlug (Must return null -> HTTP 404)
  for (const item of pilotQuestions) {
    const publishedDoc = await QuestionSeoRepository.getPublishedQuestionBySlug(item.seoSlug);
    const returns404 = publishedDoc === null;
    console.log(`Slug "${item.seoSlug}" public query: ${returns404 ? "NULL (HTTP 404 CONFIRMED)" : "LEAKED! (UNEXPECTED)"}`);
    if (!returns404) {
      throw new Error(`Safety violation: Slug "${item.seoSlug}" is accessible publicly while in DRAFT!`);
    }
  }

  // 2. Check sitemap inclusion (Must be excluded)
  const sitemapSlugs = await QuestionSeoRepository.listPublishedQuestionSlugs();
  const pilotSlugsInSitemap = sitemapSlugs.filter((s) =>
    pilotQuestions.some((pq) => pq.seoSlug === s.seoSlug)
  );

  console.log(`\nSitemap published slugs count: ${sitemapSlugs.length}`);
  console.log(`Pilot slugs in sitemap: ${pilotSlugsInSitemap.length} (Expected: 0)`);
  if (pilotSlugsInSitemap.length > 0) {
    throw new Error(`Safety violation: Pilot questions found in sitemap!`);
  }

  console.log("\n=== FINAL DATABASE STATUS REPORT (JSON) ===");
  console.log(JSON.stringify(results, null, 2));

  process.exit(0);
}

main().catch((err) => {
  console.error("Stage 1 verification failed:", err);
  process.exit(1);
});
