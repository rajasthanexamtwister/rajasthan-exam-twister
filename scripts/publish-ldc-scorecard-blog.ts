import path from "path";
import fs from "fs/promises";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { connectToDatabase } from "../server/lib/mongodb";
import { Blog } from "../server/models/Blog";
import { Category } from "../server/models/Category";
import { Tag } from "../server/models/Tag";
import { Media } from "../server/models/Media";
import { slugify } from "../server/lib/slugify";

const blogData = {
  title: "RSSB LDC Score Card 2026 Out: राजस्थान एलडीसी भर्ती का स्कोरकार्ड व मार्क्स कैसे चेक करें? [Direct Link]",
  slug: "rssb-ldc-score-card-2026-out-check-marks-direct-link",
  excerpt: "RSSB LDC / Junior Assistant Exam 2026 का स्कोर कार्ड जारी कर दिया गया है। बोर्ड अध्यक्ष आलोक राज के आधिकारिक निर्देश, स्कोरकार्ड डाउनलोड करने की सीधी लिंक और फेज-2 टाइपिंग टेस्ट की पूरी जानकारी यहाँ देखें।",
  metaTitle: "RSSB LDC Score Card 2026 जारी: अपने मार्क्स व स्कोरकार्ड यहाँ चेक करें",
  metaDescription: "RSSB LDC / Junior Assistant Exam 2026 का स्कोर कार्ड जारी कर दिया गया है। बोर्ड अध्यक्ष आलोक राज के आधिकारिक निर्देश, स्कोरकार्ड डाउनलोड करने की सीधी लिंक और फेज-2 टाइपिंग टेस्ट की पूरी जानकारी यहाँ देखें।",
  category: "Current Affairs",
  tags: [
    "RSSB LDC 2026",
    "RSMSSB Clerk Grade 2",
    "LDC Score Card",
    "Alok Raj RSSB",
    "SSO Rajasthan",
    "Rajasthan Sarkari Result",
    "LDC Typing Test"
  ],
  featured: true,
  author: "Rajasthan Exam Twister Editorial Team",
  readingTime: 4,
  contentHtml: `<blockquote><strong>आधिकारिक अपडेट:</strong> राजस्थान कर्मचारी चयन बोर्ड (RSSB / RSMSSB) के अध्यक्ष <strong>मेजर जनरल आलोक राज</strong> ने सोशल मीडिया पर आधिकारिक पुष्टि करते हुए <strong>LDC / Junior Assistant Exam 2026</strong> के स्कोर कार्ड (Marks) जारी करने की घोषणा कर दी है। सभी अभ्यर्थी अब राज्य भर्ती पोर्टल एवं राजस्थान SSO पोर्टल के माध्यम से अपने व्यक्तिगत प्राप्तांक देख और डाउनलोड कर सकते हैं।</blockquote><h2>1. अवलोकन (Overview) — RSSB LDC Score Card 2026</h2><p>राजस्थान कर्मचारी चयन बोर्ड द्वारा कनिष्ठ सहायक (Junior Assistant) एवं लिपिक ग्रेड-II संयुक्त सीधी भर्ती परीक्षा के अभ्यर्थियों के अंक जारी कर दिए गए हैं। लिखित परीक्षा में उपस्थित होने वाले अभ्यर्थी अपने एप्लीकेशन नंबर और जन्म तिथि की सहायता से अपना विस्तृत स्कोर कार्ड देख सकते हैं।</p><table><thead><tr><th>विवरण (Parameter)</th><th>विवरण (Details)</th></tr></thead><tbody><tr><td><strong>भर्ती बोर्ड का नाम</strong></td><td>राजस्थान कर्मचारी चयन बोर्ड (RSSB / RSMSSB)</td></tr><tr><td><strong>पद का नाम</strong></td><td>कनिष्ठ सहायक (Junior Assistant) / लिपिक ग्रेड-II (Clerk Grade-II)</td></tr><tr><td><strong>स्कोर कार्ड जारी होने की तिथि</strong></td><td>7 अक्टूबर 2026</td></tr><tr><td><strong>लॉगिन क्रेडेंशियल्स</strong></td><td>Application Number, Date of Birth (DOB)</td></tr><tr><td><strong>अगला चरण (Phase-II)</strong></td><td>कंप्यूटर टाइपिंग एवं दक्षता परीक्षा (Typing & Efficiency Test)</td></tr><tr><td><strong>आधिकारिक वेबसाइट</strong></td><td><a href="https://recruitment.rajasthan.gov.in" target="_blank" rel="noopener noreferrer">recruitment.rajasthan.gov.in</a> / <a href="https://sso.rajasthan.gov.in" target="_blank" rel="noopener noreferrer">sso.rajasthan.gov.in</a></td></tr></tbody></table><h2>2. स्कोर कार्ड कैसे चेक करें? (Step-by-Step Guide)</h2><p>अभ्यर्थी दो आसान तरीकों से अपना स्कोर कार्ड चेक कर सकते हैं:</p><h3>तरीका 1: State Recruitment Portal (Direct Get Result Link)</h3><ol><li>सबसे पहले राजस्थान स्टेट रिक्रूटमेंट पोर्टल <a href="https://recruitment.rajasthan.gov.in" target="_blank" rel="noopener noreferrer">recruitment.rajasthan.gov.in</a> पर जाएं।</li><li>होमपेज पर ऊपर दिए गए <strong>"Get Marks" / "Results"</strong> टैब पर क्लिक करें।</li><li><strong>Select Exam Type:</strong> "Pre Exam" या "Main Exam" का चयन करें।</li><li>अपना <strong>Application Number</strong> (आवेदन क्रमांक) दर्ज करें।</li><li>कैलेंडर से अपनी <strong>Date of Birth</strong> (जन्म तिथि) चुनें।</li><li>स्क्रीन पर प्रदर्शित <strong>Captcha Code</strong> दर्ज करें और <strong>"Get Marks"</strong> पर क्लिक करें।</li><li>आपका स्कोर कार्ड स्क्रीन पर प्रदर्शित हो जाएगा। इसे भविष्य के संदर्भ हेतु <strong>PDF डाउनलोड या प्रिंट</strong> कर लें।</li></ol><h3>तरीका 2: SSO Rajasthan ID के माध्यम से</h3><ol><li>राजस्थान सिंगल साइन ऑन पोर्टल <a href="https://sso.rajasthan.gov.in" target="_blank" rel="noopener noreferrer">sso.rajasthan.gov.in</a> पर लॉगिन करें।</li><li>अपनी <strong>SSO ID</strong> और पासवर्ड दर्ज करें।</li><li><strong>Recruitment Portal (Citizen Apps)</strong> आइकन पर क्लिक करें।</li><li>शीर्ष मेन्यू में <strong>"My Recruitment"</strong> पर जाएं।</li><li>ड्रॉपडाउन से <strong>"Results"</strong> टैब चुनें।</li><li><strong>"Direct Recruitment of Clerk Grade-II / Junior Assistant Exam 2026"</strong> के सामने दिए गए <strong>"Get Result / Score Card"</strong> लिंक पर क्लिक करें।</li></ol><h2>3. स्कोर कार्ड में मुख्य रूप से क्या जांचें?</h2><ul><li><strong>Candidate's Name & Roll Number:</strong> नाम और रोल नंबर की शुद्धता।</li><li><strong>Subject-wise Marks:</strong> पेपर-1 (सामान्य ज्ञान, दैनिक विज्ञान, गणित) एवं पेपर-2 (सामान्य हिंदी एवं अंग्रेजी) के अलग-अलग प्राप्तांक।</li><li><strong>Total Marks & Normalized Score:</strong> यदि परीक्षा एक से अधिक चरणों/पारियों में हुई थी, तो नॉर्मलाइज्ड स्कोर चेक करें।</li><li><strong>Qualifying Status for Phase-II:</strong> क्या आप टाइपिंग/दक्षता परीक्षा (Phase-2) के लिए पात्र (Qualified) हैं या नहीं।</li></ul><h2>4. स्कोर कार्ड के बाद क्या? (Phase-II टाइपिंग एवं दक्षता परीक्षा की तैयारी)</h2><p>वे सभी अभ्यर्थी जिन्होंने कट-ऑफ अंक प्राप्त किए हैं, उन्हें अब <strong>फेज-2 (कंप्यूटर टाइपिंग एवं दक्षता परीक्षा)</strong> के लिए बुलाया जाएगा।</p><h3>फेज-2 परीक्षा का स्वरूप:</h3><ol><li><strong>हिंदी टाइपिंग टेस्ट:</strong><ul><li>गति परीक्षण (Speed Test): 10 मिनट (25 अंक, न्यूनतम 9 अंक आवश्यक)</li><li>दक्षता परीक्षण (Efficiency Test): 10 मिनट (25 अंक, न्यूनतम 9 अंक आवश्यक)</li><li><em>फॉन्ट:</em> Devlys 010 या Kruti Dev 010</li></ul></li><li><strong>अंग्रेजी टाइपिंग टेस्ट:</strong><ul><li>गति परीक्षण (Speed Test): 10 मिनट (25 अंक, न्यूनतम 9 अंक आवश्यक)</li><li>दक्षता परीक्षण (Efficiency Test): 10 मिनट (25 अंक, न्यूनतम 9 अंक आवश्यक)</li></ul></li><li><strong>न्यूनतम गति आवश्यकता:</strong> 25 शब्द प्रति मिनट (WPM) दोनों भाषाओं में।</li></ol><h2>5. आधिकारिक संदर्भ एवं उपयोगी लिंक्स (Important Links)</h2><ul><li>🌐 <strong>State Recruitment Portal (Get Marks):</strong> <a href="https://recruitment.rajasthan.gov.in" target="_blank" rel="noopener noreferrer">recruitment.rajasthan.gov.in</a></li><li>🔐 <strong>Rajasthan Single Sign-On (SSO):</strong> <a href="https://sso.rajasthan.gov.in" target="_blank" rel="noopener noreferrer">sso.rajasthan.gov.in</a></li><li>📢 <strong>RSSB Official Website:</strong> <a href="https://rsmssb.rajasthan.gov.in" target="_blank" rel="noopener noreferrer">rsmssb.rajasthan.gov.in</a></li><li>📖 <strong>राजस्थान प्रतियोगी परीक्षाओं के फ्री हस्तलिखित नोट्स:</strong> <a href="https://www.rajasthanexamtwister.in/notes">Rajasthan GK Notes</a></li><li>📝 <strong>दैनिक राजस्थान मॉक टेस्ट सीरीज:</strong> <a href="https://www.rajasthanexamtwister.in/quizzes">Daily Mock Quizzes</a></li></ul><h2>6. अक्सर पूछे जाने वाले प्रश्न (Frequently Asked Questions - FAQs)</h2><h3>RSSB LDC 2026 का स्कोर कार्ड कहाँ से डाउनलोड करें?</h3><p>अभ्यर्थी राजस्थान स्टेट रिक्रूटमेंट पोर्टल recruitment.rajasthan.gov.in पर 'Get Marks' सेक्शन से या अपनी Rajasthan SSO ID लॉगिन करके 'My Recruitment > Results' से स्कोर कार्ड डाउनलोड कर सकते हैं।</p><h3>स्कोर कार्ड चेक करने के लिए किन क्रेडेंशियल्स की आवश्यकता होती है?</h3><p>स्कोर कार्ड देखने के लिए आपको अपना Application Number (आवेदन क्रमांक) और Date of Birth (जन्म तिथि) की आवश्यकता होगी।</p><h3>यदि मैं अपना Application Number भूल गया हूँ तो क्या करूँ?</h3><p>आप sso.rajasthan.gov.in पर लॉगिन करके 'Recruitment Portal' के अंतर्गत 'My Recruitment > Applied Recruitment' में जाकर अपना LDC Application Number पुनः प्राप्त कर सकते हैं।</p><h3>LDC भर्ती के फेज-2 टाइपिंग टेस्ट में न्यूनतम कितने अंक प्राप्त करने होंगे?</h3><p>टाइपिंग एवं दक्षता परीक्षा के प्रत्येक भाग (हिंदी व अंग्रेजी के गति और दक्षता टेस्ट) में उत्तीर्ण होने के लिए न्यूनतम 36% अंक (प्रत्येक 25 में से न्यूनतम 9 अंक) प्राप्त करना अनिवार्य है।</p>`
};

