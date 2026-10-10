# Rajasthan Exam Twister — Website Redesign PRD
**Version:** 1.0 | **Prepared:** 10 October 2026 | **Scope:** Visual redesign only

## 1. Executive Summary
Redesign the existing Rajasthan Exam Twister website to improve hierarchy, readability, navigation, responsiveness, consistency, and discoverability of its main action: **Free Quiz / Mock Test**. The result should feel like a credible, editorial-quality education platform—not a generic AI-generated template.

**Hard rule: REDESIGN ONLY — NO FUNCTIONALITY CHANGES.** Preserve all current routes, APIs, database schemas, authentication, quiz logic, CMS/admin workflows, SEO behavior, analytics, consent behavior, media integrations, and external integrations. This PRD is a design brief and must be paired with a read-only audit of the current repository before implementation.

Known product preferences: Hindi-first interface with familiar English technical terms; audience includes new and returning students; primary action is Free Quiz/Mock Test. The RajasthanGyan screenshot is a reference for broad content categories only, not a design to copy.

## 2. Goals
1. Make the free quiz/mock-test action obvious.
2. Help new students understand the platform quickly.
3. Help returning students reach existing learning shortcuts where implemented.
4. Improve mobile readability, touch targets, navigation, and responsive behavior.
5. Create consistent design tokens and reusable components.
6. Preserve SEO, accessibility, performance, content, and current workflows.
7. Ensure every design maps to an existing route and real content source.

## 3. Non-Goals and Forbidden Changes
- No new or removed features.
- No route, URL, query parameter, API, database, or permission changes.
- No changes to quiz scoring, timers, question/answer visibility, attempts, bookmarks, or exam logic.
- No changes to authentication, OAuth, cookies, sessions, authorization, CSRF, or rate limits.
- No changes to CMS create/edit/draft/publish/archive/import/media workflows.
- No SEO changes: preserve titles, descriptions, canonical URLs, redirects, sitemap, robots, feed, structured data, and crawlable links.
- No fake users, reviews, ratings, statistics, exam dates, results, or placeholder content.
- No production deployment, migrations, seeds, or environment changes.
- No copying another site's branding, exact layout, or assets.
- If a visual improvement requires changing behavior, stop and record it for approval.

## 4. Users and Journeys
**New student:** land from search/social → understand exam-preparation value → choose an exam or start a free quiz → use the existing quiz flow → discover related notes/current affairs/syllabus.

**Returning student:** reach existing account/dashboard → access supported features such as attempt history, saved/wrong questions, weak topics, or booster tests if implemented → continue learning without new forced sign-in gates.

**Admin/content editor:** existing admin login, role protection, CMS, media, import, draft/publish, validation, filters, and forms must continue to work exactly as before.

## 5. Design Principles
- Content-first, not decoration-first.
- Hindi-first typography with correct Devanagari rendering.
- One clear primary action per major view.
- Purposeful density: useful content without tiny text or excessive whitespace.
- Trustworthy, restrained regional identity; use real brand assets.
- Accessible keyboard focus, labels, contrast, semantic headings, and reduced motion.
- Responsive layouts designed for each viewport.
- Preserve familiar features and labels.
- Ads remain distinct from content and primary actions.

## 6. Visual Direction
**Recommended direction: Editorial learning platform.** Use a calm neutral background, high-contrast ink text, one primary brand color and a restrained secondary accent selected after inspecting the current logo/assets, readable Devanagari-capable fonts, consistent spacing, subtle borders, and purposeful—not excessive—shadows. Prefer existing brand assets, real content thumbnails, maps, and simple diagrams over generic illustrations.

### Avoid “AI-generated template” signals
- Purple/blue gradients across every section.
- Floating blobs, random glows, excessive glassmorphism.
- Every item inside the same rounded card.
- Repeated three-card sections regardless of content.
- Arbitrary emojis as interface icons or mixed icon styles.
- Generic AI people/hero art, fake charts, fake testimonials, fake counters.
- Excessive animation, parallax, or hover-only interactions.
- Generic marketing phrases unrelated to real product capabilities.
- Unsubstantiated “Popular”, “Trending”, or “Best” badges.
- Perfectly symmetrical layouts that ignore real content needs.

