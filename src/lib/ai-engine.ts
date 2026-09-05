/**
 * AI Recommendation Engine — Gemini 2.0 Flash powered
 *
 * Asks Gemini to recommend ANY 5-6 destinations worldwide (not limited to a
 * fixed list) with full destination data. Falls back to the built-in 6-destination
 * mock engine if the API is unavailable.
 */

import { CustomerRequirements, Destination, Activity, TouristAttraction } from './types';
import { DESTINATIONS } from './destinations-data';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface AIInsight {
  destinationId: string;
  reasoning: string;
  hotels: string[];
  mustDoActivity: string;
  activityInsights: Record<string, string>;
}

export interface AIAnalysisResult {
  rankedDestinations: (Destination & { matchScore: number; aiInsight: AIInsight })[];
  overallTip: string;
  monthTip: string;
  analysisTime: number;
  source: 'gemini' | 'mock';
}

// ─── Gemini raw destination shape ──────────────────────────────────────────────

interface GeminiDestination {
  id: string;
  city: string;
  country: string;
  region: string;
  emoji: string;
  tagline: string;
  description: string;
  matchScore: number;
  reasoning: string;
  bestFor: string[];
  budgetRange: string[];
  highlights: string[];
  safetyIndex: number;
  crimeIndex: number;
  geopoliticalRisk: string;
  geopoliticalStatus: string;
  travelAdvisory: string;
  language: string;
  currency: string;
  timezone: string;
  religion: string;
  culturalDos: string[];
  culturalDonts: string[];
  importantNotes: string[];
  weatherInMonth: string;
  suggestedHotels: string[];
  mustDoActivity: string;
  activities: Activity[];
  attractions: TouristAttraction[];
}

// ─── Build a full Destination from Gemini data ─────────────────────────────────

function buildDestination(g: GeminiDestination, travelMonth: string): Destination {
  return {
    id: g.id || `${g.city}-${g.country}`.toLowerCase().replace(/\s+/g, '-'),
    city: g.city,
    country: g.country,
    region: g.region || 'International',
    emoji: g.emoji || '✈️',
    tagline: g.tagline || `Discover ${g.city}`,
    description: g.description || '',
    bestFor: (g.bestFor || []) as Destination['bestFor'],
    budgetRange: (g.budgetRange || ['moderate']) as Destination['budgetRange'],
    highlights: g.highlights || [],
    weather: [{
      month: travelMonth,
      temp: '',
      condition: g.weatherInMonth || 'Check local forecasts',
      humidity: '',
      uvIndex: '',
      recommendedClothes: [],
    }],
    safety: {
      crimeIndex: g.crimeIndex ?? 30,
      safetyIndex: g.safetyIndex ?? 70,
      majorCrimes: [],
      geopoliticalStatus: g.geopoliticalStatus || 'Generally stable',
      geopoliticalRisk: (g.geopoliticalRisk as 'low' | 'medium' | 'high') || 'low',
      travelAdvisory: g.travelAdvisory || 'Standard travel precautions apply.',
    },
    cultural: {
      language: g.language || 'Local language',
      religion: g.religion || 'Various',
      currency: g.currency || 'Local currency',
      timezone: g.timezone || 'Local time',
      attractions: (g.attractions || []).map(a => a.name),
      dos: g.culturalDos || [],
      donts: g.culturalDonts || [],
      importantNotes: g.importantNotes || [],
    },
    activities: (g.activities || []).map((a, i) => ({
      id: a.id || `act-${i}`,
      name: a.name,
      type: a.type as Activity['type'],
      duration: a.duration || '2 hours',
      cost: Number(a.cost) || 50,
      difficulty: a.difficulty as Activity['difficulty'],
      description: a.description || '',
    })),
    attractions: (g.attractions || []).map((a, i) => ({
      id: a.id || `att-${i}`,
      name: a.name,
      type: a.type || 'Attraction',
      timeNeeded: a.timeNeeded || '2 hours',
      entryFee: Number(a.entryFee) || 0,
      description: a.description || '',
      bestTime: a.bestTime || 'Anytime',
    })),
  };
}

// ─── Gemini API Client ──────────────────────────────────────────────────────────

