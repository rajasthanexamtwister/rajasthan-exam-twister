import { describe, it, expect } from "vitest";
import {
  calculateTotalMarks,
  evaluatePaperQualification,
  calculateCutoffInterpolation,
  calculateEffectiveSampleSize,
  calculateNonTspWeights,
  calculateUrMigrationAdjustment,
  calculateSamplePercentile,
  calculateCutoffMargin,
  calculateRankInterval,
  calculateBootstrapInterval,
} from "../../server/lib/bci-stat-calculator";

describe("BCI 2026 Statistical Engine Tests", () => {
  // Test A: Total marks formula
  describe("Test A: Total marks formula", () => {
    it("correctly sums Paper-I (48.5) and Paper-II (52.25) to 100.75", () => {
      const total = calculateTotalMarks(48.5, 52.25);
      expect(total).toBe(100.75);
    });

    it("rejects marks outside 0 to 100", () => {
      expect(() => calculateTotalMarks(-1, 50)).toThrow();
      expect(() => calculateTotalMarks(50, 105)).toThrow();
    });
  });

  // Test B: Qualification rule
  describe("Test B: Qualification rule check", () => {
    const thresholds = {
      UR: 40,
      EWS: 40,
      OBC: 40,
      MBC: 40,
      SC: 35,
      ST: 35,
    };

    it("fails UR candidate if Paper-II (38) is below 40 even with high Paper-I (60)", () => {
      const res = evaluatePaperQualification(60, 38, "UR", thresholds);
      expect(res.isQualified).toBe(false);
      expect(res.label).toBe("paper_verified_not_qualified");
      expect(res.paper2Qualified).toBe(false);
      expect(res.reason).toContain("Paper-II (38) below minimum 40");
    });

    it("passes SC candidate when both papers are at least 35", () => {
      const res = evaluatePaperQualification(36, 37, "SC", thresholds);
      expect(res.isQualified).toBe(true);
      expect(res.label).toBe("paper_verified_qualified");
    });
  });

  // Test C: Sample target rank
  describe("Test C: Sample target rank", () => {
    it("computes r = 15 when seats = 100 and coverage c = 0.15", () => {
      const seats = 100;
      const coverage = 0.15;
      const scores = Array.from({ length: 50 }, (_, i) => 150 - i * 2);
      const res = calculateCutoffInterpolation(scores, seats, coverage);
      expect(res.targetRank).toBe(15);
      expect(res.k).toBe(15);
      expect(res.f).toBe(0);
    });
  });

  // Test D: Cutoff interpolation
  describe("Test D: Cutoff interpolation", () => {
    it("interpolates cutoff to 119 when r = 15.5, x[15] = 120 and x[16] = 118", () => {
      // 1-indexed: 15th score is at index 14, 16th is at index 15
      const scores = Array.from({ length: 30 }, (_, i) => {
        if (i < 14) return 150 - i;
        if (i === 14) return 120; // 15th
        if (i === 15) return 118; // 16th
        return 118 - (i - 15);
      });

      // seats * c = 15.5 => seats = 155, c = 0.10
      const res = calculateCutoffInterpolation(scores, 155, 0.1);
      expect(res.targetRank).toBe(15.5);
      expect(res.k).toBe(15);
      expect(res.f).toBe(0.5);
      expect(res.cutoff).toBe(119.0);
    });

    it("returns boundary warning when target rank r > sample size n", () => {
      const scores = [140, 130, 120];
      const res = calculateCutoffInterpolation(scores, 100, 0.15); // r = 15 > 3
      expect(res.cutoff).toBeNull();
      expect(res.warning).toContain("BOUNDARY_OUTSIDE_SAMPLE");
    });
  });

  // Test E: Effective sample size
  describe("Test E: Effective sample size", () => {
    it("computes n_eff = 4.0 for weights [1, 1, 1, 1]", () => {
      const neff = calculateEffectiveSampleSize([1, 1, 1, 1]);
      expect(neff).toBe(4.0);
    });

    it("computes n_eff = 1.0 for weights [2, 0]", () => {
      const neff = calculateEffectiveSampleSize([2, 0]);
      expect(neff).toBe(1.0);
    });
  });

  // Test F: UR migration adjustment
  describe("Test F: UR Migration adjustment", () => {
    it("estimates M = 200 when H = 30 and coverage c = 0.15", () => {
      const res = calculateUrMigrationAdjustment(100, 30, 0.15);
      expect(res.migratingCandidatesEstimated).toBe(200);
      expect(res.effectiveUnreservedSeats).toBe(300);
      expect(res.targetSampleRank).toBe(45);
    });
  });

  // Test G: Percentile calculation
  describe("Test G: Percentile calculation", () => {
    it("calculates 80.0 percentile when B = 75, E = 10, W = 100", () => {
      // 75 scores at 50, 10 scores at 60 (candidate score), 15 scores at 70
      const scores: number[] = [
        ...Array(75).fill(50),
        ...Array(10).fill(60),
        ...Array(15).fill(70),
      ];
      const p = calculateSamplePercentile(60, scores);
      expect(p).toBe(80.0);
    });
  });

  // Test H: Cutoff margin
  describe("Test H: Cutoff margin", () => {
    it("computes +5.5 margin for candidate 124.5 vs cutoff 119.0 (safe)", () => {
      const res = calculateCutoffMargin(124.5, 119.0);
      expect(res.margin).toBe(5.5);
      expect(res.status).toBe("safe");
    });

    it("identifies borderline margin (+0.5) and below margin (-4.0)", () => {
      const border = calculateCutoffMargin(119.5, 119.0);
      expect(border.margin).toBe(0.5);
      expect(border.status).toBe("borderline");

      const below = calculateCutoffMargin(115.0, 119.0);
      expect(below.margin).toBe(-4.0);
      expect(below.status).toBe("below");
    });
  });

  // Weighting & Rank intervals
  describe("Non-TSP Weighting and Unknown Gender", () => {
    it("normalizes weights so sum(weights) = n", () => {
      const sample = [
        { category: "UR", gender: "Male" },
        { category: "UR", gender: "Female" },
        { category: "OBC", gender: "Male" },
        { category: "OBC", gender: "Female" },
        { category: "SC", gender: "Other" },
      ];
      const shares = {
        UR_Male: 0.15,
        UR_Female: 0.1,
        OBC_Male: 0.3,
        OBC_Female: 0.15,
        SC_Male: 0.1,
        SC_Female: 0.05,
      };
      const weights = calculateNonTspWeights(sample, shares);
      expect(weights.length).toBe(5);
      const totalW = weights.reduce((sum, w) => sum + w, 0);
      expect(Math.round(totalW)).toBe(5);
    });
  });

  describe("Rank Interval and Bootstrap Interval", () => {
    it("calculates lower, upper and midpoint rank correctly", () => {
      const scores = [150, 140, 130, 130, 120];
      const rank = calculateRankInterval(130, scores);
      // 2 scores above (150, 140), 2 equal (130, 130)
      expect(rank.lowerRank).toBe(3);
      expect(rank.upperRank).toBe(4);
      expect(rank.midpointRank).toBe(3.5);
    });

    it("runs bootstrap resampling and provides p10, p50, p90", () => {
      const scores = Array.from({ length: 50 }, (_, i) => 160 - i * 1.5);
      const bRes = calculateBootstrapInterval(scores, null, 100, 0.15, 200);
      expect(bRes.p10).not.toBeNull();
      expect(bRes.p50).not.toBeNull();
      expect(bRes.p90).not.toBeNull();
      expect(bRes.p10!).toBeLessThanOrEqual(bRes.p90!);
      expect(bRes.p10!).toBeLessThanOrEqual(bRes.p50!);
      expect(bRes.p50!).toBeLessThanOrEqual(bRes.p90!);
    });
  });
});
