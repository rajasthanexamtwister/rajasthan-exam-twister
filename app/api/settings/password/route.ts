import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Admin } from "@/server/models/Admin";
import { getSessionFromRequest } from "@/server/lib/token";
import { hashPassword, verifyPassword } from "@/server/lib/auth";
import { errorResponse } from "@/server/lib/api-response";
import { z } from "zod";

export const dynamic = "force-dynamic";

const PasswordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Admin session required", 401);
    }

    const customHeader = request.headers.get("x-requested-with");
    if (!customHeader || (customHeader !== "ret-admin" && customHeader !== "XMLHttpRequest")) {
      return errorResponse("FORBIDDEN", "CSRF custom header validation failed", 403);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse("VALIDATION_ERROR", "Invalid JSON payload", 400);
    }

    const validation = PasswordChangeSchema.safeParse(body);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        fieldErrors[issue.path.join(".")] = issue.message;
      }
      return errorResponse("VALIDATION_ERROR", "Validation failed", 400, fieldErrors);
    }

    await connectToDatabase();
    const admin = await Admin.findById(session.adminId);
    if (!admin) {
      return errorResponse("NOT_FOUND", "Admin record not found", 404);
    }

    const isMatch = await verifyPassword(validation.data.currentPassword, admin.passwordHash);
    if (!isMatch) {
      return errorResponse("VALIDATION_ERROR", "Current password is incorrect", 400, {
        currentPassword: "Incorrect password",
      });
    }

    const newHash = await hashPassword(validation.data.newPassword);
    admin.passwordHash = newHash;
    await admin.save();

    return NextResponse.json({ message: "Admin password changed successfully" }, { status: 200 });
  } catch (err) {
    console.error("Change password error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to change password", 500);
  }
}
