import { connectToDatabase } from "../server/lib/mongodb";
import { BlogAutomationService } from "../server/services/blog-automation/service";

async function main() {
  console.log("🔍 Scanning and discovering topics from AI engine / syllabus...");
  await connectToDatabase();

  const topics = await BlogAutomationService.discoverTopics({ count: 10 });

  console.log(`\nFound ${topics.length} Candidate Topics:\n`);
  topics.forEach((t, i) => {
    console.log(`${i + 1}. [${t.articleType}] ${t.topic}`);
    console.log(`   Category: ${t.category} | Relevance: ${t.relevanceScore}% | Recommendation: ${t.recommendation}`);
    if (t.reason) console.log(`   Note: ${t.reason}`);
    console.log("");
  });

  process.exit(0);
}

main().catch((err) => {
  console.error("Discovery error:", err);
  process.exit(1);
});
