# Social Media Reel & Question Kit Automation Rules

This rule defines the authoritative, simplified Reel Generation and Question Publishing Workflow for Rajasthan Exam Twister.

## 📌 Status Tracker & Baseline
- **Completed & Uploaded:** **Questions 1 to 30 (Q1 – Q30)** are fully uploaded to Instagram by the user.
- **Current Active Slot:** **Q31 onwards** (Batch size: max 20 questions per day / user slot).

---

## 🎯 Simplified Daily Reel Workflow (Chat & User-Assisted)
The complex `/admin/social-studio` UI is deprecated for daily reel uploads. Instead, the workflow is fast, direct, and conversational:

### 1. User Requests a Slot
When the user says e.g. *"Q26 se agla slot do"* or *"mera ye slot chal raha hai"*:
The agent prepares the questions for that slot from the original exam paper PDF (e.g. `paper-421-cet-senior-secondary-2024.pdf` or `ldc_master_paper.pdf`).

### 2. What the Agent Delivers for Each Question:
For every question in the requested slot, the agent outputs:
1. **Direct Cropped Paper Image:**
   - The authentic question cropped directly from the official PDF using PyMuPDF (`fitz`).
   - Saved with high DPI (e.g. 2.0x scale) so Hindi Devanagari text is razor-sharp.
   - Clickable link: `[View Cropped Question Image](file:///path/to/crop.jpg)`
2. **Clean Question Text & Options:**
   - Hindi & English question text.
   - Options A, B, C, D clearly formatted for quick copying.
3. **ChatGPT AI Reel Prompt:**
   - A ready-to-copy English prompt optimized for ChatGPT/DALL-E 3 (Vertical 9:16 aesthetic wallpaper, exam theme, neon/golden lighting, relevant exam topic elements).
   - User simply pastes this prompt into ChatGPT to generate their AI background/reel image.
4. **Pinned Comment (Answer & Explanation):**
   - Correct Option letter and full educational explanation for students to read and comment on.

---

### 3. User Feedback & Slot Progress Tracking
- User manually posts the reel to Instagram using the ChatGPT image + Question text + Pinned comment.
- When the user says *"All done"* or *"Mene X upload kar diye"*:
  1. The agent marks those questions as `instagramUploaded: true` with timestamp in `public/uploads/social_posts_history.json`.
  2. The agent reports the updated progress (e.g. *"Q21–Q25 completed! Now ready for Q26–Q30"*).
  3. The agent prepares the next slot on request without repeating previously posted questions.

---

### 📂 Key Asset Paths
- **CET 2024 Shift 1 Paper (Paper 421):** `public/uploads/papers/2024/cet-senior-secondary/paper-421-cet-senior-secondary-2024-all-cet-sr-sec-2024-master-question-paper-v23.pdf`
- **LDC 2024 Master Paper:** `temp-ldc-paper/ldc_master_paper.pdf`
- **Social Posts History:** `public/uploads/social_posts_history.json`
- **Output Directory for Cropped Paper Questions:** `public/uploads/social-kits/<exam-slug>/question-<num>/`
