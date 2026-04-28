// @ts-ignore
import googleTrends from 'google-trends-api';
import axios from 'axios';

/**
 * Google Intelligence Layer
 *
 * Provides verified live data from Google Maps + Trends APIs.
 * All functions accept an optional `cityHint` so we can correctly resolve
 * locations outside Noida (Gurgaon, Ayodhya, Mumbai, etc.).
 *
 * Anti-hallucination principles:
 *   - Never assume a default city. If no hint and the location is ambiguous,
 *     let Google's geocoder do its best and accept whatever it returns.
 *   - POIs (metro/airport/hospital) for distance matrix are city-specific.
 *     For unknown cities, return empty rather than fake Noida POIs.
 *   - Empty results return empty strings — let the caller decide how to
 *     surface "no data" to the user.
 */

// ────────────────────────────────────────────────────────────────────────────
// City-specific POIs for the Distance Matrix API.
// Add cities here as you expand coverage.
// ────────────────────────────────────────────────────────────────────────────

const CITY_POIS: Record<string, string> = {
  Noida: 'Noida Sector 18 Metro Station|Indira Gandhi International Airport Delhi|Fortis Hospital Noida',
  Gurgaon: 'MG Road Metro Station Gurgaon|Indira Gandhi International Airport Delhi|Medanta The Medicity Gurgaon',
  Gurugram: 'MG Road Metro Station Gurgaon|Indira Gandhi International Airport Delhi|Medanta The Medicity Gurgaon',
  'Greater Noida': 'Pari Chowk Metro Station|Jewar Airport|Sharda Hospital Greater Noida',
  Delhi: 'Rajiv Chowk Metro Station|Indira Gandhi International Airport Delhi|AIIMS Delhi',
  'New Delhi': 'Rajiv Chowk Metro Station|Indira Gandhi International Airport Delhi|AIIMS Delhi',
  Ayodhya: 'Ayodhya Junction Railway Station|Maharishi Valmiki International Airport Ayodhya|Shri Ram Hospital Ayodhya',
  Mumbai: 'Bandra Station Mumbai|Chhatrapati Shivaji Maharaj International Airport|Lilavati Hospital Mumbai',
  Bangalore: 'MG Road Metro Bangalore|Kempegowda International Airport Bangalore|Manipal Hospital Bangalore',
  Bengaluru: 'MG Road Metro Bangalore|Kempegowda International Airport Bangalore|Manipal Hospital Bangalore',
  Pune: 'Pune Junction Railway Station|Pune International Airport|Ruby Hall Clinic Pune',
  Hyderabad: 'Ameerpet Metro Station|Rajiv Gandhi International Airport Hyderabad|Apollo Hospital Hyderabad',
  Chennai: 'Chennai Central Metro|Chennai International Airport|Apollo Hospital Chennai',
  Kolkata: 'Esplanade Metro Station|Netaji Subhash Chandra Bose Airport|AMRI Hospital Kolkata',
};

/**
 * Build an address string for geocoding. Avoids the old bug of
 * always appending ", Noida, Uttar Pradesh, India".
 */
function buildAddressForGeocoding(location: string, cityHint?: string): string {
  const parts: string[] = [location];

  // Add city hint only if it's not already in the location string
  if (cityHint && !location.toLowerCase().includes(cityHint.toLowerCase())) {
    parts.push(cityHint);
  }

  // Always end with India for disambiguation
  parts.push('India');
  return parts.join(', ');
}

// ────────────────────────────────────────────────────────────────────────────
// 0. Geocoding
// ────────────────────────────────────────────────────────────────────────────