## 7. Proposed Homepage Hierarchy
Validate this against existing routes and content; do not create missing functionality.
1. **Header:** existing logo, key navigation, existing search and account/login controls; mobile navigation preserves current destinations.
2. **Hero:** Hindi-first heading about exam practice; short truthful description; primary CTA “Free Quiz शुरू करें” (or the accurate existing label); secondary CTA “Notes देखें”.
3. **Exam/resource discovery:** only categories with real content.
4. **Continue learning:** only existing shortcuts supported for the current signed-in/out state.
5. **Featured/daily practice:** only if backed by existing content and rules.
6. **Latest exam updates/current affairs:** existing published content and sorting.
7. **Notes/articles/syllabus:** existing taxonomy and routes.
8. **Additional tools:** only implemented resources.
9. **Footer:** preserve legal, contact, policy, copyright, and navigation links.
Do not cram every category into the first viewport; on mobile, the primary quiz action must be easy to find.

## 8. Page Templates to Audit
Discover the actual route inventory first. Redesign only those that exist:
- Homepage and exam/category discovery
- Quiz listing/details/instructions, active quiz, result/review
- Blog/article/notes listing and detail
- Search results
- Sign-in and OAuth-related screens
- Student dashboard/profile
- Attempt history, bookmarks, wrong questions, weak topics, booster tests, leaderboard (if implemented)
- Syllabus/resources
- Contact/about/privacy/terms/refund/copyright pages
- Custom 404, loading, empty, error, and success states
- Admin login, dashboard, CMS editor, media, import and publishing screens
- Any other real public/protected routes found in the repository
Do not invent screens for completeness.

## 9. Component Requirements
Reuse existing components where practical. Refine shared visual components such as header/mobile nav, footer, buttons, links, breadcrumbs, search/filter controls, exam/resource tiles, quiz cards, article cards, section headings, status labels, form fields/validation, admin tables/pagination, empty/loading/error states, existing modals, and clearly separated ad slots. Do not introduce a new component library unless necessary and approved.

## 10. Responsive Requirements
Test at 320–360, 375–430, 768, 1024–1280, and 1440+ CSS px.
- No unintended horizontal overflow or clipped Hindi text.
- Tap targets generally at least 44×44 px where practical.
- Quiz question/options/timer/submit/review remain usable on mobile.
- Tables receive intentional responsive treatment without hiding critical actions.
- Sidebars may stack below main content on small screens.
- No essential action available only on hover.
- Respect browser zoom and text scaling.

## 11. Accessibility
- Semantic HTML and logical heading order.
- Programmatic labels for all fields.
- Clear accessible names for controls.
- Visible keyboard focus.
- Aim for WCAG 2.2 AA contrast: 4.5:1 normal text, 3:1 large text.
- Never rely on color alone to convey status.
- Meaningful alt text for informative images; empty alt for decorative images.
- Essential text must not be embedded only in images.
- Test Devanagari matras, conjuncts, punctuation, and mixed Hindi/English.
- Respect `prefers-reduced-motion`.
- Preserve semantic SEO content.

## 12. SEO, Analytics, Performance Guardrails
Preserve page-specific metadata, canonical URLs/domain redirects, sitemap, robots, feed, Open Graph/Twitter metadata, JSON-LD, analytics and consent behavior, internal links, and public/private route boundaries. Do not turn text into images or replace crawlable links with nonsemantic click handlers. Avoid heavy dependencies, unnecessary client components, layout shift, and excessive animations. Compare baseline and post-change performance on the same routes/viewports.

## 13. Protected Functionality Contracts
Subject to confirmation in the audit, preserve:
- URL paths, query parameters, redirects, route handlers.
- API contracts, request/response shapes, error and caching behavior.
- Database models, indexes, schema, seed behavior.
- Login/logout, OAuth, cookies, sessions, role checks.
- Admin/student separation and protected routes.
- Quiz timing, attempts, answer submission, scoring, result review, answer visibility, guest access.
- Bookmarks, weak-topic analysis, wrong-question notebook, booster tests, leaderboard.
- CMS draft/edit/publish/archive/import/media flows.
- Search, filters, sorting, pagination, taxonomy.
- SEO metadata/canonical/sitemap/robots/feed/structured data.
- Analytics/consent and configured media provider.
If an existing bug is found, document it separately. Do not silently fix it during visual redesign.

## 14. Required Read-Only Repository Audit
Before final design, inspect and report:
1. Current branch, commit, git status, package manager, scripts, versions.
2. Full public/protected route inventory with source files.
3. Homepage component tree and reusable layouts/components.
4. Global CSS, Tailwind/theme tokens, fonts, logo, images, icon library.
5. Per-page data dependencies, API calls, session requirements, loading/error/empty states.
6. Contracts for quiz, auth, dashboard, CMS/admin, search, SEO.
7. Existing tests and baseline typecheck/test/build/lint results.
8. Known issues and external dependencies not verifiable locally.
9. Desktop/mobile screenshots of key routes with safe real/staging data.
10. Mapping from every proposed Stitch screen to an existing route/component.
11. Unknowns and decisions requiring approval.
Audit must not change files, install packages, run migrations/seeds, modify env, access/mutate production data, or deploy.

