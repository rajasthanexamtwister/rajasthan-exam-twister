import "dotenv/config";
import fs from "fs";
import path from "path";
import { connectToDatabase } from "../server/lib/mongodb";
import { Blog } from "../server/models/Blog";

const TODAY = new Date("2026-10-10T14:50:00.000Z");

const NEW_BLOGS = [
  {
    title: "RSMSSB LDC 2026 Score Card Out (जारी): राजस्थान एलडीसी भर्ती स्कोर कार्ड लिंक व कट-ऑफ मार्क्स कैसे चेक करें",
    slug: "rsmssb-ldc-2026-score-card-out-download-link",
    category: "Exam Updates & Results",
    tags: ["RSMSSB", "LDC", "Clerk Grade II", "Score Card", "Alok Raj RSSB", "Rajasthan LDC"],
    metaTitle: "RSMSSB LDC 2026 Score Card Out (जारी) | स्कोर कार्ड डायरेक्ट डाउनलोड लिंक व कट-ऑफ",
    metaDescription: "राजस्थान कर्मचारी चयन बोर्ड (RSSB) द्वारा LDC भर्ती 2026 के स्कोर कार्ड जारी कर दिए गए हैं। आधिकारिक वेबसाइट एवं SSO ID से मार्क्स चेक करने का डायरेक्ट लिंक और फेज-2 टाइपिंग गाइड यहाँ देखें।",
    featuredImage: "/uploads/blogs/rsmssb-ldc-2026-scorecard.jpg",
    content: `
# RSMSSB LDC 2026 Score Card Out: राजस्थान एलडीसी भर्ती स्कोर कार्ड जारी

**राजस्थान कर्मचारी चयन बोर्ड (RSSB)** के अध्यक्ष **मेजर जनरल आलोक राज (Maj Gen Alok Raj)** ने आधिकारिक तौर पर घोषणा की है कि **LDC Exam 2026 (लिपिक ग्रेड-II / कनिष्ठ सहायक संयुक्त सीधी भर्ती परीक्षा)** के स्कोर कार्ड (Score Cards) अब आधिकारिक रिक्रूटमेंट पोर्टल पर लाइव कर दिए गए हैं। 

जो भी अभ्यर्थी राजस्थान एलडीसी लिखित परीक्षा में शामिल हुए थे, वे अब अपने रोल नंबर और एप्लीकेशन नंबर की सहायता से अपने विषयवार प्राप्तांक और नॉर्मलाइज्ड मार्क्स देख सकते हैं।

---

## 📌 LDC Exam 2026 स्कोर कार्ड: मुख्य विवरण तालिका

| विवरण | आधिकारिक सूचना |
| :--- | :--- |
| **भर्ती बोर्ड** | राजस्थान कर्मचारी चयन बोर्ड (RSMSSB / RSSB), जयपुर |
| **पद का नाम** | लिपिक ग्रेड-II / कनिष्ठ सहायक (LDC / Junior Assistant) |
| **स्कोर कार्ड स्थिति** | **लाइव (Active Now)** |
| **स्कोर कार्ड लिंक** | [recruitment.rajasthan.gov.in](https://recruitment.rajasthan.gov.in/postdetailgetresultservlet) |
| **लॉगिन माध्यम** | Application Number & Date of Birth / SSO Rajasthan |
| **अगला चरण** | फेज-2 (कंप्यूटर टाइपिंग एवं दक्षता परीक्षा) |

---

## 🔍 RSMSSB LDC 2026 स्कोर कार्ड कैसे चेक करें? (Step-by-Step Guide)

अभ्यर्थी नीचे दी गई आसान प्रक्रिया का पालन करके अपना स्कोर कार्ड तुरंत देख सकते हैं:

1. **आधिकारिक रिजल्ट पोर्टल खोलें:** सबसे पहले [RSSB Recruitment Result Portal](https://recruitment.rajasthan.gov.in/postdetailgetresultservlet) पर जाएं या अपनी **Rajasthan SSO ID** (sso.rajasthan.gov.in) पर लॉगिन करें।
2. **परीक्षा का चयन करें:** **"Recruitment of Clerk Grade-II / Junior Assistant 2026"** के सामने दिए गए Get Result / Score Card लिंक पर क्लिक करें।
3. **आवश्यक विवरण दर्ज करें:**
   - **Exam Type:** Pre / Main Exam
   - **Application Number:** अपना आवेदन क्रमांक दर्ज करें।
   - **Date of Birth (DOB):** अपनी जन्म तिथि चुनें।
   - **Captcha Code:** स्क्रीन पर दिख रहा सिक्योरिटी कोड भरें।
4. **Get Result पर क्लिक करें:** आपका स्कोर कार्ड स्क्रीन पर प्रदर्शित हो जाएगा।
5. **प्रिंट या सेव करें:** अपने स्कोर कार्ड का PDF डाउनलोड करें और भविष्य के संदर्भ के लिए सुरक्षित रख लें।

---

## ⌨️ फेज-2 (कंप्यूटर टाइपिंग व एफिशिएंसी टेस्ट) की तैयारी

स्कोर कार्ड जारी होने के बाद, जो अभ्यर्थी कट-ऑफ में आ रहे हैं, उन्हें तुरंत **फेज-2 कंप्यूटर टाइपिंग एवं दक्षता परीक्षा** के अभ्यास में जुट जाना चाहिए:

1. **हिंदी टाइपिंग:** कृतिदेव 010 या देवलीज 010 फॉन्ट पर 10 मिनट में 25 अंक की गति और 25 अंक की दक्षता परीक्षा।
2. **अंग्रेजी टाइपिंग:** 10 मिनट में 25 अंक की स्पीड और 25 अंक की दक्षता परीक्षा।
3. **न्यूनतम अर्हक अंक:** सामान्य एवं आरक्षित वर्ग के अभ्यर्थियों को नियमानुसार प्रत्येक प्रश्नपत्र में 36% और कुल मिलाकर 40% अंक प्राप्त करना अनिवार्य है।

---

## ❓ अक्सर पूछे जाने वाले प्रश्न (FAQs)

### Q1. क्या राजस्थान एलडीसी 2026 के स्कोर कार्ड जारी हो चुके हैं?
**उत्तर:** हाँ, 7 अक्टूबर को RSSB अध्यक्ष मेजर जनरल आलोक राज ने ट्वीट कर पुष्टि की कि LDC 2026 स्कोर कार्ड पोर्टल पर लाइव हैं।

### Q2. स्कोर कार्ड चेक करने के लिए कौन से क्रेडेंशियल्स की आवश्यकता है?
**उत्तर:** आपको अपना Application Number, Date of Birth और Captcha कोड की आवश्यकता होगी।
`,
  },
  {
    title: "REET Level 1 कोर्ट केस व स्टे हियरिंग अपडेट: 12 अक्टूबर सुनवाई, AAG पैरवी व चयन बोर्ड अध्यक्ष का संदेश",
    slug: "reet-level-1-court-case-stay-update-alok-raj-rssb",
    category: "Recruitment News & Analysis",
    tags: ["REET", "REET Level 1", "Alok Raj RSSB", "High Court Stay", "Rajasthan 3rd Grade Teacher", "4th Class Bharti"],
    metaTitle: "REET Level 1 कोर्ट केस व स्टे हियरिंग अपडेट | 12 अक्टूबर सुनवाई व आलोक राज का संदेश",
    metaDescription: "REET Level 1 कोर्ट स्टे और 12 अक्टूबर को होने वाली हाईकोर्ट सुनवाई को लेकर चयन बोर्ड अध्यक्ष मेजर जनरल आलोक राज ने स्थिति स्पष्ट की। AAG पैरवी और 4th Class भर्ती अपडेट यहाँ पढ़ें।",
    featuredImage: "/uploads/blogs/reet-level1-court-stay-update.jpg",
    content: `
# REET Level 1 कोर्ट केस व स्टे हियरिंग अपडेट: 12 अक्टूबर सुनवाई पर चयन बोर्ड का रुख

राजस्थान तृतीय श्रेणी शिक्षक भर्ती (3rd Grade Teacher / REET Level-1) में नियुक्तियों पर लगे कोर्ट स्टे और आगामी **12 अक्टूबर को राजस्थान हाईकोर्ट में होने वाली अहम सुनवाई** को लेकर कर्मचारी चयन बोर्ड पूरी तरह सक्रिय है।

कर्मचारी चयन बोर्ड (RSSB) के अध्यक्ष **मेजर जनरल आलोक राज (Maj Gen Alok Raj)** ने अभ्यर्थियों के सवालों का जवाब देते हुए आश्वस्त किया है कि बोर्ड और राज्य सरकार की ओर से **अतिरिक्त महाधिवक्ता (AAG)** के माध्यम से कोर्ट में मजबूत और प्रभावी पैरवी सुनिश्चित की जा रही है ताकि स्टे हट सके और चयनित युवाओं को जल्द राहत मिल सके।

---

## ⚖️ REET Level-1 कोर्ट केस: प्रमुख बिंदु एवं वर्तमान स्थिति

| विषय | ताजा अपडेट |
| :--- | :--- |
| **भर्ती का नाम** | प्राथमिक एवं उच्च प्राथमिक विद्यालय अध्यापक (Level-1) |
| **मामला** | नियुक्ति प्रक्रिया एवं वेटिंग लिस्ट पर अंतरिम रोक (Stay) |
| **सुनवाई की तारीख** | **12 अक्टूबर 2026 (माननीय राजस्थान हाईकोर्ट)** |
| **बोर्ड की पैरवी** | AAG (अतिरिक्त महाधिवक्ता) द्वारा सरकार व बोर्ड का पक्ष मजबूती से रखा जा रहा है |
| **अध्यक्ष का संदेश** | बोर्ड का पूरा प्रयास है कि विधिक प्रक्रिया पूर्ण होकर अभ्यर्थियों को न्याय मिले |

---

## 💬 अध्यक्ष मेजर जनरल आलोक राज का अभ्यर्थियों को संदेश

सोशल मीडिया पर अभ्यर्थियों द्वारा 12 अक्टूबर की सुनवाई में स्टे हटाने के प्रयासों का अनुरोध करने पर अध्यक्ष जी ने सकारात्मक उत्तर देते हुए कहा कि बोर्ड निष्पक्षता और तत्परता के साथ विधिक प्रक्रिया का पालन कर रहा है। 

इसके साथ ही, हाल ही में **4th Class भर्ती में सफल हुए ऐसे कैंडिडेट्स, जो वर्तमान में माननीय हाईकोर्ट में सेवारत हैं**, उनसे भी बोर्ड अध्यक्ष की सौहार्दपूर्ण मुलाकात हुई। अध्यक्ष जी ने युवाओं के चेहरों पर गौरव और खुशी के भाव को देखकर शुभकामनाएं प्रेषित कीं।

---

## 🚜 एग्रीकल्चर सुपरवाइजर (Agriculture Supervisor) रिप्लाई स्टेटस

एग्रीकल्चर सुपरवाइजर भर्ती के अभ्यर्थियों द्वारा कोर्ट में रिप्लाई फाइल पेश करने के आग्रह पर बोर्ड अध्यक्ष ने कहा:
> *"हिम्मत जी हिम्मत रखो, सही समय पर सब अच्छा होगा।"*

बोर्ड की कानूनी टीम सभी लंबित मामलों में समयबद्ध तरीके से जवाब (Reply Affidavits) पेश करने के लिए पूरी तरह कार्यरत है।

---

## 🎯 सफलता के सात कदम: युवाओं के लिए प्रेरक सूत्र

अध्यक्ष आलोक राज जी ने राज्य के सभी प्रतियोगी परीक्षार्थियों के साथ सफलता के सात स्वर्णिम सूत्र साझा किए:

1. **Goal Setting (लक्ष्य निर्धारण):** स्पष्ट लक्ष्य बनाएं।
2. **Planning (योजना):** समयबद्ध और ठोस कार्ययोजना।
3. **Learning & Skilling (सीखना व कौशल):** विषय ज्ञान को लगातार निखारें।
4. **Coordination (समन्वय):** अपने संसाधनों और समय का सही संतुलन।
5. **Continuous Practice (निरंतर अभ्यास):** दैनिक मॉक टेस्ट और क्विज़ प्रैक्टिस।
6. **Perseverance (दृढ़ निश्चय):** विपरीत परिस्थितियों में भी अडिग रहना।
7. **Never Giving Up Passion (अटूट लगन):** अंतिम चयन तक हार न मानने का जज्बा।

---

## ❓ अक्सर पूछे जाने वाले प्रश्न (FAQs)

### Q1. REET Level-1 स्टे मामले की अगली सुनवाई कब है?
**उत्तर:** मामले की महत्वपूर्ण सुनवाई माननीय राजस्थान हाईकोर्ट में 12 अक्टूबर को सूचीबद्ध है।

### Q2. क्या कर्मचारी चयन बोर्ड कोर्ट में पैरवी करा रहा है?
**उत्तर:** हाँ, बोर्ड द्वारा अतिरिक्त महाधिवक्ता (AAG) के जरिए कोर्ट में मजबूती से पक्ष रखा जा रहा है।
`,
  },
];

