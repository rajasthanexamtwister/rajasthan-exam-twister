import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/server/lib/token";
import { getActiveConfig } from "@/server/services/bci-survey-service";
import { BciSurveyConfig } from "@/server/models/BciSurveyConfig";
import { errorResponse, successResponse } from "@/server/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Admin authorization required", 401);
    }

    const config = await getActiveConfig();
    return successResponse(config);
  } catch (error: any) {
    console.error("Error retrieving BCI survey config:", error);
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to retrieve config", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Admin authorization required", 401);
    }

    const body = await request.json();
    const current = await getActiveConfig();

    // Mark current inactive and create new version for full audit trail
    current.isActive = false;
    await current.save();

    const newConfig = await BciSurveyConfig.create({
      exam: "BCI_2026",
      version: (current.version || 1) + 1,
      isActive: true,
      vacancies: body.vacancies || current.vacancies,
      backlogEnabled:
        body.backlogEnabled !== undefined
          ? body.backlogEnabled
          : current.backlogEnabled,
      backlogSeats:
        body.backlogSeats !== undefined ? body.backlogSeats : current.backlogSeats,
      coverageFraction:
        body.coverageFraction !== undefined
          ? body.coverageFraction
          : current.coverageFraction,
      qualifyingThresholds:
        body.qualifyingThresholds || current.qualifyingThresholds,
      applicationShares:
        body.applicationShares || current.applicationShares,
      minEffectiveSampleSize:
        body.minEffectiveSampleSize !== undefined
          ? body.minEffectiveSampleSize
          : current.minEffectiveSampleSize,
      bootstrapIterations:
        body.bootstrapIterations !== undefined
          ? body.bootstrapIterations
          : current.bootstrapIterations,
      updatedBy: session.email,
      changeDescription: body.changeDescription || "Config updated via admin portal",
    });

    return successResponse({
      config: newConfig,
      message: `Configuration updated to version ${newConfig.version}`,
    });
  } catch (error: any) {
    console.error("Error updating BCI survey config:", error);
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to update config", 500);
  }
}
