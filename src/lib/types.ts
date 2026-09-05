export type TravelPurpose = 'leisure' | 'adventure' | 'culture' | 'business' | 'honeymoon' | 'family' | 'solo' | 'group';

export interface UnsplashPhoto {
  url: string;
  thumbUrl: string;
  alt: string;
  query: string;
}
export type HotelStar = 3 | 4 | 5 | 7;
export type BudgetRange = 'budget' | 'moderate' | 'luxury' | 'ultra-luxury';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface CustomerRequirements {
  name: string;
  email: string;
  phone: string;
  purpose: TravelPurpose;
  budgetRange: BudgetRange;
  budgetUSD: number;
  duration: number; // days
  groupSize: number;
  hotelStar: HotelStar;
  departureCity: string;
  travelMonth: string;
  interests: string[];
  specialRequirements: string;
  // Innovation Module fields
  riskTolerance: number; // 1 (very cautious) → 5 (thrill seeker)
  healthConcerns: string[]; // e.g. ['diabetes', 'heart condition', 'mobility issues']
  dietaryRestrictions: string[]; // e.g. ['vegan', 'halal', 'gluten-free']
}

export interface WeatherInfo {
  month: string;
  temp: string;
  condition: string;
  humidity: string;
  uvIndex: string;
  recommendedClothes: string[];
}

export interface SafetyInfo {
  crimeIndex: number;
  safetyIndex: number;
  majorCrimes: { type: string; percentage: number }[];
  geopoliticalStatus: string;
  geopoliticalRisk: 'low' | 'medium' | 'high';
  travelAdvisory: string;
}

export interface CulturalInfo {
  language: string;
  religion: string;
  currency: string;
  timezone: string;
  attractions: string[];
  dos: string[];
  donts: string[];
  importantNotes: string[];
}

export interface Activity {
  id: string;
  name: string;
  type: 'adventure' | 'sports' | 'cultural' | 'recreational' | 'food' | 'shopping';
  duration: string;
  cost: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  description: string;
}

export interface TouristAttraction {
  id: string;
  name: string;
  type: string;
  timeNeeded: string; // e.g. "2-3 hours"
  entryFee: number;
  description: string;
  bestTime: string;
  coordinates?: { lat: number; lng: number };
}

export interface ItineraryDay {
  id: string;
  day: number;
  date?: string;
  location: string;
  attractions: TouristAttraction[];
  activities: Activity[];
  hotel: string;
  notes: string;
}

export interface CostBreakdown {
  visa: number;
  flights: number;
  hotel: number; // per night
  totalHotel: number;
  food: number; // per day
  totalFood: number;
  shopping: number;
  activities: number;
  transport: number;
  insurance: number;
  miscellaneous: number;
  total: number;
}

export interface Destination {
  id: string;
  country: string;
  city: string;
  region: string;
  emoji: string;
  tagline: string;
  description: string;
  bestFor: TravelPurpose[];
  budgetRange: BudgetRange[];
  imageUrl?: string;
  highlights: string[];
  weather: WeatherInfo[];
  safety: SafetyInfo;
  cultural: CulturalInfo;
  activities: Activity[];
  attractions: TouristAttraction[];
  matchScore?: number;
  // AI & photo enhancements
  aiReasoning?: string;
  suggestedHotels?: string[];
  mustDoActivity?: string;
  activityInsights?: Record<string, string>;
  photos?: UnsplashPhoto[];
}

export interface TripPlan {
  id: string;
  customer: CustomerRequirements;
  destination: Destination;
  itinerary: ItineraryDay[];
  costs: CostBreakdown;
  createdAt: string;
  bookingRef?: string;
  status: 'planning' | 'booked' | 'confirmed';
}

// ─── Module 1: Travel Safety Index (TSI) ──────────────────────────────────────
export interface TSIComponent {
  name: string;
  rawScore: number;      // 0-100 (higher = safer in all dimensions)
  weight: number;        // dynamic weight based on riskTolerance
  weightedScore: number;
}

