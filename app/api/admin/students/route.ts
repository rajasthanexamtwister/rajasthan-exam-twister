import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Student } from "@/server/models/Student";
import { QuizAttempt } from "@/server/models/QuizAttempt";
import { getSessionFromRequest } from "@/server/lib/token";
import { errorResponse } from "@/server/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Admin access required", 401);
    }

    await connectToDatabase();

    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.min(100, parseInt(searchParams.get("pageSize") || "50"));

    const filter: Record<string, any> = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [students, total] = await Promise.all([
      Student.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Student.countDocuments(filter),
    ]);

    // Get attempt counts for each student
    const studentIds = students.map((s) => s._id);
    const attemptCounts = await QuizAttempt.aggregate([
      { $match: { studentId: { $in: studentIds } } },
      { $group: { _id: "$studentId", count: { $sum: 1 } } },
    ]);
    const attemptCountMap = Object.fromEntries(
      attemptCounts.map((a) => [a._id.toString(), a.count])
    );

    return NextResponse.json({
      students: students.map((s) => ({
        _id: s._id.toString(),
        name: s.name,
        email: s.email,
        avatarUrl: s.avatarUrl || null,
        googleId: s.googleId,
        createdAt: s.createdAt,
        attemptCount: attemptCountMap[s._id.toString()] || 0,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    console.error("Admin students list error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to fetch students", 500);
  }
}