## 15. Google Stitch Workflow
Stitch is a design exploration tool; generated output is not automatically production-ready application logic.
1. Complete the read-only audit.
2. Upload the current homepage screenshot and official brand assets.
3. Provide this PRD and the design prompt below.
4. Generate desktop and mobile variants that share the same design system.
5. Compare at least two visual directions before choosing one.
6. Design only real templates discovered in the audit.
7. Document tokens, typography, spacing, states, responsive rules, and route mapping in `DESIGN.md` or equivalent.
8. Export/share selected designs and assets.
9. Implement in a separate branch with small, reviewable commits.
10. Compare implementation screenshots to approved designs at identical viewport sizes.
11. Run regression checks; do not deploy without approval.

## 16. Google Stitch Master Prompt
Attach the current website screenshot, official logo/assets, and this PRD.

> Design a polished, credible, editorial-style redesign for Rajasthan Exam Twister, an existing Rajasthan exam-preparation website for Hindi-speaking students. The main action is starting a free quiz/mock test. Support new and returning students. Use Hindi-first interface copy with familiar English technical terms where natural.
>
> This is an existing product, not a new startup landing page. Preserve the information architecture and feature availability from the supplied repository audit. Use only real routes, content types, and capabilities. Never invent features, user statistics, testimonials, results, exam dates, or content.
>
> Visual direction: intentional editorial learning platform, strong Devanagari typography, readable text, clear hierarchy, purposeful whitespace, restrained brand color, subtle borders, realistic content density, and a distinctive but quiet Rajasthan education identity. Use supplied brand assets. Do not copy the reference website’s exact visual design.
>
> Avoid generic AI-template patterns: no page-wide purple/blue gradients, floating blobs, excessive glassmorphism, repetitive identical rounded cards, arbitrary emoji icons, generic AI illustrations, fake charts, fabricated statistics, or gratuitous animation. Every component must have a clear information or interaction purpose.
>
> Create responsive desktop and mobile variants. Make the free-quiz action obvious without overwhelming the page. Keep secondary routes discoverable. Design states only for interactions already present.
>
> Output a visual design specification, not backend behavior. Include colors, typography, spacing, grid, breakpoints, component rules, icon rules, accessibility notes, and mapping to existing routes. Mark missing information as an open question instead of inventing it.

## 17. Coding Agent — Read-Only Audit Prompt
> You are auditing the existing Rajasthan Exam Twister repository before a visual-only redesign.
>
> **HARD RULE: READ ONLY.** Do not edit, create, delete, rename, format, or move files. Do not install packages, change configuration/environment variables, access or mutate production data, run migrations/seeds, or deploy.
>
> Inspect git branch/status and recent commits; package scripts; framework/UI dependencies; routes; layouts; components; CSS/Tailwind/theme; fonts/assets; public/protected pages; data/API dependencies; auth/session/role boundaries; quiz behavior; student features; CMS/admin workflows; search; SEO metadata/canonical/sitemap/robots/feed/structured data; analytics/consent; media integration; loading/error/empty states; tests/build configuration.
>
> For each route, report route pattern, public/protected status, purpose, components, data source, actions, query parameters, important states, and files. Distinguish code-verified facts from assumptions and external settings that cannot be verified.
>
> Run only safe existing checks that do not mutate data. Record typecheck, tests, build, and lint results only if actually run.
>
> Deliver: executive summary; route inventory; component/design-system inventory; protected functionality contracts; baseline checks; UX/accessibility/responsive issues with file/line evidence; route-to-Stitch-screen map; risks; unknowns/questions; implementation sequence.
>
> End with: “No files changed; no functionality modified; no deployment performed.” Stop and report if a command unexpectedly changes state.

