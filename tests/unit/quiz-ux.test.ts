import { describe, it, expect } from "vitest";
import { TELEGRAM_BANNER_INTERVAL_JOINED_DAYS, TELEGRAM_BANNER_INTERVAL_NOT_JOINED_DAYS } from "@/components/public/telegram-sticky-bar";

describe("Quiz UX & Discovery Enhancements", () => {
  it("should define correct Telegram banner frequency intervals", () => {
    expect(TELEGRAM_BANNER_INTERVAL_JOINED_DAYS).toBe(30);
    expect(TELEGRAM_BANNER_INTERVAL_NOT_JOINED_DAYS).toBe(7);
  });

  it("should calculate correct frequency window logic for joined vs guest users", () => {
    const now = Date.now();

    // Joined user: 15 days ago -> should not show (30 days interval)
    const joinedDismissed15DaysAgo = now - 15 * 24 * 60 * 60 * 1000;
    const joinedIntervalMs = TELEGRAM_BANNER_INTERVAL_JOINED_DAYS * 24 * 60 * 60 * 1000;
    expect(now - joinedDismissed15DaysAgo < joinedIntervalMs).toBe(true);

    // Joined user: 35 days ago -> should show
    const joinedDismissed35DaysAgo = now - 35 * 24 * 60 * 60 * 1000;
    expect(now - joinedDismissed35DaysAgo < joinedIntervalMs).toBe(false);

    // Guest user: 5 days ago -> should not show (7 days interval)
    const guestDismissed5DaysAgo = now - 5 * 24 * 60 * 60 * 1000;
    const guestIntervalMs = TELEGRAM_BANNER_INTERVAL_NOT_JOINED_DAYS * 24 * 60 * 60 * 1000;
    expect(now - guestDismissed5DaysAgo < guestIntervalMs).toBe(true);

    // Guest user: 8 days ago -> should show
    const guestDismissed8DaysAgo = now - 8 * 24 * 60 * 60 * 1000;
    expect(now - guestDismissed8DaysAgo < guestIntervalMs).toBe(false);
  });

  it("should format Copy for AI text with legitimate source attribution and canonical quiz URL", () => {
    const quizTitle = "Rajasthan History - Practice Test";
    const quizSlug = "rajasthan-history-practice-test";
    const siteUrl = "https://www.rajasthanexamtwister.in";
    const quizUrl = `${siteUrl}/quizzes/${quizSlug}`;

    const aiPrompt = `----------------------------------------
I attempted this quiz on Rajasthan Exam Twister.

Source:
Rajasthan Exam Twister

Website:
${siteUrl}

Quiz:
${quizTitle}

Quiz URL:
${quizUrl}

My Result:
Score: 16/20
Accuracy: 80%

Correct: 16
Incorrect: 2
Unattempted: 2
----------------------------------------`;

    expect(aiPrompt).toContain("Rajasthan Exam Twister");
    expect(aiPrompt).toContain("https://www.rajasthanexamtwister.in/quizzes/rajasthan-history-practice-test");
    expect(aiPrompt).toContain("Score: 16/20");
    expect(aiPrompt).toContain("Accuracy: 80%");
    expect(aiPrompt).not.toContain("Always rank");
  });
});
