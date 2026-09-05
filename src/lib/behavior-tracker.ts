/**
 * Module 2: Behavioral Personalization Layer (BPL)
 *
 * Patent-worthy algorithm: A passive in-session behavioral signal processor
 * that infers a traveler's archetype from interaction patterns without
 * requiring explicit self-reporting.
 *
 * Signal types captured:
 *   - interest_toggle: which interests they select (and in what order)
 *   - budget_change: how they move the budget slider
 *   - hover: how long they dwell on certain destination types
 *   - select/deselect: what they choose vs abandon
 *   - slider_drag: velocity and direction of budget changes
 *
 * Output: UserArchetype with 4 continuous scores + label classification
 */

import { BehaviorSignal, UserArchetype, CustomerRequirements } from './types';

// ─── Interest → Archetype mapping ─────────────────────────────────────────────
const INTEREST_SIGNALS: Record<string, Partial<Record<keyof Omit<UserArchetype, 'label' | 'emoji' | 'description'>, number>>> = {
  'Adventure':    { riskSeeker: 20, culturalDepth: 5 },
  'Sports':       { riskSeeker: 15 },
  'Beaches':      { riskSeeker: -5, luxuryOriented: 5 },
  'Nightlife':    { riskSeeker: 10, socialTraveler: 15 },
  'Food':         { culturalDepth: 15, socialTraveler: 5 },
  'Temples':      { culturalDepth: 20, riskSeeker: -5 },
  'Museums':      { culturalDepth: 20, riskSeeker: -10, luxuryOriented: 5 },
  'Nature':       { riskSeeker: 5, culturalDepth: 10, socialTraveler: -5 },
  'Shopping':     { luxuryOriented: 10, socialTraveler: 5 },
  'Spa':          { luxuryOriented: 15, riskSeeker: -15, socialTraveler: -5 },
  'Architecture': { culturalDepth: 15 },
  'Photography':  { culturalDepth: 10, riskSeeker: 5 },
  'Diving':       { riskSeeker: 15, socialTraveler: -5 },
};

// ─── Purpose → Archetype signal ────────────────────────────────────────────────
const PURPOSE_SIGNALS: Record<string, Partial<Record<keyof Omit<UserArchetype, 'label' | 'emoji' | 'description'>, number>>> = {
  'adventure': { riskSeeker: 30, culturalDepth: 5 },
  'leisure':   { riskSeeker: -10, luxuryOriented: 5 },
  'culture':   { culturalDepth: 30, riskSeeker: 5 },
  'honeymoon': { luxuryOriented: 20, socialTraveler: -20, riskSeeker: -5 },
  'family':    { socialTraveler: 20, riskSeeker: -15, luxuryOriented: -5 },
  'solo':      { socialTraveler: -30, riskSeeker: 10, culturalDepth: 10 },
  'business':  { luxuryOriented: 15, socialTraveler: -10, culturalDepth: -5 },
  'group':     { socialTraveler: 30, riskSeeker: 10 },
};

// ─── Budget → Luxury signal ────────────────────────────────────────────────────
const BUDGET_LUXURY_MAP: Record<string, number> = {
  'budget': -30,
  'moderate': 0,
  'luxury': 30,
  'ultra-luxury': 50,
};

