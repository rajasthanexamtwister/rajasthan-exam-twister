/**
 * BCI 2026 Statistical Engine & Decision Lab Calculator
 * Implements strict statistical formulas, Non-TSP category × gender weighting,
 * percentile rankings, cutoff interpolation, UR migration, and bootstrap uncertainty.
 *
 * Mandatory Notice:
 * Unofficial Survey | Self-Reported Data | Statistical Estimate | Not RSSB Official Result
 */

export interface QualificationResult {
  isQualified: boolean;
  paper1Qualified: boolean;
  paper2Qualified: boolean;
  reason: string;
  label: "paper_verified_qualified" | "paper_verified_not_qualified";
}

export interface CutoffInterpolationResult {
  cutoff: number | null;
  targetRank: number;
  k: number;
  f: number;
  warning?: string;
}

export interface RankIntervalResult {
  lowerRank: number;
  upperRank: number;
  midpointRank: number;
}

export interface UrMigrationResult {
  migratingCandidatesEstimated: number; // M = H / c
  effectiveUnreservedSeats: number; // S + M
  targetSampleRank: number; // r = R * c
}

export interface CutoffMarginResult {
  margin: number;
  status: "safe" | "borderline" | "below";
  label: string;
}

export interface BootstrapIntervalResult {
  p10: number | null;
  p50: number | null;
  p90: number | null;
  validIterations: number;
  warning?: string;
}

/**
 * 1. Total Marks
 * T = P1 + P2 (0 <= P1, P2 <= 100, 0 <= T <= 200)
 */
export function calculateTotalMarks(p1: number, p2: number): number {
  if (p1 < 0 || p1 > 100 || p2 < 0 || p2 > 100) {
    throw new Error("Paper marks must be between 0 and 100");
  }
  return Math.round((p1 + p2) * 100) / 100;
}

/**
 * 2. Paper Qualification Check
 * Paper-I >= Min AND Paper-II >= Min
 */
export function evaluatePaperQualification(
  p1: number,
  p2: number,
  category: string,
  thresholds: Record<string, number>
): QualificationResult {
  const minRequired = thresholds[category] ?? (["SC", "ST"].includes(category) ? 35 : 40);
  const paper1Qualified = p1 >= minRequired;
  const paper2Qualified = p2 >= minRequired;
  const isQualified = paper1Qualified && paper2Qualified;

  let reason = "";
  if (!isQualified) {
    if (!paper1Qualified && !paper2Qualified) {
      reason = `Both Paper-I (${p1}) and Paper-II (${p2}) below minimum ${minRequired}`;
    } else if (!paper1Qualified) {
      reason = `Paper-I (${p1}) below minimum ${minRequired}`;
    } else {
      reason = `Paper-II (${p2}) below minimum ${minRequired}`;
    }
  } else {
    reason = `Both papers satisfied minimum requirement of ${minRequired} marks`;
  }

  return {
    isQualified,
    paper1Qualified,
    paper2Qualified,
    reason,
    label: isQualified
      ? "paper_verified_qualified"
      : "paper_verified_not_qualified",
  };
}

/**
 * 3. Unweighted Cutoff Interpolation
 * Let S = seats, c = coverage fraction, n = sample rows
 * r = S * c
 * x sorted high-to-low
 * k = floor(r), f = r - k
 * Cutoff = x[k] + f * (x[k+1] - x[k])  [using 1-indexed specification from brief]
 */
