// ============================================================
// test-deep-search.ts — Simple test for Deep Search Engine
// ============================================================

import {
  createSearchJob,
  getJobStatus,
  getJobResult,
} from "./src/services/deepSearchEngine.js";
import {
  initializeSearchQueue,
  createSearchWorker,
} from "./src/services/deepSearchEngine.js";

async function testDeepSearch() {
  console.log("🧪 Testing Deep Search Engine...");

  // Initialize
  initializeSearchQueue();
  createSearchWorker();

  // Create a search job
  console.log("📝 Creating search job...");
  const job = await createSearchJob({
    query: "John Doe",
    searchType: "full_name",
    categories: ["social_media", "web_mentions"],
    maxResults: 10,
    deepMode: true,
  });

  console.log("✅ Job created:", job.id);

  // Wait a bit and check status
  console.log("⏳ Waiting for processing...");
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const status = await getJobStatus(job.id);
  console.log("📊 Job status:", status);

  // Wait more and check result
  console.log("⏳ Waiting for completion...");
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const result = await getJobResult(job.id);
  if (result) {
    console.log("🎉 Job completed!");
    console.log("📋 Results:", result.results.length);
    console.log("🤖 AI Summary:", result.aiAnalysis.naturalLanguageSummary);
  } else {
    console.log("❌ Job not completed yet");
  }

  console.log("✅ Test completed");
}

// Run test
testDeepSearch().catch(console.error);
