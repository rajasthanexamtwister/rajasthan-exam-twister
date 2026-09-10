import { NextRequest, NextResponse } from "next/server";
import { SearchService } from "@/server/services/search-service";
import { errorResponse } from "@/server/lib/api-response";
import { z } from "zod";

export const dynamic = "force-dynamic";

const SearchParamsSchema = z.object({
  q: z.string().trim().min(1, "Search query is required and cannot be empty").max(200, "Query too long"),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const q = searchParams.get("q") || "";
    const page = searchParams.get("page") || "1";
    const pageSize = searchParams.get("pageSize") || "20";

    const validation = SearchParamsSchema.safeParse({ q, page, pageSize });
    if (!validation.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        validation.error.errors[0]?.message || "Invalid search query",
        400
      );
    }

    const results = await SearchService.search(validation.data.q, {
      page: validation.data.page,
      pageSize: validation.data.pageSize,
    });

    return NextResponse.json(results, { status: 200 });
  } catch (err) {
    console.error("Public search API error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to perform search", 500);
  }
}