export interface TSIResult {
  overallScore: number;           // 0-100 (patented composite)
  components: TSIComponent[];
  geopoliticalMultiplier: number; // 0.55 | 0.82 | 1.0
  seasonalCorrection: number;     // ±5 based on travel month weather
  riskTolerance: number;          // user's input (1-5)
  riskLabel: 'Very Safe' | 'Safe' | 'Moderate' | 'Risky' | 'Dangerous';
  riskColor: string;              // hex color
  advisory: string;               // human-readable advisory
}

// ─── Module 2: Behavioral Personalization Layer (BPL) ──────────────────────────
export interface BehaviorSignal {
  type: 'hover' | 'select' | 'deselect' | 'interest_toggle' | 'budget_change' | 'slider_drag';
  payload: Record<string, unknown>;
  timestamp: number;
}

export interface UserArchetype {
  riskSeeker: number;        // 0-100 (0=risk-avoider, 100=thrill-seeker)
  luxuryOriented: number;    // 0-100 (0=budget, 100=ultra-luxury)
  socialTraveler: number;    // 0-100 (0=solo, 100=group)
  culturalDepth: number;     // 0-100 (0=surface tourist, 100=deep cultural)
  label: string;             // e.g. "The Adventurous Explorer"
  emoji: string;
  description: string;
}

// ─── Module 3: AIRO — Adaptive Itinerary Re-Optimizer ──────────────────────────
export interface AIROConstraints {
  maxHoursPerDay: number;       // 6-12 hrs
  maxEntryFeePerDay: number;    // USD
  maxFatigueScore: number;      // 0-100
  avoidCrowds: boolean;
  geopoliticalExclusions: string[]; // zone types to avoid
}

export interface ConstraintViolation {
  dayId: string;
  type: 'time_overflow' | 'budget_overflow' | 'fatigue_overflow';
  message: string;
  severity: 'warning' | 'critical';
  suggestedFix: string;
}

export interface OptimizedDay {
  dayId: string;
  orderedAttractions: TouristAttraction[];
  estimatedHours: number;
  estimatedCost: number;
  fatigueScore: number;
  efficiency: number; // value/time ratio
  violations: ConstraintViolation[];
}

// ─── Module 4: Smart Cost Optimizer (SCO) ──────────────────────────────────────
export type SCOPlanType = 'bestValue' | 'dream' | 'safe';

export interface SCOPlanVariant {
  type: SCOPlanType;
  label: string;
  description: string;
  emoji: string;
  adjustedCosts: CostBreakdown;
  efficiencyScore: number;  // quality per dollar (patented metric)
  budgetUtilization: number; // % of user budget used
  qualityScore: number;     // 0-100 experience quality estimate
  savingsVsDream: number;   // USD saved vs dream plan
  highlights: string[];     // what makes this plan special
}

// ─── Module 5: Geopolitical Risk Recalibration (GRR) ───────────────────────────
export interface GRRAdjustedScore {
  originalScore: number;
  grrMultiplier: number;      // 0.55 | 0.82 | 1.0 (cascade)
  riskAdjustment: number;     // user tolerance modifier
  finalScore: number;         // GRR-adjusted match score
  scoreDelta: number;         // how much it changed vs original
  triggerAdvisory: boolean;   // true if score dropped >20 pts
  advisoryText: string;
  advisoryLevel: 'info' | 'warning' | 'critical';
}

export interface BookingDetails {
  paymentMethod: 'card' | 'upi' | 'netbanking' | 'wallet';
  cardNumber?: string;
  cardName?: string;
  cvv?: string;
  expiry?: string;
  upiId?: string;
  bankName?: string;
  walletType?: string;
}

// ─── Hotel Picker (HotelOption) ─────────────────────────────────────────────────
export interface HotelOption {
  id: string;
  name: string;
  stars: number;
  pricePerNight: number;
  totalPrice: number;
  imageUrl: string;
  amenities: string[];
  description: string;
  rating: number;
  reviewCount: number;
  distanceFromCenter: string;
  type: 'luxury' | 'boutique' | 'resort' | 'heritage' | 'business';
}
