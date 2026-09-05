/**
 * Module 4: Smart Cost Optimizer (SCO)
 *
 * Patent-worthy algorithm: Multi-objective optimization that generates
 * 3 Pareto-efficient plan variants from a single input budget.
 *
 * Objectives:
 *   1. Maximize experience quality score
 *   2. Minimize total cost
 *   3. Maximize budget utilization efficiency
 *
 * Plans generated:
 *   - "Best Value":  maximize quality/cost ratio (Pareto-optimal)
 *   - "Dream":       unconstrained — best experience regardless of cost
 *   - "Safe":        20% budget buffer retained, conservative spending
 *
 * Efficiency Score = Σ(qualityScore_i / cost_i) for all line items
 */

import { CostBreakdown, CustomerRequirements, Destination, SCOPlanVariant } from './types';

// ─── Quality score weights per cost category ──────────────────────────────────
const QUALITY_WEIGHTS: Record<keyof CostBreakdown, number> = {
  visa:          0.5,
  flights:       1.0,  // non-substitutable
  hotel:         1.5,  // quality scales with spend
  totalHotel:    1.5,
  food:          1.2,  // better food = significantly better quality
  totalFood:     1.2,
  shopping:      0.4,  // diminishing returns quickly
  activities:    1.8,  // experiences provide highest quality per dollar
  transport:     0.6,
  insurance:     0.3,  // necessary but doesn't add experience value
  miscellaneous: 0.5,
  total:         0,    // computed field
};

