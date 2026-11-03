import crypto from "crypto";
import { connectToDatabase } from "@/server/lib/mongodb";
import {
  BciSurveySubmission,
  IBciSurveySubmission,
  BciArea,
  BciCategory,
  BciGender,
  BciMarksSource,
} from "@/server/models/BciSurveySubmission";
import {
  BciSurveyConfig,
  IBciSurveyConfig,
} from "@/server/models/BciSurveyConfig";
import {
  calculateTotalMarks,
  evaluatePaperQualification,
  calculateCutoffInterpolation,
  calculateWeightedCutoff,
  calculateEffectiveSampleSize,
  calculateNonTspWeights,
  calculateUrMigrationAdjustment,
  calculateSamplePercentile,
  calculateRankInterval,
  calculateCutoffMargin,
  calculateBootstrapInterval,
} from "@/server/lib/bci-stat-calculator";

export interface SurveySubmitInput {
  area: BciArea;
  category: BciCategory;
  gender: BciGender;
  paper1Marks: number;
  paper2Marks: number;
  marksSource: BciMarksSource;
  district?: string;
  shift?: string;
  candidateName?: string;
  mobile?: string;
  rollNumber?: string;
  consent: boolean;
}

export interface CandidateReportData {
  submission: {
    id: string;
    exam: string;
    area: BciArea;
    category: BciCategory;
    gender: BciGender;
    paper1Marks: number;
    paper2Marks: number;
    totalMarks: number;
    marksSource: BciMarksSource;
    district?: string;
    shift?: string;
    candidateName?: string;
    qualificationStatus: string;
    adminStatus: string;
    createdAt: string;
  };
  sampleStats: {
    totalSamplePool: number;
    categoryPoolCount: number;
    percentileOverall: number;
    percentileCategory: number;
    sampleRankInterval: {
      lowerRank: number;
      upperRank: number;
      midpointRank: number;
    };
    categoryRankInterval: {
      lowerRank: number;
      upperRank: number;
      midpointRank: number;
    };
    estimatedCutoff: number | null;
    cutoffWarning?: string;
    cutoffMargin: {
      margin: number;
      status: "safe" | "borderline" | "below";
      label: string;
    } | null;
    bootstrapInterval: {
      p10: number | null;
      p50: number | null;
      p90: number | null;
    } | null;
  };
  configSnapshot: {
    coverageFraction: number;
    backlogEnabled: boolean;
    qualifyingThreshold: number;
    disclaimer: string;
  };
}

const MANDATORY_DISCLAIMER =
  "Unofficial Survey | Self-Reported Data | Statistical Estimate | Not RSSB Official Result";

// Helper for SHA-256
function sha256(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}

export async function getActiveConfig(): Promise<IBciSurveyConfig> {
  await connectToDatabase();
  let config = await BciSurveyConfig.findOne({ exam: "BCI_2026", isActive: true });
  if (!config) {
    config = await BciSurveyConfig.create({
      exam: "BCI_2026",
      version: 1,
      isActive: true,
      vacancies: {
        nonTspTotal: 2936,
        tspTotal: 693,
        nonTspCategorySeats: {
          UR: 1100,
          EWS: 294,
          OBC: 616,
          MBC: 147,
          SC: 470,
          ST: 309,
        },
        tspCategorySeats: {
          UR: 347,
          SC: 35,
          ST: 311,
        },
      },
      coverageFraction: 0.15,
      qualifyingThresholds: {
        UR: 40,
        EWS: 40,
        OBC: 40,
        MBC: 40,
        SC: 35,
        ST: 35,
      },
      applicationShares: {
        UR_Male: 0.12,
        UR_Female: 0.08,
        EWS_Male: 0.07,
        EWS_Female: 0.03,
        OBC_Male: 0.28,
        OBC_Female: 0.14,
        MBC_Male: 0.04,
        MBC_Female: 0.01,
        SC_Male: 0.11,
        SC_Female: 0.04,
        ST_Male: 0.03,
        ST_Female: 0.02,
      },
      minEffectiveSampleSize: 15,
      bootstrapIterations: 400,
    });
  }
  return config;
}