export function calculateCutoffInterpolation(
  scoresDesc: number[],
  seats: number,
  coverage: number
): CutoffInterpolationResult {
  const n = scoresDesc.length;
  const r = Math.round(seats * coverage * 100) / 100;

  if (n === 0) {
    return {
      cutoff: null,
      targetRank: r,
      k: 0,
      f: 0,
      warning: "NO_SAMPLE: No qualifying records available in this pool",
    };
  }

  if (r > n) {
    return {
      cutoff: null,
      targetRank: r,
      k: Math.floor(r),
      f: r - Math.floor(r),
      warning: `BOUNDARY_OUTSIDE_SAMPLE: Target sample rank (${r}) exceeds usable sample size (${n})`,
    };
  }

  if (r <= 1) {
    return {
      cutoff: Math.round(scoresDesc[0] * 100) / 100,
      targetRank: r,
      k: 1,
      f: 0,
      warning: "BOUNDARY_BELOW_SAMPLE: Target rank <= 1; highest sampled score returned",
    };
  }

  const k = Math.floor(r);
  const f = r - k;

  // 1-indexed formula: x[k] is index k-1; x[k+1] is index k.
  // If r is integer, f is 0, cutoff is x[k-1].
  const x_k = scoresDesc[k - 1];
  const x_k_plus_1 = k < n ? scoresDesc[k] : x_k;
  const cutoff = x_k + f * (x_k_plus_1 - x_k);

  return {
    cutoff: Math.round(cutoff * 100) / 100,
    targetRank: r,
    k,
    f: Math.round(f * 100) / 100,
  };
}

/**
 * 4. Effective Sample Size
 * n_eff = (sum w_i)^2 / sum (w_i^2)
 */
export function calculateEffectiveSampleSize(weights: number[]): number {
  if (weights.length === 0) return 0;
  const sumW = weights.reduce((acc, w) => acc + w, 0);
  const sumW2 = weights.reduce((acc, w) => acc + w * w, 0);
  if (sumW2 === 0) return 0;
  return Math.round(((sumW * sumW) / sumW2) * 100) / 100;
}

/**
 * 5. Non-TSP Category × Gender Weighting with Unknown-Gender Handling
 * Normalizes all weights such that sum(weights) = n
 */
export function calculateNonTspWeights(
  sample: Array<{ category: string; gender: string }>,
  applicationShares: Record<string, number>
): number[] {
  const n = sample.length;
  if (n === 0) return [];

  // Group by category and gender
  const counts: Record<string, { male: number; female: number; unknown: number; total: number }> = {};
  const categories = ["UR", "EWS", "OBC", "MBC", "SC", "ST"];

  categories.forEach((cat) => {
    counts[cat] = { male: 0, female: 0, unknown: 0, total: 0 };
  });

  sample.forEach((item) => {
    const cat = item.category;
    if (!counts[cat]) {
      counts[cat] = { male: 0, female: 0, unknown: 0, total: 0 };
    }
    counts[cat].total += 1;
    if (item.gender === "Male") counts[cat].male += 1;
    else if (item.gender === "Female") counts[cat].female += 1;
    else counts[cat].unknown += 1;
  });

  const rawWeights: number[] = [];

  sample.forEach((item) => {
    const cat = item.category;
    const cell = counts[cat] || { male: 0, female: 0, unknown: 0, total: 1 };
    const t_male = applicationShares[`${cat}_Male`] ?? 0;
    const t_female = applicationShares[`${cat}_Female`] ?? 0;
    const t_cat = t_male + t_female;

    const hasMale = cell.male > 0;
    const hasFemale = cell.female > 0;
    const n_c = cell.total;

    let w = 1.0;

    if (item.gender === "Other" || (!hasMale && !hasFemale)) {
      // Unknown gender row
      w = n_c > 0 && t_cat > 0 ? t_cat / n_c : 1.0;
    } else {
      // Known gender row
      if (hasMale && hasFemale) {
        const genderCount = item.gender === "Male" ? cell.male : cell.female;
        const t_cg = item.gender === "Male" ? t_male : t_female;
        if (cell.unknown > 0) {
          // Unknowns present
          w = (t_cg * (cell.male + cell.female)) / (n_c * genderCount);
        } else {
          // No unknowns
          w = genderCount > 0 ? t_cg / genderCount : 1.0;
        }
      } else {
        // Only one known gender sampled in this category
        w = n_c > 0 && t_cat > 0 ? t_cat / n_c : 1.0;
      }
    }

    rawWeights.push(w > 0 ? w : 1.0);
  });

  const rawSum = rawWeights.reduce((acc, val) => acc + val, 0);
  if (rawSum === 0) return rawWeights.map(() => 1.0);

  // Normalize: FinalWeight_i = RawWeight_i * n / rawSum
  return rawWeights.map((rw) => Math.round(((rw * n) / rawSum) * 10000) / 10000);
}

