import { Suspense } from "react";
import type { Metadata } from "next";
import { StudentSubmissionsClient } from "./student-submissions-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Quiz Submissions | Rajasthan Exam Twister",
  description: "View and manage your saved AI quiz JSON submissions.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function StudentSubmissionsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading your submissions...</div>}>
      <StudentSubmissionsClient />
    </Suspense>
  );
}