export async function submitSurvey(
  input: SurveySubmitInput,
  clientIp?: string
): Promise<{
  submissionId: string;
  editToken: string;
  totalMarks: number;
  qualificationStatus: string;
  isDuplicate: boolean;
}> {
  if (!input.consent) {
    throw new Error("Consent is required to submit survey");
  }

  await connectToDatabase();
  const config = await getActiveConfig();

  const totalMarks = calculateTotalMarks(input.paper1Marks, input.paper2Marks);
  const qualResult = evaluatePaperQualification(
    input.paper1Marks,
    input.paper2Marks,
    input.category,
    config.qualifyingThresholds
  );

  const rawEditToken = crypto.randomBytes(24).toString("hex");
  const editTokenHash = sha256(rawEditToken);

  let rollNumberHash: string | undefined;
  let isDuplicate = false;

  if (input.rollNumber && input.rollNumber.trim()) {
    rollNumberHash = sha256(input.rollNumber.trim().toUpperCase());
    const existing = await BciSurveySubmission.findOne({
      exam: "BCI_2026",
      rollNumberHash,
      isValid: true,
    });
    if (existing) {
      isDuplicate = true;
    }
  }

  const clientFingerprintHash = clientIp ? sha256(clientIp) : undefined;

  const submission = await BciSurveySubmission.create({
    exam: "BCI_2026",
    area: input.area,
    category: input.category,
    gender: input.gender,
    paper1Marks: input.paper1Marks,
    paper2Marks: input.paper2Marks,
    totalMarks,
    marksSource: input.marksSource,
    district: input.district?.trim(),
    shift: input.shift?.trim(),
    candidateName: input.candidateName?.trim(),
    mobile: input.mobile?.trim(),
    rollNumberHash,
    editTokenHash,
    clientFingerprintHash,
    qualificationStatus: qualResult.label,
    isValid: !isDuplicate,
    isDuplicate,
    adminStatus: isDuplicate ? "duplicate" : "approved",
    auditLog: [
      {
        action: isDuplicate ? "SUBMITTED_AS_DUPLICATE" : "SUBMITTED",
        performedBy: "candidate",
        timestamp: new Date(),
        details: isDuplicate
          ? "Duplicate roll number detected"
          : "Initial candidate submission",
      },
    ],
  });

  return {
    submissionId: submission._id.toString(),
    editToken: rawEditToken,
    totalMarks,
    qualificationStatus: qualResult.label,
    isDuplicate,
  };
}

export async function getSubmissionByEditToken(
  token: string
): Promise<IBciSurveySubmission | null> {
  await connectToDatabase();
  const hash = sha256(token);
  return await BciSurveySubmission.findOne({ editTokenHash: hash });
}

export async function updateSubmissionViaToken(
  token: string,
  update: Partial<SurveySubmitInput>
): Promise<IBciSurveySubmission> {
  await connectToDatabase();
  const hash = sha256(token);
  const sub = await BciSurveySubmission.findOne({ editTokenHash: hash });
  if (!sub) {
    throw new Error("Invalid edit token or submission not found");
  }

  const config = await getActiveConfig();

  if (update.paper1Marks !== undefined) sub.paper1Marks = update.paper1Marks;
  if (update.paper2Marks !== undefined) sub.paper2Marks = update.paper2Marks;
  if (update.area !== undefined) sub.area = update.area;
  if (update.category !== undefined) sub.category = update.category;
  if (update.gender !== undefined) sub.gender = update.gender;
  if (update.marksSource !== undefined) sub.marksSource = update.marksSource;
  if (update.district !== undefined) sub.district = update.district;
  if (update.shift !== undefined) sub.shift = update.shift;
  if (update.candidateName !== undefined) sub.candidateName = update.candidateName;

  sub.totalMarks = calculateTotalMarks(sub.paper1Marks, sub.paper2Marks);
  const qualResult = evaluatePaperQualification(
    sub.paper1Marks,
    sub.paper2Marks,
    sub.category,
    config.qualifyingThresholds
  );
  sub.qualificationStatus = qualResult.label;

  sub.auditLog.push({
    action: "UPDATED_BY_CANDIDATE",
    performedBy: "candidate",
    timestamp: new Date(),
    details: `Updated marks: P1=${sub.paper1Marks}, P2=${sub.paper2Marks}, Total=${sub.totalMarks}`,
  });

  await sub.save();
  return sub;
}