/**
 * 6. UR Migration Adjustment
 * H = qualified reserved-category candidates whose scores >= unreserved tentative cutoff
 * M = H / c
 * R = S + M
 * r = R * c
 */
export function calculateUrMigrationAdjustment(
  unreservedSeats: number,
  reservedAboveCutoffCount: number,
  coverage: number
): UrMigrationResult {
  const H = reservedAboveCutoffCount;
  const c = coverage;
  const M = Math.round((H / c) * 100) / 100;
  const R = Math.round((unreservedSeats + M) * 100) / 100;
  const r = Math.round((R * c) * 100) / 100;

  return {
    migratingCandidatesEstimated: M,
    effectiveUnreservedSeats: R,
    targetSampleRank: r,
  };
}

/**
 * 7. Weighted / Unweighted Percentile
 * Let B = sum of weights strictly below candidate score
 * Let E = sum of weights equal to candidate score
 * Let W = total weights
 * Percentile = 100 * (B + E / 2) / W
 */
export function calculateSamplePercentile(
  candidateScore: number,
  allScores: number[],
  weights?: number[]
): number {
  const n = allScores.length;
  if (n === 0) return 0;

  let B = 0;
  let E = 0;
  let W = 0;

  for (let i = 0; i < n; i++) {
    const s = allScores[i];
    const w = weights && weights[i] !== undefined ? weights[i] : 1.0;
    W += w;
    if (s < candidateScore) {
      B += w;
    } else if (Math.abs(s - candidateScore) < 0.0001) {
      E += w;
    }
  }

  if (W === 0) return 0;
  const percentile = (100 * (B + E / 2)) / W;
  return Math.round(percentile * 100) / 100;
}

/**
 * 8. Midpoint Rank and Rank Interval
 * Lower Rank = A_above + 1
 * Upper Rank = A_above + E
 * Midpoint Rank = A_above + (E + 1) / 2
 */
export function calculateRankInterval(
  candidateScore: number,
  allScores: number[],
  weights?: number[]
): RankIntervalResult {
  const n = allScores.length;
  if (n === 0) {
    return { lowerRank: 1, upperRank: 1, midpointRank: 1 };
  }

  let A_above = 0;
  let E = 0;

  for (let i = 0; i < n; i++) {
    const s = allScores[i];
    const w = weights && weights[i] !== undefined ? weights[i] : 1.0;
    if (s > candidateScore) {
      A_above += w;
    } else if (Math.abs(s - candidateScore) < 0.0001) {
      E += w;
    }
  }

  const lowerRank = Math.round((A_above + 1) * 10) / 10;
  const upperRank = Math.round((A_above + E) * 10) / 10;
  const midpointRank = Math.round((A_above + (E + 1) / 2) * 10) / 10;

  return { lowerRank, upperRank, midpointRank };
}

/**
 * 9. Cutoff Margin
 * Margin = Candidate Total - Cutoff
 * >= 5: "safe", 0 to <5: "borderline", < 0: "below"
 */
export function calculateCutoffMargin(
  candidateScore: number,
  cutoffScore: number
): CutoffMarginResult {
  const margin = Math.round((candidateScore - cutoffScore) * 100) / 100;
  let status: "safe" | "borderline" | "below" = "safe";
  let label = "Safe Margin";

  if (margin < 0) {
    status = "below";
    label = "Below Estimated Cut-off";
  } else if (margin < 5) {
    status = "borderline";
    label = "Borderline Zone";
  } else {
    status = "safe";
    label = "Comfortable / Safe Zone";
  }

  return { margin, status, label };
}

/**
 * 10. Weighted Cutoff Interpolation
 * Linearly interpolates cutoff when sample rows have non-uniform weights.
 */
