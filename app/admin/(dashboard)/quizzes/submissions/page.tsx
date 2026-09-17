import { Suspense } from "react";
import { AdminSubmissionsClient } from "./admin-submissions-client";

export const dynamic = "force-dynamic";

export default function AdminQuizSubmissionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading admin submissions...</div>}>
      <AdminSubmissionsClient />
    </Suspense>
  );
}
