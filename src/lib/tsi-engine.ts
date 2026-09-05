/**
 * Module 1: Travel Safety Index (TSI) Engine
 *
 * Patent-worthy algorithm: Composite 5-dimension risk scoring model with
 * dynamic weight recalibration based on user risk tolerance profile.
 *
 * TSI = Σ(wᵢ × normalizedDimension_i) × geopoliticalMultiplier × seasonalCorrection
 *
 * Dimensions:
 *   1. Crime Safety   — inverted crimeIndex → safe score
 *   2. Political Stability — geopolitical risk level → safe score
 *   3. Health Risk    — mapped from destination data / health concerns
 *   4. Weather Hazard — seasonal hazard modifier
 *   5. Cultural Friction — how easy is cultural adaptation
 *
 * Weight Recalibration:
 *   riskTolerance=1 (cautious) → weights safety dimensions heavily
 *   riskTolerance=5 (seeker)   → weights adventure dimensions, penalizes less
 */

import { Destination, CustomerRequirements, TSIResult, TSIComponent } from './types';

// ─── Weight Table per risk tolerance level ─────────────────────────────────────
// [crimeSafety, politicalStability, healthRisk, weatherHazard, culturalFriction]
const WEIGHT_TABLE: Record<number, [number, number, number, number, number]> = {
  1: [0.35, 0.30, 0.20, 0.10, 0.05], // Very cautious: crime + political dominate
  2: [0.30, 0.28, 0.18, 0.14, 0.10],
  3: [0.25, 0.25, 0.18, 0.18, 0.14], // Balanced
  4: [0.20, 0.20, 0.18, 0.22, 0.20],
  5: [0.15, 0.18, 0.17, 0.25, 0.25], // Thrill seeker: weather + culture weighted more
};

// ─── Geopolitical cascade multipliers ────────────────────────────────────────
const GEO_MULTIPLIER: Record<string, number> = {
  low: 1.0,
  medium: 0.82,
  high: 0.55,
};

// ─── Seasonal hazard modifiers (by month) ────────────────────────────────────
const SEASONAL_MODIFIERS: Record<string, number> = {
  January: 2, February: 2, March: 1, April: 1, May: 0,
  June: -2, July: -3, August: -3, September: -1, October: 0,
  November: 1, December: 2,
};

// ─── Cultural friction score by region ─────────────────────────────────────────
const CULTURAL_FRICTION: Record<string, number> = {
  'Europe': 80,        // Low friction: familiar customs for most tourists
  'North America': 85,
  'East Asia': 60,     // Medium: language barrier, different customs
  'Southeast Asia': 70,
  'Middle East': 55,   // Higher: strict rules, language barrier
  'South Asia': 65,
  'Indian Ocean': 72,
  'Africa': 62,
  'South America': 68,
  'International': 65,
};

// ─── Health risk base score by region ────────────────────────────────────────
const HEALTH_RISK_BASE: Record<string, number> = {
  'Europe': 90,
  'North America': 88,
  'East Asia': 82,
  'Southeast Asia': 65, // Dengue, food hygiene concerns
  'Middle East': 78,
  'South Asia': 62,
  'Indian Ocean': 75,
  'Africa': 52,
  'South America': 65,
  'International': 70,
};

// ─── Weather hazard score by condition ────────────────────────────────────────
function computeWeatherHazardScore(condition: string): number {
  const lc = condition.toLowerCase();
  if (lc.includes('cyclone') || lc.includes('typhoon') || lc.includes('hurricane')) return 15;
  if (lc.includes('extreme') || lc.includes('monsoon') || lc.includes('flood')) return 30;
  if (lc.includes('very hot') || lc.includes('humid')) return 45;
  if (lc.includes('hot') || lc.includes('wet season')) return 60;
  if (lc.includes('mild') || lc.includes('warm')) return 80;
  if (lc.includes('pleasant') || lc.includes('ideal') || lc.includes('sunny')) return 90;
  if (lc.includes('cold') || lc.includes('snow') || lc.includes('rainy')) return 55;
  return 70;
}

