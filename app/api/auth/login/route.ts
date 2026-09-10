import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Admin } from "@/server/models/Admin";
import { verifyPassword } from "@/server/lib/auth";
import { signAdminToken, AUTH_COOKIE_OPTIONS } from "@/server/lib/token";
import { LoginSchema } from "@/server/validation/auth";
import { errorResponse } from "@/server/lib/api-response";
import { checkRateLimit, getClientIp } from "@/server/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(clientIp, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5,                   // 5 login attempts
      keyPrefix: "login",
    });

    if (!rateLimit.success) {
      const retryAfterSeconds = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
      return new NextResponse(
        JSON.stringify({
          error: {
            code: "RATE_LIMITED",
            message: `Too many login attempts. Please try again in ${Math.ceil(retryAfterSeconds / 60)} minute(s).`,
          },
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": retryAfterSeconds.toString(),
          },
        }
      );
    }
    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse("VALIDATION_ERROR", "Invalid JSON payload", 400);
    }

    const validation = LoginSchema.safeParse(body);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const fieldName = issue.path.join(".");
        fieldErrors[fieldName] = issue.message;
      }
      return errorResponse("VALIDATION_ERROR", "Validation failed", 400, fieldErrors);
    }

    const { email, password } = validation.data;

    await connectToDatabase();

    const admin = await Admin.findOne({ email: email.toLowerCase() });

    if (!admin) {
      return errorResponse("UNAUTHORIZED", "Invalid email or password", 401);
    }

    const isMatch = await verifyPassword(password, admin.passwordHash);
    if (!isMatch) {
      return errorResponse("UNAUTHORIZED", "Invalid email or password", 401);
    }

    const token = await signAdminToken({
      adminId: admin._id.toString(),
      email: admin.email,
    });

    const response = NextResponse.json(
      {
        message: "Logged in successfully",
        admin: {
          id: admin._id.toString(),
          email: admin.email,
          name: admin.name,
        },
      },
      { status: 200 }
    );

    response.cookies.set({
      ...AUTH_COOKIE_OPTIONS,
      value: token,
    });

    return response;
  } catch (err) {
    console.error("Login error:", err);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred during login", 500);
  }
}
