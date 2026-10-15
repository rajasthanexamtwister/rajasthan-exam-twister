import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quiz Result & Solutions | Rajasthan Exam Twister",
  robots: {
    index: false,
    follow: false,
  },
};

export default function QuizResultLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