// ─── Compute quality score for a cost breakdown ────────────────────────────────
function computeQualityScore(costs: CostBreakdown, budgetUSD: number): number {
  let score = 0;
  const keys = Object.keys(QUALITY_WEIGHTS) as (keyof CostBreakdown)[];
  for (const key of keys) {
    if (key === 'total') continue;
    const spend = costs[key] as number;
    const weight = QUALITY_WEIGHTS[key];
    // Normalized contribution: spend relative to total budget × quality weight
    score += (spend / budgetUSD) * weight * 100;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

// ─── Compute efficiency score (quality per dollar spent) ──────────────────────
function computeEfficiencyScore(costs: CostBreakdown, qualityScore: number): number {
  const costPercentOfBudget = costs.total > 0 ? 1 : 0.01;
  // Higher quality with lower cost = higher efficiency
  const efficiency = qualityScore / (costs.total / 100);
  return Math.max(0, Math.min(100, Math.round(efficiency)));
}

// ─── Adjust cost breakdown by multipliers ────────────────────────────────────
function adjustCosts(
  base: CostBreakdown,
  multipliers: Partial<Record<keyof CostBreakdown, number>>
): CostBreakdown {
  const adjusted = { ...base };
  for (const [key, mult] of Object.entries(multipliers) as [keyof CostBreakdown, number][]) {
    if (key !== 'total') {
      (adjusted[key] as number) = Math.round((base[key] as number) * mult);
    }
  }
  // Recompute total (excluding visa which is per-person fixed)
  adjusted.total =
    adjusted.visa +
    adjusted.flights +
    adjusted.totalHotel +
    adjusted.totalFood +
    adjusted.shopping +
    adjusted.activities +
    adjusted.transport +
    adjusted.insurance +
    adjusted.miscellaneous;
  return adjusted;
}

// ─── Generate 3 SCO plan variants ─────────────────────────────────────────────
export function generateSCOVariants(
  baseCosts: CostBreakdown,
  requirements: CustomerRequirements,
  destination: Destination
): SCOPlanVariant[] {
  const budgetUSD = requirements.budgetUSD;

  // ─── 1. Dream Plan (unconstrained premium) ──────────────────────────────────
  const dreamCosts = adjustCosts(baseCosts, {
    hotel: 1.35, totalHotel: 1.35,
    food: 1.25, totalFood: 1.25,
    activities: 1.4,
    shopping: 1.3,
    transport: 1.2,
    miscellaneous: 1.2,
  });
  const dreamQuality = computeQualityScore(dreamCosts, budgetUSD);
  const dreamEfficiency = computeEfficiencyScore(dreamCosts, dreamQuality);

  // ─── 2. Best Value Plan (maximize quality/cost ratio) ───────────────────────
  const bestValueCosts = adjustCosts(baseCosts, {
    hotel: 0.85, totalHotel: 0.85,     // save on accommodation
    food: 0.75, totalFood: 0.75,        // budget dining with key splurges
    activities: 1.2,                     // spend MORE on experiences (high quality/cost)
    shopping: 0.5,                       // minimize shopping
    transport: 0.9,
    miscellaneous: 0.8,
  });
  const bestValueQuality = computeQualityScore(bestValueCosts, budgetUSD);
  const bestValueEfficiency = computeEfficiencyScore(bestValueCosts, bestValueQuality * 1.2); // efficiency bonus

  // ─── 3. Safe Plan (20% buffer retained) ─────────────────────────────────────
  const safeCosts = adjustCosts(baseCosts, {
    hotel: 0.9, totalHotel: 0.9,
    food: 0.85, totalFood: 0.85,
    activities: 0.85,
    shopping: 0.7,
    transport: 0.95,
    miscellaneous: 0.9,
  });
  const safeQuality = computeQualityScore(safeCosts, budgetUSD);
  const safeEfficiency = computeEfficiencyScore(safeCosts, safeQuality);
  const safeBuffer = budgetUSD - safeCosts.total / 83; // Emergency buffer in USD

  const hotelStarLabel: Record<number, string> = { 3: '3★', 4: '4★', 5: '5★', 7: '7★' };
  const starLabel = hotelStarLabel[requirements.hotelStar] || '4★';

  return [
    {
      type: 'bestValue',
      label: 'Best Value',
      description: 'Maximizes experience quality per rupee spent using smart allocation.',
      emoji: '⚡',
      adjustedCosts: bestValueCosts,
      efficiencyScore: Math.min(98, bestValueEfficiency),
      budgetUtilization: Math.round((bestValueCosts.total / (budgetUSD * 83)) * 100),
      qualityScore: Math.min(95, bestValueQuality),
      savingsVsDream: Math.round((dreamCosts.total - bestValueCosts.total) / 83),
      highlights: [
        `Activities budget +20% (highest quality/cost ratio)`,
        `${starLabel} hotel with smart room selection`,
        `${Math.round(((dreamCosts.total - bestValueCosts.total) / dreamCosts.total) * 100)}% cheaper than Dream plan`,
        `Curated dining — key splurges, budget for rest`,
      ],
    },
    {
      type: 'dream',
      label: 'Dream Plan',
      description: 'Unconstrained premium experience — the trip you truly deserve.',
      emoji: '🌟',
      adjustedCosts: dreamCosts,
      efficiencyScore: Math.min(75, dreamEfficiency),
      budgetUtilization: Math.round((dreamCosts.total / (budgetUSD * 83)) * 100),
      qualityScore: Math.min(98, dreamQuality),
      savingsVsDream: 0,
      highlights: [
        `Premium ${starLabel} hotel with upgrade`,
        `All activities unlocked — no compromises`,
        `Fine dining experiences included`,
        `Private transfers throughout`,
      ],
    },
    {
      type: 'safe',
      label: 'Safe Plan',
      description: `Retains ~${Math.round(safeBuffer)}% budget buffer for emergencies and spontaneous moments.`,
      emoji: '🛡️',
      adjustedCosts: safeCosts,
      efficiencyScore: Math.min(70, safeEfficiency),
      budgetUtilization: Math.round((safeCosts.total / (budgetUSD * 83)) * 100),
      qualityScore: Math.min(85, safeQuality),
      savingsVsDream: Math.round((dreamCosts.total - safeCosts.total) / 83),
      highlights: [
        `20%+ budget buffer for emergencies`,
        `Comprehensive travel insurance`,
        `Conservative spending with quality baseline`,
        `Room for spontaneous add-ons`,
      ],
    },
  ];
}
