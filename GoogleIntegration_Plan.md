# RealityPal: "God-Tier" Google Integrations Guide

This guide breaks down exactly how to implement the 4 core Google intelligence layers into our current `chatController.ts` AI orchestrator. 

By feeding this live data into our Gemini prompt, the AI will naturally weave it into its responses without requiring complex UI changes.

---

## 1. Live Market Pulse (Google Trends API)
**Goal:** Inject real-time market hype into the AI's response (e.g., "Ayodhya search volume is up 420%").

### Setup
1. **Install Package:** `npm install google-trends-api` (Already installed!).
2. **Create Service:** `src/services/trendsService.ts`.

### Implementation Code (`trendsService.ts`)
```typescript
import googleTrends from 'google-trends-api';

export async function getMarketPulse(location: string): Promise<string> {
  try {
    const results = await googleTrends.interestOverTime({
      keyword: `${location} real estate`,
      startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      geo: 'IN', // India
    });
    
    // Parse the JSON string
    const data = JSON.parse(results);
    const timelineData = data.default.timelineData;
    
    if (timelineData.length < 2) return '';
    
    // Calculate simple trend
    const firstWeek = timelineData[0].value[0];
    const lastWeek = timelineData[timelineData.length - 1].value[0];
    
    if (lastWeek > firstWeek) {
      const surge = Math.round(((lastWeek - firstWeek) / firstWeek) * 100);
      return `Market Pulse: Search interest for ${location} real estate has surged by ${surge}% in the last 30 days.`;
    }
    return `Market Pulse: Demand in ${location} is steady.`;
  } catch (error) {
    console.error("Trends Error:", error);
    return "";
  }
}
```

### How to use in `chatController.ts`
When the AI detects a location query, call `const pulse = await getMarketPulse(updatedIntent.sector);` and append it to the `SEARCH_CONTEXT` variable inside `chatController.ts` before sending it to Gemini.

---

## 2. Walkability & Vibe Score (Google Maps Distance Matrix API)
**Goal:** Prove to the user exactly how well-connected a property is.

### Setup
1. Get a **Google Maps API Key** from the Google Cloud Console.
2. Ensure the **Distance Matrix API** is enabled.

### Implementation Logic
In `src/services/mapsService.ts`:
```typescript
import axios from 'axios';

export async function getWalkability(propertyAddress: string): Promise<string> {
  const destinations = "nearest Metro Station|nearest Airport|nearest Hospital";
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(propertyAddress)}&destinations=${encodeURIComponent(destinations)}&key=${process.env.GOOGLE_MAPS_KEY}`;
  
  try {
    const response = await axios.get(url);
    // Parse response.data.rows to find the exact driving times
    // Return a string like: "Connectivity: 15 mins to Metro, 45 mins to Airport."
    return "Connectivity: 15 mins to Metro, 45 mins to Airport."; // Mocked for example
  } catch (err) {
    return "";
  }
}
```

---

## 3. Hyper-Local Intelligence (Google Places Nearby Search)
**Goal:** Tell families how many schools are nearby, or bachelors how much nightlife there is.

### Implementation Logic
We are already using the Google Places Text Search. We just need to add a secondary query using the `Nearby Search API` around the lat/lng of the primary property.

```typescript
export async function getNearbyAmenities(lat: number, lng: number): Promise<string> {
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=3000&type=school&key=${process.env.GOOGLE_MAPS_KEY}`;
  
  // Count the results
  // Return: "Neighborhood Stats: 12 top-tier schools and 4 major hospitals within 3km."
}
```
**Inject this into Gemini:** Just like the trend data, append this string to `SEARCH_CONTEXT`. Gemini will naturally mention it as "Insider Info".

---

## 4. Street View / Static Maps (Google Static Maps API)
**Goal:** Render a beautiful map image inside the chat bubble.

### Setup
Enable **Maps Static API**.

### Implementation Logic
Instead of a placeholder image, we generate a URL that acts as an image.
```typescript
const lat = 28.5355; // Property Lat
const lng = 77.3910; // Property Lng
const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=14&size=600x300&maptype=roadmap&markers=color:red%7C${lat},${lng}&style=feature:all|element:labels.text.fill|color:0x333333&key=${process.env.GOOGLE_MAPS_KEY}`;
```

In `chatController.ts`, when you map the Google Places results to our `Property` interface, set:
`image_url: staticMapUrl`

The frontend will automatically render this map in the Property Card or Gallery!

---

## Summary of Action Plan
1. **API Keys:** You will need to create a Google Cloud project with billing enabled and generate an API key.
2. **Environment:** Add `GOOGLE_MAPS_KEY=your_key_here` to the `.env` file.
3. **Execution:** We will create `src/services/googleIntelligence.ts` to house all these functions.
4. **Integration:** We will call these functions in `chatController.ts` right after we fetch the base Google Places properties, compile all the data into a master "Context Block", and feed it to the AI.
