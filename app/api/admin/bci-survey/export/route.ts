import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/server/lib/token";
import { connectToDatabase } from "@/server/lib/mongodb";
import { BciSurveySubmission } from "@/server/models/BciSurveySubmission";
import { errorResponse } from "@/server/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Admin authorization required", 401);
    }

    await connectToDatabase();
    const submissions = await BciSurveySubmission.find({ exam: "BCI_2026" })
      .sort({ createdAt: -1 })
      .lean();

    const headers = [
      "ID",
      "Area",
      "Category",
      "Gender",
      "Paper-I Marks",
      "Paper-II Marks",
      "Total Marks",
      "Marks Source",
      "District",
      "Shift",
      "Candidate Name",
      "Qualification Status",
      "Is Valid",
      "Is Duplicate",
      "Admin Status",
      "Admin Notes",
      "Created At",
    ];

    const escapeCsv = (str: any) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = submissions.map((s) => [
      escapeCsv(s._id.toString()),
      escapeCsv(s.area),
      escapeCsv(s.category),
      escapeCsv(s.gender),
      escapeCsv(s.paper1Marks),
      escapeCsv(s.paper2Marks),
      escapeCsv(s.totalMarks),
      escapeCsv(s.marksSource),
      escapeCsv(s.district || ""),
      escapeCsv(s.shift || ""),
      escapeCsv(s.candidateName || ""),
      escapeCsv(s.qualificationStatus),
      escapeCsv(s.isValid ? "TRUE" : "FALSE"),
      escapeCsv(s.isDuplicate ? "TRUE" : "FALSE"),
      escapeCsv(s.adminStatus),
      escapeCsv(s.adminNotes || ""),
      escapeCsv(s.createdAt ? new Date(s.createdAt).toISOString() : ""),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="bci_2026_survey_export_${Date.now()}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Error exporting BCI survey CSV:", error);
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to export", 500);
  }
}
