# Backend Structure Documentation

Complete overview of the Investors Clinic backend architecture, file organization, and responsibilities.

**Last Updated:** After Chat-First Refactor & Intent Management System

---

## 📁 Directory Structure

```
investors-clinic/
├── src/                          # Main source code
│   ├── server.ts                 # Express app entry point
│   ├── controllers/              # Request handlers (thin layer)
│   │   ├── chatController.ts     # Chat & intent management
│   │   ├── propertyController.ts # Property discovery & details
│   │   ├── valueCheckController.ts # Value estimation
│   │   ├── compareController.ts  # Property comparison
│   │   └── savedPropertyController.ts # Saved properties CRUD
│   ├── routes/                   # API route definitions
│   │   ├── chatRoutes.ts         # Chat & intent endpoints
│   │   ├── propertyRoutes.ts     # Property endpoints
│   │   ├── valueCheckRoutes.ts   # Value check endpoint
│   │   ├── compareRoutes.ts      # Compare endpoint
│   │   └── savedPropertyRoutes.ts # Saved properties endpoints
│   ├── logic/                    # Pure business logic engines
│   │   ├── discoveryEngine.ts    # Property discovery & ranking
│   │   ├── valueEstimator.ts     # Value estimation algorithm
│   │   └── compareEngine.ts      # Property comparison logic
│   ├── services/                 # Service layer (database & AI operations)
│   │   ├── intentManager.ts      # Intent state management
│   │   ├── aiService.ts          # AI-powered intent extraction
│   │   └── priceBandResolver.ts  # Price band lookup
│   ├── utils/                     # Shared utilities & constants
│   │   ├── constants.ts          # Premium builders, typical sizes
│   │   └── errors.ts             # Error taxonomy
│   └── __tests__/                # Integration tests
│       └── integration/          # End-to-end API tests
├── prisma/                       # Database layer
│   ├── schema.prisma             # Database schema definition
│   ├── seed.ts                   # Database seeding script
│   └── migrations/               # Database migration history
├── postman/                      # API testing collection
├── package.json                  # Dependencies & scripts
└── tsconfig.json                 # TypeScript configuration
```

---

## 🎯 Architecture Overview

**Request Flow:**
```
HTTP Request → Routes → Controllers → Services/Logic → Database (Prisma) → Response
                                    ↓
                              AI Service (optional)
```

**Key Principles:**
- **Controllers:** Thin layer - validate input, call logic/services, return response
- **Logic Engines:** Pure functions - deterministic, testable, no database calls
- **Services:** Database operations, AI calls, intent management
- **Routes:** URL mapping - connect HTTP endpoints to controllers
- **AI Integration:** Optional - falls back to regex if not configured

---

## 📄 File-by-File Breakdown

### 🚀 Entry Point

#### `src/server.ts`
**Purpose:** Express application entry point and server configuration

**Responsibilities:**
- Initialize Express app
- Configure middleware (CORS, JSON parsing)
- Register all API routes
- Start HTTP server
- Health check endpoint (`/health`)

**Key Code:**
```typescript
app.use('/api/v1/properties', propertyRoutes);
app.use('/api/v1/value-check', valueCheckRoutes);
app.use('/api/v1/compare', compareRoutes);
app.use('/api/v1/saved-properties', savedPropertyRoutes);
app.use('/api/v1/chat', chatRoutes);
```

**Port:** `3000` (configurable via `PORT` env variable)

---

### 🛣️ Routes Layer (`src/routes/`)

Routes map HTTP endpoints to controller functions.

#### `src/routes/propertyRoutes.ts`
**Purpose:** Property discovery and detail endpoints

**Endpoints:**
- `GET /api/v1/properties` → `getProperties()`
- `GET /api/v1/properties/:id` → `getPropertyById()`

**Maps to:** `propertyController.ts`

---

#### `src/routes/valueCheckRoutes.ts`
**Purpose:** Property value estimation endpoint

**Endpoints:**
- `POST /api/v1/value-check` → `checkValue()`

**Maps to:** `valueCheckController.ts`

---

#### `src/routes/compareRoutes.ts`
**Purpose:** Property comparison endpoint

**Endpoints:**
- `POST /api/v1/compare` → `compare()`