// ─── Risk label + color from score ────────────────────────────────────────────
function getRiskLabel(score: number): TSIResult['riskLabel'] {
  if (score >= 80) return 'Very Safe';
  if (score >= 65) return 'Safe';
  if (score >= 50) return 'Moderate';
  if (score >= 35) return 'Risky';
  return 'Dangerous';
}

function getRiskColor(score: number): string {
  if (score >= 80) return '#10B981';  // emerald
  if (score >= 65) return '#22D3EE';  // cyan
  if (score >= 50) return '#F59E0B';  // amber
  if (score >= 35) return '#F97316';  // orange
  return '#EF4444';                   // red
}

function getAdvisory(score: number, dest: Destination, riskTolerance: number): string {
  if (score >= 80) return `${dest.city} is an excellent choice for your safety profile. Enjoy your trip with confidence!`;
  if (score >= 65) return `${dest.city} is safe for most travelers. Follow standard precautions and stay alert in crowded areas.`;
  if (score >= 50) return `${dest.city} requires moderate vigilance. We recommend comprehensive travel insurance and staying informed of local conditions.`;
  if (score >= 35) return `${dest.city} carries elevated risk. Consider travel advisories carefully and register your trip with your embassy.`;
  return `${dest.city} has significant safety concerns. ${riskTolerance <= 2 ? 'Given your cautious profile, we strongly recommend reconsidering this destination.' : 'Ensure thorough preparation, insurance, and local contacts before travel.'}`;
}

// ─── Main TSI Computation ──────────────────────────────────────────────────────
export function computeTSI(
  destination: Destination,
  requirements: CustomerRequirements
): TSIResult {
  const rt = Math.max(1, Math.min(5, requirements.riskTolerance || 3));
  const weights = WEIGHT_TABLE[rt];

  // Dimension 1: Crime Safety (0-100, higher = safer)
  const crimeSafetyScore = Math.max(0, Math.min(100, destination.safety.safetyIndex));

  // Dimension 2: Political Stability
  const geoRisk = destination.safety.geopoliticalRisk;
  const politicalScore = geoRisk === 'low' ? 90 : geoRisk === 'medium' ? 55 : 20;

  // Dimension 3: Health Risk
  const baseHealthScore = HEALTH_RISK_BASE[destination.region] ?? 70;
  // Penalize if user has health concerns
  const healthPenalty = (requirements.healthConcerns?.length ?? 0) * 5;
  const healthScore = Math.max(20, baseHealthScore - healthPenalty);

  // Dimension 4: Weather Hazard
  const currentMonth = requirements.travelMonth;
  const weatherInfo = destination.weather.find(w => w.month === currentMonth) || destination.weather[0];
  const weatherScore = weatherInfo ? computeWeatherHazardScore(weatherInfo.condition) : 70;

  // Dimension 5: Cultural Friction
  const culturalScore = CULTURAL_FRICTION[destination.region] ?? 65;

  const dimensionRawScores = [crimeSafetyScore, politicalScore, healthScore, weatherScore, culturalScore];
  const dimensionNames = ['Crime Safety', 'Political Stability', 'Health Risk', 'Weather Safety', 'Cultural Ease'];

  // Compute weighted sum
  let weightedSum = 0;
  const components: TSIComponent[] = dimensionNames.map((name, i) => {
    const raw = dimensionRawScores[i];
    const weight = weights[i];
    const weighted = raw * weight;
    weightedSum += weighted;
    return { name, rawScore: raw, weight, weightedScore: weighted };
  });

  // Apply geopolitical cascade multiplier
  const geoMultiplier = GEO_MULTIPLIER[geoRisk] ?? 1.0;
  const afterGeo = weightedSum * geoMultiplier;

  // Apply seasonal correction (±5)
  const seasonalCorrectionBase = SEASONAL_MODIFIERS[currentMonth] ?? 0;
  const finalScore = Math.max(5, Math.min(98, Math.round(afterGeo + seasonalCorrectionBase)));

  return {
    overallScore: finalScore,
    components,
    geopoliticalMultiplier: geoMultiplier,
    seasonalCorrection: seasonalCorrectionBase,
    riskTolerance: rt,
    riskLabel: getRiskLabel(finalScore),
    riskColor: getRiskColor(finalScore),
    advisory: getAdvisory(finalScore, destination, rt),
  };
}
