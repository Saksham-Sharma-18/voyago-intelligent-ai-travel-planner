'use client';
import { create } from 'zustand';
import { CustomerRequirements, Destination, ItineraryDay, CostBreakdown, TripPlan, UserArchetype, BehaviorSignal, AIROConstraints, SCOPlanVariant, GRRAdjustedScore, OptimizedDay, HotelOption } from './types';
import { generateItinerary, generateBookingRef, calculateCosts } from './trip-utils';
import { runAIAnalysis } from './ai-engine';
import { getDestinationPhotos, getDestinationPhotosPexels } from './photos';
import { computeArchetype } from './behavior-tracker';
import { optimizeDay as airoOptimizeDay, optimizeAllDays as airoOptimizeAll, getDefaultConstraints, scanForViolations } from './airo-engine';
import { generateSCOVariants } from './sco-engine';
import { applyGRR } from './grr-engine';

type AppStep = 'welcome' | 'requirements' | 'recommendations' | 'itinerary' | 'costs' | 'safety' | 'report' | 'booking' | 'confirmed';

interface AppState {
  step: AppStep;
  requirements: CustomerRequirements | null;
  recommendations: (Destination & { matchScore: number; grrScore?: GRRAdjustedScore })[];
  selectedDestination: Destination | null;
  itinerary: ItineraryDay[];
  costs: CostBreakdown | null;
  tripPlan: TripPlan | null;
  bookingRef: string | null;
  aiLoading: boolean;
  overallTip: string;
  monthTip: string;
  aiSource: 'gemini' | 'mock' | null;

  // ─── Innovation Module State ──────────────────────────────────────────────
  // BPL (Module 2)
  userArchetype: UserArchetype | null;
  behaviorSignals: BehaviorSignal[];
  // AIRO (Module 3)
  airoConstraints: AIROConstraints;
  optimizedDays: OptimizedDay[];
  // SCO (Module 4)
  scoVariants: SCOPlanVariant[];
  activeSCOPlan: 'bestValue' | 'dream' | 'safe' | null;

  // Hotel Selection
  selectedHotel: HotelOption | null;

  // ─── Actions ─────────────────────────────────────────────────────────────
  setStep: (step: AppStep) => void;
  setRequirements: (req: CustomerRequirements) => void;
  setRecommendations: (recs: (Destination & { matchScore: number })[]) => void;
  runAIRecommendations: (req: CustomerRequirements) => void;
  selectDestination: (dest: Destination) => void;
  setItinerary: (items: ItineraryDay[]) => void;
  addAttraction: (dayId: string, attraction: import('./types').TouristAttraction) => void;
  removeAttraction: (dayId: string, attractionId: string) => void;
  removeDay: (dayId: string) => void;
  addDay: () => void;
  finalizePlan: () => void;
  setBookingComplete: () => void;
  reset: () => void;

  // BPL actions (Module 2)
  addBehaviorSignal: (signal: Omit<BehaviorSignal, 'timestamp'>) => void;
  recomputeArchetype: () => void;

  // AIRO actions (Module 3)
  updateAIROConstraints: (constraints: Partial<AIROConstraints>) => void;
  optimizeDayById: (dayId: string) => void;
  optimizeAllDays: () => void;

  // SCO actions (Module 4)
  computeSCOVariants: () => void;
  applyActiveSCOPlan: (planType: 'bestValue' | 'dream' | 'safe') => void;

  // Hotel selection
  setSelectedHotel: (hotel: HotelOption | null) => void;
}

const DEFAULT_AIRO_CONSTRAINTS: AIROConstraints = {
  maxHoursPerDay: 8,
  maxEntryFeePerDay: 150,
  maxFatigueScore: 70,
  avoidCrowds: false,
  geopoliticalExclusions: [],
};

