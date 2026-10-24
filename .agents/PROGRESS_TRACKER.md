# 🏆 Rajasthan Exam Twister — Complete Progress Tracker & Agent Guide

> **Status:** Active Production Development (~88% Complete)  
> **Last Updated:** October 2026  
> **Target Audience:** Future AI Agents (`.agent` / `.agents`), Core Developers & Maintainers  
> **Live Site:** [rajasthanexamtwister.in](https://rajasthanexamtwister.in)  
> **Repository:** `chiragbhoi01/trynew` (Migrating to `chiragbhoi01/rajasthan-exam-twister`)

---

## 🎯 1. Project Vision & Identity

**Rajasthan Exam Twister** is a high-engagement edtech platform tailored for Rajasthan state government exams (CET 10+2 & Graduate, REET, Patwar, RPSC RAS, Rajasthan Police, LDC, Informatics Assistant). It pairs an interactive, gamified student quiz engine with an automated, viral social media publishing studio to drive zero-cost student acquisition via Instagram Reels and X (Twitter).

* **Official Mascot Branding:** The wise Rajasthani Owl wearing a colorful traditional pagri (turban) and glasses (`public/brand/logo.png`).
* **Slogan / Battlecry:** *"सवाल सीधा नहीं, सोच टेढ़ी करो! ⚡"*
* **Core Philosophy:** High-difficulty, trap-oriented questions with detailed explanations that expose common exam misconceptions.

---

## 🏗️ 2. Technology Stack & Key Infrastructure

| Layer | Technologies Used | Key Locations |
| :--- | :--- | :--- |
| **Framework** | Next.js 14 (App Router), React 18, TypeScript | `app/`, `components/` |
| **Styling** | Tailwind CSS, Custom Glassmorphism, CSS 3D Transforms | `tailwind.config.ts`, `app/globals.css` |
| **Database** | MongoDB Atlas (`rajasthan_exam_twister`) via Prisma & Mongoose | `prisma/schema.prisma`, `server/models/` |
| **Authentication** | NextAuth.js (Google OAuth for Students) + JWT for Admin | `app/api/auth/[...nextauth]`, `middleware.ts` |
| **Media & CDN** | Cloudinary API + Local Static Uploads | `public/uploads/`, `app/api/admin/social-studio` |
| **Graphic Rendering**| Headless Microsoft Edge + HTML5/CSS3 Canvas Automation | `scripts/generate_all_master_templates.py` |
| **Verification** | Vitest, TypeScript Compiler (`tsc --noEmit`) | `vitest.config.ts`, `tests/` |

---

## 📊 3. Subsystem Progress Matrix

```
[████████████████████] 100% — Social Media Content Studio (Reels & X)
[██████████████████  ]  95% — SEO & Blog Publishing Engine
[██████████████████  ]  90% — Interactive Quiz Player & Test Series Engine
[██████████████████  ]  90% — Admin Dashboard & Content Ledger
[█████████████████   ]  85% — Question Bank Ingestion & Validation
[████████████        ]  60% — Automated Headless Social Scheduling
[████████            ]  40% — Payment Gateway (Monetization Engine)
----------------------------------------------------------------------
OVERALL COMPLETION: ~88%
```

---

## 🎨 4. Subsystem Deep Dives

### A. Social Studio & Viral Content Automation (100% Functional)
* **Location:** `app/admin/(dashboard)/social-studio/` & `app/api/admin/social-studio/route.ts`
* **Master 9:16 Reel Generator (1080 × 1920 HD):**
  * Script: [`scripts/generate_all_master_templates.py`](file:///c:/Users/Chirag%20Bhoi/Desktop/maytoaug/trynew/scripts/generate_all_master_templates.py)
  * Balanced safe margins: `padding: 60px 55px 160px 55px` (symmetric, zero right-side dead space).
  * Original mascot logo untouched with ambient radial glow.
  * Glowing 5-second countdown timer bar (`⏱️ 05s TIMER: बिना Google किए उत्तर दो!`).
  * 3D Navy & 24k Gold question panel with electric yellow keyword highlights.
  * 4 vertical gaming quiz option buttons (A, B, C, D) — **No answer is revealed on the image** to maximize comment engagement.
  * Signature `⚠️ EXAM TRAP` callout box for negative marking warnings.
  * Bottom engagement strip + Pinned Comment driver.
* **Master 16:9 X (Twitter) Card Generator (1200 × 675 px):**
  * Clean 2×2 grid layout (A, B on top; C, D on bottom) optimized for mobile Twitter timelines without vertical cropping.
* **Ledger & Duplicate Prevention Engine:**
  * Persistent storage in [`public/uploads/social_posts_history.json`](file:///c:/Users/Chirag%20Bhoi/Desktop/maytoaug/trynew/public/uploads/social_posts_history.json).
  * Normalized string distance duplicate guard: blocks re-adding or re-uploading identical questions.
  * Instant auto-advance: clicking "Mark Uploaded" immediately moves the post from `Pending` to `Uploaded` and loads the next question.
* **Current Upload Status (October 2026):**
  * **Questions 1 to 30:** Marked as **Uploaded** (`instagramUploaded: true`) with timestamps and sequences 1 to 30.
  * **Next Active Slot:** Question 31 onwards ready on request.

### B. Interactive Quiz & Mock Test Series Engine (90% Functional)
* **Location:** `app/(student)/test-series/`, `app/(student)/quiz/`, `server/services/quiz-service.ts`
* **Features:**
  * Dual-language toggle (Hindi / English) with instantaneous re-rendering.
  * Negative marking calculations (Standard RSMSSB 1/3rd = -0.66 marks).
  * Question palette with visited, answered, flagged, and review statuses.
  * Weak-Topic AI Booster (`server/services/booster-service.ts`): identifies weak subjects and builds targeted custom review drills.
  * Seeded Test Series: `question-bank/seeds/test-series/rajasthan-cet-test-series.json`.

### C. Blog & Organic SEO Architecture (95% Functional)
* **Location:** `app/(public)/blog/`, `app/admin/(dashboard)/blogs/`
* **Features:**
  * Comprehensive schema markup (FAQSchema, ArticleSchema, BreadcrumbList).
  * Slug validation, canonical URL generation, reading time estimator.
  * Category and tag filtering with mobile-first responsive layout.
  * XML sitemap dynamic generation (`app/sitemap.ts`).

### D. Authentication & Security (90% Functional)
* **Location:** `app/api/auth/[...nextauth]/route.ts`, `middleware.ts`
* **Features:**
  * Google OAuth client integration for instant student login.
  * Secure hashed admin password seed (`admin@rajasthanexamtwister.com`).
  * Student bookmarking and personal notes notebook (`server/services/notebook-service.ts`).

---

## 🗂️ 5. Key File & Asset Directory Map

```
trynew/
├── .agent/
│   └── PROGRESS_TRACKER.md             <-- This master tracker file
├── .agents/
│   ├── rules/                          <-- Agent behavioral constraints
│   ├── skills/                         <-- Universal quiz batch ingestion skills
│   └── PROGRESS_TRACKER.md             <-- Mirror copy for agent discovery
├── app/
│   ├── (student)/                      <-- Student test player & dashboard
│   ├── (public)/                       <-- Landing page, blogs, static SEO pages
│   ├── admin/(dashboard)/social-studio <-- Social Studio UI & Queue controller
│   └── api/admin/social-studio/        <-- Queue API, Cloudinary sync, duplicate guard
├── public/
│   ├── brand/logo.png                  <-- OFFICIAL UNTOUCHED MASCOT LOGO
│   └── uploads/
│       ├── social_posts_history.json   <-- Primary social queue & status ledger
│       └── social-kits/                <-- Generated 9:16 reels, 16:9 twitter cards & kit.json
│           └── rajasthan-cet-sr-secondary/2024/
│               ├── question-1/ ... question-11/ (UPLOADED)
│               └── question-12/ ... question-15/ (ACTIVE PENDING)
└── scripts/
    ├── generate_all_master_templates.py <-- Master Edge Headless generator for Reel + X
    ├── mark_first_11_as_posted.py       <-- Queue maintenance & status updater
    └── verify_social_history_state.py   <-- Integrity & duplicate check script
```

---

## 📜 6. Crucial Rules for Future AI Agents

1. **Brand Integrity (Never Violate):**
   * Never redraw, recolor, distort, or crop the official mascot logo (`public/brand/logo.png`).
   * The owl mascot with colorful turban and glasses is the primary brand identity.
2. **Terminal & Execution Constraint:**
   * **NEVER run complex multiline inline scripts directly in the terminal.**
   * Always write a standalone script in `scripts/` (e.g. `scripts/my_task.py` or `.ts`) and execute it with UTF-8 stdout wrapping.
3. **Encoding on Windows:**
   * Windows PowerShell uses `cp1252` by default. Any Python script printing Hindi / Devanagari text must include:
     ```python
     import sys, io
     sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
     ```
4. **Suspense & Answer Revelation in Social Kits:**
   * Social quiz cards (Instagram Reels & Twitter Cards) must **NEVER reveal the correct answer on the challenge slide**.
   * The correct answer belongs exclusively in the **Pinned Comment / Reply**, which forces viewers to engage and comment.
5. **Duplicate Prevention:**
   * Before adding any question to `social_posts_history.json`, always run text normalization to check for existing questions. Never pollute the database with duplicate questions.

---

## 📅 7. Next Immediate Roadmap & Open Tasks

- [ ] **Publish Remaining CET Batch:** Post Question 12 through Question 15 from the Social Studio pending queue.
- [ ] **Batch Ingestion of CET Shift 2 / Paper 422:** Ingest the next 15 questions from the 2024 CET exams using `.agents/skills/pdf-quiz-batch`.
- [ ] **Monetization (Payment Gateway):** Integrate Razorpay / Cashfree test mode for premium full-length test series.
- [ ] **Automated Reel Video Builder (Optional):** Wrap the 9:16 static reel image into a 5-second MP4 video loop with subtle particle movement and countdown audio sound effects using FFmpeg.
- [ ] **PWA & Offline Capability:** Add Service Worker for offline quiz practice on mobile browsers.

---
*Maintained by the Antigravity Agentic Framework for Rajasthan Exam Twister.*
