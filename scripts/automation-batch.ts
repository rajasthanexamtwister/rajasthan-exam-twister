import { connectToDatabase } from "../server/lib/mongodb";
import { BlogAutomationService } from "../server/services/blog-automation/service";

async function main() {
  const count = parseInt(process.argv[2] || "5", 10);
  const dryRun = process.argv.includes("--dry-run");

  console.log(`🚀 Triggering Batch Generation for ${count} articles (Dry-run: ${dryRun})...`);
  await connectToDatabase();

  const result = await BlogAutomationService.generateBatch({
    count,
    dryRun,
    requestedBy: "CLI",
  });

  console.log("\n📊 Batch Generation Result Summary:");
  console.log(`- Total Requested: ${result.totalRequested}`);
  console.log(`- Generated Successfully: ${result.generatedCount}`);
  console.log(`- Failed: ${result.failedCount}`);

  result.results.forEach((r, i) => {
    console.log(`\n${i + 1}. Topic: ${r.topic}`);
    console.log(`   Success: ${r.success} | QA Score: ${r.qaScore || "N/A"} | Job ID: ${r.jobId || "N/A"}`);
    if (r.error) console.log(`   Error: [${r.errorCode}] ${r.error}`);
  });

  process.exit(0);
}

main().catch((err) => {
  console.error("Batch generation error:", err);
  process.exit(1);
});
