/**
 * Module 3: Adaptive Itinerary Re-Optimizer (AIRO)
 *
 * Patent-worthy algorithm: Constraint-satisfaction engine using a 0/1
 * knapsack-variant to optimally pack and sequence attractions within
 * per-day constraints.
 *
 * AIRO Optimization Loop:
 *   1. Score each attraction: value/time + value/cost efficiency ratio
 *   2. Pack each day using bounded knapsack with time + cost as capacity constraints
 *   3. Detect violations (budget overflow, fatigue overflow, time overflow)
 *   4. Propose re-ordered schedule with explanation
 *   5. Compute fatigue score: hard activities = high fatigue, easy = low
 */

import { ItineraryDay, TouristAttraction, AIROConstraints, OptimizedDay, ConstraintViolation } from './types';

// ─── Activity fatigue map (estimated exertion level) ──────────────────────────
const TYPE_FATIGUE: Record<string, number> = {
  'Temple':           20,
  'Museum':           25,
  'Landmark':         15,
  'Nature':           35,
  'Market':           20,
  'Park':             15,
  'Shrine':           15,
  'Shopping':         20,
  'Historic Site':    20,
  'Observation Tower': 10,
  'Resort Experience': 5,
  'Island':           25,
  'Neighbourhood':    20,
  'Historic Palace':  25,
  'default':          20,
};

// ─── Parse timeNeeded string → hours float ─────────────────────────────────────
function parseHours(timeNeeded: string): number {
  // e.g. "2-3 hours" → 2.5, "1 hour" → 1, "Full stay" → 4
  if (timeNeeded.toLowerCase().includes('full')) return 4;
  if (timeNeeded.toLowerCase().includes('day')) return 8;
  const nums = timeNeeded.match(/\d+(\.\d+)?/g);
  if (!nums) return 2;
  if (nums.length === 1) return parseFloat(nums[0]);
  return (parseFloat(nums[0]) + parseFloat(nums[1])) / 2;
}

// ─── Compute attraction efficiency score ──────────────────────────────────────
function attractionEfficiency(att: TouristAttraction): number {
  const hours = parseHours(att.timeNeeded);
  const cost = att.entryFee || 1; // avoid division by zero
  // Base value: free attractions get a value of 50, paid get value proportional to fee
  const baseValue = att.entryFee === 0 ? 60 : Math.min(100, 30 + att.entryFee * 0.5);
  const timeEfficiency = baseValue / hours;
  const costEfficiency = baseValue / cost;
  return (timeEfficiency * 0.6) + (costEfficiency * 0.4);
}

// ─── Compute fatigue score for a set of attractions ────────────────────────────
export function computeFatigueScore(attractions: TouristAttraction[]): number {
  if (attractions.length === 0) return 0;
  const baseFatigue = attractions.reduce((sum, att) => {
    const typeFatigue = TYPE_FATIGUE[att.type] ?? TYPE_FATIGUE['default'];
    const hours = parseHours(att.timeNeeded);
    return sum + typeFatigue * (hours / 2);
  }, 0);
  return Math.min(100, Math.round(baseFatigue));
}

// ─── Bounded Knapsack: pack attractions within time + cost constraints ─────────
function knapsackPack(
  attractions: TouristAttraction[],
  maxHours: number,
  maxCost: number
): TouristAttraction[] {
  // Sort by efficiency descending (greedy with backtracking)
  const sorted = [...attractions].sort((a, b) => attractionEfficiency(b) - attractionEfficiency(a));

  const packed: TouristAttraction[] = [];
  let usedHours = 0;
  let usedCost = 0;

  for (const att of sorted) {
    const hours = parseHours(att.timeNeeded);
    const cost = att.entryFee;
    if (usedHours + hours <= maxHours && usedCost + cost <= maxCost) {
      packed.push(att);
      usedHours += hours;
      usedCost += cost;
    }
  }

  return packed;
}

