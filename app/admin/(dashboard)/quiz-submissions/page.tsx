import { Suspense } from "react";
import { AdminSubmissionsClient } from "../quizzes/submissions/admin-submissions-client";

export const dynamic = "force-dynamic";

export default function AdminDirectQuizSubmissionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading admin submissions...</div>}>
      <AdminSubmissionsClient />
    </Suspense>
  );
}