**Maps to:** `compareController.ts`

---

#### `src/routes/savedPropertyRoutes.ts`
**Purpose:** Saved properties management endpoints

**Endpoints:**
- `POST /api/v1/saved-properties` → `saveProperty()`
- `GET /api/v1/saved-properties` → `getSavedProperties()`

**Maps to:** `savedPropertyController.ts`

**Authentication:** Requires `X-User-Id` header (MVP placeholder)

---

#### `src/routes/chatRoutes.ts`
**Purpose:** Chat & intent management endpoints

**Endpoints:**
- `POST /api/v1/chat` → `handleChat()` - Main chat endpoint
- `GET /api/v1/chat/intent` → `getIntent()` - Get current intent state
- `DELETE /api/v1/chat/intent` → `resetIntent()` - Reset intent state

**Maps to:** `chatController.ts`

**Functionality:** 
- Intent-based conversation flow
- AI-powered intent extraction
- Property recommendations when intent complete

---

### 🎮 Controllers Layer (`src/controllers/`)

Controllers handle HTTP requests/responses. They are **thin** - validate input, call logic/services, return JSON.

#### `src/controllers/propertyController.ts`
**Purpose:** Handle property discovery and detail requests

**Functions:**

1. **`getProperties(req, res)`**
   - **Input:** Query params: `sector`, `bhk`, `min_price`, `max_price`, `property_type`
   - **Process:** Validates input, calls `discoverProperties()` from `discoveryEngine`
   - **Output:** `{ properties: Property[] }` (max 20, ranked by score)

2. **`getPropertyById(req, res)`**
   - **Input:** URL param: `id`
   - **Process:** Fetches property from database with sector relation
   - **Output:** `{ property: Property }` or 404 error

**Error Handling:** Returns 400 for validation errors, 404 for not found

---

#### `src/controllers/valueCheckController.ts`
**Purpose:** Handle property value estimation requests

**Functions:**

1. **`checkValue(req, res)`**
   - **Input:** Body: `{ sector, bhk, size_sqft, quoted_price?, property_type, property_status?, builder?, floor? }`
   - **Process:** 
     - Validates all required and optional fields
     - Validates numeric ranges (BHK: 1-10, Size: 100-10000)
     - Validates enums (property_type, property_status)
     - Calls `estimatePropertyValue()` from `valueEstimator`
   - **Output:** `{ market_range, verdict, reason_codes, risk_flag }`

**Required Fields:** `sector`, `bhk`, `size_sqft`, `property_type`

**Optional Fields:** `quoted_price`, `property_status`, `builder`, `floor`

**Validation:**
- BHK must be 1-10
- Size must be 100-10000 sqft
- Quoted price must be positive if provided
- Floor must be non-negative if provided

---

#### `src/controllers/compareController.ts`
**Purpose:** Handle property comparison requests

**Functions:**

1. **`compare(req, res)`**
   - **Input:** Body: `{ property_id_1, property_id_2 }`
   - **Process:** Validates input, calls `compareProperties()` from `compareEngine`
   - **Output:** `{ property_1, property_2, differences }`

**Error Handling:**
- 400: Missing fields or comparing property with itself
- 404: Property not found
- 500: Server error

---

#### `src/controllers/savedPropertyController.ts`
**Purpose:** Handle saved properties CRUD operations

**Functions:**

1. **`saveProperty(req, res)`**
   - **Input:** Header: `X-User-Id`, Body: `{ property_id }`
   - **Process:** Validates user_id and property_id, verifies property exists, upserts saved property
   - **Output:** `{ savedProperty }`

2. **`getSavedProperties(req, res)`**
   - **Input:** Header: `X-User-Id`
   - **Process:** Fetches all saved properties for user with full property details
   - **Output:** `{ savedProperties: SavedProperty[] }` (ordered by `saved_at` desc)

**Authentication:** Requires `X-User-Id` header (MVP - no real auth)

**Note:** Uses `upsert` to prevent duplicates (composite key: `user_id + property_id`)

---

#### `src/controllers/chatController.ts`
**Purpose:** Handle chat & intent-based property advisor

**Functions:**

