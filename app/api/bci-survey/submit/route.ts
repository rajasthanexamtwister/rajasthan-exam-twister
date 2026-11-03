import { NextRequest, NextResponse } from "next/server";
import { submitSurvey, SurveySubmitInput } from "@/server/services/bci-survey-service";
import { errorResponse, successResponse } from "@/server/lib/api-response";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      area,
      category,
      gender,
      paper1Marks,
      paper2Marks,
      marksSource,
      district,
      shift,
      candidateName,
      mobile,
      rollNumber,
      consent,
    } = body;

    // 1. Mandatory Identity Validations to prevent fake / spam entries
    const cleanName = candidateName?.trim();
    if (!cleanName || cleanName.length < 3) {
      return errorResponse(
        "VALIDATION_ERROR",
        "कृपया अपना पूरा नाम दर्ज करें (कम से कम 3 अक्षर)।",
        400
      );
    }

    const cleanRoll = rollNumber?.trim();
    if (!cleanRoll || !/^\d{6,8}$/.test(cleanRoll)) {
      return errorResponse(
        "VALIDATION_ERROR",
        "कृपया अपना मान्य 6 से 8 अंकों का रोल नंबर दर्ज करें।",
        400
      );
    }

    const cleanMobile = mobile?.replace(/\D/g, "");
    if (!cleanMobile || !/^[6-9]\d{9}$/.test(cleanMobile)) {
      return errorResponse(
        "VALIDATION_ERROR",
        "कृपया अपना मान्य 10 अंकों का मोबाइल नंबर दर्ज करें।",
        400
      );
    }

    const cleanDistrict = district?.trim();
    if (!cleanDistrict) {
      return errorResponse(
        "VALIDATION_ERROR",
        "कृपया अपना गृह जिला अवश्य चुनें।",
        400
      );
    }

    // 2. Exam fields
    if (!["TSP", "Non-TSP"].includes(area)) {
      return errorResponse("VALIDATION_ERROR", "Invalid area. Must be TSP or Non-TSP", 400);
    }

    if (!["UR", "EWS", "OBC", "MBC", "SC", "ST"].includes(category)) {
      return errorResponse("VALIDATION_ERROR", "Invalid category", 400);
    }

    if (!["Male", "Female", "Other"].includes(gender)) {
      return errorResponse("VALIDATION_ERROR", "Invalid gender", 400);
    }

    // 3. Marks validation
    const p1 = Number(paper1Marks);
    const p2 = Number(paper2Marks);

    if (isNaN(p1) || p1 < 0 || p1 > 100) {
      return errorResponse("VALIDATION_ERROR", "Paper-I marks must be between 0 and 100", 400);
    }

    if (isNaN(p2) || p2 < 0 || p2 > 100) {
      return errorResponse("VALIDATION_ERROR", "Paper-II marks must be between 0 and 100", 400);
    }

    if (!consent) {
      return errorResponse("VALIDATION_ERROR", "Consent is required to submit survey", 400);
    }

    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const input: SurveySubmitInput = {
      area,
      category,
      gender,
      paper1Marks: Math.round(p1 * 100) / 100,
      paper2Marks: Math.round(p2 * 100) / 100,
      marksSource: marksSource || "official_provisional_key",
      district: cleanDistrict,
      shift: shift?.trim() || undefined,
      candidateName: cleanName,
      mobile: cleanMobile,
      rollNumber: cleanRoll,
      consent: Boolean(consent),
    };

    const result = await submitSurvey(input, clientIp);
    return successResponse(result, 201);
  } catch (error: any) {
    console.error("Error submitting BCI survey:", error);
    const status = error.message?.includes("पहले ही") ? 409 : 500;
    return errorResponse(
      status === 409 ? "CONFLICT" : "INTERNAL_ERROR",
      error.message || "Failed to submit survey",
      status
    );
  }
}
