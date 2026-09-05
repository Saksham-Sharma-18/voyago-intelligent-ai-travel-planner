/**
 * Photo utility — Pexels API (real photos) with Unsplash CDN fallback.
 *
 * All photo fetches go through /api/photos (server-side, key protected).
 * Hardcoded Unsplash IDs serve as instant fallbacks if Pexels is unavailable.
 */

export interface UnsplashPhoto {
  url: string;
  thumbUrl: string;
  alt: string;
  query: string;
}

// ─── Unsplash Fallback Helpers ─────────────────────────────────────────────────

function buildUnsplashUrl(photoId: string, w = 800, h = 500): string {
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;
}

const DESTINATION_PHOTOS_FALLBACK: Record<string, Array<{ id: string; alt: string }>> = {
  'dubai-uae': [
    { id: '1512453979798-5ea266f8880c', alt: 'Dubai Burj Khalifa skyline at night' },
    { id: '1469854523086-cc02b0de7f37', alt: 'Dubai desert sand dunes at sunset' },
    { id: '1548194491-4fab-bdee-c5ff-b3c5ddbf0cf8', alt: 'Dubai luxury overwater view' },
  ],
  'paris-france': [
    { id: '1502602898657-3e91760cbb34', alt: 'Eiffel Tower Paris at dusk' },
    { id: '1431274172761-fcdaa2bb33b5', alt: 'Paris street cafe morning light' },
    { id: '1499856871958-5b9627545d1a', alt: 'Paris Seine river at night' },
  ],
  'bali-indonesia': [
    { id: '1537996194471-e657df975ab4', alt: 'Bali rice terraces Ubud green' },
    { id: '1518548419341-360e80150787', alt: 'Tanah Lot temple Bali at sunset' },
    { id: '1552274434-0f2a6a234c68', alt: 'Bali beach blue ocean surf' },
  ],
  'tokyo-japan': [
    { id: '1540959733332-eab4deabeeaf', alt: 'Tokyo city skyline at night' },
    { id: '1493253987029-b51aeb8d6de3', alt: 'Senso-ji Temple Tokyo cherry blossom' },
    { id: '1490806843957-31f4c9a91c65', alt: 'Mount Fuji reflection lake Japan' },
  ],
  'maldives': [
    { id: '1514282401047-d79a71a590e8', alt: 'Maldives overwater bungalow turquoise' },
    { id: '1573843981267-be1999ff37cd', alt: 'Maldives crystal clear coral reef' },
    { id: '1586861203927-800a5acddfed', alt: 'Maldives aerial tropical lagoon' },
  ],
  'new-york-usa': [
    { id: '1496442226666-8d4d0e62e6e9', alt: 'New York City skyline Manhattan' },
    { id: '1534430480872-3498386e7856', alt: 'Brooklyn Bridge New York at sunset' },
    { id: '1513635269975-59663e0ac1ad', alt: 'Central Park Manhattan aerial view' },
  ],
};

const HOTEL_PHOTOS_FALLBACK: Record<number, string> = {
  3: '1574362848149-11496d93a7c7',
  4: '1578683994576-fb168b8b30d3',
  5: '1542314831-068cd1dbfeeb',
  7: '1445019980597-93fa8acb246c',
};

const FALLBACK_ID = '1502602898657-3e91760cbb34';

// ─── Destination search queries for Pexels ────────────────────────────────────

const DESTINATION_QUERIES: Record<string, string[]> = {
  'dubai-uae':      ['Dubai skyline architecture', 'Dubai Burj Khalifa', 'Dubai desert luxury'],
  'paris-france':   ['Paris Eiffel Tower', 'Paris city romantic', 'Paris street cafe'],
  'bali-indonesia': ['Bali rice terraces', 'Bali temple sunset', 'Bali beach tropical'],
  'tokyo-japan':    ['Tokyo city night', 'Tokyo temple cherry blossom', 'Mount Fuji Japan'],
  'maldives':       ['Maldives overwater bungalow', 'Maldives turquoise water', 'Maldives tropical island'],
  'new-york-usa':   ['New York City skyline', 'Manhattan Brooklyn Bridge', 'Central Park New York'],
};

// ─── Pexels Fetch ─────────────────────────────────────────────────────────────

async function fetchPexelsPhotos(query: string, count = 3): Promise<UnsplashPhoto[]> {
  const res = await fetch(`/api/photos?query=${encodeURIComponent(query)}&count=${count}`);
  if (!res.ok) throw new Error(`Photos API failed: ${res.status}`);
  const data = await res.json() as { photos: UnsplashPhoto[] };
  if (!data.photos || data.photos.length === 0) throw new Error('No photos returned');
  return data.photos;
}

// ─── Fallback helpers ─────────────────────────────────────────────────────────