## 18. Coding Agent — Visual-Only Implementation Prompt
> Implement the approved redesign in the existing repository. This is strictly presentation-layer work.
>
> Before editing, verify the branch is clean and use a dedicated redesign branch. Read the PRD, audit, and approved Stitch exports. Never overwrite the app with generated code.
>
> Allowed: layout, CSS/Tailwind, visual components, design tokens, typography, responsive styling, visual assets, semantic markup, and accessibility fixes that do not change behavior.
>
> Forbidden: route/API/data/schema/auth/quiz/scoring/timer/CMS/search/SEO/analytics/consent/integration changes; new features; removing controls; mock data replacing real data; content fact changes; environment changes; migrations/seeds; production deployment.
>
> Preserve handlers, props, server/client boundaries, API calls, URL behavior, and state transitions. Prefer existing dependencies. Work in small route-based batches. For each batch report files changed, why changes are visual-only, tests, screenshots, and mismatches. Stop for approval if a design requires a functional change.
>
> Run existing typecheck, tests, build, and lint if configured. Compare before/after screenshots. Check keyboard navigation, contrast, focus, Hindi rendering, overflow, loading/empty/error states, SEO output, and protected journeys. Do not deploy. Deliver a change summary, regression evidence, unresolved issues, and confirmation that production behavior was not intentionally changed.

## 19. Acceptance Criteria
**Visual:** quiz CTA is clear; hierarchy/readability improve; desktop/mobile are intentional; design system documented; no unexplained generic-template patterns; real brand assets/content used.

**Functionality:** all baseline routes remain reachable under existing access rules; all primary actions behave as before; quiz journey works; auth boundaries remain; CMS workflows remain; search/filters/pagination and student tools remain; no API/schema/env changes; SEO/analytics/consent output preserved.

**Engineering:** typecheck, existing tests, and production build pass (or baseline failures are documented); no new console/hydration errors; no unintended overflow; keyboard focus/labels work; before/after screenshots and route regression checklist supplied; no deployment before explicit approval.

## 20. Delivery Phases
- **Phase 0 — Audit:** route inventory, baseline screenshots, tests.
- **Phase 1 — Design system:** typography, colors, spacing, grid, navigation, buttons, cards, forms.
- **Phase 2 — Homepage:** implement and verify the main quiz journey.
- **Phase 3 — Shared shell:** header/footer/shared components.
- **Phase 4 — Public content:** existing quiz listings, articles/notes, search, syllabus/resources.
- **Phase 5 — Student flows:** existing login/dashboard/attempt/saved/wrong-question/progress screens.
- **Phase 6 — Admin/CMS:** visual improvements while preserving permissions/workflows.
- **Phase 7 — Regression/sign-off:** visual, functional, responsive, accessibility, SEO, performance.
Each phase must be reviewable and revertible.

## 21. Open Questions to Resolve During Audit
1. What routes exist today and which are most visited?
2. Which logo/colors/fonts/assets are official?
3. Which student shortcuts are available to guests vs signed-in users?
4. Which loading/empty/error states already exist?
5. Which ad slots/widgets must remain and how do they behave responsively?
6. Which analytics events already track quiz starts/completions/sign-ins/navigation?
7. Which mobile/accessibility issues are already known?
8. Which routes should be included in the first visual release?
Resolve from repository evidence where possible; do not infer functionality from screenshots alone.

## 22. Risk Register
- **Quiz behavior changes accidentally:** preserve handlers/state and regression-test full quiz journey.
- **Generated UI invents content:** use real data and route audit.
- **SEO changes during markup refactor:** snapshot metadata, canonicals, JSON-LD, sitemap, robots, links.
- **Admin exposure:** preserve route protection and role-boundary tests.
- **Hindi clipping on mobile:** test real Devanagari content at narrow widths.
- **Bundle growth:** reuse existing dependencies.
- **Ads disrupt layout:** reserve space and separate from content.
- **Scope creep:** small route-based phases; presentation-only stop rule.
- **Stitch output replaces app logic:** treat generated code as reference and integrate carefully.

## 23. Research Notes
Google’s official Stitch announcement describes UI generation from natural-language prompts and images, design iteration, and design-to-code workflows. Google’s 2026 updates describe a broader design canvas, design systems such as `DESIGN.md`, and export/integration options. Availability may vary by account and product version.

Official references:
- Google Developers Blog, “From idea to app: Introducing Stitch, a new way to design UIs” (20 May 2025): https://developers.googleblog.com/en/stitch-a-new-way-to-design-uis/
- Google Blog, “We’re introducing new ways to design in real time with Stitch” (19 May 2026): https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-updates/
- Google Blog, “Introducing ‘vibe design’ with Stitch” (18 March 2026): https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-ai-ui-design/

The previous repository audit from September 2026 described a Next.js/TypeScript/MongoDB application with CMS, quiz, student features, SEO, and media integrations. This is historical context, not a substitute for auditing the current checkout.

## Final Rule
**If a change can affect what the website does, it is out of scope. If it changes only how the existing website looks and remains accessible, responsive, and understandable, it may be in scope. When uncertain, stop and ask for approval.**
