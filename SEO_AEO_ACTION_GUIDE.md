# SEO_AEO_ACTION_GUIDE.md — Rajasthan Exam Twister
## Google Indexing + Ranking + AI Answer Engine (AEO) — Complete Action Plan

This is a DOING guide, not a spec — it tells you exactly what to click,
submit, and repeat, in order. The technical foundation (sitemap.xml,
robots.txt, meta tags, JSON-LD, canonical URLs) is already built into
the codebase per `SEO.md` (the architecture doc). This file is about
everything that happens OUTSIDE the code — the manual/ongoing work that
actually gets you indexed, ranked, and picked up by AI answer engines
like ChatGPT, Perplexity, and Google AI Overviews.

---

## PART 1 — ONE-TIME SETUP (do this once, right after your site is live)

### Step 1: Confirm the technical foundation is actually live
Before doing anything in Search Console, verify these URLs work on your
real production domain:
- `https://yourdomain.com/sitemap.xml` — should list all published
  Blogs/Notes/static pages, NOT drafts, NOT `/admin/*`
- `https://yourdomain.com/robots.txt` — should `Allow: /` and
  `Disallow: /admin/` and `Disallow: /api/`
- View page source on your homepage and one Blog/Note detail page —
  confirm `<title>`, `<meta name="description">`, canonical `<link>`,
  and a `<script type="application/ld+json">` block are all present and
  filled with real content (not empty/placeholder).

If any of these are missing or broken, fix the code before proceeding —
Search Console submission is wasted effort on a broken foundation.