export async function getCandidateReport(
  id: string
): Promise<CandidateReportData | null> {
  await connectToDatabase();
  const sub = await BciSurveySubmission.findById(id).select("-mobile");
  if (!sub) return null;

  const config = await getActiveConfig();

  // Load all approved & valid submissions in the same area
  const areaDocs = await BciSurveySubmission.find({
    exam: "BCI_2026",
    area: sub.area,
    isValid: true,
    adminStatus: "approved",
  })
    .select("totalMarks category gender qualificationStatus")
    .lean();

  const allScores = areaDocs.map((d) => d.totalMarks);
  const categoryDocs = areaDocs.filter((d) => d.category === sub.category);
  const categoryScores = categoryDocs.map((d) => d.totalMarks);

  // Percentiles & Rank Intervals
  const percentileOverall = calculateSamplePercentile(sub.totalMarks, allScores);
  const percentileCategory = calculateSamplePercentile(sub.totalMarks, categoryScores);
  const sampleRankInterval = calculateRankInterval(sub.totalMarks, allScores);
  const categoryRankInterval = calculateRankInterval(sub.totalMarks, categoryScores);

  // Seats determination for category
  let applicableSeats = 0;
  if (sub.area === "Non-TSP") {
    applicableSeats =
      (config.vacancies.nonTspCategorySeats as any)[sub.category] || 100;
  } else {
    applicableSeats =
      (config.vacancies.tspCategorySeats as any)[sub.category] || 50;
  }

  if (config.backlogEnabled) {
    applicableSeats += config.backlogSeats;
  }

  // Filter only qualified scores for cutoff estimate in that category
  const qualifiedCategoryDocs = categoryDocs.filter(
    (d) => d.qualificationStatus === "paper_verified_qualified"
  );
  const qualCategoryScores = qualifiedCategoryDocs
    .map((d) => d.totalMarks)
    .sort((a, b) => b - a);

  let estimatedCutoff: number | null = null;
  let cutoffWarning: string | undefined;

  if (sub.area === "Non-TSP" && qualCategoryScores.length > 0) {
    const weights = calculateNonTspWeights(
      qualifiedCategoryDocs,
      config.applicationShares as Record<string, number>
    );
    const pairs = qualCategoryScores.map((score, i) => ({
      score,
      weight: weights[i] ?? 1.0,
    }));
    const cutRes = calculateWeightedCutoff(
      pairs,
      applicableSeats,
      config.coverageFraction
    );
    estimatedCutoff = cutRes.cutoff;
    cutoffWarning = cutRes.warning;
  } else if (qualCategoryScores.length > 0) {
    const cutRes = calculateCutoffInterpolation(
      qualCategoryScores,
      applicableSeats,
      config.coverageFraction
    );
    estimatedCutoff = cutRes.cutoff;
    cutoffWarning = cutRes.warning;
  }

  let cutoffMargin: CandidateReportData["sampleStats"]["cutoffMargin"] = null;
  if (estimatedCutoff !== null) {
    const cm = calculateCutoffMargin(sub.totalMarks, estimatedCutoff);
    cutoffMargin = {
      margin: cm.margin,
      status: cm.status,
      label: cm.label,
    };
  }

  let bootstrapInterval: CandidateReportData["sampleStats"]["bootstrapInterval"] = null;
  if (qualCategoryScores.length >= 5 && estimatedCutoff !== null) {
    const boot = calculateBootstrapInterval(
      qualCategoryScores,
      null,
      applicableSeats,
      config.coverageFraction,
      200
    );
    bootstrapInterval = {
      p10: boot.p10,
      p50: boot.p50,
      p90: boot.p90,
    };
  }

  return {
    submission: {
      id: sub._id.toString(),
      exam: sub.exam,
      area: sub.area,
      category: sub.category,
      gender: sub.gender,
      paper1Marks: sub.paper1Marks,
      paper2Marks: sub.paper2Marks,
      totalMarks: sub.totalMarks,
      marksSource: sub.marksSource,
      district: sub.district,
      shift: sub.shift,
      candidateName: sub.candidateName,
      qualificationStatus: sub.qualificationStatus,
      adminStatus: sub.adminStatus,
      createdAt: sub.createdAt.toISOString(),
    },
    sampleStats: {
      totalSamplePool: allScores.length,
      categoryPoolCount: categoryScores.length,
      percentileOverall,
      percentileCategory,
      sampleRankInterval,
      categoryRankInterval,
      estimatedCutoff,
      cutoffWarning,
      cutoffMargin,
      bootstrapInterval,
    },
    configSnapshot: {
      coverageFraction: config.coverageFraction,
      backlogEnabled: config.backlogEnabled,
      qualifyingThreshold:
        config.qualifyingThresholds[sub.category] ?? 40,
      disclaimer: MANDATORY_DISCLAIMER,
    },
  };
}

