# RealtyPals — Known Issues & Fix Priority

## P0 — Fix Before Any Brokerage Demo

### [BUG-01] Grounded search returns unreliable prices
**File**: `src/services/aiService.ts`
**Problem**: Google Search Grounding is active for all out-of-scope queries including price-related ones. Indian portal prices are manipulated.
**Fix**: Add a topic classifier call before routing to grounded mode. Block grounding for any query matching price/cost/valuation intent. Return a canned response directing user to DB listings instead.

### [BUG-02] Intent not merged across messages — overwrites on each turn
**File**: `src/services/chatSessionService.ts`
**Problem**: User says "3BHK" in message 1, then "under 80 lakhs" in message 2. Message 2 wipes BHK because incoming intent only has budget.
**Fix**: Implement `mergeIntent()` — only overwrite fields that are explicitly present in incoming parse. See AI_CONTEXT.md for implementation.

### [BUG-03] Budget scoring is binary
**File**: `src/logic/discoveryEngine.ts`
**Problem**: Property 1% over budget scores 0. User loses valid options.
**Fix**: Gradient scoring — see AI_CONTEXT.md for formula.

---

## P1 — Fix to Improve Product Quality

### [IMPROVE-01] Intent extraction fails on Hinglish
**File**: `src/services/aiService.ts` → intent prompt
**Problem**: "2BHK 50 se 60 mein chahiye sector 150 mein" fails to parse budget range.
**Fix**: Add 5–8 few-shot examples in the prompt covering: Hindi budget ranges, BHK variations ("2 bedroom", "double bedroom"), possession phrases ("ready to move", "abhi chahiye").

### [IMPROVE-02] No prompt constants file
**Files**: Spread across `aiService.ts`
**Problem**: Prompt strings are inline — impossible to version, review, or A/B test.
**Fix**: Create `src/services/prompts.ts`, extract all prompt strings as named exports.

### [IMPROVE-03] No confidence scoring on intent extraction
**File**: `src/services/aiService.ts`
**Problem**: A failed or partial parse silently produces an incomplete object. No way to know if Gemini was uncertain.
**Fix**: Add an optional `_confidence: 'high' | 'medium' | 'low'` field to IntentJSON output. Route low-confidence parses back to clarification questions.

---

## P2 — Nice to Have Before Scaling

### [FEATURE-01] Price Alert / Watch
**New feature**
User subscribes to a criteria set. When a new property is added matching their criteria, they receive a notification.
- Backend: Store `Alert` records in DB (criteria JSON + contact)
- Trigger: Run alert matching on every new Property insert
- Delivery: Email (start simple) → WhatsApp later

### [FEATURE-02] RERA cross-reference
**New feature**
For any project in DB, store RERA registration number. Surface it in advisor mode. Flag projects without RERA numbers.
- Schema change: Add `rera_number` (nullable) to `Property`
- UI hint: Show "RERA Verified" badge on properties that have it

### [FEATURE-03] PDF Ingestion Pipeline
**New major feature** — see AI_CONTEXT.md for full spec
Highest-value unbuilt feature. Directly unblocks the brokerage data problem.

---

## Architecture Constraints (Do Not Violate)
- No AI calls in `logic/` layer — ever
- No Prisma queries outside `logic/` layer — ever
- All Gemini calls must have typed fallbacks — never let AI failure crash the chat
- Prompt strings must live in `prompts.ts` — not inline