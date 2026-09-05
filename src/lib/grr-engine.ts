/**
 * Module 5: Geopolitical Risk Recalibration (GRR) Engine
 *
 * Patent-worthy algorithm: A cascade multiplier system that dynamically
 * re-scores travel recommendations by integrating geopolitical risk levels
 * with individual user risk tolerance profiles.
 *
 * GRR Cascade Model:
 *   BASE_MULTIPLIERS: low=1.0, medium=0.82, high=0.55
 *   User Risk Tolerance adjustment:
 *     riskTolerance=1 → penalty ×1.5 (more sensitive)
 *     riskTolerance=5 → penalty ×0.5 (less sensitive)
 *   Advisory trigger: if delta > 20 pts → surface geopolitical advisory
 */

import { Destination, GRRAdjustedScore } from './types';

// ─── Cascade multipliers per geopolitical risk level ─────────────────────────
const BASE_GRR_MULTIPLIERS: Record<string, number> = {
  low: 1.0,
  medium: 0.82,
  high: 0.55,
};

// ─── Advisory text templates ───────────────────────────────────────────────────
const ADVISORY_TEMPLATES: Record<string, Record<'info' | 'warning' | 'critical', string>> = {
  low: {
    info: 'This destination has a stable geopolitical environment. No special precautions required.',
    warning: '',
    critical: '',
  },
  medium: {
    info: '',
    warning: 'Moderate geopolitical tensions exist. Stay updated on local news, avoid demonstrations, and register with your embassy.',
    critical: '',
  },
  high: {
    info: '',
    warning: '',
    critical: 'GEOPOLITICAL ADVISORY: Significant political instability reported. We strongly recommend checking official government travel advisories before booking and purchasing comprehensive emergency evacuation insurance.',
  },
};

// ─── Main GRR Computation ──────────────────────────────────────────────────────
export function applyGRR(
  destination: Destination,
  riskTolerance: number,
  originalMatchScore: number
): GRRAdjustedScore {
  const rt = Math.max(1, Math.min(5, riskTolerance || 3));
  const geoRisk = destination.safety.geopoliticalRisk;

  const baseMultiplier = BASE_GRR_MULTIPLIERS[geoRisk] ?? 1.0;

  // User tolerance adjustment:
  // rt=1 → tolAdjust=1.5 (double the penalty)
  // rt=3 → tolAdjust=1.0 (neutral)
  // rt=5 → tolAdjust=0.5 (half the penalty)
  const toleranceAdjust = rt === 1 ? 1.5 : rt === 2 ? 1.25 : rt === 3 ? 1.0 : rt === 4 ? 0.75 : 0.5;

  // When multiplier < 1, penalty = (1 - multiplier). Apply tolerance to that penalty
  const basePenalty = 1.0 - baseMultiplier;
  const adjustedPenalty = basePenalty * toleranceAdjust;
  const riskAdjustment = 1.0 - adjustedPenalty;

  const finalScore = Math.max(5, Math.min(98, Math.round(originalMatchScore * riskAdjustment)));
  const scoreDelta = originalMatchScore - finalScore;

  // Trigger advisory if score dropped significantly or risk is high
  const triggerAdvisory = scoreDelta > 12 || geoRisk === 'high';

  let advisoryLevel: GRRAdjustedScore['advisoryLevel'] = 'info';
  let advisoryText = ADVISORY_TEMPLATES.low.info;

  if (geoRisk === 'medium') {
    advisoryLevel = 'warning';
    advisoryText = ADVISORY_TEMPLATES.medium.warning;
  } else if (geoRisk === 'high') {
    advisoryLevel = 'critical';
    advisoryText = ADVISORY_TEMPLATES.high.critical;
  }

  return {
    originalScore: originalMatchScore,
    grrMultiplier: baseMultiplier,
    riskAdjustment,
    finalScore,
    scoreDelta,
    triggerAdvisory,
    advisoryText,
    advisoryLevel,
  };
}

// ─── Batch apply GRR to ranked recommendations ─────────────────────────────────
export function applyGRRToAll<T extends { matchScore: number; safety: Destination['safety'] } & Partial<Destination>>(
  destinations: (T & Destination)[],
  riskTolerance: number
): (T & Destination & { grrScore: GRRAdjustedScore })[] {
  return destinations
    .map(dest => ({
      ...dest,
      grrScore: applyGRR(dest, riskTolerance, dest.matchScore),
    }))
    .sort((a, b) => b.grrScore.finalScore - a.grrScore.finalScore);
}
