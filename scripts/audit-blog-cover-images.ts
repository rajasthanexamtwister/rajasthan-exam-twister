import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { connectToDatabase } from "../server/lib/mongodb";
import { Blog } from "../server/models/Blog";
import "../server/models/Media";

async function main() {
  await connectToDatabase();
  const blogs = await Blog.find({}, "title slug coverImageId status").populate("coverImageId", "url").lean();
  console.log(`Found ${blogs.length} total blogs in database:\n`);
  for (const b of blogs) {
    const cover = b.coverImageId as unknown as { url?: string } | undefined;
    console.log(`- [${b.status}] ${b.title}`);
    console.log(`  Slug: /blogs/${b.slug}`);
    console.log(`  Cover: ${cover?.url || "NONE (MISSING)"}\n`);
  }
  process.exit(0);
}

main().catch(err => {
  console.error("Error inspecting blogs:", err);
  process.exit(1);
});
