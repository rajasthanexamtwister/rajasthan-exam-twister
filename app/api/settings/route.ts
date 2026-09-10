import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Settings } from "@/server/models/Settings";
import { getSessionFromRequest } from "@/server/lib/token";
import { errorResponse } from "@/server/lib/api-response";
import { SOCIAL_LINKS } from "@/server/lib/social-links";
import { z } from "zod";

export const dynamic = "force-dynamic";

const UpdateSettingsSchema = z.object({
  siteTitle: z.string().min(1, "Site title is required").max(100),
  siteTagline: z.string().max(200).optional(),
  contactEmail: z.string().email("Invalid email format").optional().or(z.literal("")),
});

// GET /api/settings - Retrieve singleton site settings
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    let settings = await Settings.findById("singleton").lean();

    if (!settings) {
      await Settings.create({
        _id: "singleton",
        siteTitle: "Rajasthan Exam Twister",
        siteTagline: "Rajasthan Competitive Exam Preparation & Master Revision Hub",
        contactEmail: "admin@rajasthanexamtwister.com",
      });
      settings = await Settings.findById("singleton").lean();
    }

    return NextResponse.json({
      settings,
      socialLinks: SOCIAL_LINKS,
    });
  } catch (err) {
    console.error("Fetch settings error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to load settings", 500);
  }
}

// PUT /api/settings - Update site settings (Admin only)
export async function PUT(request: NextRequest) {
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

    const validation = UpdateSettingsSchema.safeParse(body);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        fieldErrors[issue.path.join(".")] = issue.message;
      }
      return errorResponse("VALIDATION_ERROR", "Validation failed", 400, fieldErrors);
    }

    await connectToDatabase();
    const updated = await Settings.findByIdAndUpdate(
      "singleton",
      {
        $set: {
          siteTitle: validation.data.siteTitle,
          siteTagline: validation.data.siteTagline || "",
          contactEmail: validation.data.contactEmail || "",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({
      message: "Settings updated successfully",
      settings: updated,
    });
  } catch (err) {
    console.error("Update settings error:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to update settings", 500);
  }
}