export async function getPublicAnalytics(filters?: {
  area?: string;
  category?: string;
  gender?: string;
  marksSource?: string;
}) {
  await connectToDatabase();
  const config = await getActiveConfig();

  const query: any = {
    exam: "BCI_2026",
    isValid: true,
    adminStatus: "approved",
  };

  if (filters?.area && filters.area !== "ALL") query.area = filters.area;
  if (filters?.category && filters.category !== "ALL") query.category = filters.category;
  if (filters?.gender && filters.gender !== "ALL") query.gender = filters.gender;
  if (filters?.marksSource && filters.marksSource !== "ALL") query.marksSource = filters.marksSource;

  const docs = await BciSurveySubmission.find(query)
    .select("area category gender paper1Marks paper2Marks totalMarks qualificationStatus marksSource")
    .lean();

  const totalCount = docs.length;
  if (totalCount === 0) {
    return {
      totalCount: 0,
      qualifiedCount: 0,
      qualificationRate: 0,
      avgTotal: 0,
      avgPaper1: 0,
      avgPaper2: 0,
      medianTotal: 0,
      highestTotal: 0,
      lowestTotal: 0,
      histogram: [],
      categoryBreakdown: [],
      areaBreakdown: [],
      decisionLabCutoffs: [],
      disclaimer: MANDATORY_DISCLAIMER,
    };
  }

  let qualifiedCount = 0;
  let sumP1 = 0;
  let sumP2 = 0;
  let sumTotal = 0;

  const totalScores: number[] = [];

  docs.forEach((d) => {
    if (d.qualificationStatus === "paper_verified_qualified") qualifiedCount++;
    sumP1 += d.paper1Marks;
    sumP2 += d.paper2Marks;
    sumTotal += d.totalMarks;
    totalScores.push(d.totalMarks);
  });

  totalScores.sort((a, b) => a - b);
  const medianTotal =
    totalScores.length % 2 === 0
      ? Math.round(
          ((totalScores[totalScores.length / 2 - 1] +
            totalScores[totalScores.length / 2]) /
            2) *
            100
        ) / 100
      : totalScores[Math.floor(totalScores.length / 2)];

  // Score histogram (10 ranges: 0-20, 20-40, 40-60, 60-80, 80-100, 100-120, 120-140, 140-160, 160-180, 180-200)
  const bins = [
    { range: "0–40", min: 0, max: 40, count: 0 },
    { range: "40–60", min: 40, max: 60, count: 0 },
    { range: "60–80", min: 60, max: 80, count: 0 },
    { range: "80–100", min: 80, max: 100, count: 0 },
    { range: "100–120", min: 100, max: 120, count: 0 },
    { range: "120–140", min: 120, max: 140, count: 0 },
    { range: "140–160", min: 140, max: 160, count: 0 },
    { range: "160–180", min: 160, max: 180, count: 0 },
    { range: "180–200", min: 180, max: 200, count: 0 },
  ];

  totalScores.forEach((score) => {
    const bin = bins.find(
      (b, idx) =>
        (idx === bins.length - 1 ? score <= b.max : score < b.max) &&
        score >= b.min
    );
    if (bin) bin.count++;
  });

  // Category breakdown
  const categoryGroups: Record<string, { count: number; qualified: number; sumTotal: number; scores: number[] }> = {};
  const categories = ["UR", "EWS", "OBC", "MBC", "SC", "ST"];
  categories.forEach((cat) => {
    categoryGroups[cat] = { count: 0, qualified: 0, sumTotal: 0, scores: [] };
  });

  docs.forEach((d) => {
    if (!categoryGroups[d.category]) {
      categoryGroups[d.category] = { count: 0, qualified: 0, sumTotal: 0, scores: [] };
    }
    const g = categoryGroups[d.category];
    g.count++;
    if (d.qualificationStatus === "paper_verified_qualified") g.qualified++;
    g.sumTotal += d.totalMarks;
    g.scores.push(d.totalMarks);
  });

  const categoryBreakdown = Object.entries(categoryGroups).map(([cat, g]) => {
    g.scores.sort((a, b) => a - b);
    const med =
      g.scores.length === 0
        ? 0
        : g.scores.length % 2 === 0
        ? Math.round(
            ((g.scores[g.scores.length / 2 - 1] + g.scores[g.scores.length / 2]) /
              2) *
              100
          ) / 100
        : g.scores[Math.floor(g.scores.length / 2)];

    return {
      category: cat,
      count: g.count,
      qualifiedCount: g.qualified,
      qualificationRate:
        g.count > 0 ? Math.round((g.qualified / g.count) * 1000) / 10 : 0,
      avgScore: g.count > 0 ? Math.round((g.sumTotal / g.count) * 100) / 100 : 0,
      medianScore: med,
    };
  });

  // Area breakdown
  const tspDocs = docs.filter((d) => d.area === "TSP");
  const nonTspDocs = docs.filter((d) => d.area === "Non-TSP");

  const areaBreakdown = [
    {
      area: "Non-TSP",
      count: nonTspDocs.length,
      qualifiedCount: nonTspDocs.filter((d) => d.qualificationStatus === "paper_verified_qualified").length,
      avgScore:
        nonTspDocs.length > 0
          ? Math.round(
              (nonTspDocs.reduce((a, b) => a + b.totalMarks, 0) / nonTspDocs.length) *
                100
            ) / 100
          : 0,
    },
    {
      area: "TSP",
      count: tspDocs.length,
      qualifiedCount: tspDocs.filter((d) => d.qualificationStatus === "paper_verified_qualified").length,
      avgScore:
        tspDocs.length > 0
          ? Math.round(
              (tspDocs.reduce((a, b) => a + b.totalMarks, 0) / tspDocs.length) *
                100
            ) / 100
          : 0,
    },
  ];

  // Decision Lab Cutoff Estimator table
  const decisionLabCutoffs: Array<{
    area: string;
    category: string;
    seats: number;
    sampleSize: number;
    qualifiedSample: number;
    effectiveSampleSize: number;
    estimatedCutoff: number | null;
    p10: number | null;
    p90: number | null;
    warning?: string;
  }> = [];

  // Non-TSP pools
  for (const cat of ["UR", "EWS", "OBC", "MBC", "SC", "ST"]) {
    const pool = nonTspDocs.filter((d) => d.category === cat);
    const qualifiedPool = pool.filter(
      (d) => d.qualificationStatus === "paper_verified_qualified"
    );
    const sortedScores = qualifiedPool.map((d) => d.totalMarks).sort((a, b) => b - a);

    const seats =
      (config.vacancies.nonTspCategorySeats as any)[cat] || 100;
    const weights = calculateNonTspWeights(
      qualifiedPool,
      config.applicationShares as Record<string, number>
    );
    const neff = calculateEffectiveSampleSize(weights);

    const pairs = sortedScores.map((score, i) => ({
      score,
      weight: weights[i] ?? 1.0,
    }));

    const cutRes = calculateWeightedCutoff(
      pairs,
      seats,
      config.coverageFraction
    );

    let p10: number | null = null;
    let p90: number | null = null;
    if (sortedScores.length >= 5 && cutRes.cutoff !== null) {
      const boot = calculateBootstrapInterval(
        sortedScores,
        weights,
        seats,
        config.coverageFraction,
        150
      );
      p10 = boot.p10;
      p90 = boot.p90;
    }

    decisionLabCutoffs.push({
      area: "Non-TSP",
      category: cat,
      seats,
      sampleSize: pool.length,
      qualifiedSample: qualifiedPool.length,
      effectiveSampleSize: neff,
      estimatedCutoff: cutRes.cutoff,
      p10,
      p90,
      warning: cutRes.warning,
    });
  }

  // TSP pools (UR, SC, ST)
  for (const cat of ["UR", "SC", "ST"]) {
    const pool = tspDocs.filter((d) => d.category === cat);
    const qualifiedPool = pool.filter(
      (d) => d.qualificationStatus === "paper_verified_qualified"
    );
    const sortedScores = qualifiedPool.map((d) => d.totalMarks).sort((a, b) => b - a);

    const seats = (config.vacancies.tspCategorySeats as any)[cat] || 50;
    const cutRes = calculateCutoffInterpolation(
      sortedScores,
      seats,
      config.coverageFraction
    );

    let p10: number | null = null;
    let p90: number | null = null;
    if (sortedScores.length >= 5 && cutRes.cutoff !== null) {
      const boot = calculateBootstrapInterval(
        sortedScores,
        null,
        seats,
        config.coverageFraction,
        150
      );
      p10 = boot.p10;
      p90 = boot.p90;
    }

    decisionLabCutoffs.push({
      area: "TSP",
      category: cat,
      seats,
      sampleSize: pool.length,
      qualifiedSample: qualifiedPool.length,
      effectiveSampleSize: qualifiedPool.length,
      estimatedCutoff: cutRes.cutoff,
      p10,
      p90,
      warning: cutRes.warning,
    });
  }

  return {
    totalCount,
    qualifiedCount,
    qualificationRate: Math.round((qualifiedCount / totalCount) * 1000) / 10,
    avgTotal: Math.round((sumTotal / totalCount) * 100) / 100,
    avgPaper1: Math.round((sumP1 / totalCount) * 100) / 100,
    avgPaper2: Math.round((sumP2 / totalCount) * 100) / 100,
    medianTotal,
    highestTotal: totalScores[totalScores.length - 1],
    lowestTotal: totalScores[0],
    histogram: bins,
    categoryBreakdown,
    areaBreakdown,
    decisionLabCutoffs,
    disclaimer: MANDATORY_DISCLAIMER,
  };
}

