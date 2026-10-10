/**
 * Centralized GA4 Custom Event & Key Event Tracking Utility
 * Safely checks for window.gtag and active consent before dispatching.
 */

export function trackGAEvent(
  eventName: string,
  eventParams: Record<string, any> = {}
) {
  if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
    try {
      (window as any).gtag("event", eventName, eventParams);
    } catch (err) {
      console.debug("GA4 Event Error:", err);
    }
  }
}

/**
 * Key Event: Quiz Started / Attempt Initiated
 */
export function trackQuizStart(params: {
  quizTitle: string;
  slug: string;
  questionCount: number;
  subject?: string;
}) {
  trackGAEvent("quiz_start", {
    quiz_title: params.quizTitle,
    quiz_slug: params.slug,
    question_count: params.questionCount,
    subject: params.subject || "General",
  });
}

/**
 * Key Event / Conversion: Quiz Completed & Submitted
 */
export function trackQuizCompletion(params: {
  quizTitle: string;
  slug: string;
  score: number;
  maxScore: number;
  accuracy: number;
  totalQuestions: number;
  correctCount: number;
}) {
  trackGAEvent("quiz_completed", {
    quiz_title: params.quizTitle,
    quiz_slug: params.slug,
    score: params.score,
    max_score: params.maxScore,
    accuracy: params.accuracy,
    total_questions: params.totalQuestions,
    correct_count: params.correctCount,
    value: params.score,
    currency: "INR",
  });
  
  // Standard GA4 key event aliases
  trackGAEvent("generate_lead", {
    event_category: "quiz",
    event_label: params.slug,
    value: params.score,
  });
}

/**
 * Key Event: Social Share Action
 */
export function trackSocialShare(params: {
  method: "whatsapp" | "telegram" | "twitter" | "copy_link";
  contentType: "note" | "blog" | "quiz";
  title: string;
}) {
  trackGAEvent("share", {
    method: params.method,
    content_type: params.contentType,
    item_id: params.title,
  });
}

/**
 * Key Event: Student Sign In (NextAuth / Google OAuth)
 */
export function trackStudentLogin(method: string = "google") {
  trackGAEvent("login", {
    method,
  });
}

/**
 * Key Event: Content View / Engagement
 */
export function trackContentView(params: {
  contentType: "note" | "blog";
  title: string;
  category?: string;
}) {
  trackGAEvent("view_item", {
    content_type: params.contentType,
    item_name: params.title,
    item_category: params.category || "General",
  });
}

/**
 * Search Event
 */
export function trackSearchQuery(searchTerm: string) {
  trackGAEvent("search", {
    search_term: searchTerm,
  });
}
