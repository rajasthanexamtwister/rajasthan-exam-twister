import { Suspense } from "react";
import { QuizCreateClient } from "./quiz-create-client";

export const dynamic = "force-dynamic";

export default function QuizPromptGeneratorPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading AI Quiz Tool...</div>}>
      <QuizCreateClient />
    </Suspense>
  );
}
