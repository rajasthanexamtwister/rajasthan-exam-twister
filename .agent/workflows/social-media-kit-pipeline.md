# 🎯 Rajasthan Exam Twister — Social Media Automation & Question Kit Pipeline

This document defines the complete architecture, status tracker, folder conventions, and automated workflows for generating and managing Daily Social Media Kits (Instagram Reels 9:16, X/Twitter Cards, Captions, Pinned Comments, Audio Recommendations, and Upload Tracking).

---

## 📌 1. Current Project Status & Completed Modules

| Module / Component | Location | Status | Details |
| :--- | :--- | :---: | :--- |
| **CET 2024 Master Question Papers** | `public/uploads/papers/2024/cet-senior-secondary/` | ✅ Complete | 6 Official Master Question Papers (P12, Q13, R15, S17, T19, V23) downloaded and stored locally. |
| **Social Studio UI (Admin Portal)** | `app/admin/(dashboard)/social-studio/page.tsx` | ✅ Complete | Fully responsive mobile-friendly UI with 9:16 preview, 1-click HD Download, Copy Image, Copy Captions, Copy Pinned Comment, X Intent Post, and Upload Status Toggles. |
| **Social Studio Backend API** | `app/api/admin/social-studio/route.ts` | ✅ Complete | Manages fetching history, status updates, syncing with individual `kit.json`, creating custom questions, and deleting kits. |
| **Admin Sidebar Navigation** | `components/admin/admin-sidebar.tsx` | ✅ Complete | Added "Social Studio" link with `Share2` icon to desktop and mobile slide-over drawers. |
| **Pixel-Perfect Image Renderer** | `scripts/render_social_graphic.py` | ✅ Complete | Uses Headless Edge + Google Fonts (`Mukta`, `Poppins`) to render 1080×1920 HD Reel graphics matching reference style with zero font-shaping bugs. |
| **Master Social Kit Generator** | `scripts/generate_social_kit.py` | ✅ Complete | Standalone CLI script to take any question and automatically generate both images, `kit.json`, and register in admin history. |
| **Standard Social Kits Storage** | `public/uploads/social-kits/` | ✅ Complete | Hierarchical storage (`<exam-slug>/<year>/question-<num>/`). Question 1 fully registered. |

---

## 🗂️ 2. Standard Folder & File Architecture

```
public/uploads/
├── brand/
│   └── examtwister_logo.png               # Official brand logo
├── papers/
│   └── 2024/
│       └── cet-senior-secondary/          # 6 Downloaded PDF Question Papers
│           ├── paper-422-...-p12.pdf
│           ├── paper-425-...-q13.pdf
│           └── ...
├── social_posts_history.json              # Central index of active social kits
└── social-kits/                           # Reusable Question Kits Library
    └── rajasthan-cet-sr-secondary/
        └── 2024/
            ├── question-1/
            │   ├── reel_9_16.jpg          # 1080×1920 HD Instagram Reel / Story Image
            │   ├── twitter_card.jpg       # Cropped X / Twitter Card Image
            │   └── kit.json               # Full question metadata, captions, comments, & status
            └── question-2/
                ├── reel_9_16.jpg
                ├── twitter_card.jpg
                └── kit.json
```

---

## 📄 3. Standard `kit.json` Schema Specification

Every generated question MUST follow this exact schema in its `kit.json`:

