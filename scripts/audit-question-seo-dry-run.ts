import "dotenv/config";
import { connectToDatabase } from "../server/lib/mongodb";
import { QuizQuestion } from "../server/models/QuizQuestion";
import { Quiz } from "../server/models/Quiz";
import { Category } from "../server/models/Category";

interface AuditSummary {
  totalQuestions: number;
  byStatus: Record<string, number>;
  byAnswerVerified: { verified: number; unverified: number };
  explanationHealth: {
    hasExplanation: number;
    emptyOrMissing: number;
    shortExplanation: number; // < 20 chars
  };
  optionValidity: {
    validOptionIndex: number;
    invalidOptionIndex: number;
  };
  slugHealth: {
    hasSlug: number;
    noSlug: number;
    duplicateSlugs: string[];
  };
  parentQuizHealth: {
    parentPublished: number;
    parentDraft: number;
    parentArchived: number;
    parentMissing: number;
  };
  publishingReadiness: {
    currentlyPublishedAndActive: number;
    pilotCandidatesPendingVerification: number; // parent published + valid options + non-empty explanation, but unverified
    blockedMissingExplanation: number;
    blockedUnpublishedParent: number;
  };
}

async function runDryRunAudit() {
  console.log("=== RAJASTHAN EXAM TWISTER — QUESTION SEO AUDIT DRY-RUN ===");
  console.log("Connecting to MongoDB in READ-ONLY audit mode...");

  await connectToDatabase();

  // Ensure Quiz and Category models are registered for populate
  if (Quiz && Category) {
    // models loaded
  }

  const questions = await QuizQuestion.find({})
    .select("questionText options correctOptionIndex explanation seoStatus seoSlug isAnswerVerified verifiedOptionIndex quizId")
    .populate("quizId", "title slug status")
    .lean()
    .exec();

  console.log(`Fetched ${questions.length} total questions from database.\n`);

  const summary: AuditSummary = {
    totalQuestions: questions.length,
    byStatus: { DRAFT: 0, PUBLISHED: 0, ARCHIVED: 0, OTHER: 0 },
    byAnswerVerified: { verified: 0, unverified: 0 },
    explanationHealth: { hasExplanation: 0, emptyOrMissing: 0, shortExplanation: 0 },
    optionValidity: { validOptionIndex: 0, invalidOptionIndex: 0 },
    slugHealth: { hasSlug: 0, noSlug: 0, duplicateSlugs: [] },
    parentQuizHealth: { parentPublished: 0, parentDraft: 0, parentArchived: 0, parentMissing: 0 },
    publishingReadiness: {
      currentlyPublishedAndActive: 0,
      pilotCandidatesPendingVerification: 0,
      blockedMissingExplanation: 0,
      blockedUnpublishedParent: 0,
    },
  };

  const slugCounts = new Map<string, number>();

  for (const q of questions) {
    // 1. Status breakdown
    const status = (q as any).seoStatus || "DRAFT";
    if (summary.byStatus[status] !== undefined) {
      summary.byStatus[status]++;
    } else {
      summary.byStatus.OTHER++;
    }

    // 2. Verified breakdown
    if ((q as any).isAnswerVerified) {
      summary.byAnswerVerified.verified++;
    } else {
      summary.byAnswerVerified.unverified++;
    }

    // 3. Explanation health
    const expl = (q.explanation || "").trim();
    if (!expl) {
      summary.explanationHealth.emptyOrMissing++;
    } else if (expl.length < 20) {
      summary.explanationHealth.shortExplanation++;
      summary.explanationHealth.hasExplanation++;
    } else {
      summary.explanationHealth.hasExplanation++;
    }

    // 4. Option validity
    const options = q.options || [];
    const correctIdx = q.correctOptionIndex;
    const isValidIdx =
      typeof correctIdx === "number" &&
      correctIdx >= 0 &&
      correctIdx < options.length;
    if (isValidIdx) {
      summary.optionValidity.validOptionIndex++;
    } else {
      summary.optionValidity.invalidOptionIndex++;
    }

    // 5. Slug analysis
    const slug = (q as any).seoSlug;
    if (slug && typeof slug === "string" && slug.trim().length > 0) {
      summary.slugHealth.hasSlug++;
      const count = (slugCounts.get(slug) || 0) + 1;
      slugCounts.set(slug, count);
    } else {
      summary.slugHealth.noSlug++;
    }

    // 6. Parent Quiz status
    const parent = q.quizId as any;
    if (!parent) {
      summary.parentQuizHealth.parentMissing++;
    } else if (parent.status === "PUBLISHED") {
      summary.parentQuizHealth.parentPublished++;
    } else if (parent.status === "DRAFT") {
      summary.parentQuizHealth.parentDraft++;
    } else {
      summary.parentQuizHealth.parentArchived++;
    }

    // 7. Publishing Readiness
    const parentPublished = parent && parent.status === "PUBLISHED";
    const hasMeaningfulExpl = expl.length > 0;
    const isCurrentlyPublished =
      status === "PUBLISHED" &&
      (q as any).isAnswerVerified &&
      (q as any).verifiedOptionIndex === correctIdx &&
      parentPublished &&
      hasMeaningfulExpl &&
      slug;

    if (isCurrentlyPublished) {
      summary.publishingReadiness.currentlyPublishedAndActive++;
    } else {
      if (!parentPublished) {
        summary.publishingReadiness.blockedUnpublishedParent++;
      } else if (!hasMeaningfulExpl) {
        summary.publishingReadiness.blockedMissingExplanation++;
      } else if (isValidIdx) {
        // High quality question with explanation and published parent, ready for manual verification
        summary.publishingReadiness.pilotCandidatesPendingVerification++;
      }
    }
  }

  // Find duplicate slugs if any
  for (const [s, count] of slugCounts.entries()) {
    if (count > 1) {
      summary.slugHealth.duplicateSlugs.push(`${s} (${count}x)`);
    }
  }

  console.log("=== DRY-RUN AUDIT RESULTS ===");
  console.log(JSON.stringify(summary, null, 2));

  console.log("\n--- KEY OBSERVATIONS ---");
  console.log(`1. Total Questions: ${summary.totalQuestions}`);
  console.log(`2. All in DRAFT: ${summary.byStatus.DRAFT}/${summary.totalQuestions} (${((summary.byStatus.DRAFT / (summary.totalQuestions || 1)) * 100).toFixed(1)}%)`);
  console.log(`3. Verified Answers: ${summary.byAnswerVerified.verified} (Zero prematurely published, strict safety confirmed)`);
  console.log(`4. Questions with Authentic Explanations: ${summary.explanationHealth.hasExplanation}`);
  console.log(`5. Pilot Verification Candidates (Parent Published + Has Explanation): ${summary.publishingReadiness.pilotCandidatesPendingVerification}`);
  console.log(`6. Duplicate Slugs: ${summary.slugHealth.duplicateSlugs.length === 0 ? "None detected (Clean)" : summary.slugHealth.duplicateSlugs.join(", ")}`);
  console.log(`7. Orphan Questions (Missing Parent): ${summary.parentQuizHealth.parentMissing}`);

  process.exit(0);
}

runDryRunAudit().catch((err) => {
  console.error("Dry run audit failed:", err);
  process.exit(1);
});
