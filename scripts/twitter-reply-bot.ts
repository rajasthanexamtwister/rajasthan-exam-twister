import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { chromium } from "playwright";

const AUTH_TOKEN = process.env.TWITTER_AUTH_TOKEN || "d3a1ac5b5d60ceb521d8f8bee72d555ab5091d9d";

export interface ReplyOptions {
  tweetUrl: string;
  replyText: string;
}

export async function replyToTweet(options: ReplyOptions) {
  const { tweetUrl, replyText } = options;
  console.log(`\n🚀 Launching Browser for Twitter Automation...`);
  console.log(`🎯 Target Tweet: ${tweetUrl}`);
  console.log(`💬 Reply Text: "${replyText}"`);

  const browser = await chromium.launch({
    headless: true, // run in background
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
  });

  // Set the authentication cookie
  await context.addCookies([
    {
      name: "auth_token",
      value: AUTH_TOKEN,
      domain: ".x.com",
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "None",
    },
  ]);

  const page = await context.newPage();

  try {
    console.log("Navigating to target tweet...");
    await page.goto(tweetUrl, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Wait a little for dynamic hydration
    await page.waitForTimeout(4000);

    // Check if logged in by looking for reply composer or account profile elements
    const isLoginRequired = await page.$('a[href="/login"]');
    if (isLoginRequired) {
      console.error("❌ Session check failed: Cookie might be expired or restricted.");
      await browser.close();
      return { success: false, error: "Authentication failed. Please verify auth_token." };
    }

    console.log("✅ Authenticated successfully! Finding reply composer...");

    // Find the reply box (draft editor)
    const replyEditor =
      (await page.$('[data-testid="tweetTextarea_0"]')) ||
      (await page.$('div[role="textbox"][data-testid^="tweetTextarea"]')) ||
      (await page.$('div[aria-label="Post text"]'));

    if (!replyEditor) {
      // Try clicking placeholder first if inline editor needs focus
      const placeholder = await page.$('div[data-testid="tweetTextarea_0_placeholder"]');
      if (placeholder) {
        await placeholder.click();
        await page.waitForTimeout(1000);
      }
    }

    const editorToType =
      replyEditor || (await page.$('div[role="textbox"][data-testid^="tweetTextarea"]'));

    if (!editorToType) {
      console.warn("Could not find reply textarea directly. Taking screenshot for diagnosis...");
      await page.screenshot({ path: "twitter_debug.png" });
      await browser.close();
      return { success: false, error: "Reply textarea not found on page." };
    }

    await editorToType.click();
    await page.waitForTimeout(500);

    // Type the reply text smoothly
    await editorToType.fill(replyText);
    await page.waitForTimeout(1500);

    console.log("Text typed. Locating Reply button...");
    const replyButton =
      (await page.$('[data-testid="tweetButtonInline"]')) ||
      (await page.$('[data-testid="tweetButton"]'));

    if (!replyButton) {
      console.error("❌ Reply button not found.");
      await page.screenshot({ path: "twitter_debug.png" });
      await browser.close();
      return { success: false, error: "Reply button not found." };
    }

    // Click Reply
    await replyButton.click();
    console.log("Sent click to Reply button! Waiting for confirmation...");
    await page.waitForTimeout(4000);

    console.log("🎉 Successfully posted reply on Twitter/X!");
    await browser.close();
    return { success: true };
  } catch (err: any) {
    console.error("Error during Twitter automation:", err.message);
    try {
      await page.screenshot({ path: "twitter_error.png" });
    } catch {}
    await browser.close();
    return { success: false, error: err.message };
  }
}

// Verification function to test auth_token validity
export async function testTwitterAuth() {
  console.log("Testing Twitter authentication with auth_token...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  await context.addCookies([
    {
      name: "auth_token",
      value: AUTH_TOKEN,
      domain: ".x.com",
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "None",
    },
  ]);

  const page = await context.newPage();
  await page.goto("https://x.com/home", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(5000);

  const url = page.url();
  console.log(`Current page URL: ${url}`);

  const isLoggedIn = !url.includes("/login") && !url.includes("/i/flow/login");
  if (isLoggedIn) {
    console.log("🎉 SUCCESS: Twitter auth_token is VALID and working!");
  } else {
    console.log("⚠️ WARNING: Redirected to login page. Cookie might need refresh.");
  }

  await browser.close();
  return isLoggedIn;
}

// CLI runner
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || "test";

  if (command === "test") {
    testTwitterAuth().then((ok) => {
      process.exit(ok ? 0 : 1);
    });
  } else if (command === "reply") {
    const tweetUrl = args[1];
    const replyText = args.slice(2).join(" ");

    if (!tweetUrl || !replyText) {
      console.error("Usage: npx tsx scripts/twitter-reply-bot.ts reply <tweetUrl> <replyText>");
      process.exit(1);
    }

    replyToTweet({ tweetUrl, replyText }).then((res) => {
      process.exit(res.success ? 0 : 1);
    });
  }
}
