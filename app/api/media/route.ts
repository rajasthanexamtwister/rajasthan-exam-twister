import { NextRequest, NextResponse } from "next/server";
import { MediaService } from "@/server/services/media-service";
import { MediaRepository } from "@/server/repositories/media";
import { getSessionFromRequest } from "@/server/lib/token";
import { errorResponse } from "@/server/lib/api-response";
import { checkRateLimit, getClientIp } from "@/server/lib/rate-limit";

export const dynamic = "force-dynamic";

// GET /api/media - List media (Admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Unauthorized: Admin session required", 401);
    }

    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1", 10) || 1;
    const pageSize = parseInt(searchParams.get("pageSize") || "24", 10) || 24;
    const search = searchParams.get("q") || searchParams.get("search") || undefined;
    const mimeType = searchParams.get("mimeType") || undefined;

    const result = await MediaService.listMedia({
      search,
      mimeType,
      page,
      pageSize,
    });
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("List media API error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to list media", 500);
  }
}

// POST /api/media - Multipart upload (Admin only)
export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(clientIp, {
      windowMs: 15 * 60 * 1000,
      max: 40,
      keyPrefix: "media-upload",
    });

    if (!rateLimit.success) {
      return errorResponse(
        "RATE_LIMITED",
        "Upload rate limit exceeded. Please wait a few minutes before uploading more files.",
        429
      );
    }

    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Unauthorized: Admin session required", 401);
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const altText = (formData.get("altText") as string) || undefined;
    const caption = (formData.get("caption") as string) || undefined;

    if (!file) {
      return errorResponse("VALIDATION_ERROR", "No file uploaded in 'file' field", 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await MediaService.uploadFile(
      buffer,
      file.name,
      file.type,
      altText,
      caption
    );

    if (!result.success || !result.media) {
      return errorResponse("VALIDATION_ERROR", result.error || "File upload failed", 400);
    }

    return NextResponse.json({ media: result.media }, { status: 201 });
  } catch (err) {
    console.error("Upload media API error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to process upload", 500);
  }
}
