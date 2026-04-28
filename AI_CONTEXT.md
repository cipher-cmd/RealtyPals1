# AI Layer — Detailed Context for Claude Code

## Gemini Integration (`src/services/aiService.ts`)

### Model
`gemini-2.0-flash` — do not upgrade without testing intent extraction accuracy

### Three Modes (never mix in a single function)

#### Mode 1: Intent Extraction
**Goal**: Convert natural language to structured JSON
**Input**: Raw user message string
**Output**: Typed IntentJSON object
**Rules**:
- Temperature: 0 (deterministic)
- Response must be pure JSON — strip any markdown fences before parsing
- On parse failure: return `null`, let intentManager handle incomplete state
- Never throw to the controller — catch internally

**Current prompt issues to fix**:
- Needs few-shot examples for Hinglish inputs
- Budget extraction fails when user says "50 se 70 ke beech" (Hindi range)
- BHK extraction misses "2 bedroom" vs "2BHK" inconsistency

**Target IntentJSON shape**:
```typescript
interface IntentJSON {
  bhk?: 1 | 2 | 3 | 4 | 5;
  budget_min?: number;        // always in INR, never lakhs
  budget_max?: number;        // always in INR, never lakhs
  possession_status?: 'ready_to_move' | 'under_construction' | 'new_launch';
  amenities?: string[];       // normalised to DB enum values
  floor_preference?: 'low' | 'mid' | 'high';
  sector?: number;            // default 150 for now
}
```

#### Mode 2: Conversational / Grounded
**Goal**: Answer general real estate questions using Google Search Grounding
**CRITICAL RESTRICTION**: Gate this mode with a topic classifier first.
- ALLOWED topics for grounding: project reputation, builder background, legal disputes, possession delays, general market trends
- BLOCKED topics for grounding: price per sqft, total cost, circle rates, stamp duty amounts
- For blocked topics: respond from DB only, or state "I can only quote prices from verified listings in our database"

**Why this matters**: Indian real estate portals deliberately underprice listings. Serving a grounded price to a buyer is a trust-destroying (and potentially liability-creating) move.

#### Mode 3: Advisor Mode
**Goal**: Post-shortlist concierge
**Input**: Property DB records (passed as context) + user question
**Rules**:
- Temperature: 0.3 (allow natural language, not creative)
- Prompt must explicitly say: "Only quote prices and figures from the provided property data. Do not use your training knowledge for specific pricing."
- Can compare properties against each other
- Can explain risks (builder track record, under-construction risk, etc.)
- Should NOT recommend one property over another — present tradeoffs, let user decide

---

## Intent State Machine (`src/services/intentManager.ts`)

### States
```
COLD → GATHERING → READY_TO_SEARCH → SHORTLISTED → ADVISORY
```

### Transition Rules
- `COLD → GATHERING`: First message received
- `GATHERING → READY_TO_SEARCH`: Minimum required fields present (bhk + budget_max minimum)
- `READY_TO_SEARCH → SHORTLISTED`: discoveryEngine returns ≥1 result
- `SHORTLISTED → ADVISORY`: User asks a follow-up question about a specific property
- Any state → `GATHERING`: User says "start over" or changes a core requirement

### Missing Field Priority (what to ask for first)
1. BHK (most disambiguating)
2. Budget max (hard filter)
3. Possession status (large UX difference)
4. Amenities (nice to have, not blocking)

---

## Discovery Engine (`src/logic/discoveryEngine.ts`)

### Ranking Algorithm
Properties are scored 0–100. Current weights (review these):
- BHK exact match: 40 pts
- Budget within range: 30 pts
- Possession status match: 20 pts
- Amenity overlap: 10 pts (per amenity up to cap)

**Known weakness**: Budget scoring is binary (in range = 30, out = 0). Should be gradient — a property 5% over budget should score ~27, not 0.

**Fix needed**: Replace binary budget gate with a soft score:
```typescript
const budgetScore = budget_max
  ? Math.max(0, 30 * (1 - Math.max(0, price - budget_max) / budget_max))
  : 15; // neutral if no budget given
```

---

## Session Persistence (`src/services/chatSessionService.ts`)

### What's stored per session
- `intent`: Latest IntentJSON (partial or complete)
- `shortlist`: Array of Property IDs from last search
- `state`: Current IntentManager state
- `message_count`: For analytics

### Known issue
Session intent is overwritten on each message — there's no merge logic. If user says "3BHK" then later "under 80 lakhs", the second message should merge, not replace.

**Fix needed**: Deep merge IntentJSON, never overwrite defined fields with undefined:
```typescript
function mergeIntent(existing: Partial, incoming: Partial): Partial {
  return {
    ...existing,
    ...Object.fromEntries(
      Object.entries(incoming).filter(([_, v]) => v !== undefined && v !== null)
    )
  };
}
```

---

## PDF Ingestion Pipeline (NOT YET BUILT — next major feature)

### Goal
Parse developer brochures (PDFs sent over WhatsApp/email) into structured Property records automatically.

### Proposed Flow
```
PDF received (upload endpoint or webhook)
    └─> Extract text + images with Gemini Document Understanding
    └─> Map extracted fields to PropertyInsertSchema
    └─> Human review queue (flag low-confidence fields)
    └─> Prisma upsert on (project_name, sector_id, bhk_type)
```

### Confidence Threshold
Any field extracted with <70% confidence should be flagged `needs_review: true` and NOT served to users until manually verified.

### Priority fields to extract
- Project name, builder name
- BHK configurations available
- Price per sqft (base price)
- Total price range
- Possession date / status
- Key amenities
- RERA registration number (critical for credibility layer)

---

## Prompt Constants File (to be created: `src/services/prompts.ts`)

All prompt strings should be extracted here. Structure:
```typescript
export const PROMPTS = {
  INTENT_EXTRACTION: `...`,
  ADVISOR_MODE: `...`,
  TOPIC_CLASSIFIER: `...`,       // new — gates grounding
  PDF_FIELD_EXTRACTION: `...`,   // new — for ingestion pipeline
} as const;
```