export async function geocodeLocation(
  location: string,
  cityHint?: string
): Promise<{ lat: number; lng: number } | null> {
  if (!process.env.GOOGLE_MAPS_KEY || !location) return null;

  const address = buildAddressForGeocoding(location, cityHint);
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_MAPS_KEY}`;

  try {
    const response = await axios.get(url);
    if (response.data.status === 'OK' && response.data.results[0]) {
      return response.data.results[0].geometry.location;
    }
    if (response.data.status !== 'ZERO_RESULTS') {
      console.error('[Geocode] Status:', response.data.status, 'for', address);
    }
    return null;
  } catch (err) {
    console.error('[Geocode] Error for', address, ':', err);
    return null;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 1. Google Trends — Live Market Pulse
// ────────────────────────────────────────────────────────────────────────────

export async function getMarketPulse(location: string): Promise<string> {
  if (!location) return '';

  try {
    const results = await googleTrends.interestOverTime({
      keyword: `${location} real estate`,
      startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // last 30 days
      geo: 'IN',
    });

    // google-trends-api occasionally returns an HTML error page instead of JSON
    if (!results || typeof results !== 'string' || results.trim().startsWith('<')) {
      return '';
    }
    const data = JSON.parse(results);
    const timelineData = data.default?.timelineData || [];

    if (timelineData.length < 2) return '';

    const firstWeek = timelineData[0].value[0] || 1;
    const lastWeek = timelineData[timelineData.length - 1].value[0] || 1;

    if (lastWeek > firstWeek) {
      const surge = Math.round(((lastWeek - firstWeek) / firstWeek) * 100);
      return `Search interest for ${location} real estate has risen ${surge}% over the last 30 days, indicating growing demand.`;
    } else if (lastWeek < firstWeek) {
      return `Search interest for ${location} real estate has cooled slightly over the last 30 days — a more buyer-friendly window.`;
    }
    return `Search interest for ${location} real estate has been steady over the last 30 days.`;
  } catch (error) {
    console.error('[Trends] Error for', location, ':', error);
    return '';
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 2. Distance Matrix — Walkability / Connectivity
// ────────────────────────────────────────────────────────────────────────────

export async function getWalkability(
  lat: number,
  lng: number,
  cityHint?: string
): Promise<string> {
  if (!process.env.GOOGLE_MAPS_KEY) return '';

  // Pick city-appropriate POIs. If we don't know the city, return empty
  // rather than misleadingly comparing distances to Noida POIs.
  const destinations = cityHint ? CITY_POIS[cityHint] : undefined;
  if (!destinations) {
    return '';
  }

  const origins = `${lat},${lng}`;
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${encodeURIComponent(destinations)}&key=${process.env.GOOGLE_MAPS_KEY}`;

  try {
    const response = await axios.get(url);
    if (response.data.status !== 'OK' || !response.data.rows[0]?.elements) return '';

    const elements = response.data.rows[0].elements;
    const labels = ['Metro/Transit', 'Airport', 'Major Hospital'];
    const lines: string[] = [];

    elements.forEach((el: any, idx: number) => {
      if (el?.status === 'OK' && el.duration?.text) {
        lines.push(`${labels[idx]}: ${el.duration.text}`);
      }
    });

    if (lines.length === 0) return '';
    return `Connectivity (drive times):\n- ${lines.join('\n- ')}`;
  } catch (err) {
    console.error('[DistanceMatrix] Error:', err);
    return '';
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 3. Nearby Amenities — Schools, parks, hospitals, malls
// ────────────────────────────────────────────────────────────────────────────

export async function getNearbyAmenities(lat: number, lng: number): Promise<string> {
  if (!process.env.GOOGLE_MAPS_KEY) return '';

  const types = ['school', 'park', 'hospital', 'shopping_mall'];
  const promises = types.map((type) =>
    axios.get(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=3000&type=${type}&key=${process.env.GOOGLE_MAPS_KEY}`
    )
  );

  try {
    const responses = await Promise.all(promises);
    const sections: string[] = [];

    responses.forEach((res, idx) => {
      if (res.data.status === 'OK' && res.data.results) {
        const type = types[idx];
        const top = res.data.results.slice(0, 5);
        const names = top.map((r: any) => r.name).filter(Boolean).join(', ');
        if (names) {
          sections.push(`${type.replace('_', ' ')}s nearby: ${names}`);
        }
      }
    });

    if (sections.length === 0) return '';
    return `Verified amenities within 3km:\n- ${sections.join('\n- ')}`;
  } catch (err) {
    console.error('[NearbySearch] Error:', err);
    return '';
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 4. Static Map URL
// ────────────────────────────────────────────────────────────────────────────

export function getStaticMapUrl(lat: number, lng: number): string | null {
  if (!process.env.GOOGLE_MAPS_KEY) return null;
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=800x400&maptype=roadmap&markers=color:red%7C${lat},${lng}&style=feature:poi|visibility:off&style=feature:transit|visibility:simplified&key=${process.env.GOOGLE_MAPS_KEY}`;
}

// ────────────────────────────────────────────────────────────────────────────
// 5. Area Photo
// ────────────────────────────────────────────────────────────────────────────

export async function getAreaPhoto(
  location: string,
  cityHint?: string
): Promise<string | null> {
  if (!process.env.GOOGLE_MAPS_KEY || !location) return null;

  try {
    const searchText =
      cityHint && !location.toLowerCase().includes(cityHint.toLowerCase())
        ? `${location}, ${cityHint}`
        : location;

    const findUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchText)}&inputtype=textquery&fields=photos,place_id&key=${process.env.GOOGLE_MAPS_KEY}`;

    const findRes = await axios.get(findUrl);
    const photoReference = findRes.data.candidates?.[0]?.photos?.[0]?.photo_reference;

    if (photoReference) {
      return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${photoReference}&key=${process.env.GOOGLE_MAPS_KEY}`;
    }
    return null;
  } catch (e) {
    console.error('[AreaPhoto] Error for', location, ':', e);
    return null;
  }
}