async function fetchGeminiAnalysis(requirements: CustomerRequirements): Promise<AIAnalysisResult> {
  const response = await fetch('/api/ai-recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requirements }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API failed: ${response.status}`);
  }

  const data = await response.json() as {
    destinations: GeminiDestination[];
    overallTip: string;
    monthTip: string;
  };

  if (!data.destinations || data.destinations.length === 0) {
    throw new Error('No destinations returned from Gemini');
  }

  const rankedDestinations = data.destinations
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    .map(item => {
      const dest = buildDestination(item, requirements.travelMonth);
      return {
        ...dest,
        matchScore: Math.min(Math.max(item.matchScore || 70, 0), 98),
        aiInsight: {
          destinationId: dest.id,
          reasoning: item.reasoning || '',
          hotels: item.suggestedHotels || [],
          mustDoActivity: item.mustDoActivity || '',
          activityInsights: {},
        } satisfies AIInsight,
      };
    });

  return {
    rankedDestinations,
    overallTip: data.overallTip || '',
    monthTip: data.monthTip || '',
    analysisTime: 2500 + Math.random() * 500,
    source: 'gemini',
  };
}

// ─── Mock Fallback Engine ────────────────────────────────────────────────────────

const HOTEL_DATABASE: Record<string, Record<number, string[]>> = {
  'dubai-uae': {
    3: ['Premier Inn Dubai Al Jaddaf', 'ibis Dubai Al Barsha', 'Citymax Hotel Al Barsha'],
    4: ['Sheraton Grand Hotel Dubai', 'Crowne Plaza Dubai Jumeirah', 'Hyatt Regency Dubai Creek'],
    5: ['Burj Al Arab Jumeirah', 'Atlantis The Palm', 'One&Only The Palm'],
    7: ['Burj Al Arab Royal Suite', 'Atlantis Royal', 'Armani Hotel Dubai'],
  },
  'paris-france': {
    3: ['ibis Paris Opera La Fayette', 'Hotel Victoires Opera', 'Timhotel Montmartre'],
    4: ['Hotel Lutetia', 'Le Grand Hotel Paris', 'Renaissance Paris Vendome'],
    5: ['Le Bristol Paris', 'Hotel de Crillon', 'The Peninsula Paris'],
    7: ['Ritz Paris Imperial Suite', 'Plaza Athénée Royal Suite', 'George V Presidential Suite'],
  },
  'bali-indonesia': {
    3: ['The Layar Seminyak', 'Katamama Boutique Hotel', 'Bisma Eight Ubud'],
    4: ['Four Points by Sheraton Bali', 'Alaya Resort Ubud', 'W Bali Seminyak'],
    5: ['COMO Uma Ubud', 'Bulgari Resort Bali', 'Six Senses Uluwatu'],
    7: ['Amankila Bali', 'Amanjiwo', 'The Mulia Nusa Dua'],
  },
  'tokyo-japan': {
    3: ['Shinjuku Granbell Hotel', 'Shibuya Excel Hotel Tokyu', 'APA Hotel Shinjuku'],
    4: ['Cerulean Tower Tokyu Hotel', 'Keio Plaza Hotel Tokyo', 'Hotel New Otani Tokyo'],
    5: ['The Peninsula Tokyo', 'Aman Tokyo', 'Mandarin Oriental Tokyo'],
    7: ['Aman Tokyo Garden Suite', 'The Peninsula Imperial Suite', 'Park Hyatt Presidential'],
  },
  'maldives': {
    3: ['Maafushi Inn', 'Kaani Village & Spa', 'Kuredu Island Resort'],
    4: ['Canareef Resort Maldives', 'Holiday Inn Resort Kandooma', 'Adaaran Select Meedhupparu'],
    5: ['Gili Lankanfushi', 'Baros Maldives', 'COMO Cocoa Island'],
    7: ['Soneva Jani', 'Cheval Blanc Randheli', 'The Nautilus Maldives'],
  },
  'new-york-usa': {
    3: ['Pod 51 Hotel', 'Row NYC', 'The Stewart Hotel'],
    4: ['Kimpton Hotel Eventi', 'The Lexington Hotel', 'Lotte New York Palace'],
    5: ['The Plaza Hotel', 'Four Seasons New York', 'Aman New York'],
    7: ['The Mark Presidential Suite', 'Four Seasons 65th Floor Suite', 'The Carlyle New York'],
  },
};

const MOCK_TIPS: Record<string, string[]> = {
  leisure: ['Resist the urge to over-plan. The best travel memories are found in the gaps between the scheduled events.'],
  adventure: ['Travel insurance is non-negotiable for adventure activities — check your policy covers all chosen activities.'],
  honeymoon: ['Tell every hotel, restaurant, and activity provider it\'s your honeymoon — the upgrades and special touches will cost nothing and add everything.'],
  culture: ['Download an offline guide to major museums before you go — the context transforms your visit.'],
  family: ['The golden ratio for family travel: 60% planned + 40% flexible.'],
  solo: ['Join one organised tour or class per destination — the fastest way to meet fellow travellers.'],
  business: ['Schedule one dedicated discovery half-day per city.'],
  group: ['Designate decision-free time each day where the group splits and each person follows their own curiosity.'],
};

