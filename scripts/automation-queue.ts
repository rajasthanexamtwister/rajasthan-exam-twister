import { connectToDatabase } from "../server/lib/mongodb";
import { BlogAutomationService } from "../server/services/blog-automation/service";

async function main() {
  console.log("📋 Fetching Content Queue & Stats...");
  await connectToDatabase();

  const [queueData, stats] = await Promise.all([
    BlogAutomationService.listQueue({ page: 1, limit: 10 }),
    BlogAutomationService.getDashboardStats(),
  ]);

  console.log("\n📊 Dashboard Summary Stats:");
  console.log(`- Generated Today: ${stats.generatedToday}`);
  console.log(`- Drafts in Queue: ${stats.drafts}`);
  console.log(`- QA Passed: ${stats.qaPassed}`);
  console.log(`- Scheduled: ${stats.scheduled}`);
  console.log(`- Awaiting Approval: ${stats.awaitingApproval}`);
  console.log(`- Published: ${stats.published}`);
  console.log(`- Held: ${stats.held}`);

  console.log(`\n📋 Recent Queue Items (${queueData.items.length}/${queueData.total}):\n`);
  queueData.items.forEach((item: any, i: number) => {
    console.log(`${i + 1}. [${item.scheduleStatus}] ${item.topic}`);
    console.log(`   Type: ${item.articleType} | QA: ${item.qaScore}/100 (${item.qaStatus}) | Approved: ${item.adminApproved}`);
    if (item.scheduledAt) console.log(`   Scheduled At: ${new Date(item.scheduledAt).toISOString()}`);
    console.log("");
  });

  process.exit(0);
}

main().catch((err) => {
  console.error("Queue listing error:", err);
  process.exit(1);
});
