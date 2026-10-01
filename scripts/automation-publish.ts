import { connectToDatabase } from "../server/lib/mongodb";
import { BlogAutomationScheduler } from "../server/services/blog-automation/scheduler";

async function main() {
  console.log("⏰ Running Blog Automation Publisher Cron Worker...");
  await connectToDatabase();

  const result = await BlogAutomationScheduler.runPublisherCron();

  console.log("\n📊 Publisher Execution Report:");
  console.log(`- Executed At: ${result.executedAt.toISOString()}`);
  console.log(`- Scanned Due Items: ${result.scannedCount}`);
  console.log(`- Successfully Published: ${result.publishedCount}`);
  console.log(`- Placed On Hold (Safeguards): ${result.heldCount}`);
  console.log(`- Failed: ${result.failedCount}`);

  if (result.details.length > 0) {
    console.log("\nDetails:");
    result.details.forEach((d, i) => {
      console.log(`${i + 1}. [${d.status}] ${d.topic}`);
      if (d.reasons) console.log(`   Reasons: ${d.reasons.join("; ")}`);
    });
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Publisher cron error:", err);
  process.exit(1);
});