```json
{
  "id": "rajasthan-cet-sr-secondary-2024-q1",
  "exam": "Rajasthan CET (Sr. Secondary)",
  "year": "2024",
  "questionNumber": 1,
  "subject": "सामान्य हिंदी",
  "topic": "सर्वनाम एवं उसके भेद",
  "questionHi": "‘उसने कुछ नहीं खाया’ इसमें ‘कुछ’ कौन-सा सर्वनाम है?",
  "questionEn": "In 'उसने कुछ नहीं खाया', which pronoun is 'कुछ'?",
  "options": [
    { "key": "A", "hi": "प्रश्नवाचक", "en": "Prashnavachak" },
    { "key": "B", "hi": "संबंधवाचक", "en": "Sambandhvachak" },
    { "key": "C", "hi": "निजवाचक", "en": "Nijvachak" },
    { "key": "D", "hi": "अनिश्चयवाचक", "en": "Anishchayvachak", "isCorrect": true }
  ],
  "correctOption": "D",
  "explanation": "‘कुछ’ अनिश्चयवाचक सर्वनाम है क्योंकि इससे किसी निश्चित व्यक्ति या वस्तु का बोध नहीं होता।",
  "relativePaths": {
    "reelImage": "/uploads/social-kits/rajasthan-cet-sr-secondary/2024/question-1/reel_9_16.jpg",
    "twitterImage": "/uploads/social-kits/rajasthan-cet-sr-secondary/2024/question-1/twitter_card.jpg",
    "kitJson": "/uploads/social-kits/rajasthan-cet-sr-secondary/2024/question-1/kit.json"
  },
  "instagramCaption": "🔥 राजस्थान CET 2024 Master Paper 1 का महत्वपूर्ण सवाल! 🎯\n\n...",
  "pinnedComment": "✅ सही उत्तर: विकल्प (D) अनिश्चयवाचक सर्वनाम\n\n📌 व्याख्या...",
  "suggestedSongs": [
    { "title": "Aarambh Hai Prachand", "mood": "High Energy Motivation", "tag": "trending-exam" },
    { "title": "Kesariya Balam (Folk Beats)", "mood": "Rajasthani Cultural Pride", "tag": "viral-rajasthan" },
    { "title": "Kar Har Maidan Fateh", "mood": "Aspirant Inspiration", "tag": "study-grind" },
    { "title": "Lakshya Toh Har Haal Mein Paana Hai", "mood": "Laser Focus", "tag": "exam-focus" }
  ],
  "tweetText": "🎯 Rajasthan CET 2024 Master Paper 1 | सामान्य हिंदी\n\n...",
  "status": {
    "instagramUploaded": false,
    "instagramUploadedAt": null,
    "twitterPosted": false,
    "twitterPostedAt": null
  },
  "createdAt": "2026-10-09T01:26:00Z"
}
```

---

## ⚡ 4. How to Generate New Kits in Future (Step-by-Step)

### Option A: Via Python Automation Script
To generate a kit for any new question extracted from a PDF, run:
```bash
python scripts/generate_social_kit.py
```
Or import and call `generate_social_kit(...)` in your script:
```python
from scripts.generate_social_kit import generate_social_kit

generate_social_kit(
    exam_name="Rajasthan CET (Sr. Secondary)",
    year="2024",
    question_num=2,
    subject="सामान्य हिंदी",
    topic="संज्ञा",
    question_hi="निम्नलिखित में जातिवाचक संज्ञा का उदाहरण है-",
    question_en="Which of the following is an example of Common Noun?",
    options=[
        {"key": "A", "hi": "मित्रता", "en": "Mitrata"},
        {"key": "B", "hi": "तूफान", "en": "Toofan", "isCorrect": True},
        {"key": "C", "hi": "दौड़", "en": "Daud"},
        {"key": "D", "hi": "सभा", "en": "Sabha"}
    ],
    correct_option="B",
    explanation="‘तूफान’ प्राकृतिक आपदा होने के कारण जातिवाचक संज्ञा है।"
)
```

### Option B: Via Admin UI (`/admin/social-studio`)
1. Open `http://localhost:3000/admin/social-studio`
2. Click **"+ Generate New"** in the top right.
3. Fill in the Question (Hindi), 4 Options (A, B, C, D), Correct Option, and Explanation.
4. Click **"Generate Kit"**.

---

## 🎯 5. Next Roadmap & Upcoming Steps

- [ ] **Batch Extract CET Papers:** Extract Question 2 to Question 10 from CET 2024 Master Papers and generate kits in bulk.
- [ ] **Direct Instagram Graph API Publishing:** (Optional) Add automatic publishing to Instagram Business account via Graph API token.
- [ ] **Subject Templates:** Add specialized visual badges for *Rajasthan History & Art Culture*, *Rajasthan Geography*, and *General Science*.
