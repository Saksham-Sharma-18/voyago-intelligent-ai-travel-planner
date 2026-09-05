import { NextRequest, NextResponse } from 'next/server';

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { requirements } = body;

    // Purpose-to-priority mapping so Gemini knows what to weight heavily
    const PURPOSE_CONTEXT: Record<string, string> = {
      honeymoon: 'romantic, intimate, couples-only — prioritise Maldives, Santorini, Bali, Paris, Amalfi, Seychelles, Fiji, Venice; romance, sunsets, overwater villas, candlelit dining are the top criteria',
      leisure: 'relaxed, comfortable — beach resorts, scenic towns, low-stress destinations',
      adventure: 'thrill-seeking — hiking, diving, trekking, extreme sports destinations',
      culture: 'heritage, history, architecture, local traditions; museums and ancient sites',
      solo: 'safe, social, backpacker-friendly cities with great transport',
      family: 'child-friendly, safe, varied activities for all ages',
      group: 'vibrant, social, nightlife, group-tour-friendly destinations',
      business: 'global hubs, excellent connectivity, business infrastructure',
    };
    const purposeGuide = PURPOSE_CONTEXT[requirements.purpose] || requirements.purpose;

    const prompt = `Travel AI for Voyago. Customer:
Purpose: ${requirements.purpose} (${purposeGuide})
Budget: ${requirements.budgetRange} ($${requirements.budgetUSD} total)
Duration: ${requirements.duration} days, Group: ${requirements.groupSize}, Hotel: ${requirements.hotelStar}★
Month: ${requirements.travelMonth}, From: ${requirements.departureCity}
Interests: ${requirements.interests.join(', ')}
Special: ${requirements.specialRequirements || 'none'}

Return 5-6 destinations ranked by how well they match PURPOSE "${requirements.purpose}" FIRST, then budget and interests. The #1 destination must be the most iconic choice for "${requirements.purpose}" travel.

CRITICAL: suggestedHotels must be 3 REAL, NAMED, UNIQUE hotels that actually exist in that specific city (e.g. "Burj Al Arab, Dubai" not just "5-star hotel"). Hotels must differ between destinations.

JSON only, no markdown:
{"destinations":[{"id":"city-country","city":"","country":"","region":"","emoji":"🏳️","tagline":"","description":"2 sentences","matchScore":95,"reasoning":"2 sentences why this fits ${requirements.purpose} for this customer","bestFor":["honeymoon"],"budgetRange":["luxury"],"highlights":["5 highlights"],"safetyIndex":80,"crimeIndex":20,"geopoliticalRisk":"low","geopoliticalStatus":"1 sentence","travelAdvisory":"1 sentence","language":"","currency":"1 USD ≈ X","timezone":"GMT+X","religion":"","culturalDos":["5 dos"],"culturalDonts":["5 donts"],"importantNotes":["5 notes with emojis"],"weatherInMonth":"${requirements.travelMonth} weather: temp, conditions, what to wear","suggestedHotels":["Real Hotel Name 1, City","Real Hotel Name 2, City","Real Hotel Name 3, City"],"mustDoActivity":"1 must-do activity for ${requirements.purpose} travellers, 2 sentences","activities":[{"id":"a1","name":"","type":"adventure","duration":"X hours","cost":50,"difficulty":"easy","description":""}],"attractions":[{"id":"at1","name":"","type":"Landmark","timeNeeded":"2 hours","entryFee":10,"description":"","bestTime":"Morning"}]}],"overallTip":"1 actionable tip for ${requirements.purpose} travel with ${requirements.groupSize} people","monthTip":"${requirements.travelMonth} seasonal advice: weather, crowds, pricing"}

Rules: matchScore 0-98 int, sorted desc. activities 5-8 per dest, type: adventure|sports|cultural|recreational|food|shopping, difficulty: easy|medium|hard. attractions 4-6 per dest. bestFor values: leisure|honeymoon|adventure|culture|solo|family|group|business. budgetRange values: budget|moderate|luxury|ultra-luxury. All IDs unique.`;

    const geminiRes = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.85,
          maxOutputTokens: 8192,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      console.error('[ai-recommend] Gemini API error:', geminiRes.status, errBody.slice(0, 300));
      return NextResponse.json(
        { error: `Gemini API returned ${geminiRes.status}` },
        { status: 502 }
      );
    }

    const geminiData = await geminiRes.json() as {
      candidates?: Array<{
        content: { parts: Array<{ text: string }> };
      }>;
    };

    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!rawText) {
      throw new Error('Empty response from Gemini');
    }

    // Strip any markdown fences Gemini might include
    const cleaned = rawText
      .replace(/^```json\s*/im, '')
      .replace(/^```\s*/im, '')
      .replace(/```\s*$/im, '')
      .trim();

    const parsed = JSON.parse(cleaned);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error('[ai-recommend] Error:', err);
    return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 });
  }
}
