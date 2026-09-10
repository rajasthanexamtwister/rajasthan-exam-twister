import "dotenv/config";
import fs from "fs";
import path from "path";
import { connectToDatabase } from "../server/lib/mongodb";
import { ImportService, UploadedHtmlFile } from "../server/services/import-service";

async function main() {
  console.log("Connecting to MongoDB for Notes Import...");
  await connectToDatabase();
  console.log("Connected successfully.");

  const notesDir = path.join(process.cwd(), "notes");
  if (!fs.existsSync(notesDir)) {
    console.error("Notes directory not found at:", notesDir);
    process.exit(1);
  }

  const htmlFiles: UploadedHtmlFile[] = [];

  function collectHtmlFiles(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        collectHtmlFiles(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".html")) {
        const content = fs.readFileSync(fullPath, "utf-8");
        // Skip tiny redirect stubs
        if (content.includes('http-equiv="refresh"') && content.length < 600) {
          console.log(`Skipping redirect stub: ${entry.name}`);
          continue;
        }
        htmlFiles.push({
          name: entry.name,
          content,
        });
      }
    }
  }

  collectHtmlFiles(notesDir);
  console.log(`Found ${htmlFiles.length} legacy HTML note files to import.`);

  if (htmlFiles.length === 0) {
    console.log("No valid HTML files to import.");
    process.exit(0);
  }

  console.log("Processing batch import (creating Drafts)...");
  const summary = await ImportService.processBatch(htmlFiles, [], { dryRun: false });

  console.log("\n--- Import Summary ---");
  console.log(`Job ID: ${summary.jobId}`);
  console.log(`Total Files: ${summary.totalFiles}`);
  console.log(`Successfully Imported (Drafts): ${summary.successCount}`);
  console.log(`Duplicates: ${summary.duplicateCount}`);
  console.log(`Failed: ${summary.failedCount}`);

  if (summary.failedCount > 0) {
    console.log("\nFailed files:");
    summary.results
      .filter((r) => r.result === "FAILED")
      .forEach((r) => console.log(` - ${r.fileName}: ${r.reason}`));
  }
}

main()
  .then(() => {
    console.log("\nLocal notes import completed successfully.");
    process.exit(0);
  })
  .catch((e) => {
    console.error("Error during notes import:", e);
    process.exit(1);
  });
