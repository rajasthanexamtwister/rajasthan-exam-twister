import { describe, it, expect, vi, beforeEach } from "vitest";
import { QuizSubmissionRepository } from "@/server/repositories/quiz-submission";
import { QuizSubmission } from "@/server/models/QuizSubmission";
import { QuizImportJSONSchema } from "@/server/validation/quiz";
import mongoose from "mongoose";

vi.mock("@/server/lib/mongodb", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

describe("Student Quiz Submissions System & Security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validQuizJson = {
    quizTitle: "Rajasthan History & Culture Practice Quiz",
    subject: "Rajasthan GK",
    questions: [
      {
        questionText: "Who was the founder of the Kingdom of Mewar?",
        options: ["Bappa Rawal", "Rana Sanga", "Rana Kumbha", "Maharana Pratap"],
        correctOptionIndex: 0,
        explanation: "Bappa Rawal established the Mewar dynasty rule.",
        marks: 1,
        negativeMarks: 0.33,
      },
      {
        questionText: "Which fort in Rajasthan is known as Sonar Qila?",
        options: ["Chittorgarh", "Jaisalmer Fort", "Mehrangarh", "Kumbhalgarh"],
        correctOptionIndex: 1,
        explanation: "Jaisalmer Fort is built of yellow sandstone giving it a golden appearance.",
        marks: 1,
        negativeMarks: 0.33,
      },
    ],
  };

  it("validates valid quiz JSON structure successfully", () => {
    const result = QuizImportJSONSchema.safeParse(validQuizJson);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quizTitle).toBe("Rajasthan History & Culture Practice Quiz");
      expect(result.data.questions).toHaveLength(2);
    }
  });

  it("rejects invalid quiz JSON missing correctOptionIndex or options", () => {
    const invalidJson = {
      quizTitle: "Invalid Quiz",
      questions: [
        {
          questionText: "Invalid question with no options",
          options: ["Only One Option"],
          correctOptionIndex: 5, // out of range
        },
      ],
    };

    const result = QuizImportJSONSchema.safeParse(invalidJson);
    expect(result.success).toBe(false);
  });

  it("creates a quiz submission record associated with authenticated student userId", async () => {
    const sampleStudentId = new mongoose.Types.ObjectId().toString();
    const saveSpy = vi.spyOn(QuizSubmission.prototype, "save").mockResolvedValue({
      _id: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(sampleStudentId),
      quizTitle: validQuizJson.quizTitle,
      questionCount: 2,
      status: "VALID",
      createdAt: new Date(),
    } as any);

    const submission = await QuizSubmissionRepository.create({
      userId: sampleStudentId,
      userEmail: "student@example.com",
      userName: "Test Student",
      quizTitle: validQuizJson.quizTitle,
      subject: validQuizJson.subject,
      questionCount: validQuizJson.questions.length,
      jsonData: validQuizJson,
    });

    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(submission.quizTitle).toBe(validQuizJson.quizTitle);
    expect(submission.questionCount).toBe(2);
  });

  it("enforces strict student ownership isolation when querying by userId", async () => {
    const studentAId = new mongoose.Types.ObjectId().toString();
    const studentBId = new mongoose.Types.ObjectId().toString();

    const mockFind = vi.spyOn(QuizSubmission, "find").mockReturnValue({
      sort: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue([
          {
            _id: new mongoose.Types.ObjectId(),
            userId: new mongoose.Types.ObjectId(studentAId),
            quizTitle: "Student A Quiz",
          },
        ]),
      }),
    } as any);

    const studentASubmissions = await QuizSubmissionRepository.findByUserId(studentAId);
    expect(mockFind).toHaveBeenCalledWith({ userId: new mongoose.Types.ObjectId(studentAId) });
    expect(studentASubmissions).toHaveLength(1);
    expect(studentASubmissions[0].userId.toString()).toBe(studentAId);
    expect(studentASubmissions[0].userId.toString()).not.toBe(studentBId);
  });

  it("verifies admin can retrieve paginated student submissions", async () => {
    const mockFind = vi.spyOn(QuizSubmission, "find").mockReturnValue({
      sort: vi.fn().mockReturnValue({
        skip: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue([
              { _id: new mongoose.Types.ObjectId(), quizTitle: "Sub 1" },
              { _id: new mongoose.Types.ObjectId(), quizTitle: "Sub 2" },
            ]),
          }),
        }),
      }),
    } as any);

    vi.spyOn(QuizSubmission, "countDocuments").mockResolvedValue(2 as any);

    const result = await QuizSubmissionRepository.findAllPaginated({ page: 1, pageSize: 10 });
    expect(result.total).toBe(2);
    expect(result.submissions).toHaveLength(2);
  });

  it("ensures original submission data remains immutable when admin creates a quiz draft", async () => {
    const mockSubmissionId = new mongoose.Types.ObjectId().toString();

    const updateStatusSpy = vi.spyOn(QuizSubmission, "findByIdAndUpdate").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(mockSubmissionId),
        quizTitle: validQuizJson.quizTitle,
        jsonData: validQuizJson, // Unchanged
        status: "USED",
      }),
    } as any);

    const updated = await QuizSubmissionRepository.updateStatus(mockSubmissionId, "USED");
    expect(updateStatusSpy).toHaveBeenCalledWith(
      mockSubmissionId,
      { $set: { status: "USED" } },
      { new: true }
    );
    expect(updated?.status).toBe("USED");
    expect(updated?.jsonData).toEqual(validQuizJson);
  });
});