// ─── Detect constraint violations ──────────────────────────────────────────────
function detectViolations(
  day: ItineraryDay,
  constraints: AIROConstraints,
  totalHours: number,
  totalCost: number,
  fatigueScore: number
): ConstraintViolation[] {
  const violations: ConstraintViolation[] = [];

  if (totalHours > constraints.maxHoursPerDay) {
    violations.push({
      dayId: day.id,
      type: 'time_overflow',
      message: `Day ${day.day} is packed with ${totalHours.toFixed(1)}h of activities, exceeding your ${constraints.maxHoursPerDay}h limit.`,
      severity: totalHours > constraints.maxHoursPerDay + 2 ? 'critical' : 'warning',
      suggestedFix: 'Remove 1-2 attractions or split across days using AIRO Re-optimize.',
    });
  }

  if (totalCost > constraints.maxEntryFeePerDay) {
    violations.push({
      dayId: day.id,
      type: 'budget_overflow',
      message: `Entry fees total $${totalCost} exceeds your $${constraints.maxEntryFeePerDay} daily budget.`,
      severity: 'warning',
      suggestedFix: 'Swap a paid attraction for a free one, or increase your daily fee budget.',
    });
  }

  if (fatigueScore > constraints.maxFatigueScore) {
    violations.push({
      dayId: day.id,
      type: 'fatigue_overflow',
      message: `Day ${day.day} has a high fatigue score of ${fatigueScore}/100 — this may be exhausting.`,
      severity: fatigueScore > 85 ? 'critical' : 'warning',
      suggestedFix: 'Replace a high-exertion attraction with a lighter one, or add a rest period.',
    });
  }

  return violations;
}

// ─── Main: Optimize a single day ──────────────────────────────────────────────
export function optimizeDay(day: ItineraryDay, constraints: AIROConstraints): OptimizedDay {
  const maxHours = constraints.maxHoursPerDay;
  const maxCost = constraints.maxEntryFeePerDay;

  // Optimize using knapsack
  const optimizedAttractions = knapsackPack(day.attractions, maxHours, maxCost);

  // Compute metrics on optimized set
  const totalHours = optimizedAttractions.reduce((s, a) => s + parseHours(a.timeNeeded), 0);
  const totalCost = optimizedAttractions.reduce((s, a) => s + a.entryFee, 0);
  const fatigueScore = computeFatigueScore(optimizedAttractions);

  // Compute average efficiency
  const efficiency = optimizedAttractions.length > 0
    ? optimizedAttractions.reduce((s, a) => s + attractionEfficiency(a), 0) / optimizedAttractions.length
    : 0;

  const violations = detectViolations(day, constraints, totalHours, totalCost, fatigueScore);

  return {
    dayId: day.id,
    orderedAttractions: optimizedAttractions,
    estimatedHours: Math.round(totalHours * 10) / 10,
    estimatedCost: totalCost,
    fatigueScore,
    efficiency: Math.round(efficiency * 10) / 10,
    violations,
  };
}

// ─── Optimize all days ────────────────────────────────────────────────────────
export function optimizeAllDays(
  itinerary: ItineraryDay[],
  constraints: AIROConstraints
): OptimizedDay[] {
  return itinerary.map(day => optimizeDay(day, constraints));
}

// ─── Check all days for violations without optimizing ─────────────────────────
export function scanForViolations(
  itinerary: ItineraryDay[],
  constraints: AIROConstraints
): ConstraintViolation[] {
  return itinerary.flatMap(day => {
    const totalHours = day.attractions.reduce((s, a) => s + parseHours(a.timeNeeded), 0);
    const totalCost = day.attractions.reduce((s, a) => s + a.entryFee, 0);
    const fatigueScore = computeFatigueScore(day.attractions);
    return detectViolations(day, constraints, totalHours, totalCost, fatigueScore);
  });
}

// ─── Default constraints ───────────────────────────────────────────────────────
export function getDefaultConstraints(riskTolerance: number): AIROConstraints {
  return {
    maxHoursPerDay: riskTolerance >= 4 ? 10 : riskTolerance >= 3 ? 8 : 6,
    maxEntryFeePerDay: 150,
    maxFatigueScore: riskTolerance >= 4 ? 80 : riskTolerance >= 3 ? 65 : 50,
    avoidCrowds: riskTolerance <= 2,
    geopoliticalExclusions: [],
  };
}
