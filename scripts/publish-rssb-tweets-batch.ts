import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { connectToDatabase } from "../server/lib/mongodb";
import { Blog } from "../server/models/Blog";
import { Category } from "../server/models/Category";
import { Tag } from "../server/models/Tag";
import { Media } from "../server/models/Media";
import { slugify } from "../server/lib/slugify";

const blogsToPublish = [
  {
    title: "RSSB Exam Calendar 2026: CET, टीचिंग एसोसिएट्स (32 Subjects), JEn और Lab Attendant परीक्षा तिथियां जारी",
    slug: "rssb-exam-calendar-2026-cet-teaching-associates-jen-lab-attendant-dates",
    excerpt: "राजस्थान कर्मचारी चयन बोर्ड (RSSB) के अध्यक्ष आलोक राज ने CET 12th व स्नातक स्तर, 32 विषयों के टीचिंग एसोसिएट्स, Lab Attendant और JEn परीक्षाओं की तिथियों की आधिकारिक घोषणा कर दी है। पूरा टाइम टेबल यहाँ देखें।",
    metaTitle: "RSSB Exam Calendar 2026 जारी: CET, टीचिंग एसोसिएट्स, JEn परीक्षा तिथियां",
    metaDescription: "RSSB New Exam Calendar 2026: राजस्थान सीईटी सीनियर सेकेंडरी व स्नातक, 32 विषयों के टीचिंग एसोसिएट्स, JEn और लैब अटेंडेंट परीक्षा का संपूर्ण शेड्यूल, शिफ्ट टाइमिंग और टाइम टेबल यहाँ देखें।",
    category: "Current Affairs",
    tags: [
      "RSSB Exam Calendar 2026",
      "Rajasthan CET Exam Dates",
      "CET 12th Level Date",
      "CET Graduation Date",
      "Teaching Associates Exam 2026",
      "RSSB JEn Exam Date",
      "Lab Attendant 2026",
      "Alok Raj RSSB"
    ],
    coverImage: {
      url: "/brand/rssb-exam-calendar-2026.jpg",
      altText: "Rajasthan RSSB New Exam Calendar 2026 Official Notification",
      caption: "RSSB Exam Calendar 2026: CET, Teaching Associates, JEn & Lab Attendant Dates"
    },
    readingTime: 5,
    featured: true,
    author: "Rajasthan Exam Twister Editorial Team",
    contentHtml: `<blockquote><strong>आधिकारिक घोषणा:</strong> राजस्थान कर्मचारी चयन बोर्ड (RSSB / RSMSSB) के अध्यक्ष <strong>मेजर जनरल आलोक राज</strong> ने अभ्यर्थियों को परीक्षा की अग्रिम तैयारी की शुभकामनाएं देते हुए <strong>टीचिंग एसोसिएट्स (32 विषय), CET सीनियर सेकेंडरी, CET स्नातक, लैब अटेंडेंट और कनिष्ठ अभियंता (JEn)</strong> परीक्षाओं की तिथियों का आधिकारिक नोटिफिकेशन जारी करने की पुष्टि की है।</blockquote><h2>1. RSSB मेगा परीक्षा कैलेंडर 2026 — मुख्य आकर्षण (Overview)</h2><p>राजस्थान कर्मचारी चयन बोर्ड ने इस वर्ष आयोजित होने वाली प्रमुख प्रतियोगी परीक्षाओं की तिथियों को समयबद्ध रूप से घोषित कर दिया है। यह कैलेंडर लाखों उन अभ्यर्थियों के लिए अत्यंत महत्वपूर्ण है जो सीईटी और तकनीकी/शिक्षण भर्तियों की तैयारी कर रहे हैं।</p><table><thead><tr><th>परीक्षा का नाम (Exam Name)</th><th>प्रस्तावित परीक्षा तिथि / माह</th><th>परीक्षा का प्रकार / स्तर</th></tr></thead><tbody><tr><td><strong>CET (Senior Secondary Level)</strong></td><td>अक्टूबर / नवंबर 2026</td><td>राज्य स्तरीय पात्रता परीक्षा (12वीं स्तर)</td></tr><tr><td><strong>CET (Graduation Level)</strong></td><td>सितंबर / अक्टूबर 2026</td><td>राज्य स्तरीय पात्रता परीक्षा (स्नातक स्तर)</td></tr><tr><td><strong>टीचिंग एसोसिएट्स (32 विषय)</strong></td><td>विषयवार व शिफ्टवार विस्तृत शेड्यूल जारी</td><td>विशिष्ट विषय आधारित शिक्षण भर्ती</td></tr><tr><td><strong>कनिष्ठ अभियंता (JEn Direct Recruitment)</strong></td><td>प्रस्तावित फरवरी 2027</td><td>PWD, WRD, PHED इंजीनियरिंग संवर्ग</td></tr><tr><td><strong>लैब अटेंडेंट (Lab Attendant Exam)</strong></td><td>नवंबर 2026</td><td>माध्यमिक / उच्च माध्यमिक तकनीकी पद</td></tr></tbody></table><h2>2. टीचिंग एसोसिएट्स के 32 विषयों की विषयवार व शिफ्टवार परीक्षा</h2><p>अध्यक्ष आलोक राज ने स्पष्ट किया कि टीचिंग एसोसिएट्स भर्ती के अंतर्गत कुल <strong>32 अलग-अलग विषयों</strong> की परीक्षाएं आयोजित की जाएंगी। बोर्ड द्वारा इन सभी 32 विषयों के लिए विषयवार, तिथि एवं शिफ्टवार (Morning & Evening Shift) विस्तृत समय सारणी आधिकारिक पोर्टल पर उपलब्ध करवाई जा रही है।</p><h3>अभ्यर्थियों के लिए मुख्य निर्देश:</h3><ul><li><strong>एडमिट कार्ड:</strong> परीक्षा से 7 दिन पूर्व SSO ID और रिक्रूटमेंट पोर्टल के माध्यम से डाउनलोड किए जा सकेंगे।</li><li><strong>बायोमेट्रिक एवं फेस रिकॉग्निशन:</strong> परीक्षा केंद्रों पर अनिवार्य बायोमेट्रिक सत्यापन और 5वें विकल्प (5th Option) नियम का कड़ाई से पालन होगा।</li></ul><h2>3. राजस्थान CET (12वीं व स्नातक स्तर) के लिए अंतिम रणनीति</h2><p>समान पात्रता परीक्षा (CET) राजस्थान की सभी आगामी प्रमुख भर्तियों जैसे राजस्थान पुलिस कांस्टेबल, एलडीसी, पटवारी, महिला सुपरवाइजर, और वनपाल के लिए अनिवार्य गेटवे है।</p><ol><li><strong>राजस्थान जीके और समसामयिकी:</strong> कुल 150 प्रश्नों में से 50+ प्रश्न राजस्थान के इतिहास, कला-संस्कृति, भूगोल एवं राजस्थान करंट अफेयर्स से आते हैं।</li><li><strong>नेगेटिव मार्किंग व 5वां विकल्प:</strong> प्रत्येक प्रश्न में 5 विकल्प (A, B, C, D, E) होंगे। यदि प्रश्न हल नहीं करना है, तो 5वां विकल्प भरना अनिवार्य है। 10% से अधिक अनुत्तरित प्रश्न खाली छोड़ने पर अयोग्य घोषित कर दिया जाएगा।</li></ol><h2>4. आधिकारिक संदर्भ एवं फ्री स्टडी मटेरियल (Direct Links)</h2><ul><li>🌐 <strong>RSSB Official Notification Hub:</strong> <a href="https://rssb.rajasthan.gov.in/news" target="_blank" rel="noopener noreferrer">rssb.rajasthan.gov.in/news</a></li><li>📖 <strong>राजस्थान सीईटी हस्तलिखित रिवीजन नोट्स:</strong> <a href="https://www.rajasthanexamtwister.in/notes">Free Rajasthan GK Notes</a></li><li>📝 <strong>दैनिक विषयवार मॉक टेस्ट (Daily Free Quizzes):</strong> <a href="https://www.rajasthanexamtwister.in/quizzes">Rajasthan Exam Twister Quizzes</a></li></ul><h2>5. अक्सर पूछे जाने वाले प्रश्न (FAQs)</h2><h3>Q1: RSSB का नया परीक्षा कैलेंडर कहाँ से डाउनलोड करें?</h3><p><strong>उत्तर:</strong> आप राजस्थान कर्मचारी चयन बोर्ड के आधिकारिक पोर्टल rssb.rajasthan.gov.in के 'News & Notifications' सेक्शन से पीडीएफ डाउनलोड कर सकते हैं।</p><h3>Q2: क्या सीईटी परीक्षा में 5वां विकल्प भरना अनिवार्य है?</h3><p><strong>उत्तर:</strong> हाँ, RSSB की सभी परीक्षाओं में यदि आप कोई प्रश्न छोड़ रहे हैं, तो विकल्प 'E' (5वां गोला) भरना अनिवार्य है।</p><h3>Q3: टीचिंग एसोसिएट्स के कितने विषयों की परीक्षा आयोजित होगी?</h3><p><strong>उत्तर:</strong> कुल 32 विषयों के लिए विषयवार एवं शिफ्टवार परीक्षाएं आयोजित की जाएंगी।</p>`
  },
  {
    title: "Rajasthan LDC Result PDF में Rank और Marks क्यों नहीं दिखे? RSSB अध्यक्ष आलोक राज ने स्पष्ट किया नियम",
    slug: "rajasthan-ldc-result-ranking-score-withhold-rule-alok-raj-clarification",
    excerpt: "LDC भर्ती के परिणाम में मेरिट रैंक और स्कोर क्यों नहीं थे? RSSB चेयरमैन मेजर जनरल आलोक राज ने स्पष्ट किया कि टाइप टेस्ट के कारण रैंक रोकी गई है और यह प्री-डीवी में जारी होगी। पूरी जानकारी यहाँ पढ़ें।",
    metaTitle: "Rajasthan LDC Result: रैंक और मार्क्स क्यों नहीं दिखे? RSSB चेयरमैन का स्पष्टीकरण",
    metaDescription: "Rajasthan LDC Result PDF में मेरिट रैंक और मार्क्स क्यों नहीं थे? RSSB अध्यक्ष आलोक राज का स्पष्टीकरण: टाइप टेस्ट के बाद प्री-डीवी रिजल्ट में आएगी फाइनल मेरिट रैंक। पूरा नियम यहाँ समझें।",
    category: "Current Affairs",
    tags: [
      "Rajasthan LDC Result 2026",
      "LDC Result Merit List",
      "LDC Score Card Rule",
      "Alok Raj LDC Result",
      "RSSB Junior Assistant Result",
      "LDC Typing Test Pre-DV"
    ],
    coverImage: {
      url: "/brand/ldc-result-ranking-rule.jpg",
      altText: "Rajasthan LDC Result Ranking Rule Clarified by RSSB Chairman",
      caption: "LDC Result Ranking Clarification: Merit Rank vs Serial Number Rule"
    },
    readingTime: 4,
    featured: false,
    author: "Rajasthan Exam Twister Editorial Team",
    contentHtml: `<blockquote><strong>अध्यक्षीय स्पष्टीकरण:</strong> राजस्थान LDC / कनिष्ठ सहायक भर्ती परीक्षा के परिणाम जारी होने के बाद अभ्यर्थियों द्वारा रैंक और स्कोर न दिखने पर उठे सवालों का जवाब देते हुए RSSB अध्यक्ष <strong>मेजर जनरल आलोक राज</strong> ने स्पष्ट किया: <em>"Type test की वजह से रैंक और स्कोर को withhold किया है। सभी PDF में रैंक नहीं महज सीरियल नंबर हैं। रैंक और स्कोर टाइप टेस्ट के बाद प्री-डीवी (Pre-DV) रिजल्ट में आएंगे।"</em></blockquote><h2>1. LDC परिणाम में क्या था विवाद? (The Confusion Explained)</h2><p>28 सितंबर को जब चयन बोर्ड ने LDC परीक्षा का परिणाम (टाइप टेस्ट के लिए शॉर्टलिस्टेड अभ्यर्थियों की 4000+ पेजों की 4 पीडीएफ) जारी किया, तो अभ्यर्थियों ने देखा कि पीडीएफ में अंकों (Marks) का कॉलम नहीं था और रोल नंबर के आगे सिर्फ 1, 2, 3... जैसे सीरियल नंबर लिखे थे।</p><p>कई छात्रों में यह भ्रम फैल गया कि क्या यह उनकी 'मेरिट रैंक' (Merit Rank) है? लेकिन बोर्ड ने साफ कर दिया कि यह केवल एक <strong>क्रम संख्या (Serial Number)</strong> है, न कि कोई मेरिट सूची।</p><table><thead><tr><th>पहलू</th><th>पीडीएफ में क्या था?</th><th>वास्तविक स्थिति (Fact)</th></tr></thead><tbody><tr><td><strong>पीडीएफ में प्रदर्शित नंबर</strong></td><td>1, 2, 3, 4, 5...</td><td>यह केवल प्रशासनिक सीरियल नंबर है, रैंक नहीं।</td></tr><tr><td><strong>व्यक्तिगत स्कोर (Marks)</strong></td><td>पीडीएफ में उपलब्ध नहीं</td><td>स्कोर कार्ड पोर्टल पर अलग से जारी कर दिया गया है।</td></tr><tr><td><strong>फाइनल मेरिट रैंक</strong></td><td>वर्तमान में Withhold (रोकी गई)</td><td>टाइपिंग टेस्ट के बाद Pre-DV चरण में जारी होगी।</td></tr></tbody></table><h2>2. बोर्ड ने रैंक को Withhold (रोक) क्यों रखा?</h2><p>LDC भर्ती एक <strong>दो-चरणीय भर्ती प्रक्रिया (Two-Phase Selection)</strong> है:</p><ul><li><strong>फेज-1 (लिखित परीक्षा):</strong> 200 अंक (पेपर-1: 100 अंक, पेपर-2: 100 अंक)</li><li><strong>फेज-2 (टाइपिंग एवं दक्षता परीक्षा):</strong> 100 अंक (हिंदी: 50 अंक, अंग्रेजी: 50 अंक)</li><li><strong>कुल पूर्णांक (Total Merit):</strong> 300 अंक</li></ul><p>बोर्ड अध्यक्ष के अनुसार, यदि केवल लिखित परीक्षा (200 अंक) के आधार पर रैंक जारी कर दी जाती, तो वह भ्रामक होती क्योंकि टाइपिंग टेस्ट (100 अंक) के बाद अभ्यर्थियों के समग्र अंकों में बड़ा उलटफेर हो जाता है। इसलिए अंतिम मेरिट रैंक दोनों चरणों के कुल 300 अंकों को मिलाकर प्री-डॉक्यूमेंट वेरिफिकेशन (Pre-DV) के समय ही घोषित की जाएगी।</p><h2>3. अभ्यर्थी अपने लिखित परीक्षा के अंक कैसे देखें?</h2><p>यद्यपि रिजल्ट पीडीएफ में अंक नहीं थे, लेकिन बोर्ड ने अब <strong>आधिकारिक स्कोर कार्ड पोर्टल</strong> पर सभी अभ्यर्थियों के पेपर-1 और पेपर-2 के अंक लाइव कर दिए हैं। आप <a href="https://www.rajasthanexamtwister.in/blogs/rssb-ldc-score-card-2026-out-check-marks-direct-link">LDC स्कोर कार्ड डाउनलोड गाइड</a> देखकर अपने अंक चेक कर सकते हैं।</p><h2>4. टाइपिंग टेस्ट की तैयारी के लिए महत्वपूर्ण सुझाव</h2><ol><li><strong>हिंदी टाइपिंग (Devlys / KrutiDev 010):</strong> प्रतिदिन न्यूनतम 2 घंटे गति और 1 घंटा दक्षता (Formatting/Tables in MS Word) का अभ्यास करें।</li><li><strong>अंग्रेजी टाइपिंग:</strong> स्पीड को 35+ WPM तक ले जाने का लक्ष्य रखें ताकि परीक्षा के तनाव में 25 WPM आसानी से पार हो जाए।</li><li><strong>समान महत्व:</strong> 100 अंकों की टाइपिंग आपके अंतिम चयन और मनचाहा विभाग (Secretariat / RPSC / Subordinate Offices) तय करेगी।</li></ol><h2>5. FAQs — LDC रिजल्ट व रैंकिंग संशय निवारण</h2><h3>Q1: क्या LDC रिजल्ट पीडीएफ में लिखे नंबर मेरी मेरिट रैंक हैं?</h3><p><strong>उत्तर:</strong> नहीं, पीडीएफ में केवल सीरियल नंबर दिए गए थे। मेरिट रैंक टाइप टेस्ट के बाद आएगी।</p><h3>Q2: फाइनल चयन सूची (Merit List) कितने अंकों में से बनेगी?</h3><p><strong>उत्तर:</strong> लिखित परीक्षा के 200 अंक + टाइपिंग टेस्ट के 100 अंक = कुल 300 अंकों में से फाइनल मेरिट बनेगी।</p>`
  },
  {
    title: "क्या Rajasthan CET स्नातक के फॉर्म फिर से Re-open होंगे? RSSB चेयरमैन आलोक राज का बड़ा बयान",
    slug: "rajasthan-cet-graduate-level-form-reopen-status-rssb-update",
    excerpt: "राजस्थान CET ग्रेजुएशन स्तर के फॉर्म री-ओपन होने को लेकर RSSB अध्यक्ष आलोक राज ने स्थिति स्पष्ट कर दी है। क्या फॉर्म दोबारा भरे जाएंगे? बोर्ड का अंतिम फैसला और अभ्यर्थियों के लिए सलाह यहाँ पढ़ें।",
    metaTitle: "Rajasthan CET स्नातक फॉर्म Re-Open होंगे या नहीं? RSSB चेयरमैन का आधिकारिक बयान",
    metaDescription: "Rajasthan CET Graduate Level Exam 2026 फॉर्म री-ओपनिंग पर RSSB अध्यक्ष मेजर जनरल आलोक राज का स्पष्ट बयान: 'No reopening of forms please'। जाने पूरी स्थिति और आगामी रणनीति।",
    category: "Current Affairs",
    tags: [
      "Rajasthan CET Graduate Level",
      "CET Form Reopen 2026",
      "Alok Raj RSSB Tweet",
      "CET Exam 2026 Update",
      "Rajasthan CET Registration"
    ],
    coverImage: {
      url: "/brand/cet-graduate-form-reopen-status.jpg",
      altText: "Rajasthan CET Graduate Level Application Form Reopen Status Update",
      caption: "Rajasthan CET Graduate Level: No Form Re-opening Policy Clarified"
    },
    readingTime: 3,
    featured: false,
    author: "Rajasthan Exam Twister Editorial Team",
    contentHtml: `<blockquote><strong>आधिकारिक बयान:</strong> राजस्थान CET स्नातक स्तर (Graduate Level) के फॉर्म दोबारा खोले जाने की मांग पर जवाब देते हुए RSSB अध्यक्ष <strong>मेजर जनरल आलोक राज</strong> ने दो-टूक कहा: <em>"No please... sorry to disappoint you. फॉर्म्स काफी पहले भरे जा चुके हैं, हम एग्जाम नहीं करा पाए थे। No reopening of forms please."</em></blockquote><h2>1. CET फॉर्म री-ओपनिंग पर स्थिति स्पष्ट (Final Verdict)</h2><p>राजस्थान में समान पात्रता परीक्षा (CET स्नातक स्तर) के आवेदन काफी समय पूर्व पूर्ण हो चुके थे। कई अभ्यर्थी जो किसी कारणवश आवेदन करने से चूक गए थे, वे सोशल मीडिया पर लगातार फॉर्म री-ओपन करने की मांग कर रहे थे।</p><p>लेकिन कर्मचारी चयन बोर्ड के अध्यक्ष ने स्पष्ट कर दिया है कि अब परीक्षा आयोजन की पूरी तैयारी हो चुकी है और परीक्षा तिथियां घोषित कर दी गई हैं, अतः <strong>फॉर्म दोबारा नहीं खोले जाएंगे</strong>।</p><table><thead><tr><th>विवरण</th><th>बोर्ड की आधिकारिक स्थिति</th></tr></thead><tbody><tr><td><strong>परीक्षा का नाम</strong></td><td>Rajasthan CET (Graduation Level)</td></tr><tr><td><strong>फॉर्म री-ओपन स्टेटस</strong></td><td>❌ <strong>नहीं खोले जाएंगे (Closed Permanently)</strong></td></tr><tr><td><strong>कारण</strong></td><td>आवेदन प्रक्रिया पूर्व में ही पूर्ण हो चुकी है और परीक्षा की तिथियां निर्धारित हैं।</td></tr><tr><td><strong>सलाह</strong></td><td>जिन अभ्यर्थियों ने आवेदन किया है, वे केवल रिवीजन और मॉक टेस्ट पर ध्यान केंद्रित करें।</td></tr></tbody></table><h2>2. जो छात्र फॉर्म नहीं भर पाए, उनके पास अब क्या विकल्प हैं?</h2><ol><li><strong>CET सीनियर सेकेंडरी स्तर (12th Level):</strong> यदि आपने 12वीं स्तर की सीईटी का आवेदन किया है, तो उस पर पूरा फोकस करें क्योंकि LDC, कांस्टेबल और अन्य पद इसके अंतर्गत आते हैं।</li><li><strong>सीधी भर्तियां (Non-CET Exams):</strong> राजस्थान की कई भर्तियां जैसे पशु परिचर (Animal Attendant), सफाई कर्मचारी, और कुछ तकनीकी पद CET के दायरे से बाहर हैं।</li><li><strong>आगामी वर्ष की CET:</strong> सरकार के नियमानुसार CET का आयोजन प्रतिवर्ष होना प्रस्तावित है, इसलिए अपनी बेसिक तैयारी मजबूत रखें।</li></ol><h2>3. फ्री अध्ययन सामग्री और टेस्ट सीरीज</h2><p>राजस्थान की सभी प्रतियोगी परीक्षाओं के प्रामाणिक राजस्थान सामान्य ज्ञान, इतिहास, भूगोल और राजव्यवस्था के हस्तलिखित नोट्स और दैनिक मॉक टेस्ट के लिए हमारे पोर्टल से जुड़ें:</p><ul><li>📖 <a href="https://www.rajasthanexamtwister.in/notes">राजस्थान सम्पूर्ण हस्तलिखित नोट्स</a></li><li>📝 <a href="https://www.rajasthanexamtwister.in/quizzes">डेली फ्री मॉक टेस्ट सीरीज</a></li></ul>`
  }
];

