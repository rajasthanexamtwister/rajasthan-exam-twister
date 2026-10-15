import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quiz Attempt | Rajasthan Exam Twister",
  robots: {
    index: false,
    follow: false,
  },
};

export default function QuizAttemptLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
