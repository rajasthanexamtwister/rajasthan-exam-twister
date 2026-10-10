# STITCH_DESIGN_BRIEF.md — Google Stitch UI/UX Design System & Master Prompts
**Project:** Rajasthan Exam Twister — Visual Redesign  
**Platform:** Next.js / Tailwind CSS / Google Stitch  
**Audience:** Rajasthan Competitive Exam Students (Hindi-first with standard English technical terms)  
**Primary Goal:** Transform the user experience into an authoritative, editorial-grade educational platform while spotlights the **Free Quiz / Mock Test** journey.

---

## 1. Visual Direction: "Rajasthan Educational Gazette & Interactive Test Hub"

### Core Aesthetic Principles:
1. **Warm Parchment Canvas (`#FAF8F5`):** Soft, glare-free, paper-inspired background that allows students to study and read for hours without optical fatigue.
2. **Deep Navy Ink (`#0B132B`):** Authoritative headers and structural dividers providing high contrast and civic credibility.
3. **Heritage Amber / Saffron Accent (`#F59E0B` / `#D97706`):** Vibrant accent color dedicated exclusively to primary actions (*"Free Quiz शुरू करें"*, active options, high-yield badges).
4. **Devanagari-First Typography (`Noto Sans Devanagari` + `Sora` / `Plus Jakarta Sans`):** Generous line-heights (`1.65 - 1.75`) preventing *matra* clipping and ensuring effortless reading of complex Hindi terms.
5. **No AI-Template Cliches:** Strictly zero generic purple gradients, zero floating blobs, zero decorative glassmorphism, zero fake user statistics, and zero synthetic AI avatar illustrations.

---

## 2. Design System Tokens & Specs

### Color Tokens:
```css
/* Core Color Palette */
--canvas-bg: #FAF8F5;          /* Warm Heritage Parchment */
--surface-card: #FFFFFF;        /* Pure White Elevated Sheet */
--surface-subtle: #FFFDF9;      /* Off-White Study Surface */
--ink-primary: #0B132B;         /* Deep Navy / Charcoal Ink (WCAG AAA contrast) */
--ink-muted: #475569;           /* Slate Muted Text for secondary labels */
--brand-amber: #F59E0B;         /* Primary Action Gold */
--brand-amber-dark: #D97706;    /* Hover State Amber */
--brand-amber-light: #FEF3C7;   /* High-Yield Tag Tint */
--border-hairline: #E2DFD7;     /* Subtle Paper Border */
--border-accent: #FDE68A;       /* Amber Accent Border */
--success-emerald: #059669;     /* Correct Answer Green */
--error-crimson: #DC2626;       /* Incorrect Answer Red */
```

### Typography Scale:
- **Hero Title (Display):** 36px - 44px (Desktop) / 26px - 30px (Mobile), Font: `Sora` / `Noto Sans Devanagari`, Weight: `800`, Leading: `1.2`.
- **Section Heading (H2):** 22px - 28px, Font: `Sora`, Weight: `700`, Leading: `1.3`.
- **Question Body:** 16px - 18px, Font: `Noto Sans Devanagari`, Weight: `600`, Leading: `1.7`.
- **Option Item:** 14px - 16px, Font: `Noto Sans Devanagari`, Weight: `500`, Min Height: `48px` (Touch target).
- **Metadata / Badges:** 11px - 12px, Font: `Plus Jakarta Sans`, Weight: `700`, Tracking: `0.04em`.

---

## 3. Screens to Generate in Google Stitch

| Screen # | Screen Name | Existing Route | Primary Focus |
|---|---|---|---|
| **01** | **Homepage (Desktop & Mobile)** | `/` | Hero Free Quiz Spotlight, Quick Exam Streams, Latest Notes & Articles |
| **02** | **Quiz Listing & Filters** | `/quizzes` | Subject/Exam/Difficulty filter bar, Test cards with question count and timer |
| **03** | **Interactive Quiz Attempt Screen** | `/quizzes/[slug]/attempt` | Timer, Question Card, Hindi/English Toggle, Instant Feedback, Sticky Submit Bar |
| **04** | **Quiz Result & Score Breakdown** | `/quizzes/[slug]/result` | Score summary, Accuracy percentage, Question-by-Question solution review, Bookmark action |
| **05** | **Revision Note Study Sheet** | `/notes/[slug]` | Clean editorial reading layout, Infographic gallery, Download PDF / Print triggers |
| **06** | **Student Dashboard & Notebook** | `/profile` & `/notebook` | Accuracy charts, Weak Topics list, Booster Test CTA, Saved Questions Notebook |

---

## 4. Copy-Paste Google Stitch Master Prompts