1. **`handleChat(req, res)`** - Main chat endpoint
   - **Input:** 
     - Body: `{ message: string }`
     - Header: `X-User-Id` (required)
   - **Process:**
     - Gets or initializes intent state for user
     - Extracts intent from message using AI (or regex fallback)
     - Merges extracted intent into existing state
     - Calculates completeness score
     - If complete (score >= 60):
       - Queries discovery engine with intent
       - Validates each property's price
       - Returns 3-5 properties with validation
     - If not complete:
       - Generates next question using AI (or rule-based)
       - Returns question only
   - **Output:** 
     ```json
     {
       "message": "string",
       "properties": Property[],
       "showRecommendations": boolean,
       "intent": { completenessScore, bhk, budget, purpose }
     }
     ```

2. **`getIntent(req, res)`** - Get current intent state
   - **Input:** Header: `X-User-Id`
   - **Output:** `{ intent: IntentState }`

3. **`resetIntent(req, res)`** - Reset intent state
   - **Input:** Header: `X-User-Id`
   - **Output:** `{ message: "Intent reset successfully" }`

**Intent State Storage:**
- In-memory Map (`userIntentStore`) - MVP approach
- Key: `userId`, Value: `IntentState`
- Can be moved to database in future

**Key Features:**
- **Chat-First:** Only shows properties when intent complete
- **AI-Powered:** Intent extraction and question generation
- **Deterministic Discovery:** Uses existing discovery engine
- **Price Validation:** Validates properties when shown
- **Conversational:** Natural question flow

---

### 🧠 Logic Engines (`src/logic/`)

Pure business logic functions. **Deterministic, testable, no database calls.**

#### `src/logic/discoveryEngine.ts`
**Purpose:** Property discovery and ranking algorithm

**Functions:**

1. **`discoverProperties(input, prisma)`**
   - **Input:** `DiscoveryInput` (sector, bhk, min_price, max_price, property_type)
   - **Process:**
     - Resolves sector name to sector_id
     - Queries properties with filters
     - Calculates scores (ready status + budget proximity)
     - Sorts by score descending
   - **Output:** `ScoredProperty[]` (top 20)

**Scoring Algorithm:**
- +10 points: Property status = "ready"
- +5 points: Price closer to budget midpoint (if min/max provided)
- Sort: Descending by score

**Helper Functions:**
- `resolveSectorHelper()`: Maps sector name to sector_id (validates "Sector 150")
- `calculateScore()`: Pure function for scoring logic

**Note:** This is **impure** (calls Prisma) but kept here for organizational consistency.

---

#### `src/logic/valueEstimator.ts`
**Purpose:** Property value estimation algorithm

**Functions:**

1. **`estimatePropertyValue(input, prisma)`** - Orchestration function
   - **Input:** `ValueEstimateInput` (sector, bhk, size_sqft, quoted_price?, ...)
   - **Process:**
     - Resolves sector to sector_id
     - Finds matching PriceBand (via `priceBandResolver`)
     - Calls pure logic function with fetched data
   - **Output:** `{ market_range, verdict, reason_codes, risk_flag }`

2. **`estimatePropertyValueLogic(params)`** - Pure logic function
   - **Input:** `ValueEstimateLogicParams` (priceBand, sector, confidenceLevel, input)
   - **Process:**
     - Converts price per sqft to total price (multiplies by size_sqft)
     - Determines verdict (Within market / Slightly high / Aggressive / Market range only)
     - Generates reason codes (max 3, priority order)
     - Sets risk flag (LOW / MEDIUM / HIGH)
   - **Output:** `ValueEstimateResult`

**Verdict Logic:**
- No quoted_price → "Market range only", MEDIUM risk
- quoted_price <= band_total_high → "Within market"
- quoted_price <= band_total_high * 1.15 → "Slightly high"
- Else → "Aggressive"

**Confidence Safety Rule:**
- If confidence_level = low → verdict cannot be "Within market" (upgrades to "Slightly high")

**Reason Codes (Priority Order):**
1. RECENT_LOWER_DEALS (if quoted > high)
2. RECENT_HIGHER_DEALS (if quoted < low * 0.9)
3. HIGH_SUPPLY / LOW_SUPPLY (from sector)
4. UNDER_CONSTRUCTION_DISCOUNT
5. BUILDER_PREMIUM (if builder in premium list)
6. SIZE_PREMIUM (if size > typical for BHK)
7. FLOOR_PREMIUM (if floor >= 8)
8. MARKET_ALIGNMENT (if quoted within range, confidence not low)

