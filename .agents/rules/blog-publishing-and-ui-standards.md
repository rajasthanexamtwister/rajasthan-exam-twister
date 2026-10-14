# 📜 Mandatory Blog Publishing & UI Standards Rule

This rule is **COMPULSORY** for all AI agents creating, drafting, or publishing blog posts on **Rajasthan Exam Twister**.

---

## 🚨 Critical Architecture Directives (NEVER VIOLATE):

### 1. Cloudinary CDN Image Hosting (MANDATORY FOR LIVE PRODUCTION)
* **The Root Cause of "Image Missing on Live Site":**
  * The production website runs on serverless hosting (Vercel).
  * A local relative path like `/uploads/blogs/image.jpg` only exists on your local laptop hard drive—**IT DOES NOT EXIST ON THE LIVE SERVERLESS PRODUCTION SITE**.
  * When a visitor or admin opens the page on the live website, the browser receives a 404 for any local file path.
* **Mandatory Action:**
  * Every generated banner **MUST be uploaded to Cloudinary** using the `CLOUDINARY_URL` credentials.
  * Cloudinary provides an instant, global HTTPS CDN URL:
    `https://res.cloudinary.com/dplnd4t4j/image/upload/...`
  * Store this Cloudinary URL in the `Media` collection and link `Blog.coverImageId = media._id`.
  * Because `next.config.mjs` allows `remotePatterns: [{ protocol: "https", hostname: "**" }]`, Next.js will instantly render the image on both localhost AND the live deployed website without requiring a code commit or redeploy.

---

### 2. Content Format MUST ALWAYS Be Semantic HTML (NEVER Raw Markdown)
* **Why:** The frontend renders article bodies using `ContentRenderer` with `dangerouslySetInnerHTML={{ __html: content }}`.
* **Prohibition:** **NEVER** save raw Markdown (`# Heading`, `**bold**`, `| table |`, `---`) directly into `Blog.content`. Doing so causes the browser to dump unformatted text without headings, line breaks, or tables.
* **Mandatory Structure:**
  - Lead quote / summary: `<blockquote><strong>आधिकारिक घोषणा / महत्वपूर्ण संदेश:</strong> ...</blockquote>`
  - Section Headings: Numbered `<h2>1. शीर्षक</h2>`, `<h2>2. शीर्षक</h2>` (Required for automatic in-article AdSense placement after the 2nd `<h2>`).
  - Subheadings: `<h3>उप-शीर्षक</h3>`
  - Paragraphs: Wrap text in `<p>...</p>`.
  - Tables: Always use clean semantic HTML:
    ```html
    <table>
      <thead>
        <tr><th>विवरण (Parameter)</th><th>आधिकारिक जानकारी</th></tr>
      </thead>
      <tbody>
        <tr><td><strong>भर्ती संस्था</strong></td><td>RSSB जयपुर</td></tr>
      </tbody>
    </table>
    ```
  - Lists: Use `<ul><li>...</li></ul>` and `<ol><li>...</li></ol>`.
  - Links: Use `<a href="..." target="_blank" rel="noopener noreferrer">...</a>`.

---

### 3. Category & Taxonomy Linkage
* Always link `blog.categoryId` to a valid `Category` ObjectId from the `categories` collection (e.g. `Rajasthan CET`, `REET`, `RSSB / RSMSSB`, `Rajasthan GK`, `Current Affairs`).
* Always provide a concise 1-2 sentence `excerpt` and estimated `readingTime` (number).

---

### 4. Verification Checklist Before Reporting Done
1. **Cloudinary Check:** Image has a live `https://res.cloudinary.com/...` CDN URL.
2. **Database Check:** Confirm `Blog.coverImageId` exists and points to the `Media` document with the Cloudinary URL.
3. **HTML Check:** Confirm `Blog.content` starts with HTML tags (`<blockquote>` or `<h2>`) and contains no raw markdown fences or unparsed `#`.
4. **Registry Check:** Confirm entry is prepended to `BLOG_REGISTRY.md`.