export async function getAdminSubmissions(query: {
  page?: number;
  pageSize?: number;
  status?: string;
  area?: string;
  category?: string;
  search?: string;
}) {
  await connectToDatabase();
  const page = Math.max(1, query.page || 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize || 20));

  const filter: any = {};
  if (query.status && query.status !== "ALL") filter.adminStatus = query.status;
  if (query.area && query.area !== "ALL") filter.area = query.area;
  if (query.category && query.category !== "ALL") filter.category = query.category;

  if (query.search?.trim()) {
    const s = query.search.trim();
    filter.$or = [
      { candidateName: { $regex: s, $options: "i" } },
      { district: { $regex: s, $options: "i" } },
      { rollNumberHash: { $regex: s, $options: "i" } },
    ];
  }

  const [docs, total] = await Promise.all([
    BciSurveySubmission.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    BciSurveySubmission.countDocuments(filter),
  ]);

  return {
    submissions: docs.map((d) => ({
      id: d._id.toString(),
      area: d.area,
      category: d.category,
      gender: d.gender,
      paper1Marks: d.paper1Marks,
      paper2Marks: d.paper2Marks,
      totalMarks: d.totalMarks,
      marksSource: d.marksSource,
      district: d.district,
      shift: d.shift,
      candidateName: d.candidateName,
      qualificationStatus: d.qualificationStatus,
      isValid: d.isValid,
      isDuplicate: d.isDuplicate,
      adminStatus: d.adminStatus,
      adminNotes: d.adminNotes,
      createdAt: d.createdAt,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function updateSubmissionAdminStatus(
  id: string,
  newStatus: "pending" | "approved" | "flagged" | "excluded" | "duplicate",
  adminNotes: string | undefined,
  adminEmail: string
) {
  await connectToDatabase();
  const sub = await BciSurveySubmission.findById(id);
  if (!sub) {
    throw new Error("Submission not found");
  }

  const oldStatus = sub.adminStatus;
  sub.adminStatus = newStatus;
  sub.isValid = newStatus === "approved";
  sub.isDuplicate = newStatus === "duplicate";
  if (adminNotes !== undefined) sub.adminNotes = adminNotes;

  sub.auditLog.push({
    action: `STATUS_CHANGE_${newStatus.toUpperCase()}`,
    performedBy: adminEmail,
    timestamp: new Date(),
    details: `Status changed from ${oldStatus} to ${newStatus}. Note: ${adminNotes || "N/A"}`,
  });

  await sub.save();
  return sub;
}
