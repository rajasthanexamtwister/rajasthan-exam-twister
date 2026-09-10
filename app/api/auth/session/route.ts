import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/server/lib/token";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Admin } from "@/server/models/Admin";
import { errorResponse } from "@/server/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Unauthorized: Valid session required", 401);
    }

    await connectToDatabase();

    const admin = await Admin.findById(session.adminId).select("email name createdAt");

    if (!admin) {
      return errorResponse("UNAUTHORIZED", "Admin user no longer exists", 401);
    }

    return NextResponse.json(
      {
        admin: {
          id: admin._id.toString(),
          email: admin.email,
          name: admin.name,
          createdAt: admin.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Session check error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to retrieve session", 500);
  }
}