**Risk Flag Logic:**
- confidence_level = low → HIGH risk
- quoted_price > high * 1.15 → HIGH risk
- quoted_price > high → MEDIUM risk
- Else → LOW risk

**Note:** Pure logic function is testable without database.

---

#### `src/logic/compareEngine.ts`
**Purpose:** Property comparison algorithm

**Functions:**

1. **`compareProperties(input, prisma)`**
   - **Input:** `CompareInput` (property_id_1, property_id_2)
   - **Process:**
     - Validates properties exist
     - Validates not comparing property with itself
     - Fetches both properties with full details
     - Calculates differences (price, size, amenities, status)
   - **Output:** `ComparisonResult` (normalized comparison object)

**Validation:**
- Returns error if property_id_1 === property_id_2
- Returns 404 if either property not found

**Differences Calculated:**
- Price difference (absolute and percentage)
- Price per sqft difference
- Size difference
- Amenities (common, only in 1, only in 2)
- Status difference (boolean)

**Note:** This is **impure** (calls Prisma).

---

### 🔧 Services Layer (`src/services/`)

Service layer handles database operations, AI calls, and intent management.

#### `src/services/intentManager.ts`
**Purpose:** Intent state management and completeness calculation

**Interfaces:**
- `IntentState`: Complete intent structure
  ```typescript
  {
    bhk?: number;
    budget?: { min?, max?, flexibility: 'hard' | 'flexible' | 'unknown' };
    purpose?: 'end_use' | 'investment' | 'unknown';
    timeline?: string;
    preferences?: { ready_to_move?, under_construction?, builder_preference?, floor_preference? };
    completenessScore: number; // 0-100
  }
  ```

**Functions:**

1. **`calculateCompletenessScore(intent)`**
   - Calculates 0-100 score based on filled fields
   - Weights: BHK (20), Budget (30), Purpose (15), Timeline (10), Preferences (25)
   - Returns rounded score

2. **`isIntentComplete(intent)`**
   - Checks if completeness score >= 60
   - Returns boolean

3. **`mergeIntentState(existing, updates)`**
   - Merges new intent data into existing state
   - Recalculates completeness score
   - Returns merged IntentState

4. **`getNextQuestion(intent)`**
   - Rule-based question generation
   - Returns next best question based on missing fields
   - Priority: BHK → Budget → Purpose → Timeline → Preferences

5. **`intentToDiscoveryInput(intent)`**
   - Converts IntentState to DiscoveryInput
   - Used for property search when intent complete

**Used By:** `chatController.ts`

---

#### `src/services/aiService.ts`
**Purpose:** AI-powered intent extraction and question generation

**Functions:**

1. **`extractIntentFromMessage(message, currentIntent)`**
   - **Input:** User message string, current intent state
   - **Process:**
     - Uses Google Gemini API if configured
     - Sends system prompt for JSON extraction
     - Parses AI response for structured intent
     - Falls back to regex extraction if AI unavailable
   - **Output:** `Partial<IntentExtractionResult>`
   - **AI Configuration:**
     - API Key: `GEMINI_API_KEY`
     - Model: `GEMINI_MODEL_NAME` (default: 'gemini-2.0-flash-exp')
     - Base URL: `https://generativelanguage.googleapis.com/v1beta`
   - **Fallback:** Regex-based extraction (BHK, price, purpose, preferences)

2. **`generateNextQuestion(currentIntent, conversationHistory)`**
   - **Input:** Current intent state, conversation history
   - **Process:**
     - Uses Google Gemini API if configured
     - Generates natural next question
     - Falls back to rule-based question if AI unavailable
   - **Output:** Question string
   - **Fallback:** Calls `getNextQuestion()` from `intentManager`

**Error Handling:**
- Gracefully falls back to regex/rule-based if AI fails
- Logs errors but doesn't crash
- Ensures system works without AI configuration

**Used By:** `chatController.ts`

---

#### `src/services/priceBandResolver.ts`
**Purpose:** Resolve PriceBand with priority-based fallback logic

**Functions:**

