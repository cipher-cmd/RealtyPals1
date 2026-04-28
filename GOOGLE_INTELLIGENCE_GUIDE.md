# RealityPal AI: Google Intelligence Integration Guide

We have successfully transformed your app into a **Live Real Estate Intelligence Engine**. By integrating your Google Cloud APIs, the AI now thinks like a local expert with access to real-time data.

## 1. Live Market Pulse (Google Trends)
**What it does:** Calculates the search momentum for a specific area.
**How it's implemented:** 
- We use the `google-trends-api` package.
- When you ask about a sector, the backend fetches search volume for "[Sector Name] real estate" over the last 30 days.
- **AI Output:** It will now say things like *"Search interest for Sector 150 has surged by 45% this month, indicating a hyper-growth phase."*

## 2. The "Walkability & Vibe" Score (Distance Matrix API)
**What it does:** Calculates exact drive/walk times to critical hubs.
**How it's implemented:**
- We use the **Google Distance Matrix API**.
- We calculate the time from the property's lat/lng to the nearest **Metro**, **Airport**, and **Major Hospital**.
- **AI Output:** *"This property is exceptionally connected—only 12 mins to the Sector 18 Metro and 45 mins to IGI Airport."*

## 3. Hyper-Local Intelligence (Places Nearby Search)
**What it does:** Identifies the density of essential services (Schools, Parks).
**How it's implemented:**
- We use the **Google Places Nearby Search API**.
- We scan a 3km radius for schools and hospitals.
- **AI Output:** *"Perfect for families: there are 12 top-tier schools within a 3km radius of this project."*

## 4. Visual Grounding (Static Maps API)
**What it does:** Shows a live map of the property location instead of a generic placeholder.
**How it's implemented:**
- We use the **Google Maps Static API**.
- We generate a custom-styled map URL for every property found.
- **Display:** These maps now appear in the "Market Intelligence" cards and Property views.

---

### How to use it:
Just ask the AI naturally! 
- *"How is Sector 150 doing for investment?"*
- *"Compare Sector 150 vs Sector 104."*
- *"Find me a 3BHK with good connectivity to the metro."*

The AI will now weave all this live Google data into its answers automatically!