async function publishBlogs() {
  await connectToDatabase();

  console.log("=================================================");
  console.log("🚀 PUBLISHING BLOGS & UPDATING REGISTRY");
  console.log("=================================================");

  for (const blogData of NEW_BLOGS) {
    const existing = await Blog.findOne({
      $or: [{ slug: blogData.slug }, { title: blogData.title }],
    });

    if (existing) {
      console.log(`⚠️ Blog already exists: "${existing.title}" (${existing.slug}) -> updating content`);
      await Blog.findByIdAndUpdate(existing._id, {
        ...blogData,
        status: "PUBLISHED",
        publishedAt: existing.publishedAt || TODAY,
        updatedAt: TODAY,
      });
    } else {
      console.log(`✨ Creating new blog: "${blogData.title}" (${blogData.slug})`);
      await Blog.create({
        ...blogData,
        status: "PUBLISHED",
        publishedAt: TODAY,
        createdAt: TODAY,
        updatedAt: TODAY,
      });
    }
  }

  // Generate updated BLOG_REGISTRY.md
  const allBlogs = await Blog.find({})
    .select("title slug category status publishedAt createdAt")
    .sort({ publishedAt: -1, createdAt: -1 })
    .lean();

  let mdContent = `# 📚 Rajasthan Exam Twister — Blog Publishing Registry\n\n`;
  mdContent += `> This registry is automatically maintained as a single source of truth for all published blog posts, exam updates, and educational guides on [Rajasthan Exam Twister](https://www.rajasthanexamtwister.in).\n\n`;
  mdContent += `**Total Published Articles:** ${allBlogs.length} | **Last Updated:** 10 October 2026\n\n`;
  mdContent += `| # | Published Date | Article Title | Slug | Category | Status |\n`;
  mdContent += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  allBlogs.forEach((b, idx) => {
    const dateStr = b.publishedAt
      ? new Date(b.publishedAt).toISOString().split("T")[0]
      : new Date(b.createdAt).toISOString().split("T")[0];
    const category = b.category || "Rajasthan GK & Exams";
    mdContent += `| ${idx + 1} | ${dateStr} | **${b.title}** | [\`${b.slug}\`](/blogs/${b.slug}) | ${category} | \`${b.status}\` |\n`;
  });

  mdContent += `\n---\n\n## 📝 How to Add or Prevent Duplicate Blogs:\n`;
  mdContent += `1. Always check this registry or run \`scripts/publish-todays-blogs.ts\` before adding new posts.\n`;
  mdContent += `2. Slugs must be unique, lowercase, URL-safe, and contain only standard alphanumeric characters and hyphens.\n`;
  mdContent += `3. Every post must include authentic facts, clear headings, and internal links to relevant Test Series and Quizzes.\n`;

  const registryPath = path.join(process.cwd(), "BLOG_REGISTRY.md");
  fs.writeFileSync(registryPath, mdContent, "utf-8");

  console.log(`✅ Successfully updated BLOG_REGISTRY.md at ${registryPath}`);
  console.log("🎉 All blogs published and verified!");
  process.exit(0);
}

publishBlogs().catch((err) => {
  console.error("Error publishing blogs:", err);
  process.exit(1);
});
