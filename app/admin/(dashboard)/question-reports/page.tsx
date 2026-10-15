import { Suspense } from "react";
import { Metadata } from "next";
import { QuestionReportsClient } from "./question-reports-client";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Question Dispute Reports | Admin Control Panel",
  description: "Review, audit, and correct student-reported question discrepancies with official answer keys.",
};

export default function AdminQuestionReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
          <p className="text-xs font-semibold text-slate-500">
            Loading Question Dispute Reports...
          </p>
        </div>
      }
    >
      <QuestionReportsClient />
    </Suspense>
  );
}
