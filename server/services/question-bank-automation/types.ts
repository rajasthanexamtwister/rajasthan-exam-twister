export type QuestionFormat =
  | "MCQ"
  | "Statement"
  | "AssertionReason"
  | "Matching"
  | "CodeList"
  | "Other";

export type VerificationStatus = "VERIFIED" | "REVIEW_NEEDED" | "CONFLICT" | "INVALID";

export interface ParsedQuestion {
  order: number;
  questionText: string;
  questionTextEn?: string;
  options: string[];
  optionsEn?: string[];
  providedOptionIndex: number;
  providedAnswerKey: string;
  providedExplanation?: string;
  providedExamTag?: string | null;
  format: QuestionFormat;
  verificationStatus: VerificationStatus;
  verifiedOptionIndex?: number;
  verifiedExplanation?: string;
  verifiedExamTag?: string | null;
  reviewNotes?: string[];
  fingerprint: string;
}

export interface QuestionProcessingIssue {
  questionOrder: number;
  issue: string;
  questionSnippet?: string;
}

export interface FileProcessingReport {
  filePath: string;
  fileName: string;
  subject: string;
  topic: string;
  totalFound: number;
  verifiedCount: number;
  importedCount: number;
  duplicateCount: number;
  examTagFoundCount: number;
  explanationGeneratedCount: number;
  reviewNeededCount: number;
  topicQuizId?: string;
  fileDeleted: boolean;
  error?: string;
  issues: QuestionProcessingIssue[];
}

export interface AutomationBatchSummary {
  totalFilesScanned: number;
  successfulFilesCount: number;
  reviewPendingFilesCount: number;
  failedFilesCount: number;
  totalQuestionsFound: number;
  totalQuestionsImported: number;
  totalDuplicatesSkipped: number;
  totalQuestionsNeedingReview: number;
  deletedFiles: string[];
  retainedFiles: string[];
  reports: FileProcessingReport[];
}
