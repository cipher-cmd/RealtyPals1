import dotenv from 'dotenv';
dotenv.config();

/**
 * Google Places — Text Search
 *
 * Returns an array of normalized property/project results, or an empty
 * array on failure or no results. Never returns an error object mixed
 * with results — callers can rely on Array.isArray and length checks.
 *
 * If you need failure visibility, check console logs.
 */

export interface GooglePlaceResult {
  projectName: string;
  rating: number | null;       // null if Google didn't provide one
  address: string;
  reviewsCount: number;
  lat: number | null;
  lng: number | null;
  placeId: string;
  photoReference: string | null;
}

const TEXTSEARCH_URL = 'https://maps.googleapis.com/maps/api/place/textsearch/json';

export async function fetchGooglePlaces(query: string): Promise<GooglePlaceResult[]> {
  if (!query || !query.trim()) {
    console.warn('[GooglePlaces] Empty query — skipping.');
    return [];
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.error('[GooglePlaces] Missing GOOGLE_PLACES_API_KEY.');
    return [];
  }

  const url = `${TEXTSEARCH_URL}?query=${encodeURIComponent(query)}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error('[GooglePlaces] HTTP', response.status, 'for query:', query);
      return [];
    }

    const data: any = await response.json();

    // Google returns status codes for known issues — log them, return empty.
    if (data.status && data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('[GooglePlaces] API status:', data.status, '-', data.error_message || '(no error message)');
      return [];
    }

    if (!Array.isArray(data.results) || data.results.length === 0) {
      return [];
    }

    return data.results.slice(0, 6).map((place: any): GooglePlaceResult => ({
      projectName: place.name || 'Unnamed',
      rating: typeof place.rating === 'number' ? place.rating : null,
      address: place.formatted_address || '',
      reviewsCount: typeof place.user_ratings_total === 'number' ? place.user_ratings_total : 0,
      lat: place.geometry?.location?.lat ?? null,
      lng: place.geometry?.location?.lng ?? null,
      placeId: place.place_id || '',
      photoReference: place.photos?.[0]?.photo_reference || null,
    }));
  } catch (error: any) {
    console.error('[GooglePlaces] Network error for query:', query, error?.message || error);
    return [];
  }
}

/**
 * Convenience: build a precise text-search query from structured inputs.
 * Use this from callers so query strings stay consistent.
 */
export function buildPlacesQuery(opts: {
  bhk?: number;
  propertyType?: 'flat' | 'plot';
  sector?: string;        // e.g. "Sector 150"
  city?: string;          // e.g. "Noida", "Gurgaon"
}): string {
  const { bhk, propertyType, sector, city } = opts;
  const parts: string[] = [];

  if (bhk) parts.push(`${bhk} BHK`);
  if (propertyType === 'flat') parts.push('apartments');
  else if (propertyType === 'plot') parts.push('plots');
  else parts.push('residential projects');

  if (sector) parts.push(`in ${sector}`);
  if (city) parts.push(city);

  return parts.join(' ').trim();
}