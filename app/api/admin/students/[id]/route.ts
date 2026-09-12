import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Student } from "@/server/models/Student";
import { QuizAttempt } from "@/server/models/QuizAttempt";
import { getSessionFromRequest } from "@/server/lib/token";
import { errorResponse } from "@/server/lib/api-response";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Admin access required", 401);
    }

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("VALIDATION_ERROR", "Invalid student ID", 400);
    }

    await connectToDatabase();

    const student = await Student.findById(id);
    if (!student) {
      return errorResponse("NOT_FOUND", "Student not found", 404);
    }

    // Delete the student and all their quiz attempts
    const [, attemptsDeleted] = await Promise.all([
      Student.findByIdAndDelete(id),
      QuizAttempt.deleteMany({ studentId: new mongoose.Types.ObjectId(id) }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Student "${student.name}" deleted along with ${attemptsDeleted.deletedCount} attempt record(s).`,
    });
  } catch (err) {
    console.error("Admin delete student error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to delete student", 500);
  }
}