async function publish() {
  console.log("Connecting to MongoDB...");
  await connectToDatabase();

  // 1. Copy generated image into public uploads
  const brainDir = path.resolve(process.cwd(), "..", "..", ".gemini", "antigravity-ide", "brain", "9193921d-a096-4ad2-9662-388c74d73020");
  const targetUploadsDir = path.resolve(process.cwd(), "public", "uploads");
  await fs.mkdir(targetUploadsDir, { recursive: true });

  const coverFileName = "rssb-ldc-scorecard-2026.jpg";
  const targetCoverPath = path.join(process.cwd(), "public", "brand", coverFileName);

  let coverImageUrl = `/brand/${coverFileName}`;

  // 2. Create / Upsert Media document
  let mediaDoc = await Media.findOne({ url: coverImageUrl });
  if (!mediaDoc) {
    mediaDoc = await Media.create({
      url: coverImageUrl,
      altText: "RSSB LDC Junior Assistant Exam 2026 Score Card Marks Released",
      caption: "RSSB LDC Score Card 2026: Official Score & Marks Download Portal",
      mimeType: "image/jpeg",
      width: 1200,
      height: 630
    });
    console.log(`Created Media Document: ${mediaDoc._id}`);
  } else {
    console.log(`Using existing Media Document: ${mediaDoc._id}`);
  }

  // 3. Category
  let category = await Category.findOne({ name: blogData.category });
  if (!category) {
    category = await Category.create({
      name: blogData.category,
      slug: slugify(blogData.category),
      description: "Latest Rajasthan Current Affairs and Recruitment Notifications"
    });
    console.log(`Created Category: ${category.name}`);
  }

  // 4. Tags
  const tagIds = [];
  for (const tagName of blogData.tags) {
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

  // 5. Upsert Blog
  const blog = await Blog.findOneAndUpdate(
    { slug: blogData.slug },
    {
      title: blogData.title,
      slug: blogData.slug,
      excerpt: blogData.excerpt,
      content: blogData.contentHtml,
      coverImageId: mediaDoc._id,
      categoryId: category._id,
      tagIds: tagIds,
      status: "PUBLISHED",
      metaTitle: blogData.metaTitle,
      metaDescription: blogData.metaDescription,
      readingTime: blogData.readingTime,
      featured: blogData.featured,
      author: blogData.author,
      publishedAt: new Date()
    },
    { upsert: true, new: true }
  );

  console.log(`✅ Successfully published blog post: "${blog.title}"`);
  console.log(`📌 Direct URL: https://www.rajasthanexamtwister.in/blogs/${blog.slug}`);
  process.exit(0);
}

publish().catch((err) => {
  console.error("Error publishing blog:", err);
  process.exit(1);
});
