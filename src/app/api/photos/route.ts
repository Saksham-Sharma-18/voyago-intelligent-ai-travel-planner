import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory cache to avoid hitting rate limits for repeated queries
const cache = new Map<string, object>();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || 'travel destination';
    const count = Math.min(parseInt(searchParams.get('count') || '3'), 10);
    const cacheKey = `${query}:${count}`;

    if (cache.has(cacheKey)) {
      return NextResponse.json(cache.get(cacheKey));
    }

    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`;

    const response = await fetch(url, {
      headers: {
        Authorization: process.env.PEXELS_API_KEY!,
      },
      next: { revalidate: 3600 }, // Cache at edge for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`);
    }

    const data = await response.json() as {
      photos: Array<{
        id: number;
        alt: string;
        src: { large: string; medium: string };
        photographer: string;
      }>;
    };

    const photos = data.photos.map(p => ({
      url: p.src.large,
      thumbUrl: p.src.medium,
      alt: p.alt || query,
      query,
      photographer: p.photographer,
    }));

    const result = { photos };
    cache.set(cacheKey, result);

    return NextResponse.json(result);
  } catch (err) {
    console.error('[photos] Error:', err);
    return NextResponse.json({ photos: [] }, { status: 500 });
  }
}
