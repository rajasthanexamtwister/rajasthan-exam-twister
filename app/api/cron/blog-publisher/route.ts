import { NextRequest, NextResponse } from "next/server";
import { BlogAutomationScheduler } from "@/server/services/blog-automation/scheduler";
import { errorResponse } from "@/server/lib/api-response";

export const dynamic = "force-dynamic";

function verifyCronAuth(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    // If no secret configured in local dev, allow
    return process.env.NODE_ENV !== "production";
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;

  const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
  return token === cronSecret;
}

// GET & POST /api/cron/blog-publisher - Scheduled Blog Publisher Cron Worker
export async function GET(request: NextRequest) {
  return handlePublisherCron(request);
}

export async function POST(request: NextRequest) {
  return handlePublisherCron(request);
}

async function handlePublisherCron(request: NextRequest) {
  try {
    if (!verifyCronAuth(request)) {
      return errorResponse("UNAUTHORIZED", "Unauthorized: Valid CRON_SECRET required", 401);
    }

    const report = await BlogAutomationScheduler.runPublisherCron();
    return NextResponse.json(report, { status: 200 });
  } catch (err: any) {
    console.error("Publisher Cron Error:", err);
    return errorResponse("INTERNAL_ERROR", "Publisher cron execution failed", 500);
  }
}
