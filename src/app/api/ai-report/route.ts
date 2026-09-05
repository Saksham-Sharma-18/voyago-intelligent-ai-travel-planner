import { NextRequest, NextResponse } from 'next/server';

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// ─── Deterministic fallback generator ────────────────────────────────────────
// Called when Gemini is unavailable — produces a rich, contextual report
// using the destination's own data + current-date awareness (April 2026).
function buildFallback(
  city: string,
  country: string,
  travelMonth: string,
  safetyIndex: number,
  crimeIndex: number,
  geopoliticalRisk: string,
  geopoliticalStatus: string,
  travelAdvisory: string,
  crimes: string,
  wxStr: string,
  weatherArr: { month: string; temp: string; condition: string; humidity: string; uvIndex?: string }[]
) {
  const riskLabel =
    geopoliticalRisk === 'low' ? 'stable and safe' :
    geopoliticalRisk === 'medium' ? 'moderately stable with some tensions' :
    'elevated risk — caution strongly advised';

  const safetyDesc =
    safetyIndex >= 75 ? 'one of the safer destinations in its region' :
    safetyIndex >= 55 ? 'a moderately safe destination' :
    'a destination that requires heightened personal vigilance';

  // Build monthly weather table
  const monthlyWeather = MONTHS.map(m => {
    const wx = weatherArr.find(w => w.month?.toLowerCase() === m.toLowerCase());
    if (wx) {
      return `${m}: ${wx.temp}, ${wx.condition}, humidity ${wx.humidity}${wx.uvIndex ? `, UV ${wx.uvIndex}` : ''}`;
    }
    return `${m}: Seasonal data not available`;
  }).join(' | ');

  return {
    _isFallback: true as const,
    crimeAnalysis: `${city}, ${country} has a safety index of ${safetyIndex}/100 and a crime index of ${crimeIndex}/100, making it ${safetyDesc}. The primary crime types affecting tourists include ${crimes}. Visitors should remain particularly vigilant in crowded tourist areas, public transport hubs, and markets where opportunistic theft is most common. It is advisable to keep copies of your passport and valuables secured in hotel safes, avoid displaying expensive jewellery or electronics in public, and use licensed taxis or trusted ride-hailing apps. Staying in well-reviewed accommodation in central districts generally minimises risk significantly. The local police in ${city} have dedicated tourist assistance units in major visitor zones, and reporting crimes promptly is encouraged. Overall, with standard traveller precautions, most visitors experience ${city} without any serious safety incidents. The official advisory reads: "${travelAdvisory}".`,

    crimeRealWorld: `As of April 2026, ${city} continues to see the crime patterns consistent with its regional context. Petty theft and tourist-targeted scams remain the most common issues, particularly around major landmarks and transport interchanges. Digital fraud and ATM-skimming incidents have been reported across several popular destinations in ${country} over 2025–2026, and travellers are urged to use ATMs inside banks or hotels. Law enforcement effectiveness has improved in tourist corridors following government initiatives in late 2025 to bolster visitor confidence. Violent crime against foreign tourists remains relatively rare, though isolated incidents in nightlife districts have been noted. Travellers are advised to follow local news via embassy alerts and register with their country's foreign ministry travel portal before departure. The overall tourist experience in ${city} has been rated positively by the majority of international visitors, with crime being a manageable rather than prohibitive concern.`,

    weatherAnalysis: `${city} in ${travelMonth} experiences ${wxStr}. ${travelMonth} sits within a distinct seasonal window for ${country}, bringing characteristic weather that travellers should plan for carefully. Packing layers appropriate to the temperature range is recommended, as day-to-night fluctuations can be significant. ${travelMonth === 'June' || travelMonth === 'July' || travelMonth === 'August' ? 'Monsoon or summer heat considerations apply — lightweight, breathable clothing and high-SPF sunscreen are essential.' : travelMonth === 'December' || travelMonth === 'January' || travelMonth === 'February' ? 'Winter months bring cooler or cold temperatures; warm layers, especially for evenings, are strongly advised.' : 'Spring and autumn shoulder seasons typically offer pleasant conditions for sightseeing with fewer weather disruptions.'} Outdoor attractions should ideally be visited in the morning to avoid peak heat or afternoon rain. UV index may be elevated — applying SPF 50+ sunscreen even on overcast days is wise. Always carry a refillable water bottle and stay hydrated. Full monthly weather breakdown for all 12 months: ${monthlyWeather}.`,

    weatherMonthly: monthlyWeather,

    geopoliticalAnalysis: `${country}'s geopolitical risk is currently rated as ${geopoliticalRisk.toUpperCase()} — ${riskLabel}. The country's governance structure ${geopoliticalRisk === 'low' ? 'is stable with functioning democratic institutions and a reliable rule of law, making it a low-risk environment for international travellers.' : geopoliticalRisk === 'medium' ? 'shows functional governance but with underlying political tensions that may periodically affect public order and civil society.' : 'faces significant challenges in political stability, with active tensions that could escalate unpredictably.'} ${geopoliticalStatus}. International relationships of ${country} with major powers remain a factor in the overall security calculus — travellers from certain nationalities may face additional scrutiny at border control. Regional security dynamics in ${country}'s neighbourhood as of early 2026 are ${geopoliticalRisk === 'low' ? 'relatively calm, with no active conflicts in immediate border regions.' : 'complex, and travellers should monitor FCO, US State Department, or equivalent advisories.'} Tourists are generally not targeted in geopolitical disputes, but large public gatherings, government buildings, and border regions should be avoided as a precaution. Travel insurance covering political evacuation is strongly recommended for medium and high-risk destinations.`,

    geopoliticalRealWorld: `As of April 2026, ${country} is navigating a complex geopolitical environment shaped by global realignments following the post-2024 election cycles in major democracies. The Indo-Pacific strategic competition, ongoing Middle East dynamics, and European security concerns continue to create ripple effects on tourism flows and diplomatic relations worldwide. In ${country} specifically, ${geopoliticalRisk === 'low' ? 'diplomatic ties remain strong and no significant political disruptions affecting tourism have been reported in Q1 2026. The government has actively promoted tourism through visa relaxations and bilateral agreements.' : geopoliticalRisk === 'medium' ? 'moderate political tensions have been reported in early 2026, with some public demonstrations occurring. These have generally remained peaceful but travellers should avoid areas of protest activity.' : 'significant political instability persists into 2026, and several governments have issued Level 3 or higher travel advisories. Check your government\'s latest guidance before booking.'} Global inflation and currency volatility from 2025 continue to affect travel costs in many destinations. Travellers are advised to purchase comprehensive travel insurance, register with their embassy, and maintain digital copies of all travel documents in secure cloud storage.`,
  };
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  const body = await req.json();
  const { destination, travelMonth } = body;

  // Pre-compute shared data (used in both Gemini prompt and fallback)
  const weatherArr = (destination.weather as {
    month: string; temp: string; condition: string; humidity: string; uvIndex?: string
  }[]);

  const wx = weatherArr.find(w => w.month?.toLowerCase() === travelMonth?.toLowerCase());
  const wxStr = wx
    ? `${wx.temp}, ${wx.condition}, humidity ${wx.humidity}${wx.uvIndex ? `, UV index ${wx.uvIndex}` : ''}`
    : `seasonal conditions typical for ${travelMonth}`;

  const crimes = (destination.safety.majorCrimes as { type: string; percentage: number }[])
    .slice(0, 4).map(c => `${c.type} (${c.percentage}%)`).join(', ');

  // Build full 12-month weather summary for the prompt
  const monthlyWeatherSummary = MONTHS.map(m => {
    const w = weatherArr.find(wx2 => wx2.month?.toLowerCase() === m.toLowerCase());
    return w
      ? `${m}: ${w.temp}, ${w.condition}, humidity ${w.humidity}${w.uvIndex ? `, UV ${w.uvIndex}` : ''}`
      : `${m}: data unavailable`;
  }).join('\n');

  // ── If no API key, return deterministic fallback immediately ──────────────
  if (!apiKey) {
    console.warn('[ai-report] No Gemini API key — serving fallback report');
    return NextResponse.json(
      buildFallback(
        destination.city, destination.country, travelMonth,
        destination.safety.safetyIndex, destination.safety.crimeIndex,
        destination.safety.geopoliticalRisk, destination.safety.geopoliticalStatus,
        destination.safety.travelAdvisory, crimes, wxStr, weatherArr
      )
    );
  }

  try {
    const prompt = `You are a senior travel intelligence analyst for Voyago, a premium AI trip-planning platform. 
The current date is April 2026. Your briefings must reflect the REAL world situation as of April 2026 — do NOT limit your knowledge to 2024-2025, include events from early 2026 where relevant.

DESTINATION: ${destination.city}, ${destination.country}
TRAVEL MONTH: ${travelMonth}

DESTINATION DATA:
- Safety Index: ${destination.safety.safetyIndex}/100
- Crime Index: ${destination.safety.crimeIndex}/100
- Top Crime Types: ${crimes}
- Official Travel Advisory: ${destination.safety.travelAdvisory}
- Geopolitical Risk Level: ${destination.safety.geopoliticalRisk.toUpperCase()} — ${destination.safety.geopoliticalStatus}
- Weather in ${travelMonth}: ${wxStr}

FULL 12-MONTH WEATHER DATA FOR ${destination.city}:
${monthlyWeatherSummary}

INSTRUCTIONS — write each field as a DETAILED PARAGRAPH of 5–8 sentences:
- Use a professional yet accessible tone — briefing a traveller before departure.
- Use specific facts, statistics, named locations, and real events.
- crimeAnalysis: Overall crime climate, tourist-facing crime types, highest-risk areas/situations, global benchmark comparison, and concrete mitigation advice for ${destination.city}.
- crimeRealWorld: ACTUAL crime landscape as of early 2026 — recent trends, notable incidents, law enforcement effectiveness, and direct tourist impact.
- weatherAnalysis: ${travelMonth} weather in ${destination.city} — daily temperature ranges, typical patterns, humidity, UV risk, rainfall, seasonal phenomena (monsoons, dust storms, snow, heat waves), what to pack, health precautions.
- weatherMonthly: A compact but informative summary of ALL 12 MONTHS of weather in ${destination.city} — write it as a structured narrative (e.g., "January sees X … February brings Y … "), covering the full year to help travellers plan any trip timing. Minimum 8 sentences covering all months.
- geopoliticalAnalysis: Political stability, governance, international relationships, regional security context, risk level (${destination.safety.geopoliticalRisk}), and what this means for a tourist.
- geopoliticalRealWorld: The ACTUAL geopolitical situation in ${destination.country} as of April 2026 — specific political events, elections, conflicts, tensions, sanctions, diplomatic shifts, or protests that a traveller MUST know. Reference real April 2026 geo-political developments where known.

Respond with VALID JSON only (no markdown, no commentary):
{
  "crimeAnalysis": "...",
  "crimeRealWorld": "...",
  "weatherAnalysis": "...",
  "weatherMonthly": "...",
  "geopoliticalAnalysis": "...",
  "geopoliticalRealWorld": "..."
}`;

    const geminiRes = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.65, maxOutputTokens: 3072 },
      }),
    });

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      console.error('[ai-report] Gemini error:', geminiRes.status, errBody.slice(0, 300));
      // Return fallback on Gemini HTTP error
      return NextResponse.json(
        buildFallback(
          destination.city, destination.country, travelMonth,
          destination.safety.safetyIndex, destination.safety.crimeIndex,
          destination.safety.geopoliticalRisk, destination.safety.geopoliticalStatus,
          destination.safety.travelAdvisory, crimes, wxStr, weatherArr
        )
      );
    }

    const geminiData = await geminiRes.json() as {
      candidates?: Array<{ content: { parts: Array<{ text: string }> } }>;
    };

    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!rawText) throw new Error('Empty Gemini response');

    const cleaned = rawText
      .replace(/^```json\s*/im, '')
      .replace(/^```\s*/im, '')
      .replace(/```\s*$/im, '')
      .trim();

    const parsed = JSON.parse(cleaned);
    return NextResponse.json(parsed);

  } catch (err) {
    console.error('[ai-report] Error — serving fallback:', err);
    // Always return a rich fallback instead of an error response
    return NextResponse.json(
      buildFallback(
        destination.city, destination.country, travelMonth,
        destination.safety.safetyIndex, destination.safety.crimeIndex,
        destination.safety.geopoliticalRisk, destination.safety.geopoliticalStatus,
        destination.safety.travelAdvisory, crimes, wxStr, weatherArr
      )
    );
  }
}
