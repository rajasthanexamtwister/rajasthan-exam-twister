import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/lib/auth-options";
import { NotebookService } from "@/server/services/notebook-service";
import { errorResponse } from "@/server/lib/api-response";
import { checkRateLimit, getClientIp } from "@/server/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(clientIp, {
      windowMs: 60 * 1000,
      max: 60,
      keyPrefix: "student-bookmarks-get",
    });

    if (!rateLimit.success) {
      return errorResponse("RATE_LIMITED", "Too many requests. Please slow down.", 429);
    }

    const session = await getServerSession(authOptions);
    const studentId = (session?.user as any)?.id;

    if (!session?.user || !studentId) {
      return errorResponse(
        "UNAUTHORIZED",
        "Student authentication required to view bookmarks",
        401
      );
    }

    const bookmarks = await NotebookService.getStudentBookmarks(studentId);

    return NextResponse.json({
      success: true,
      bookmarks,
      totalCount: bookmarks.length,
      studentId,
    });
  } catch (err) {
    console.error("Student bookmarks fetch error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to retrieve bookmarks", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(clientIp, {
      windowMs: 60 * 1000,
      max: 60,
      keyPrefix: "student-bookmarks-post",
    });

    if (!rateLimit.success) {
      return errorResponse("RATE_LIMITED", "Too many requests. Please slow down.", 429);
    }

    const session = await getServerSession(authOptions);
    const studentId = (session?.user as any)?.id;

    if (!session?.user || !studentId) {
      return errorResponse(
        "UNAUTHORIZED",
        "Student authentication required to add bookmark",
        401
      );
    }

    const body = await request.json();
    const { questionId } = body || {};

    if (!questionId || typeof questionId !== "string") {
      return errorResponse("VALIDATION_ERROR", "A valid questionId is required", 400);
    }

    const success = await NotebookService.addBookmark(studentId, questionId);

    return NextResponse.json({
      success,
      message: "Question bookmarked successfully",
      questionId,
    });
  } catch (err) {
    console.error("Student add bookmark error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to add bookmark", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(clientIp, {
      windowMs: 60 * 1000,
      max: 60,
      keyPrefix: "student-bookmarks-del",
    });

    if (!rateLimit.success) {
      return errorResponse("RATE_LIMITED", "Too many requests. Please slow down.", 429);
    }

    const session = await getServerSession(authOptions);
    const studentId = (session?.user as any)?.id;

    if (!session?.user || !studentId) {
      return errorResponse(
        "UNAUTHORIZED",
        "Student authentication required to remove bookmark",
        401
      );
    }

    const { searchParams } = request.nextUrl;
    let questionId = searchParams.get("questionId");

    if (!questionId) {
      try {
        const body = await request.json();
        questionId = body?.questionId;
      } catch {
        // body might be empty if supplied via query
      }
    }

    if (!questionId || typeof questionId !== "string") {
      return errorResponse("VALIDATION_ERROR", "A valid questionId is required", 400);
    }

    const success = await NotebookService.removeBookmark(studentId, questionId);

    return NextResponse.json({
      success,
      message: success ? "Bookmark removed successfully" : "Bookmark not found",
      questionId,
    });
  } catch (err) {
    console.error("Student remove bookmark error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to remove bookmark", 500);
  }
}