1. **`resolvePriceBand(prisma, sector_id, property_type, bhk, size_sqft)`**
   - **Input:** Sector ID, property type, BHK, size
   - **Process:** Searches PriceBand in priority order:
     1. **Exact match:** sector + property_type + bhk + size within range
     2. **Relax size:** sector + property_type + bhk (ignore size) → force confidence = low
     3. **Sector-only:** sector + property_type IS NULL + bhk IS NULL → force confidence = low
     4. **None found:** Throw EstimationError
   - **Output:** `{ band: PriceBand, forcedConfidence: ConfidenceLevel }`

**Priority Order:**
- Higher confidence bands preferred when multiple match
- Uses `orderBy: { confidence_level: 'desc' }` for deterministic ordering
- Size relaxation and sector-only fallbacks force confidence to "low"

**Used By:** `valueEstimator.ts`

---

### 🛠️ Utilities (`src/utils/`)

Shared utilities, constants, and error classes.

#### `src/utils/errors.ts`
**Purpose:** Centralized error taxonomy

**Error Classes:**
- `ValidationError`: Input validation failures (HTTP 400)
- `NotFoundError`: Resource not found (HTTP 404)
- `EstimationError`: Value estimation failures (HTTP 400)

**Helper Function:**
- `getErrorStatusCode(error)`: Maps error type to HTTP status code

**Usage:** Thrown by logic engines, caught by controllers

---

#### `src/utils/constants.ts`
**Purpose:** Shared constants used across logic engines

**Constants:**

1. **`PREMIUM_BUILDERS`**
   - Type: `['godrej', 'dlf', 'sobha'] as const`
   - Used for: `BUILDER_PREMIUM` reason code in value estimator
   - Normalized to lowercase for comparison

2. **`TYPICAL_SIZE_BY_BHK`**
   - Type: `Record<number, number>`
   - Values: `{ 1: 600, 2: 1000, 3: 1400, 4: 1800 }`
   - Used for: `SIZE_PREMIUM` reason code calculation
   - Units: Square feet

**Usage:** Imported by `valueEstimator.ts`

---

### 🗄️ Database Layer (`prisma/`)

#### `prisma/schema.prisma`
**Purpose:** Database schema definition

**Models:**

1. **`Sector`**
   - Fields: `id`, `city`, `name`, `avg_price_low`, `avg_price_high`, `demand_level`, `supply_level`, `volatility_flag`
   - Unique: `@@unique([city, name])`
   - Relations: `properties`, `priceBands`
   - **Note:** `avg_price_low/high` are in ₹ per sqft

2. **`Property`**
   - Fields: `id`, `sector_id`, `property_type`, `bhk`, `size_sqft`, `price`, `price_per_sqft`, `builder`, `project_name?`, `image_url?`, `floor?`, `status`, `amenities[]`
   - Relations: `sector`, `savedProperties`
   - **Note:** `project_name` and `image_url` added for frontend display

3. **`PriceBand`**
   - Fields: `id`, `sector_id`, `property_type?`, `bhk?`, `min_size`, `max_size`, `price_low`, `price_high`, `confidence_level`
   - Nullable: `property_type` and `bhk` (null = sector-level band)
   - Relations: `sector`
   - **Note:** Prices are in ₹ per sqft (not absolute)

4. **`SavedProperty`**
   - Fields: `user_id`, `property_id`, `saved_at`
   - Composite Key: `@@id([user_id, property_id])`
   - Relations: `property`

**Enums:**
- `DemandLevel`: low, medium, high
- `SupplyLevel`: low, medium, high
- `PropertyType`: flat, plot
- `PropertyStatus`: ready, under_construction
- `ConfidenceLevel`: low, medium, high

---

#### `prisma/seed.ts`
**Purpose:** Database seeding script

**Process:**
1. Cleans existing data (optional - for development)
2. Seeds 1 Sector (Sector 150, Noida)
3. Seeds 5 PriceBands (2BHK, 3BHK standard, 3BHK premium, 4BHK, sector-level fallback)
4. Seeds 19 Properties (mix of BHK, builders, statuses, with project names and images)

**Property Data:**
- Properties include: `project_name`, `image_url`, `builder`, `bhk`, `size_sqft`, `price`, `price_per_sqft`, `floor`, `status`, `amenities`
- Images stored in `frontend/public/images/properties/`