### Prompt 1: Homepage Redesign (Desktop + Mobile)
```
Design a modern, trustworthy, editorial-style homepage for Rajasthan Exam Twister (an existing Hindi-first Rajasthan exam preparation website).
- Canvas: Warm heritage parchment (#FAF8F5) with deep navy (#0B132B) header and saffron/amber (#F59E0B) primary action accents.
- Top Sticky Header: Brand logo, Hindi slogan "सवाल सीधा नहीं, सोच टेढ़ी करो!", navigation (Home, Blogs, Notes, Quizzes, Notebook, Leaderboard), search bar, and Google Sign-in button.
- Hero Section: High-impact editorial headline in Hindi ("राजस्थान प्रतियोगी परीक्षाओं के लिए सर्वश्रेष्ठ फ्री मॉक टेस्ट एवं रिवीज़न नोट्स"), subtitle, and a prominent primary CTA button "फ्री मॉक टेस्ट शुरू करें" (Free Quiz CTA) alongside "नोट्स देखें".
- Quick Subject Streams: Clean grid for Rajasthan History, Geography, Art & Culture, Polity, Economy, and Current Affairs with subtle borders (#E2DFD7).
- High-Yield Study Notes Section: Editorial cards with subject badge, sheet count, title, excerpt, and "Study Note" action.
- Recent Current Affairs & Blogs Section: 3-column editorial grid with read time, publication date, and clean typography.
- Telegram Community Card: Authoritative invitation banner to join the official Telegram channel for daily GK polls.
- Avoid generic AI patterns: No purple gradients, no floating decorative blobs, no fake user counts, no cartoon avatars. Use authentic educational typography with clean Devanagari support.
```

### Prompt 2: Interactive Quiz Attempt Screen (Mobile & Desktop)
```
Design an interactive mock test screen for Rajasthan Exam Twister (/quizzes/[slug]/attempt).
- Clean distraction-free testing environment with a top header showing: Quiz title ("राजस्थान का इतिहास: 1857 की क्रांति"), active timer badge (e.g. "14:32 remaining"), Hindi/English language toggle pill, and Question counter ("प्रश्न 4 / 20").
- Question Card: High-contrast white paper card with clear Hindi Devanagari question text ("1857 की क्रांति के समय कोटा के पॉलिटिकल एजेंट कौन थे?").
- Options List: 4 stacked option choices with clear radio indicators (A. मेजर बर्टन, B. कैप्टन मॉक मेसन, C. कर्नल ईडन, D. मेजर शॉवर्स). Generous touch target (min 50px height), soft border, and active selection highlight in amber-gold (#FEF3C7 background, #F59E0B border).
- Practice Feedback Mode: If instant feedback is active, show correct option in crisp emerald green with an explanation box below explaining the historical context.
- Bottom Sticky Navigation: Previous button, Question Grid Navigator drawer trigger, and high-visibility "सबमिट टेस्ट (Submit)" button.
```

### Prompt 3: Quiz Score & Review Solution Screen
```
Design a comprehensive Quiz Results & Solutions Review screen (/quizzes/[slug]/result) for Rajasthan Exam Twister.
- Summary Card: Clean white card displaying Score (e.g., 36/40 Marks), Accuracy Percentage (90%), Correct (18), Incorrect (2), and Time Taken.
- Action Buttons: "फिर से टेस्ट दें (Retake)", "अगला टेस्ट शुरू करें (Next Batch)", and "दोस्तों के साथ शेयर करें (Share)".
- Detailed Question-by-Question Solution Breakdown:
  - Question text with status indicator (Correct in Green, Incorrect in Red, Skipped in Grey).
  - Selected answer vs Correct answer clearly labeled.
  - Comprehensive explanation box (*विस्तृत व्याख्या*) with key facts.
  - "Bookmark Question (नोटबुक में सेव करें)" button on every question for personal revision.
- Retain editorial Rajasthan Exam Twister brand style with warm cream canvas (#FAF8F5) and deep navy headers.
```

### Prompt 4: Revision Note Study Sheet & Infographic Reader
```
Design a long-form educational revision note page (/notes/[slug]) for Rajasthan Exam Twister.
- Top Breadcrumbs and Title: "राजस्थान के प्रमुख दुर्ग एवं किले — संपूर्ण रिवीज़न हैंडबुक [Free PDF 2026]".
- Action Bar: "Download PDF (वाटरमार्क सहित)", "Print Sheet", "Bookmark Note", "Share on WhatsApp/Telegram".
- Article Body: High-readability typography with Devanagari line-height 1.7, structured H2/H3 headings, summary key points table, and high-resolution infographic diagrams.
- Related Notes & Recommended Quizzes sidebar on desktop (stacks below on mobile).
- Clean, focused reading experience without intrusive popups or disruptive floating elements.
```

---

## 5. Google Stitch Integration & Next Steps

1. **Option A (Manual Stitch Workflow):** Open [stitch.withgoogle.com](https://stitch.withgoogle.com/), create a new project named `Rajasthan Exam Twister Redesign`, paste the prompts above, and export the approved screen layouts.
2. **Option B (Direct Workspace Translation):** If you approve the design system and tokens specified in this brief, we can directly implement the polished CSS, Tailwind tokens, and component layouts directly into the repository in reviewable batches.