async function publishBatch() {
  console.log("Connecting to MongoDB...");
  await connectToDatabase();

  for (const item of blogsToPublish) {
    console.log(`\nProcessing: "${item.title}"...`);

    // 1. Media
    let mediaDoc = await Media.findOne({ url: item.coverImage.url });
    if (!mediaDoc) {
      mediaDoc = await Media.create({
        url: item.coverImage.url,
        altText: item.coverImage.altText,
        caption: item.coverImage.caption,
        mimeType: "image/jpeg",
        width: 1200,
        height: 630
      });
      console.log(`Created Media: ${mediaDoc._id}`);
    }

    // 2. Category
    let category = await Category.findOne({ name: item.category });
    if (!category) {
      category = await Category.create({
        name: item.category,
        slug: slugify(item.category),
        description: "Latest Rajasthan Current Affairs and Recruitment Notifications"
      });
      console.log(`Created Category: ${category.name}`);
    }

    // 3. Tags
    const tagIds = [];
    for (const tagName of item.tags) {
      let tag = await Tag.findOne({ name: tagName });
      if (!tag) {
        tag = await Tag.create({
          name: tagName,
          slug: slugify(tagName)
        });
        console.log(`Created Tag: ${tag.name}`);
      }
      tagIds.push(tag._id);
    }

    // 4. Upsert Blog
    const blog = await Blog.findOneAndUpdate(
      { slug: item.slug },
      {
        title: item.title,
        slug: item.slug,
        excerpt: item.excerpt,
        content: item.contentHtml,
        coverImageId: mediaDoc._id,
        categoryId: category._id,
        tagIds: tagIds,
        status: "PUBLISHED",
        metaTitle: item.metaTitle,
        metaDescription: item.metaDescription,
        readingTime: item.readingTime,
        featured: item.featured,
        author: item.author,
        publishedAt: new Date()
      },
      { upsert: true, new: true }
    );

    console.log(`✅ Successfully published: https://www.rajasthanexamtwister.in/blogs/${blog.slug}`);
  }

  console.log("\n🎉 All 3 blog posts published successfully!");
  process.exit(0);
}

publishBatch().catch((err) => {
  console.error("Error publishing batch blogs:", err);
  process.exit(1);
});
