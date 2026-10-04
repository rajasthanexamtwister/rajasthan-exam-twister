import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/lib/auth-options";
import { Student } from "@/server/models/Student";
import { connectToDatabase } from "@/server/lib/mongodb";
import { errorResponse } from "@/server/lib/api-response";
import { z } from "zod";

export const dynamic = "force-dynamic";

const UpdateProfileSchema = z.object({
  mobileNumber: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number")
    .optional()
    .nullable(),
  targetExam: z.string().trim().max(100).optional().nullable(),
});

// GET /api/student/profile - Fetch student profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return errorResponse("UNAUTHORIZED", "Sign in required to view profile", 401);
    }

    await connectToDatabase();
    const student = await Student.findOne({ email: session.user.email.toLowerCase() }).lean();
    if (!student) {
      return errorResponse("NOT_FOUND", "Student profile not found", 404);
    }

    return NextResponse.json({
      success: true,
      student: {
        id: student._id.toString(),
        name: student.name,
        email: student.email,
        avatarUrl: student.avatarUrl,
        mobileNumber: student.mobileNumber || "",
        targetExam: student.targetExam || "",
        createdAt: student.createdAt,
      },
    });
  } catch (err: any) {
    console.error("Fetch student profile error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to fetch student profile", 500);
  }
}

// PATCH /api/student/profile - Update mobile number or target exam
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return errorResponse("UNAUTHORIZED", "Sign in required to update profile", 401);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse("VALIDATION_ERROR", "Invalid JSON payload", 400);
    }

    const validation = UpdateProfileSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Invalid input parameters";
      return errorResponse("VALIDATION_ERROR", firstError, 400);
    }

    await connectToDatabase();
    const { mobileNumber, targetExam } = validation.data;

    const updateData: Record<string, any> = {};
    if (mobileNumber !== undefined) updateData.mobileNumber = mobileNumber;
    if (targetExam !== undefined) updateData.targetExam = targetExam;

    const updatedStudent = await Student.findOneAndUpdate(
      { email: session.user.email.toLowerCase() },
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedStudent) {
      return errorResponse("NOT_FOUND", "Student account not found", 404);
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      student: {
        id: updatedStudent._id.toString(),
        name: updatedStudent.name,
        email: updatedStudent.email,
        avatarUrl: updatedStudent.avatarUrl,
        mobileNumber: updatedStudent.mobileNumber || "",
        targetExam: updatedStudent.targetExam || "",
      },
    });
  } catch (err: any) {
    console.error("Update student profile error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to update profile", 500);
  }
}