**Run:** `npx prisma db seed`

---

#### `prisma/migrations/`
**Purpose:** Database migration history

**Files:**
- `20260118203844_init/migration.sql`: Initial schema migration
- `20260119155258_add_project_name_and_image_url/migration.sql`: Added project_name and image_url columns
- `migration_lock.toml`: Prisma migration lock file

**Run:** `npx prisma migrate dev`

---

### 🧪 Tests (`src/__tests__/`)

#### `src/__tests__/integration/`
**Purpose:** End-to-end API integration tests

**Files:**
- `properties.integration.test.ts`: Tests GET /api/v1/properties endpoints
- `valueCheck.integration.test.ts`: Tests POST /api/v1/value-check endpoint
- `compare.integration.test.ts`: Tests POST /api/v1/compare endpoint

**Coverage:** One happy-path test per endpoint

---

#### `src/logic/__tests__/`
**Purpose:** Unit tests for logic engines

**Files:**
- `discoveryEngine.test.ts`: Tests property discovery and scoring
- `valueEstimator.test.ts`: Tests value estimation logic
- `compareEngine.test.ts`: Tests property comparison logic

**Coverage:** Pure function testing (mocked Prisma)

---

### 📦 Configuration Files

#### `package.json`
**Purpose:** Project dependencies and scripts

**Scripts:**
- `npm run dev`: Start development server (ts-node)
- `npm run build`: Compile TypeScript to JavaScript
- `npm start`: Run production server (node)
- `npm run prisma:generate`: Generate Prisma Client
- `npm run prisma:migrate`: Run database migrations
- `npm run prisma:seed`: Seed database

**Dependencies:**
- `express`: Web framework
- `@prisma/client`: Database ORM client
- `cors`: CORS middleware
- `dotenv`: Environment variable loader

**Note:** No AI SDK dependencies - uses fetch API for Google Gemini API

---

#### `tsconfig.json`
**Purpose:** TypeScript compiler configuration

**Settings:**
- Target: ES2020
- Module: CommonJS
- OutDir: `dist/`
- Strict mode enabled

---

## 🔄 Request Flow Examples

### Example 1: Chat-First Property Discovery

```
1. POST /api/v1/chat { message: "looking for a flat" }
   Header: X-User-Id: "user123"
   ↓
2. chatRoutes.ts → handleChat()
   ↓
3. chatController.ts → Gets/initializes intent state
   ↓
4. aiService.ts → extractIntentFromMessage()
   ↓
5. intentManager.ts → mergeIntentState()
   ↓
6. intentManager.ts → calculateCompletenessScore()
   ↓
7a. If score < 60:
    aiService.ts → generateNextQuestion()
    → Returns: { message: "How many bedrooms...", showRecommendations: false }
   
7b. If score >= 60:
    discoveryEngine.ts → discoverProperties()
    valueEstimator.ts → estimatePropertyValue() (for each property)
    → Returns: { message: "Great! I found...", properties: [...], showRecommendations: true }
```

### Example 2: Value Estimation

```
1. POST /api/v1/value-check { sector, bhk, size_sqft, quoted_price, ... }
   ↓
2. valueCheckRoutes.ts → checkValue()
   ↓
3. valueCheckController.ts → Validates all inputs
   ↓
4. valueEstimator.ts → estimatePropertyValue()
   ↓
5. priceBandResolver.ts → resolvePriceBand() (finds matching band)
   ↓
6. valueEstimator.ts → estimatePropertyValueLogic() (pure calculation)
   ↓
7. valueCheckController.ts → returns { market_range, verdict, reason_codes, risk_flag }
```

### Example 3: Property Discovery (Direct)

```
1. GET /api/v1/properties?sector=Sector%20150&bhk=3
   ↓
2. propertyRoutes.ts → getProperties()
   ↓
3. propertyController.ts → validates input
   ↓
4. discoveryEngine.ts → discoverProperties()
   ↓
5. Prisma → queries database
   ↓
6. discoveryEngine.ts → calculates scores, sorts
   ↓
7. propertyController.ts → returns { properties: [...] }
```

---

## 🔐 Authentication (MVP)

