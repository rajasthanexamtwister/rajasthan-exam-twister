export interface SocialLink {
  name: string;
  url: string;
  handle: string;
}

export const SOCIAL_LINKS = {
  telegram: {
    name: "Telegram",
    url: "https://t.me/+9lJuoxlqJdsxMDY1",
    handle: "ExamTwister Channel",
  },
  instagram: {
    name: "Instagram",
    url: "https://www.instagram.com/examtwister/",
    handle: "@examtwister",
  },
  twitter: {
    name: "X (Twitter)",
    url: "https://x.com/examtwister",
    handle: "@examtwister",
  },
  youtube: {
    name: "YouTube",
    url: "https://www.youtube.com/@ExamTwister",
    handle: "@ExamTwister",
  },
} as const;

export const OFFICIAL_SOCIAL_URLS = Object.values(SOCIAL_LINKS).map((s) => s.url);