export const useAppStore = create<AppState>((set, get) => ({
  step: 'welcome',
  requirements: null,
  recommendations: [],
  selectedDestination: null,
  itinerary: [],
  costs: null,
  tripPlan: null,
  bookingRef: null,
  aiLoading: false,
  overallTip: '',
  monthTip: '',
  aiSource: null,

  // Innovation state
  userArchetype: null,
  behaviorSignals: [],
  airoConstraints: DEFAULT_AIRO_CONSTRAINTS,
  optimizedDays: [],
  scoVariants: [],
  activeSCOPlan: null,
  selectedHotel: null,

  setStep: (step) => set({ step }),

  setRequirements: (req) => set({ requirements: req }),

  setRecommendations: (recs) => set({ recommendations: recs }),

  runAIRecommendations: (req: CustomerRequirements) => {
    set({ aiLoading: true, requirements: req, step: 'recommendations' });

    // Update AIRO constraints based on risk tolerance
    const airoConstraints = getDefaultConstraints(req.riskTolerance || 3);
    set({ airoConstraints });

    // Compute archetype from current state
    const { behaviorSignals } = get();
    const archetype = computeArchetype(req, behaviorSignals);
    set({ userArchetype: archetype });

    (async () => {
      try {
        const result = await runAIAnalysis(req);

        const recsWithFallbackPhotos = result.rankedDestinations.map(dest => ({
          ...dest,
          aiReasoning: dest.aiInsight.reasoning,
          suggestedHotels: dest.aiInsight.hotels,
          mustDoActivity: dest.aiInsight.mustDoActivity,
          activityInsights: dest.aiInsight.activityInsights,
          photos: getDestinationPhotos(dest.id, 3),
          // Apply GRR (Module 5)
          grrScore: applyGRR(dest, req.riskTolerance || 3, dest.matchScore),
        }));

        // Sort by GRR-adjusted score
        const grrSorted = [...recsWithFallbackPhotos].sort(
          (a, b) => (b.grrScore?.finalScore ?? b.matchScore) - (a.grrScore?.finalScore ?? a.matchScore)
        );

        set({
          recommendations: grrSorted,
          overallTip: result.overallTip,
          monthTip: result.monthTip,
          aiLoading: false,
          aiSource: result.source,
        });

        // Upgrade to Pexels photos
        const pexelsResults = await Promise.allSettled(
          result.rankedDestinations.map(dest => {
            const query = `${dest.city} ${dest.country} travel landscape`;
            return getDestinationPhotosPexels(dest.id, 3, query)
              .then(photos => ({ id: dest.id, photos }));
          })
        );

        const photoMap = new Map<string, ReturnType<typeof getDestinationPhotos>>();
        pexelsResults.forEach(r => {
          if (r.status === 'fulfilled') {
            photoMap.set(r.value.id, r.value.photos);
          }
        });

        if (photoMap.size > 0) {
          set(state => ({
            recommendations: state.recommendations.map(dest =>
              photoMap.has(dest.id)
                ? { ...dest, photos: photoMap.get(dest.id)! }
                : dest
            ),
          }));
        }
      } catch (err) {
        console.error('[store] runAIRecommendations failed:', err);
        set({ aiLoading: false });
      }
    })();
  },

  selectDestination: (dest) => {
    const { requirements } = get();
    if (!requirements) return;
    const itinerary = generateItinerary(dest, requirements);
    const costs = calculateCosts(dest, requirements);

    // Pre-compute AIRO violations on fresh itinerary
    const { airoConstraints } = get();
    const optimizedDays = airoOptimizeAll(itinerary, airoConstraints);

    // Pre-compute SCO variants
    const scoVariants = generateSCOVariants(costs, requirements, dest);

    set({ selectedDestination: dest, itinerary, costs, optimizedDays, scoVariants });
  },

  setItinerary: (items) => set({ itinerary: items }),

  addAttraction: (dayId, attraction) => set(state => ({
    itinerary: state.itinerary.map(day =>
      day.id === dayId
        ? { ...day, attractions: [...day.attractions, attraction] }
        : day
    )
  })),

  removeAttraction: (dayId, attractionId) => set(state => ({
    itinerary: state.itinerary.map(day =>
      day.id === dayId
        ? { ...day, attractions: day.attractions.filter(a => a.id !== attractionId) }
        : day
    )
  })),

  removeDay: (dayId) => set(state => ({
    itinerary: state.itinerary.filter(day => day.id !== dayId)
      .map((day, idx) => ({ ...day, day: idx + 1, id: `day-${idx + 1}` }))
  })),

  addDay: () => set(state => {
    const dest = state.selectedDestination;
    if (!dest) return state;
    // Use last day's hotel or fall back to a well-known brand for the city
    const CITY_FLAGSHIP_HOTEL: Record<string, string> = {
      'Dubai': 'Burj Al Arab Jumeirah',
      'Paris': 'Ritz Paris',
      'Bali': 'Four Seasons Resort Bali at Sayan',
      'Tokyo': 'Aman Tokyo',
      'Malé': 'Soneva Fushi',
      'New York City': 'The Plaza Hotel',
      'Sydney': 'Park Hyatt Sydney',
      'Vienna': 'Hotel Sacher Wien',
      'Helsinki': 'Hotel Kämp',
      'Singapore': 'Raffles Hotel Singapore',
      'Athens': 'Hotel Grande Bretagne',
      'Cairo': 'Four Seasons Hotel Cairo at Nile Plaza',
      'Barcelona': 'El Palace Barcelona',
      'London': 'Claridge\'s London',
      'Kathmandu': 'Dwarika\'s Hotel Kathmandu',
      'Thimphu': 'Amankora Thimphu',
      'Dublin': 'The Shelbourne Dublin',
    };
    const newDay: ItineraryDay = {
      id: `day-${state.itinerary.length + 1}`,
      day: state.itinerary.length + 1,
      location: dest.city,
      attractions: [],
      activities: [],
      hotel: state.itinerary[state.itinerary.length - 1]?.hotel
        || CITY_FLAGSHIP_HOTEL[dest.city]
        || `Four Seasons Hotel ${dest.city}`,
      notes: 'Day at leisure — explore on your own.',
    };
    return { itinerary: [...state.itinerary, newDay] };
  }),

  finalizePlan: () => {
    const { requirements, selectedDestination, itinerary, costs } = get();
    if (!requirements || !selectedDestination || !costs) return;
    const ref = generateBookingRef();
    const plan: TripPlan = {
      id: ref,
      customer: requirements,
      destination: selectedDestination,
      itinerary,
      costs,
      createdAt: new Date().toISOString(),
      bookingRef: ref,
      status: 'planning',
    };
    set({ tripPlan: plan, bookingRef: ref });
  },

  setBookingComplete: () => set(state => ({
    tripPlan: state.tripPlan ? { ...state.tripPlan, status: 'confirmed' } : null
  })),

  reset: () => set({
    step: 'welcome',
    requirements: null,
    recommendations: [],
    selectedDestination: null,
    itinerary: [],
    costs: null,
    tripPlan: null,
    bookingRef: null,
    aiLoading: false,
    overallTip: '',
    monthTip: '',
    aiSource: null,
    userArchetype: null,
    behaviorSignals: [],
    airoConstraints: DEFAULT_AIRO_CONSTRAINTS,
    optimizedDays: [],
    scoVariants: [],
    activeSCOPlan: null,
    selectedHotel: null,
  }),

  // ─── BPL Actions (Module 2) ───────────────────────────────────────────────
  addBehaviorSignal: (signal) => {
    const newSignal: BehaviorSignal = { ...signal, timestamp: Date.now() };
    set(state => ({ behaviorSignals: [...state.behaviorSignals.slice(-50), newSignal] })); // keep last 50
    // Re-compute archetype
    const { requirements, behaviorSignals } = get();
    if (requirements) {
      const archetype = computeArchetype(requirements, [...behaviorSignals, newSignal]);
      set({ userArchetype: archetype });
    }
  },

  recomputeArchetype: () => {
    const { requirements, behaviorSignals } = get();
    const archetype = computeArchetype(requirements || {}, behaviorSignals);
    set({ userArchetype: archetype });
  },

  // ─── AIRO Actions (Module 3) ───────────────────────────────────────────────
  updateAIROConstraints: (partial) => {
    set(state => ({
      airoConstraints: { ...state.airoConstraints, ...partial }
    }));
    // Re-scan violations with new constraints
    const { itinerary, airoConstraints } = get();
    const optimizedDays = airoOptimizeAll(itinerary, { ...airoConstraints, ...partial });
    set({ optimizedDays });
  },

  optimizeDayById: (dayId) => {
    const { itinerary, airoConstraints } = get();
    const day = itinerary.find(d => d.id === dayId);
    if (!day) return;

    const optimized = airoOptimizeDay(day, airoConstraints);

    // Apply the optimized order back to the itinerary
    set(state => ({
      itinerary: state.itinerary.map(d =>
        d.id === dayId
          ? { ...d, attractions: optimized.orderedAttractions }
          : d
      ),
      optimizedDays: state.optimizedDays.map(od =>
        od.dayId === dayId ? optimized : od
      ),
    }));
  },

  optimizeAllDays: () => {
    const { itinerary, airoConstraints } = get();
    const optimizedDays = airoOptimizeAll(itinerary, airoConstraints);

    // Apply optimized orders back to itinerary
    set(state => ({
      itinerary: state.itinerary.map(day => {
        const optimized = optimizedDays.find(od => od.dayId === day.id);
        return optimized
          ? { ...day, attractions: optimized.orderedAttractions }
          : day;
      }),
      optimizedDays,
    }));
  },

  // ─── SCO Actions (Module 4) ───────────────────────────────────────────────
  computeSCOVariants: () => {
    const { costs, requirements, selectedDestination } = get();
    if (!costs || !requirements || !selectedDestination) return;
    const variants = generateSCOVariants(costs, requirements, selectedDestination);
    set({ scoVariants: variants });
  },

  applyActiveSCOPlan: (planType) => {
    const { scoVariants } = get();
    const variant = scoVariants.find(v => v.type === planType);
    if (!variant) return;
    set({ costs: variant.adjustedCosts, activeSCOPlan: planType });
  },

  // Hotel Selection
  setSelectedHotel: (hotel: HotelOption | null) => set({ selectedHotel: hotel }),
}));