const MOCK_MONTH_TIPS: Partial<Record<string, string>> = {
  January: 'January is peak season in warm destinations — book accommodation 2-3 months ahead.',
  February: 'Valentine\'s season drives prices up at romantic destinations — book early.',
  March: 'Cherry blossom season in Japan peaks mid-March to early April.',
  April: 'April is arguably the best month for European travel — spring blooms, pre-summer crowds.',
  May: 'May bridges spring and summer beautifully — excellent weather with shoulder-season pricing.',
  June: 'Monsoon season begins in Southeast Asia in June — check destination-specific rainfall patterns.',
  July: 'Peak summer everywhere — book everything months ahead.',
  August: 'European summer rush peaks — expect crowded beaches and museums.',
  September: 'One of the finest travel months globally — crowds thin, prices fall.',
  October: 'Autumn foliage in Japan, North America, and Europe creates extraordinary photography windows.',
  November: 'Excellent value month — pre-holiday pricing with post-summer quiet.',
  December: 'Book holiday weeks months ahead — demand is extreme.',
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function computeMockScore(dest: Destination, req: CustomerRequirements): number {
  let score = 0;
  if (dest.bestFor.includes(req.purpose)) score += 40;
  if (dest.budgetRange.includes(req.budgetRange)) score += 30;
  const interestMatches = req.interests.filter(i =>
    dest.highlights.some(h => h.toLowerCase().includes(i.toLowerCase())) ||
    dest.activities.some(a => a.type.toLowerCase().includes(i.toLowerCase()))
  );
  score += Math.min(interestMatches.length * 5, 20);
  if (dest.weather.some(w => w.month.toLowerCase() === req.travelMonth.toLowerCase())) score += 8;
  if (req.groupSize === 1 && dest.bestFor.includes('solo')) score += 5;
  if (req.groupSize >= 4 && dest.bestFor.includes('group')) score += 5;
  if (req.groupSize === 2 && dest.bestFor.includes('honeymoon')) score += 3;
  const spec = req.specialRequirements.toLowerCase();
  if (spec.includes('beach') && ['maldives', 'bali-indonesia', 'dubai-uae'].includes(dest.id)) score += 6;
  if (spec.includes('food') && ['tokyo-japan', 'paris-france', 'new-york-usa'].includes(dest.id)) score += 6;
  if ((spec.includes('romantic') || spec.includes('romance')) && ['paris-france', 'maldives', 'bali-indonesia'].includes(dest.id)) score += 8;
  return Math.min(Math.round(score), 98);
}

function runMockAnalysis(requirements: CustomerRequirements): AIAnalysisResult {
  const scored = DESTINATIONS.map(dest => {
    const hotelDb = HOTEL_DATABASE[dest.id] || {};
    const hotels = hotelDb[requirements.hotelStar] || hotelDb[4] || [`${dest.city} Premium Hotel`];
    return {
      ...dest,
      matchScore: computeMockScore(dest, requirements),
      aiInsight: {
        destinationId: dest.id,
        reasoning: `${dest.city} offers an excellent match for your ${requirements.purpose} trip with ${requirements.groupSize} traveller(s).`,
        hotels,
        mustDoActivity: dest.activities[0]
          ? `${dest.activities[0].name} is a must-do — ${dest.activities[0].description}`
          : `Explore ${dest.city}'s highlights with a local guide.`,
        activityInsights: {},
      } satisfies AIInsight,
    };
  }).sort((a, b) => b.matchScore - a.matchScore);

  const tips = MOCK_TIPS[requirements.purpose] || MOCK_TIPS['leisure'];
  return {
    rankedDestinations: scored,
    overallTip: pickRandom(tips),
    monthTip: MOCK_MONTH_TIPS[requirements.travelMonth] || 'Check local event calendars before you travel.',
    analysisTime: 1800 + Math.random() * 600,
    source: 'mock',
  };
}

// ─── Public API ─────────────────────────────────────────────────────────────────

export async function runAIAnalysis(requirements: CustomerRequirements): Promise<AIAnalysisResult> {
  try {
    return await fetchGeminiAnalysis(requirements);
  } catch (err) {
    console.warn('[ai-engine] Gemini unavailable, using mock fallback:', err);
    return runMockAnalysis(requirements);
  }
}
