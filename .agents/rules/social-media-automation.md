# Social Media Automation & Question Kit Guidelines

This rule guides all AI agents working on Rajasthan Exam Twister's Social Media Kits and Question Bank pipeline.

## Core Rules:
1. **Never generate rasterized PIL text overlays for Devanagari Hindi**:
   - Standard PIL doesn't handle complex Devanagari ligatures (e.g. `मित्रता`, `तूफान`).
   - Always use `scripts/render_social_graphic.py` or headless browser with Google Fonts (`Mukta`, `Poppins`) for rendering 1080×1920 Reel posters.
2. **Strict Hierarchy for Reusable Question Kits**:
   - Location: `public/uploads/social-kits/<exam-slug>/<year>/question-<num>/`
   - Files per kit:
     - `reel_9_16.jpg` (1080×1920)
     - `twitter_card.jpg` (Focused 1:1 or 16:9)
     - `kit.json` (Full metadata, captions, pinned comment, suggested songs, status)
3. **Database & UI Synchronization**:
   - Keep `public/uploads/social_posts_history.json` and individual `kit.json` synchronized when upload status is toggled in `/admin/social-studio`.
4. **Official Branding**:
   - Logo path: `public/brand/examtwister_logo.png`
   - Slogan: *"सवाल सीधा नहीं, सोच टेढ़ी करो! RAJASTHAN EXAM TWISTER"*