function getFallbackDestPhotos(destinationId: string, count = 3): UnsplashPhoto[] {
  const photos = DESTINATION_PHOTOS_FALLBACK[destinationId] || DESTINATION_PHOTOS_FALLBACK['paris-france'];
  return photos.slice(0, count).map(p => ({
    url: buildUnsplashUrl(p.id, 800, 500),
    thumbUrl: buildUnsplashUrl(p.id, 800, 500),
    alt: p.alt,
    query: p.alt,
  }));
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch real Pexels photos for a destination, falling back to Unsplash if unavailable.
 * @param destinationId - Used for fallback lookup only
 * @param count - Number of photos to fetch
 * @param customQuery - Override query (for dynamic destinations not in DESTINATION_QUERIES)
 */
export async function getDestinationPhotosPexels(destinationId: string, count = 3, customQuery?: string): Promise<UnsplashPhoto[]> {
  const queries = DESTINATION_QUERIES[destinationId] || [`${destinationId.replace(/-/g, ' ')} travel`];
  try {
    // Use customQuery if provided (for Gemini-generated destinations), otherwise pick from DB
    const query = customQuery || queries[Math.floor(Math.random() * queries.length)];
    return await fetchPexelsPhotos(query, count);
  } catch {
    return getFallbackDestPhotos(destinationId, count);
  }
}

/**
 * Synchronous fallback — used for immediate rendering before async photos load.
 */
export function getDestinationPhotos(destinationId: string, count = 3): UnsplashPhoto[] {
  return getFallbackDestPhotos(destinationId, count);
}

/** Simple string hash to pick a deterministic-but-varied index */
function hashStr(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Pool of varied travel-themed Unsplash photos for activity/attraction thumbnails */
const ACTIVITY_PHOTO_POOL: Array<{ id: string; alt: string }> = [
  { id: '1502602898657-3e91760cbb34', alt: 'Paris Eiffel Tower' },
  { id: '1431274172761-fcdaa2bb33b5', alt: 'Paris street cafe' },
  { id: '1512453979798-5ea266f8880c', alt: 'Dubai skyline night' },
  { id: '1537996194471-e657df975ab4', alt: 'Bali rice terraces' },
  { id: '1540959733332-eab4deabeeaf', alt: 'Tokyo city night' },
  { id: '1514282401047-d79a71a590e8', alt: 'Maldives overwater bungalow' },
  { id: '1496442226666-8d4d0e62e6e9', alt: 'New York City skyline' },
  { id: '1518548419341-360e80150787', alt: 'Temple at sunset' },
  { id: '1469854523086-cc02b0de7f37', alt: 'Desert dunes sunset' },
  { id: '1499856871958-5b9627545d1a', alt: 'River at night' },
  { id: '1490806843957-31f4c9a91c65', alt: 'Mountain reflection lake' },
  { id: '1552274434-0f2a6a234c68', alt: 'Tropical beach ocean' },
  { id: '1534430480872-3498386e7856', alt: 'Bridge city sunset' },
  { id: '1513635269975-59663e0ac1ad', alt: 'Aerial park urban' },
  { id: '1493253987029-b51aeb8d6de3', alt: 'Cherry blossoms temple' },
];

/** Used for activity thumbnails in the itinerary step. */
export function getActivityPhoto(activityName: string, _fallbackCity = ''): UnsplashPhoto {
  const idx = hashStr(activityName) % ACTIVITY_PHOTO_POOL.length;
  const pick = ACTIVITY_PHOTO_POOL[idx];
  return {
    url: buildUnsplashUrl(pick.id, 300, 200),
    thumbUrl: buildUnsplashUrl(pick.id, 200, 140),
    alt: activityName,
    query: activityName,
  };
}

/** Used for attraction thumbnails. */
export function getAttractionPhoto(attractionName: string): UnsplashPhoto {
  const idx = hashStr(attractionName) % ACTIVITY_PHOTO_POOL.length;
  const pick = ACTIVITY_PHOTO_POOL[idx];
  return {
    url: buildUnsplashUrl(pick.id, 300, 200),
    thumbUrl: buildUnsplashUrl(pick.id, 200, 140),
    alt: attractionName,
    query: attractionName,
  };
}

export function getHotelPhoto(stars: number): UnsplashPhoto {
  const id = HOTEL_PHOTOS_FALLBACK[stars] || HOTEL_PHOTOS_FALLBACK[4];
  return {
    url: buildUnsplashUrl(id, 600, 400),
    thumbUrl: buildUnsplashUrl(id, 300, 200),
    alt: `${stars}-star hotel`,
    query: `${stars} star hotel`,
  };
}

export function getDestinationHero(destinationId: string): UnsplashPhoto {
  const photos = DESTINATION_PHOTOS_FALLBACK[destinationId] || DESTINATION_PHOTOS_FALLBACK['paris-france'];
  const p = photos[0];
  return {
    url: buildUnsplashUrl(p.id, 1200, 420),
    thumbUrl: buildUnsplashUrl(p.id, 900, 350),
    alt: p.alt,
    query: p.alt,
  };
}

/** Fetch a Pexels photo for an activity by name. */
export async function getActivityPhotoAsync(activityName: string): Promise<UnsplashPhoto> {
  try {
    const photos = await fetchPexelsPhotos(activityName, 1);
    return photos[0];
  } catch {
    return getActivityPhoto(activityName);
  }
}