export function calculateWeightedCutoff(
  pairs: Array<{ score: number; weight: number }>,
  seats: number,
  coverage: number
): CutoffInterpolationResult {
  // Sort descending by score
  const sorted = [...pairs].sort((a, b) => b.score - a.score);
  const totalWeight = sorted.reduce((acc, p) => acc + p.weight, 0);
  const r = Math.round(seats * coverage * 100) / 100;

  if (sorted.length === 0) {
    return {
      cutoff: null,
      targetRank: r,
      k: 0,
      f: 0,
      warning: "NO_SAMPLE",
    };
  }

  if (r > totalWeight) {
    return {
      cutoff: null,
      targetRank: r,
      k: Math.floor(r),
      f: r - Math.floor(r),
      warning: `BOUNDARY_OUTSIDE_SAMPLE: Target sample rank (${r}) exceeds total weighted sample (${Math.round(totalWeight * 10) / 10})`,
    };
  }

  if (r <= sorted[0].weight) {
    return {
      cutoff: sorted[0].score,
      targetRank: r,
      k: 1,
      f: 0,
      warning: "BOUNDARY_BELOW_SAMPLE",
    };
  }

  let cumWeight = 0;
  for (let i = 0; i < sorted.length; i++) {
    const prevCum = cumWeight;
    cumWeight += sorted[i].weight;

    if (cumWeight >= r) {
      if (i === 0) {
        return {
          cutoff: sorted[0].score,
          targetRank: r,
          k: 1,
          f: 0,
        };
      }
      // Linear interpolation between score at index i-1 and i
      const fraction = (r - prevCum) / sorted[i].weight;
      const cutoff = sorted[i - 1].score + fraction * (sorted[i].score - sorted[i - 1].score);
      return {
        cutoff: Math.round(cutoff * 100) / 100,
        targetRank: r,
        k: i,
        f: Math.round(fraction * 100) / 100,
      };
    }
  }

  return {
    cutoff: sorted[sorted.length - 1].score,
    targetRank: r,
    k: sorted.length,
    f: 0,
  };
}

/**
 * 11. Bootstrap Resampling for 80% Uncertainty Interval (10th to 90th percentile)
 * Runs 400 iterations of sampling with replacement.
 */
export function calculateBootstrapInterval(
  scores: number[],
  weights: number[] | null,
  seats: number,
  coverage: number,
  iterations: number = 400
): BootstrapIntervalResult {
  const n = scores.length;
  if (n < 5) {
    return {
      p10: null,
      p50: null,
      p90: null,
      validIterations: 0,
      warning: "THIN_SAMPLE: Sample size insufficient for reliable bootstrap resampling",
    };
  }

  const cutoffs: number[] = [];

  for (let b = 0; b < iterations; b++) {
    const resampledScores: number[] = [];
    const resampledWeights: number[] = [];

    for (let i = 0; i < n; i++) {
      const idx = Math.floor(Math.random() * n);
      resampledScores.push(scores[idx]);
      if (weights) {
        resampledWeights.push(weights[idx]);
      }
    }

    resampledScores.sort((a, b) => b - a);

    if (weights) {
      const pairs = resampledScores.map((score, idx) => ({
        score,
        weight: resampledWeights[idx],
      }));
      const res = calculateWeightedCutoff(pairs, seats, coverage);
      if (res.cutoff !== null) {
        cutoffs.push(res.cutoff);
      }
    } else {
      const res = calculateCutoffInterpolation(resampledScores, seats, coverage);
      if (res.cutoff !== null) {
        cutoffs.push(res.cutoff);
      }
    }
  }

  if (cutoffs.length < iterations * 0.5) {
    return {
      p10: null,
      p50: null,
      p90: null,
      validIterations: cutoffs.length,
      warning: "INSUFFICIENT_BOOTSTRAP_SUPPORT: Majority of bootstrap draws fell outside sample boundary",
    };
  }

  cutoffs.sort((a, b) => a - b);
  const p10Idx = Math.floor(cutoffs.length * 0.1);
  const p50Idx = Math.floor(cutoffs.length * 0.5);
  const p90Idx = Math.floor(cutoffs.length * 0.9);

  return {
    p10: Math.round(cutoffs[p10Idx] * 100) / 100,
    p50: Math.round(cutoffs[p50Idx] * 100) / 100,
    p90: Math.round(cutoffs[p90Idx] * 100) / 100,
    validIterations: cutoffs.length,
  };
}