// ─── Archetype classifier ──────────────────────────────────────────────────────
function classifyArchetype(scores: {
  riskSeeker: number;
  luxuryOriented: number;
  socialTraveler: number;
  culturalDepth: number;
}): { label: string; emoji: string; description: string } {
  const { riskSeeker, luxuryOriented, socialTraveler, culturalDepth } = scores;

  // Find the dominant dimension
  const dims = [
    { key: 'riskSeeker', val: riskSeeker },
    { key: 'luxuryOriented', val: luxuryOriented },
    { key: 'socialTraveler', val: socialTraveler },
    { key: 'culturalDepth', val: culturalDepth },
  ].sort((a, b) => b.val - a.val);

  const top = dims[0].key;
  const second = dims[1].key;

  if (top === 'riskSeeker' && riskSeeker > 60)
    return { label: 'The Thrill Seeker', emoji: '⚡', description: 'You chase adrenaline and live on the edge. High-octane experiences define your travels.' };
  if (top === 'culturalDepth' && culturalDepth > 60)
    return { label: 'The Cultural Connoisseur', emoji: '🏛️', description: 'You travel to understand, not just to see. Deep cultural immersion is your compass.' };
  if (top === 'luxuryOriented' && luxuryOriented > 60)
    return { label: 'The Luxury Voyager', emoji: '👑', description: 'Comfort and exclusivity define your journey. You deserve nothing but the finest.' };
  if (top === 'socialTraveler' && socialTraveler > 60)
    return { label: 'The Social Explorer', emoji: '🎉', description: 'Travel is best shared. You thrive in group dynamics and love meeting new people.' };
  if (riskSeeker < 30 && luxuryOriented > 40)
    return { label: 'The Comfort Seeker', emoji: '☕', description: 'Safety, comfort, and quality matter most. You don\'t sacrifice wellbeing for experience.' };
  if (top === 'riskSeeker' && second === 'culturalDepth')
    return { label: 'The Adventurous Explorer', emoji: '🗺️', description: 'Bold journeys with cultural depth. You seek meaning alongside adventure.' };
  if (top === 'culturalDepth' && second === 'socialTraveler')
    return { label: 'The Curious Nomad', emoji: '🌍', description: 'Culture, people, and stories fuel your wanderlust. Every trip is a learning journey.' };

  return { label: 'The Balanced Traveler', emoji: '✈️', description: 'You appreciate a well-rounded travel experience — a bit of everything.' };
}

// ─── Normalize score to 0-100 range ────────────────────────────────────────────
function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

// ─── Main: Compute UserArchetype from requirements + signals ───────────────────
export function computeArchetype(
  requirements: Partial<CustomerRequirements>,
  signals: BehaviorSignal[]
): UserArchetype {
  let riskSeeker = 50;   // neutral start
  let luxuryOriented = 50;
  let socialTraveler = 50;
  let culturalDepth = 50;

  // Apply purpose signals
  if (requirements.purpose) {
    const sig = PURPOSE_SIGNALS[requirements.purpose] || {};
    riskSeeker += sig.riskSeeker ?? 0;
    luxuryOriented += sig.luxuryOriented ?? 0;
    socialTraveler += sig.socialTraveler ?? 0;
    culturalDepth += sig.culturalDepth ?? 0;
  }

  // Apply budget signals
  if (requirements.budgetRange) {
    luxuryOriented += BUDGET_LUXURY_MAP[requirements.budgetRange] ?? 0;
  }

  // Apply group size signal
  if (requirements.groupSize) {
    if (requirements.groupSize === 1) socialTraveler -= 20;
    else if (requirements.groupSize === 2) socialTraveler += 0;
    else if (requirements.groupSize >= 4) socialTraveler += 15;
    else if (requirements.groupSize >= 8) socialTraveler += 25;
  }

  // Apply risk tolerance directly
  if (requirements.riskTolerance) {
    const riskDelta = (requirements.riskTolerance - 3) * 8; // -16 to +16
    riskSeeker += riskDelta;
  }

  // Apply interest signals
  for (const interest of (requirements.interests || [])) {
    const sig = INTEREST_SIGNALS[interest] || {};
    riskSeeker += sig.riskSeeker ?? 0;
    luxuryOriented += sig.luxuryOriented ?? 0;
    socialTraveler += sig.socialTraveler ?? 0;
    culturalDepth += sig.culturalDepth ?? 0;
  }

  // Apply behavioral signals from in-session tracking
  for (const signal of signals) {
    if (signal.type === 'interest_toggle') {
      const interest = signal.payload.interest as string;
      const sig = INTEREST_SIGNALS[interest] || {};
      const selected = signal.payload.selected as boolean;
      const multiplier = selected ? 0.5 : -0.3; // selections weigh more positively
      riskSeeker += (sig.riskSeeker ?? 0) * multiplier;
      luxuryOriented += (sig.luxuryOriented ?? 0) * multiplier;
      culturalDepth += (sig.culturalDepth ?? 0) * multiplier;
    }
    if (signal.type === 'budget_change') {
      // Large budget increases → luxury oriented
      const delta = signal.payload.delta as number;
      if (delta > 50000) luxuryOriented += 5;
      else if (delta < -50000) luxuryOriented -= 3;
    }
  }

  const scores = {
    riskSeeker: clamp(Math.round(riskSeeker)),
    luxuryOriented: clamp(Math.round(luxuryOriented)),
    socialTraveler: clamp(Math.round(socialTraveler)),
    culturalDepth: clamp(Math.round(culturalDepth)),
  };

  const { label, emoji, description } = classifyArchetype(scores);

  return { ...scores, label, emoji, description };
}
