import { NextRequest, NextResponse } from "next/server";
import { getStudentSession } from "@/server/lib/student-auth";
import { QuizSubmissionRepository } from "@/server/repositories/quiz-submission";
import { QuizImportJSONSchema } from "@/server/validation/quiz";
import { errorResponse, successResponse } from "@/server/lib/api-response";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getStudentSession();
    if (!session || !session.user || !session.user.id) {
      return errorResponse("UNAUTHORIZED", "Authentication required to submit quiz JSON", 401);
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return errorResponse("VALIDATION_ERROR", "Malformed JSON body", 400);
    }

    // Body size guard (approx 2MB limit)
    const jsonString = JSON.stringify(body);
    if (jsonString.length > 2 * 1024 * 1024) {
      return errorResponse("VALIDATION_ERROR", "Quiz JSON payload exceeds 2MB limit", 413);
    }

    // Validate structure against QuizImportJSONSchema
    const parseResult = QuizImportJSONSchema.safeParse(body.jsonData || body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Quiz JSON validation failed",
            details: parseResult.error.format(),
          },
        },
        { status: 400 }
      );
    }

    const validatedQuiz = parseResult.data;
    const originalFileName = typeof body.originalFileName === "string" ? body.originalFileName.trim() : undefined;

    const submission = await QuizSubmissionRepository.create({
      userId: session.user.id,
      userEmail: session.user.email || undefined,
      userName: session.user.name || undefined,
      originalFileName,
      quizTitle: validatedQuiz.quizTitle,
      subject: validatedQuiz.subject,
      questionCount: validatedQuiz.questions.length,
      jsonData: validatedQuiz,
      status: "VALID",
    });

    return successResponse({ submission }, 201);
  } catch (err: any) {
    console.error("Failed to submit student quiz JSON:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to process quiz submission", 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getStudentSession();
    if (!session || !session.user || !session.user.id) {
      return errorResponse("UNAUTHORIZED", "Authentication required to view submissions", 401);
    }

    const submissions = await QuizSubmissionRepository.findByUserId(session.user.id);
    return successResponse({ submissions });
  } catch (err: any) {
    console.error("Failed to fetch student quiz submissions:", err);
    return errorResponse("INTERNAL_ERROR", "Failed to load quiz submissions", 500);
  }
}
