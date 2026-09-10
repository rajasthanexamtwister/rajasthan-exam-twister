import dotenv from "dotenv";
dotenv.config();

import { connectToDatabase } from "../server/lib/mongodb";
import { Blog } from "../server/models/Blog";
import { Category } from "../server/models/Category";
import { Tag } from "../server/models/Tag";
import { slugify } from "../server/lib/slugify";

const blogData = {
  title: "RSSB JE भर्ती 2026: 874 पदों हेतु आवेदन अंतिम तिथि 14 सितंबर",
  slug: "rssb-je-recruitment-2026-874-posts-last-date-14-sep",
  excerpt: "RSSB ने Junior Engineer के 874 पदों के लिए Advt No. 10/2026 जारी किया है। ऑनलाइन आवेदन की अंतिम तिथि 14 सितंबर 2026 है।",
  metaTitle: "RSSB JE भर्ती 2026: 874 पद, अंतिम तिथि 14 सितंबर",
  metaDescription: "RSSB JE Recruitment 2026 में PWD, WRD, PHED में 874 पद। योग्यता, आयु सीमा, आवेदन प्रक्रिया और अंतिम तिथि — पूरी जानकारी यहाँ चेक करें।",
  category: "Current Affairs",
  tags: [
    "RSSB JE 2026",
    "RSMSSB Junior Engineer",
    "Rajasthan Sarkari Naukri",
    "RSSB Recruitment September 2026",
    "PWD WRD PHED Vacancy",
    "RSSB Advt 10/2026"
  ],
  featured: false,
  author: "Exam Twister Team",
  readingTime: 3,
  contentHtml: `<blockquote>Rajasthan Staff Selection Board (RSSB / RSMSSB) ने Junior Engineer (JE) Combined Direct Recruitment 2026 के तहत Advt No. 10/2026 जारी किया है, जिसमें कुल 874 पद हैं। ऑनलाइन आवेदन की अंतिम तिथि 14 सितंबर 2026, रात 11:59 बजे तक है। अधिक जानकारी नीचे दी गई है।</blockquote><h2>अवलोकन (Overview)</h2><p>RSSB JE Recruitment 2026 का नोटिफिकेशन 15 अगस्त 2026 को जारी हुआ था। यह भर्ती Public Works Department (PWD), Water Resources Department (WRD) और Public Health Engineering Department (PHED) में Junior Engineer के पदों के लिए है।</p><p>कुल 874 पदों में Non-TSP क्षेत्र के लिए 793 और TSP क्षेत्र के लिए 81 पद निर्धारित हैं। आवेदन प्रक्रिया sso.rajasthan.gov.in के माध्यम से ऑनलाइन मोड में चल रही है।</p><h2>महत्वपूर्ण तिथियाँ (Important Dates)</h2><table><tr><th>इवेंट</th><th>तिथि</th></tr><tr><td>अधिसूचना जारी (Advt No. 10/2026)</td><td>15 अगस्त 2026</td></tr><tr><td>ऑनलाइन आवेदन प्रारंभ</td><td>16 अगस्त 2026</td></tr><tr><td>ऑनलाइन आवेदन की अंतिम तिथि</td><td>14 सितंबर 2026 (रात 11:59 बजे तक)</td></tr><tr><td>लिखित परीक्षा (प्रस्तावित)</td><td>फरवरी 2027 — आधिकारिक सूचना जल्द जारी होगी</td></tr></table><h2>पद विवरण (Post-wise Vacancy)</h2><ul><li>PWD — Civil Degree: 351, Civil Diploma: 42</li><li>WRD — Civil Degree: 72, Civil Diploma: 179</li><li>PHED — Civil Degree: 47, Civil Diploma: 151, Mechanical/Electrical Diploma: 32</li></ul><h2>पात्रता (Eligibility)</h2><p>संबंधित विषय (Civil / Mechanical / Electrical Engineering) में Degree या Diploma रखने वाले उम्मीदवार आवेदन के पात्र हैं। आयु सीमा 18 से 40 वर्ष है, जो 1 जनवरी 2027 के अनुसार गणना की जाएगी। आरक्षित वर्ग के लिए नियमानुसार आयु में छूट लागू होगी।</p><h2>आवेदन प्रक्रिया (How to Apply)</h2><ol><li>sso.rajasthan.gov.in पर जाकर अपनी SSO ID से लॉगिन करें</li><li>RSSB Recruitment Portal में Advt No. 10/2026 (Junior Engineer) चुनें</li><li>अगर पहले से नहीं किया है तो One Time Registration (OTR) पूरा करें</li><li>आवश्यक दस्तावेज़, फोटो और हस्ताक्षर अपलोड करें</li><li>निर्धारित आवेदन शुल्क का भुगतान करें</li><li>फॉर्म सबमिट करें और भविष्य के लिए प्रिंटआउट सुरक्षित रखें</li></ol><h2>मुख्य बिंदु (Key Points)</h2><ul><li>कुल 874 पद — PWD, WRD और PHED में Civil, Mechanical व Electrical इंजीनियरिंग विषयों के लिए</li><li>वेतनमान: Rs. 29,100 से Rs. 1,04,400 तक</li><li>चयन प्रक्रिया: लिखित परीक्षा + दस्तावेज़ सत्यापन (Document Verification)</li><li>एक वित्तीय वर्ष में 2 या अधिक RSMSSB/RPSC परीक्षाओं में अनुपस्थित रहने पर OTR सस्पेंड हो सकती है, पुनः सक्रिय करने पर पहली बार ₹750 शुल्क लगेगा</li><li>अंतिम तिथि नज़दीक है, इसलिए पात्र उम्मीदवार जल्द आवेदन करें</li><li>RSSB JE Syllabus और Exam Pattern के लिए हमारा नोट्स सेक्शन देखें</li></ul><h2>अक्सर पूछे जाने वाले प्रश्न (FAQ)</h2><h3>RSSB JE भर्ती 2026 में कुल कितने पद हैं?</h3><p>RSSB JE Recruitment 2026 में कुल 874 पद हैं, जो PWD, WRD और PHED विभागों में Non-TSP (793) और TSP (81) क्षेत्रों में बंटे हैं।</p><h3>RSSB JE 2026 आवेदन की अंतिम तिथि क्या है?</h3><p>ऑनलाइन आवेदन की अंतिम तिथि 14 सितंबर 2026, रात 11:59 बजे तक है। उम्मीदवारों को अंतिम तिथि से पहले आवेदन पूरा करना चाहिए।</p><h3>RSSB JE 2026 के लिए योग्यता क्या है?</h3><p>संबंधित विषय में Civil, Mechanical या Electrical Engineering में Degree या Diploma आवश्यक है, विभाग और पद के अनुसार योग्यता अलग-अलग है।</p><h3>RSSB JE 2026 की परीक्षा कब होगी?</h3><p>लिखित परीक्षा फरवरी 2027 में प्रस्तावित है, लेकिन बोर्ड द्वारा इसमें बदलाव किया जा सकता है। आधिकारिक सूचना जल्द जारी होगी।</p><h3>RSSB JE 2026 का आवेदन कहाँ करें?</h3><p>उम्मीदवार sso.rajasthan.gov.in पर अपनी SSO ID से लॉगिन करके ऑनलाइन आवेदन कर सकते हैं।</p><h3>RSSB JE 2026 में आयु सीमा क्या है?</h3><p>आयु सीमा 18 से 40 वर्ष है, जिसकी गणना 1 जनवरी 2027 के अनुसार होगी। आरक्षित वर्गों को नियमानुसार छूट मिलेगी।</p>`
};

async function publish() {
  console.log("Connecting to MongoDB...");
  await connectToDatabase();

  // 1. Category
  let category = await Category.findOne({ name: blogData.category });
  if (!category) {
    category = await Category.create({
      name: blogData.category,
      slug: slugify(blogData.category),
      description: "Latest Rajasthan Current Affairs and Recruitment Notifications"
    });
    console.log(`Created Category: ${category.name}`);
  }

  // 2. Tags
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

  // 3. Upsert Blog
  const blog = await Blog.findOneAndUpdate(
    { slug: blogData.slug },
    {
      title: blogData.title,
      slug: blogData.slug,
      excerpt: blogData.excerpt,
      content: blogData.contentHtml,
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

  console.log(`✅ Successfully published blog post: "${blog.title}" (ID: ${blog._id}, Slug: /blogs/${blog.slug})`);
  process.exit(0);
}

publish().catch((err) => {
  console.error("Error publishing blog:", err);
  process.exit(1);
});
