import { connectToDatabase } from "../server/lib/mongodb";
import { BlogAutomationRepository } from "../server/repositories/blog-automation";
import { BlogAutomationService } from "../server/services/blog-automation/service";

async function main() {
  const jobId = process.argv[2];
  if (!jobId) {
    console.error("Usage: tsx scripts/automation-retry.ts <JOB_ID>");
    process.exit(1);
  }

  console.log(`🔄 Retrying Automation Job: ${jobId}...`);
  await connectToDatabase();

  const result = await BlogAutomationService.updateQueueItem(
    jobId,
    { action: "RETRY" },
    "CLI_Admin"
  );

  if (result.success) {
    console.log("✅ Job reset to DRAFT_CREATED and UNSCHEDULED ready for reprocessing.");
  } else {
    console.error(`❌ Retry failed: ${result.error}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Retry error:", err);
  process.exit(1);
});