### Step 2: Google Search Console
1. Go to [search.google.com/search-console](https://search.google.com/search-console)
2. Add property → choose **"Domain"** property type (not URL-prefix) if
   you can verify via DNS — this covers `http/https` and `www/non-www`
   automatically, which is simpler long-term.
3. Verify ownership via DNS TXT record: Search Console gives you a TXT
   record value → add it in your domain registrar's DNS settings (or
   Vercel's domain DNS settings if Vercel manages your DNS) → wait
   5-30 min → click Verify in Search Console.
4. Once verified: **Sitemaps** (left sidebar) → enter `sitemap.xml` →
   Submit.
5. **URL Inspection** tool (top search bar in Search Console) → paste
   your homepage URL → click **"Request Indexing"**. Repeat this for:
   - Homepage
   - `/blogs`, `/notes`, `/quizzes` (main listing pages)
   - Your 3-5 best/most important individual Blog or Note pages
   Do NOT request indexing for every single page — Google has a daily
   quota per property, and it will crawl the rest via the sitemap
   naturally. Reserve manual requests for your most important pages.

### Step 3: Bing Webmaster Tools (smaller but free traffic, easy to add)
1. Go to [bing.com/webmasters](https://www.bing.com/webmasters)
2. You can **import directly from Google Search Console** (one-click, if
   you connect your Google account) — do this instead of manual setup.
3. Confirm your sitemap shows as submitted there too.

### Step 4: Google Analytics (optional, for traffic visibility — not required for ranking)
- Not required for SEO itself, but useful to see what's actually
  working. If you want this, tell your coding agent explicitly — it's a
  small addition (GA4 or a privacy-friendly alternative like Plausible),
  don't add it without deciding first since it's a new account/dependency.

### Step 5: Social profile → website links (helps AI engines associate your brand)
Make sure these already point back to your site (some may already be
done from earlier work):
- Telegram channel description/pinned message → your site URL
- Instagram bio link → your site URL
- X (Twitter) bio link → your site URL
- YouTube channel "About" section → your site URL

---

## PART 2 — TECHNICAL SEO CHECKLIST (verify once, re-check after big changes)

Run through this after major site changes (new page types, redesigns):

- [ ] Every page has a unique `<title>` (no two pages share one)
- [ ] Every page has a unique meta description, 150-155 characters
- [ ] Every page has exactly one `<h1>`
- [ ] Images have real, descriptive `alt` text (not filenames)
- [ ] Site loads fast on mobile — test with
      [PageSpeed Insights](https://pagespeed.web.dev/) (paste your URL,
      check both Mobile and Desktop scores)
- [ ] No broken internal links — spot-check your main nav and a few
      Blog/Note detail pages
- [ ] HTTPS is working (padlock in browser) — Vercel does this
      automatically, just confirm
- [ ] Mobile-friendly test:
      [search.google.com/test/mobile-friendly](https://search.google.com/test/mobile-friendly)

---

## PART 3 — ONGOING SEO (do this regularly, this is what actually moves rankings)

### A. Publish consistently
New sites need to show Google they're active. Aim for a realistic,
sustainable publishing cadence (e.g. 2-3 new Blogs/Notes per week) rather
than a burst-then-silence pattern — consistency matters more than
volume for a new site building trust.

### B. Use the AEO-optimized blog prompt for every new post
You already have a master prompt (given separately) that converts raw
exam updates into a blog post structured for BOTH traditional SEO and AI
answer engines — the key elements it enforces every time:
1. A "quick answer" opening that states the core fact in the first 2-3
   sentences (this is what AI engines lift directly into their answers)
2. Proper H2 structure with a dates/facts table where relevant
3. An FAQ section at the end (4-6 real question/answer pairs) — this is
   the single highest-leverage AEO element, since it directly matches
   how people phrase voice/AI searches
4. Short paragraphs, scannable lists, no invented facts

Use this prompt for every new blog post, not just some — consistency in
structure is what trains both Google and AI engines to trust and surface
your content.

### C. Target keywords people are actually searching for
Before writing a post, do a quick check (free tools, no paid keyword
tool needed for v1):
- Google the topic yourself and look at "People Also Ask" boxes — those
  are literally the FAQ questions to answer in your post
- Google autocomplete: type your topic and see what it suggests
- Check what already ranks for that topic — is it outdated/incomplete?
  That's your opportunity to write something better

### D. Internal linking — do this manually as you publish
Every time you publish a new Blog or Note, go back and add a link to it
from 1-2 OLDER related posts (via the admin editor). This is one of the
most underrated ranking factors and the CMS doesn't do this automatically
— it's a manual habit to build.

### E. Backlinks — the highest-leverage thing for a NEW site
Google trusts a new site more when other sites link to it. Realistic,
non-spammy ways to get this for an exam-prep site:
1. Share every new post in your own Telegram channel/WhatsApp
   groups/Instagram — direct traffic + some of those platforms count as
   referral signals
2. Find OTHER Rajasthan exam-prep Telegram channels/Facebook
   groups/forums and share genuinely useful content there (not spam —
   only share when it's actually relevant to the discussion)
3. If you know other education bloggers/YouTubers in this space, ask if
   they'd link to a specific useful resource (e.g. your REET syllabus
   note) — offer something genuinely useful in return
4. Answer questions on Quora/Reddit (r/Rajasthan-adjacent communities)
   about Rajasthan exams, and where genuinely relevant, link to a
   specific detailed page on your site (not your homepage, not spammy)

### F. Freshness signals
For time-sensitive content (exam notifications, current affairs), keep
it updated rather than letting it go stale — the "Updated on [date]"
badge already built into the site (Batch 7) is a real signal both to
users and to search engines that content is maintained.

---

## PART 4 — AEO SPECIFIC: GETTING PICKED UP BY CHATGPT/PERPLEXITY/AI OVERVIEWS

AI answer engines work differently from classic Google ranking — they
extract and synthesize direct answers rather than just ranking blue
links. What actually helps:

1. **Self-contained answers.** Every FAQ answer and every "quick answer"
   opening must make sense with ZERO surrounding context — assume the AI
   engine will lift just that one paragraph and show it to someone who
   never saw the rest of your page.

2. **Structured facts (tables, lists) over prose.** AI engines extract
   structured data more reliably than dense paragraphs. Dates, numbers,
   eligibility criteria — put these in tables or bullet lists, not
   buried in a sentence.

3. **Accuracy is non-negotiable.** If an AI engine cites your site and
   the fact turns out wrong, that's worse than not being cited at all —
   it damages trust in a way that's hard to recover. Never let the
   AI-generation prompt invent a date/number it wasn't given.

4. **Be crawlable by AI crawlers specifically.** Check your `robots.txt`
   isn't accidentally blocking AI crawlers you WANT indexing you (most
   sites want `GPTBot`, `PerplexityBot`, `Google-Extended` allowed unless
   you have a specific reason to block them — the default `robots.txt`
   built in this project only blocks `/admin` and `/api`, which is
   correct; don't add broader AI-crawler blocks unless you deliberately
   want to opt out of AI-engine visibility).

5. **Schema markup helps AI engines understand context faster** — this
   project already implements `Article`/`LearningResource` JSON-LD
   (Batch 7) and `BreadcrumbList` + `Organization`/`WebSite` schema
   (Batch 11) — keep this pattern for every new content type you add.

6. **Answer the question in the title/H1 itself where natural** — e.g.
   "REET 2026 Notification: Important Dates & Eligibility" answers more
   of the query directly than a vague title, which helps both classic
   SEO and AEO extraction.

---

## PART 5 — MONITORING (check periodically, don't obsess daily)

- **Google Search Console → Performance tab**: check weekly. Shows what
  queries you're appearing for, click-through rate, average position.
  This tells you what's working and what needs improvement.
- **Google Search Console → Coverage/Indexing tab**: check for any pages
  Google couldn't index (errors) — fix these promptly.
- **Google Search Console → Core Web Vitals**: check monthly, make sure
  nothing regressed after a site update.
- Search your own site name + a few key topics on Google periodically to
  see how you're actually showing up.
- Try asking ChatGPT/Perplexity a question your content answers, and see
  if/how your site gets referenced — this is the only real way to gauge
  AEO progress since there's no "AEO Search Console" equivalent yet.

---

## QUICK-START CHECKLIST (do these in this exact order, right now)

```
[ ] 1. Confirm sitemap.xml and robots.txt work on live production URL
[ ] 2. Google Search Console: add property, verify via DNS
[ ] 3. Google Search Console: submit sitemap.xml
[ ] 4. Google Search Console: request indexing for homepage + 5 key pages
[ ] 5. Bing Webmaster Tools: import from Google Search Console
[ ] 6. Add your site URL to Telegram/Instagram/X/YouTube bios
[ ] 7. Run PageSpeed Insights + Mobile-Friendly Test, fix anything red
[ ] 8. Publish your first 2-3 blogs using the AEO prompt
[ ] 9. Share each new post in your own Telegram channel
[ ] 10. Check Search Console Performance tab after 1-2 weeks
```

New sites typically take 2-8 weeks to start showing meaningful search
traffic even with everything done right — this is normal, not a sign
something's broken. Consistency over this period matters more than any
single action.