**Current Implementation:**
- Uses `X-User-Id` header (simple string, no real auth)
- Stored in `localStorage` on frontend
- No JWT, no sessions, no password hashing

**Endpoints Requiring Auth:**
- `POST /api/v1/saved-properties` (requires `X-User-Id`)
- `GET /api/v1/saved-properties` (requires `X-User-Id`)
- `POST /api/v1/chat` (requires `X-User-Id`)
- `GET /api/v1/chat/intent` (requires `X-User-Id`)
- `DELETE /api/v1/chat/intent` (requires `X-User-Id`)

---

## 🤖 AI Integration

**Configuration (Optional):**
```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL_NAME=gemini-2.5-flash
ENABLE_AI=true
```

**Usage:**
- Intent extraction from user messages
- Question generation for conversational flow
- **NOT used for:** Pricing, ranking, or property discovery

**Fallback:**
- If AI not configured, uses regex-based intent extraction
- Uses rule-based question generation
- System works fully without AI

---

## 📊 API Endpoints Summary

| Method | Endpoint | Controller | Logic/Service | Description |
|--------|----------|------------|---------------|-------------|
| GET | `/api/v1/properties` | `getProperties` | `discoverProperties` | Discover & rank properties |
| GET | `/api/v1/properties/:id` | `getPropertyById` | - | Get property details |
| POST | `/api/v1/value-check` | `checkValue` | `estimatePropertyValue` | Estimate property value |
| POST | `/api/v1/compare` | `compare` | `compareProperties` | Compare two properties |
| POST | `/api/v1/saved-properties` | `saveProperty` | - | Save property (requires auth) |
| GET | `/api/v1/saved-properties` | `getSavedProperties` | - | Get saved properties (requires auth) |
| POST | `/api/v1/chat` | `handleChat` | `intentManager`, `aiService`, `discoverProperties` | Chat & intent-based advisor |
| GET | `/api/v1/chat/intent` | `getIntent` | `intentManager` | Get current intent state |
| DELETE | `/api/v1/chat/intent` | `resetIntent` | `intentManager` | Reset intent state |

---

## 🎯 Key Design Decisions

1. **Chat-First Approach:** Properties only shown when intent complete (score >= 60)
2. **Intent Management:** In-memory storage (MVP), can move to DB later
3. **AI Optional:** System works with regex fallback if AI not configured
4. **Pure Logic Engines:** Business logic separated from HTTP concerns
5. **Thin Controllers:** Controllers only validate and delegate
6. **Deterministic:** Same input = same output (no randomness)
7. **No AI in Logic:** AI only for intent extraction and questions (not pricing/ranking)
8. **Price Bands in ₹/sqft:** All price calculations multiply by size
9. **Nullable PriceBand Fields:** `property_type` and `bhk` null = sector-level fallback
10. **Max 20 Properties:** Discovery returns top 20 (increased from 10)
11. **Max 3 Reason Codes:** Value estimator returns top 3 by priority
12. **Session-Based Auth:** Simple `user_id` string (MVP)

---

## 🚀 Running the Backend

```bash
# Development
npm run dev

# Production
npm run build
npm start

# Database
npx prisma migrate dev
npx prisma db seed
npx prisma generate
```

---

## 📝 Environment Variables

**Required:**
- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: Server port (default: 3000)

**Optional (for AI features):**
- `GEMINI_API_KEY`: Google Gemini API key
- `GEMINI_MODEL_NAME`: Gemini model name (default: 'gemini-2.0-flash-exp')
- `ENABLE_AI`: Enable AI features (set to 'true' to enable)

---

## 📝 Notes

- **Port:** 3000 (configurable via `PORT` env variable)
- **Database:** PostgreSQL (via Prisma)
- **CORS:** Enabled for all origins (development)
- **Error Handling:** Centralized error taxonomy
- **Testing:** Unit tests for logic, integration tests for endpoints
- **No Pagination:** MVP simplicity (max 20 properties per query)
- **Intent Storage:** In-memory Map (can be moved to database)

---

This structure follows a clean architecture pattern with clear separation of concerns, making the codebase maintainable, testable, and scalable. The chat-first refactor adds an AI-powered conversational layer while maintaining deterministic property discovery and value estimation.
