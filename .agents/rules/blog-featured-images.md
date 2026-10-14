# 🖼️ Mandatory Blog Featured Image Generation & Cloudinary Upload Rule

This rule is **COMPULSORY** for all AI agents creating, drafting, or publishing blog posts on Rajasthan Exam Twister.

---

## 📌 Core Directives:

1. **NO Placeholder or Stock Photos:**
   - Never use generic Unsplash URLs or placeholder image links for published blog posts.
   - Every published blog post **MUST** have a dedicated, custom-generated 16:9 featured image created via the `generate_image` tool.

2. **Visual Standards & Branding:**
   - **Aspect Ratio:** `16:9` (1920×1080 / 1200×675).
   - **Color Palette:** Deep Navy Blue (`#0B132B`), Rich Amber / Gold (`#D97706` / `#F59E0B`), Clean Slate (`#F8FAFC`).
   - **Elements:** Include Rajasthan Exam Twister badge/logo motif, official government/exam icon accents, clean typography cues, and crisp graphic elements.
   - **Devanagari Guidelines:** Avoid unreadable rasterized text. Use clear symbolic graphics, charts, documents, and bold English/Hinglish keywords.

3. **Cloudinary CDN Hosting (CRITICAL FOR LIVE WEBSITE):**
   - **Why:** The live website is hosted on serverless/cloud infrastructure (Vercel). Local files stored in `public/uploads/` on a local Windows machine **DO NOT EXIST ON THE LIVE PRODUCTION SITE**!
   - **Mandatory Step:** Every generated image **MUST** be uploaded to Cloudinary via the SDK using `CLOUDINARY_URL`:
     ```javascript
     const uploadResult = await cloudinary.uploader.upload(localImagePath, {
       folder: "rajasthan_exam_twister/blogs",
       public_id: slug,
       overwrite: true,
       resource_type: "image"
     });
     // uploadResult.secure_url -> https://res.cloudinary.com/dplnd4t4j/image/upload/...
     ```
   - Store `uploadResult.secure_url` in the `media` collection:
     ```javascript
     const mediaDoc = await db.collection("media").insertOne({
       url: uploadResult.secure_url,
       altText: `${title} - Rajasthan Exam Twister`,
       caption: `${title} - Official Update & Guide`,
       width: uploadResult.width,
       height: uploadResult.height,
       mimeType: "image/jpeg",
       createdAt: new Date(),
       updatedAt: new Date()
     });
     ```
   - Link `Blog.coverImageId = mediaDoc._id` and `Blog.featuredImage = uploadResult.secure_url`.

4. **HTML Content Requirement:**
   - Always format `Blog.content` as rich semantic HTML (`<blockquote>`, `<h2>`, `<p>`, `<table>`, `<ul>`, `<ol>`). Never dump raw markdown syntax.

5. **Registry Update:**
   - Every newly created blog and its featured image must be registered in the root [BLOG_REGISTRY.md](file:///c:/Users/Chirag%20Bhoi/Desktop/maytoaug/trynew/BLOG_REGISTRY.md).
