import { NextRequest, NextResponse } from "next/server";
import { ImportService, UploadedHtmlFile, UploadedLooseImage } from "@/server/services/import-service";
import { getSessionFromRequest } from "@/server/lib/token";
import { errorResponse } from "@/server/lib/api-response";
import { checkRateLimit, getClientIp } from "@/server/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(clientIp, {
      windowMs: 15 * 60 * 1000,
      max: 15,
      keyPrefix: "import-html",
    });

    if (!rateLimit.success) {
      return errorResponse(
        "RATE_LIMITED",
        "Too many import batch requests. Please wait a few minutes before trying again.",
        429
      );
    }

    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Unauthorized: Admin session required", 401);
    }

    const { searchParams } = request.nextUrl;
    const dryRunParam = searchParams.get("dryRun");
    const isDryRun = dryRunParam === "true" || dryRunParam === "1";

    const formData = await request.formData();
    const htmlFiles: UploadedHtmlFile[] = [];
    const looseImages: UploadedLooseImage[] = [];

    // Parse all files from formData
    const entries = Array.from(formData.entries());

    for (const [key, value] of entries) {
      if (value instanceof File) {
        const fileName = value.name;
        const lowerName = fileName.toLowerCase();

        if (lowerName.endsWith(".html") || lowerName.endsWith(".htm")) {
          const text = await value.text();
          htmlFiles.push({
            name: fileName,
            content: text,
          });
        } else if (
          lowerName.endsWith(".jpg") ||
          lowerName.endsWith(".jpeg") ||
          lowerName.endsWith(".png") ||
          lowerName.endsWith(".webp")
        ) {
          const arrayBuffer = await value.arrayBuffer();
          looseImages.push({
            name: fileName,
            buffer: Buffer.from(arrayBuffer),
            mimeType: value.type,
          });
        }
      }
    }

    if (htmlFiles.length === 0) {
      return errorResponse(
        "VALIDATION_ERROR",
        "No .html files found in upload payload. Please attach at least one HTML file.",
        400
      );
    }

    const summary = await ImportService.processBatch(htmlFiles, looseImages, {
      dryRun: isDryRun,
    });

    return NextResponse.json(summary, { status: 200 });
  } catch (err) {
    console.error("HTML Import API error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to process HTML import batch", 500);
  }
}
