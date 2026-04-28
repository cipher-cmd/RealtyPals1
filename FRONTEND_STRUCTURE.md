# Frontend Structure Documentation

Complete overview of the Investors Clinic frontend architecture, file organization, and responsibilities.

**Last Updated:** After Chat-First Refactor

---

## 📁 Directory Structure

```
frontend/
├── app/                          # Next.js 14 App Router pages
│   ├── layout.tsx                # Root layout (metadata, favicon)
│   ├── page.tsx                  # Root page (redirects to /login or /discover)
│   ├── globals.css               # Global Tailwind CSS styles
│   ├── login/                    # Login page
│   │   └── page.tsx
│   ├── discover/                 # Property Discovery & Chat page (CHAT-FIRST)
│   │   └── page.tsx
│   ├── saved/                    # Saved Properties page
│   │   └── page.tsx
│   ├── compare/                  # Compare Properties page
│   │   └── page.tsx
│   ├── value-estimator/          # Property Value Estimator page
│   │   └── page.tsx
│   └── property/                 # Dynamic Property Detail page
│       └── [id]/
│           └── page.tsx
├── components/                   # Reusable React components
│   ├── Sidebar.tsx               # Global sidebar navigation
│   ├── DiscoveryContent.tsx      # Chat-first discovery content
│   ├── PropertyCard.tsx          # Property card display (with validation)
│   ├── SavedPropertyCard.tsx     # Saved property card display
│   └── Toast.tsx                 # Toast notification component
├── types/                        # TypeScript type definitions
│   └── property.ts                # Property, Sector, ChatMessage, PropertyValidation interfaces
├── lib/                          # Utility functions (currently empty)
├── public/                       # Static assets
│   └── images/
│       ├── logo/                 # Company logos
│       │   └── investors-clinic-logo-white.svg
│       ├── icons/                # SVG icons (13 icons)
│       │   ├── add.svg
│       │   ├── compare.svg
│       │   ├── logout.svg
│       │   ├── mic.svg
│       │   ├── property-discover.svg
│       │   ├── saved-property.svg
│       │   ├── settings.svg
│       │   ├── share.svg
│       │   ├── value-estimator.svg
│       │   └── ... (more icons)
│       ├── backgrounds/          # Background images
│       │   └── login-background.jpg
│       └── properties/           # Property images (19 images)
│           └── [19 *.jpg files]
├── __tests__/                    # Unit tests
│   ├── components/               # Component tests
│   │   ├── DiscoveryContent.test.tsx
│   │   ├── PropertyCard.test.tsx
│   │   ├── Sidebar.test.tsx
│   │   └── Toast.test.tsx
│   └── pages/                    # Page tests
│       ├── compare.test.tsx
│       ├── discover.test.tsx
│       ├── login.test.tsx
│       ├── saved.test.tsx
│       └── value-estimator.test.tsx
├── env.local                     # Environment variables
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── jest.config.js                # Jest test configuration
├── jest.setup.js                 # Jest setup file
├── postcss.config.js             # PostCSS configuration
└── package.json                  # Dependencies & scripts
```

---

## 🎯 Architecture Overview

**Framework:** Next.js 14 (App Router) with React 18

**Key Technologies:**
- **Next.js 14:** App Router, Server/Client Components, Image Optimization
- **React 18:** Hooks, Client Components (`'use client'`)
- **TypeScript:** Type safety across the application
- **Tailwind CSS:** Utility-first CSS framework
- **Jest + React Testing Library:** Unit testing

**Data Flow:**
```
User Action → Component → API Call → Backend → Response → State Update → UI Re-render
```

**State Management:**
- React `useState` for local component state
- React `useEffect` for side effects (API calls, localStorage)
- `localStorage` for user authentication (MVP placeholder)
- No global state manager (Redux, Zustand, etc.)

**Key Design Principles:**
- **Chat-First:** Discover page shows chat interface first, properties only after intent complete
- **Component-Based:** Reusable components with clear responsibilities
- **Type-Safe:** TypeScript interfaces for all data structures
- **Responsive:** Mobile-first design with Tailwind breakpoints

---

## 📄 File-by-File Breakdown

### 🎨 Root Layout & Configuration

#### `app/layout.tsx`
**Purpose:** Root layout wrapper for all pages

**Responsibilities:**
- Defines HTML structure (`<html>`, `<body>`)
- Sets global metadata (title, description, favicon)
- Imports global CSS
- Wraps all page content

**Key Features:**
- Metadata: "Investors Clinic - Property Value Validator"
- Favicon: Uses Investors Clinic logo (`/images/logo/investors-clinic-logo-white.svg`)
- Global styles: Imports `globals.css`

**Note:** This is a Server Component (no `'use client'` directive)

---

#### `app/page.tsx`
**Purpose:** Root route (`/`) - handles initial redirection

**Responsibilities:**
- Checks `localStorage` for `user_id`
- Redirects to `/discover` if logged in
- Redirects to `/login` if not logged in
- Shows loading spinner during redirect

**Authentication Logic:**
- Reads `localStorage.getItem('user_id')`
- Uses Next.js `useRouter` for navigation
- Client Component (`'use client'`)

---

#### `app/globals.css`
**Purpose:** Global CSS styles and Tailwind directives

**Contents:**
- Tailwind directives (`@tailwind base/components/utilities`)
- CSS variables for theming
- Base body styles
- Custom utility classes

**Note:** Tailwind processes this file to generate utility classes

---

### 🏠 Pages (`app/`)

#### `app/login/page.tsx`
**Purpose:** User authentication page

**Route:** `/login`

**Features:**
- Split-screen layout (promotional left, form right)
- Background image with overlay (`login-background.jpg`)
- Email/password form (placeholder auth)
- Social login buttons (Google, Apple - non-functional, show "Coming soon" toast)
- "Remember Me" checkbox
- "Forgot Password" link

**Functionality:**
- On submit: Creates `user_id` in `localStorage` (any email/password works)
- Redirects to `/discover` after "login"
- No real authentication (MVP placeholder)

**State:**
- `email`, `password`, `rememberMe` (form inputs)
- `toast` (for notifications)

**API Calls:** None (placeholder authentication)

**Styling:**
- Form background: `#F9FAFB`
- Headline and description: Larger text sizes
- Responsive layout

---

#### `app/discover/page.tsx`
**Purpose:** Property Discovery & Chat page (CHAT-FIRST)

**Route:** `/discover`

**Key Change:** **CHAT-FIRST APPROACH** - No properties shown on initial load

**Features:**
- Integrates `Sidebar` and `DiscoveryContent` components
- Manages global `activeView` state for sidebar
- **Does NOT load properties on mount** (chat-first)
- Properties shown only after chat intent is complete

**State:**
- `properties`: Array of Property objects (empty initially)
- `loading`: Loading state for API calls (not used on mount)
- `activeView`: Current sidebar view ('discovery' | 'saved' | 'compare' | 'value-estimator')
- `userId`: User ID from localStorage

**API Calls:**
- None on initial mount (chat-first approach)
- Properties loaded via chat API when intent complete

**Functions:**
- `loadProperties(filters)`: Fetches properties with filters (not called on mount)

**Props Passed:**
- To `Sidebar`: `activeView`, `onViewChange`, `userId`
- To `DiscoveryContent`: `properties`, `loading`, `onLoadProperties`, `onUpdateProperties`, `userId`

**Note:** This page is now chat-first - properties only appear after user completes intent via chat.

---

#### `app/saved/page.tsx`
**Purpose:** Saved Properties page

**Route:** `/saved`

**Features:**
- Displays user's saved properties in a grid
- Empty state message (centered) when no properties
- Header with Share/Settings buttons (show "Coming soon" toast)
- Prototype disclaimer footer: "Prototype: Saved properties are session-based"
- Remove button on each property card

**State:**
- `savedProperties`: Array of SavedProperty objects
- `loading`: Loading state
- `activeView`: Sidebar state
- `userId`: User ID
- `toast`: Toast notifications

**API Calls:**
- `GET /api/v1/saved-properties` (with `X-User-Id` header) - on mount

**Functions:**
- `loadSavedProperties(userId)`: Fetches saved properties
- `handleRemoveSaved(propertyId)`: Removes property (local only, prototype) - shows "Removed locally (prototype behavior)" toast

**Components Used:**
- `Sidebar`: Navigation
- `SavedPropertyCard`: Individual saved property display
- `Toast`: Notifications

**Styling:**
- Empty state: Centered icon and message
- Grid: Responsive (1-5 columns based on screen size)

---

#### `app/compare/page.tsx`
**Purpose:** Property Comparison page

**Route:** `/compare`

**Features:**
- Property selection dropdowns (side-by-side, smaller, centered)
- Compare button (centered, smaller)
- Comparison table display
- Disclaimer: "This comparison shows factual property differences only. Price validation should be done separately using the Value Estimator."
- "Share Report" and "Select different properties" buttons (moved out of header)
- Property dropdowns show: "Project Name - BHK - Price - Size"

**State:**
- `properties`: All properties for selection
- `property1Id`, `property2Id`: Selected property IDs
- `comparison`: Comparison result from API
- `loading`: Loading state
- `activeView`: Sidebar state
- `userId`: User ID
- `toast`: Toast notifications

**API Calls:**
- `GET /api/v1/properties?sector=Sector%20150` (load properties for selection)
- `POST /api/v1/compare` (compare two properties)

**Request Body:**
```json
{
  "property_id_1": "uuid",
  "property_id_2": "uuid"
}
```

**Functions:**
- `loadProperties()`: Fetches all properties
- `handleCompare()`: Compares selected properties
- `formatPrice(price)`: Formats currency in Indian format
- `getPropertyDetails(id)`: Gets property from local state

**Components Used:**
- `Sidebar`: Navigation
- `Toast`: Notifications

**Styling:**
- Dropdowns: Smaller, side-by-side, centered
- Compare button: Centered, smaller
- Table: Clean, bordered rows

---

#### `app/value-estimator/page.tsx`
**Purpose:** Property Value Estimator page

**Route:** `/value-estimator`

**Features:**
- Property details form:
  - Property Type and Location/Sector (same line, half width each)
  - Super Area slider (500-5000 sqft)
  - BHK Configuration buttons (1-5 BHK)
  - Floor Number and Age (same line, half width each)
  - Possession Status dropdown
  - Builder input (optional)
  - **Quoted Price input (optional)** - for validation
- Connectivity perks toggles (informational only, de-emphasized with opacity-60)
- Estimation results display:
  - Market range (blue card)
  - System Verdict (with icons: ✅ ⚠️ 🔴 📊)
  - Risk flag badge (LOW/MEDIUM/HIGH)
  - Key Factors (reason codes, max 3)
- Sector locked to "Sector 150"

**State:**
- Form inputs: `propertyType`, `sector`, `sizeSqft`, `bhk`, `floor`, `age`, `propertyStatus`, `builder`, `quotedPrice`
- Connectivity toggles: `metroNearby`, `expresswayAccess`, `corporateHubProximity` (not sent to API)
- `results`: Value estimate result
- `loading`: Loading state
- `activeView`: Sidebar state
- `userId`: User ID
- `toast`: Toast notifications

**API Calls:**
- `POST /api/v1/value-check` (with property details)

**Request Body:**
```json
{
  "sector": "Sector 150",
  "bhk": 3,
  "size_sqft": 1850,
  "property_type": "flat",
  "property_status": "ready",
  "quoted_price": 9900000,  // optional
  "builder": "Godrej",      // optional
  "floor": 10                // optional
}
```

**Response:**
```json
{
  "market_range": { "low": 18000000, "high": 21600000 },
  "verdict": "Within market",
  "reason_codes": ["MARKET_ALIGNMENT", "BUILDER_PREMIUM"],
  "risk_flag": "LOW"
}
```

**Functions:**
- `handleEstimate()`: Submits form and fetches estimation
- `formatPrice(price)`: Formats currency in Indian format

**Components Used:**
- `Sidebar`: Navigation
- `Toast`: Notifications

**Styling:**
- Connectivity section: `opacity-60`, lock icon, italic note
- Placeholders: Darker opacity for visibility
- Results: Clear visual hierarchy

**Note:** Connectivity toggles are informational only (not sent to API)

---

#### `app/property/[id]/page.tsx`
**Purpose:** Dynamic Property Detail page

**Route:** `/property/[id]` (dynamic route)

**Features:**
- Displays full property details
- Property image (if available) or placeholder
- "Broker Quoted Price" (not "Listed Price") with "Listed by seller" helper text
- Disclaimer: "Prices shown are as listed. Use Value Estimator for independent market validation."
- "Save Property" button (shows "Property saved!" toast)
- "Get second-opinion on price" button (links to value estimator with pre-filled data)
- Back button
- Header with context message: "Property details shown. Price not validated."

**State:**
- `property`: Property object from API
- `loading`: Loading state
- `activeView`: Sidebar state
- `userId`: User ID
- `toast`: Toast notifications

**API Calls:**
- `GET /api/v1/properties/:id` (fetch property details)
- `POST /api/v1/saved-properties` (save property, requires `X-User-Id` header)

**Functions:**
- `loadProperty()`: Fetches property by ID
- `handleSaveProperty()`: Saves property to user's list
- `formatPrice(price)`: Formats currency

**Components Used:**
- `Sidebar`: Navigation
- `Toast`: Notifications

**Error Handling:**
- 404: Property not found → Redirects to `/discover`
- Loading state with spinner
- Error toast notifications

**Navigation:**
- "Get second-opinion on price" → Navigates to `/value-estimator` (can pre-fill data in future)

---

### 🧩 Components (`components/`)

#### `components/Sidebar.tsx`
**Purpose:** Global sidebar navigation component

**Features:**
- Investors Clinic logo and branding (centered, enlarged)
- "New Chat" button (resets discovery chat context)
- Navigation menu:
  - Discover Properties
  - Saved Properties
  - Compare Properties
  - Value Estimator
- Logout button
- Active view highlighting
- Hover effects (white text, highlight background)

**Props:**
- `activeView`: Current active view
- `onViewChange`: Callback for view changes
- `userId`: User ID (for logout)

**Functions:**
- `handleLogout()`: Clears localStorage, redirects to `/login`
- `handleViewChange(view)`: Changes view and navigates
- `handleNewChat()`: Resets discovery chat (calls `window.__resetDiscoveryChat` with safety checks)

**Navigation:**
- Uses Next.js `useRouter` for navigation
- Routes: `/discover`, `/saved`, `/compare`, `/value-estimator`

**Styling:**
- Width: `w-80` (320px)
- Background: `#F3F4F6` (slightly darker than main screen)
- Logo: Centered, 72x72px
- Buttons: Larger, with hover effects

**Note:** "New Chat" button resets discovery search context, not an AI conversation.

---

#### `components/DiscoveryContent.tsx`
**Purpose:** Main content area for Discovery page (CHAT-FIRST)

**Key Change:** **CHAT-FIRST APPROACH** - No properties shown until intent complete

**Features:**
- Header with "Noida Property Validator" title
- **Welcome message on first load** (AI advisor introduction)
- Chat interface (always visible)
- **Property recommendations section** (only shown when `showRecommendations === true`)
- Input box (always at bottom)
- Plus and mic icons inside input
- Toast notifications

**Props:**
- `properties`: Array of Property objects (empty initially)
- `loading`: Loading state
- `onLoadProperties`: Callback to load properties with filters (not used in chat-first)
- `onUpdateProperties`: Callback to update properties from chat
- `userId`: User ID (required)
- `onResetChat`: Optional reset callback

**State:**
- `chatInput`: Current chat input text
- `chatHistory`: Array of ChatMessage objects
- `showRecommendations`: Boolean - controls property visibility
- `toast`: Toast notification state
- `isInitialized`: Boolean - tracks if welcome message shown

**API Calls:**
- `POST /api/v1/chat` (when user submits chat message)
- `DELETE /api/v1/chat/intent` (when resetting chat)

**Request:**
```json
{
  "message": "looking for a flat"
}
```
Headers: `X-User-Id: userId`

**Response:**
```json
{
  "message": "How many bedrooms are you looking for?",
  "properties": [],
  "showRecommendations": false,
  "intent": { "completenessScore": 20, ... }
}
```

Or when intent complete:
```json
{
  "message": "Great! I found 5 properties...",
  "properties": [Property[] with validation],
  "showRecommendations": true,
  "intent": { "completenessScore": 75, ... }
}
```

**Functions:**
- `handleChatSubmit()`: 
  - Submits chat message
  - Calls `POST /api/v1/chat`
  - Updates chat history
  - If `showRecommendations === true`, updates properties and shows them
- `handleKeyPress()`: Handles Enter key to submit
- Exposes `__resetDiscoveryChat` on `window` object (for Sidebar access)

**Chat Flow:**
1. **Initial Load:** Shows welcome message, no properties
2. **User types message** → submits
3. **Adds user message** to history
4. **Calls `POST /api/v1/chat`** with message
5. **Receives response:**
   - If intent incomplete: Question message, `showRecommendations: false`
   - If intent complete: Explanation + properties, `showRecommendations: true`
6. **Adds AI message** to history
7. **If `showRecommendations === true`:** Shows properties below chat
8. **Chat continues** - user can adjust, ask follow-ups

**UI States:**
- **Initial:** Welcome message, input box at bottom
- **Chat Active (Intent Incomplete):** Chat messages, input at bottom, no properties
- **Intent Complete:** Chat messages, properties below chat, input at bottom

**Styling:**
- AI messages: White background (`bg-white`) with light border
- User messages: Blue background (`bg-blue-600`) with white text
- Properties: Grid layout (1-5 columns responsive)
- Input: Always at bottom, full width

**Reset Function:**
- Clears chat history
- Resets `showRecommendations` to false
- Calls `DELETE /api/v1/chat/intent` to reset backend intent
- Re-initializes with welcome message

---

#### `components/PropertyCard.tsx`
**Purpose:** Displays individual property in a card format

**Features:**
- Property image (if available) or placeholder
- Status badge overlay (Ready / Under Construction)
- **Project name** as main title (or BHK + Type if no project name)
- Builder name as subtitle
- Listed Price with "Listed by seller" helper text
- Price/sqft, Size, Floor (combined in one line)
- Amenities (first 3, then "+X more")
- Sector info
- **Price Validation Context** (if `property.validation` exists):
  - Market Validation section
  - Risk flag badge (LOW/MEDIUM/HIGH with colors)
  - Verdict with icons (✅ ⚠️ 🔴 📊)
  - Reason codes (max 2 shown)
- Helper text: "Validate Price →" (only if no validation)

**Props:**
- `property`: Property object (may include `validation` field)

**Functions:**
- `handleClick()`: Navigates to `/property/[id]`
- `formatPrice(price)`: Formats currency in Indian format

**Styling:**
- Hover effect: Shadow increases
- Clickable: Cursor pointer
- Image: 144px height (h-36), object-cover
- Status badge: Green (ready) or Yellow (under construction)
- Compact layout: Reduced padding, smaller text

**Display Logic:**
- Project name: Shows `project_name` if available, else `${bhk} BHK ${type}`
- Builder: Shows as subtitle
- Image: Uses `property.image_url` if available, else placeholder SVG
- Validation: Only shown if `property.validation` exists (from chat/search results)

**Validation Display:**
- Risk flag: Color-coded badge (green/yellow/red)
- Verdict: Human-readable with icons
- Market range: Shown if verdict is "Market range only"
- Reason codes: Displayed as badges (max 2 in card)

---

#### `components/SavedPropertyCard.tsx`
**Purpose:** Displays individual saved property in a card format

**Features:**
- Property image (if available) or placeholder
- Status badge overlay
- **Remove button** (trash icon, top-right)
- **Project name** as main title
- Builder name as subtitle
- Listed Price with "Listed by seller" helper text
- Price/sqft, Size, Floor
- "Saved on [date]" footer
- Helper text: "Validate Price → Use Value Estimator"

**Props:**
- `property`: Property object
- `savedAt`: ISO timestamp string
- `onRemove`: Callback to remove property

**Functions:**
- `handleClick()`: Navigates to `/property/[id]`
- `formatPrice(price)`: Formats currency
- `formatDate(dateString)`: Formats date (e.g., "Jan 18, 2024")

**Styling:**
- Remove button: Absolute positioned, top-right, white background
- Image: 144px height
- Hover effect: Shadow increases
- Clickable: Cursor pointer (except remove button)

**Note:** Pure presentational component (no API calls, no state management)

---

#### `components/Toast.tsx`
**Purpose:** Reusable toast notification component

**Features:**
- Auto-dismisses after 2 seconds (configurable)
- Fade-out animation (300ms)
- Positioned at **top-center** of screen
- Dark background with white text
- Quick fade (disappears faster)

**Props:**
- `message`: Toast message text
- `onClose`: Callback when toast closes
- `duration`: Display duration in ms (default: 2000)

**State:**
- `isVisible`: Controls fade-out animation

**Styling:**
- Position: `fixed top-20 left-1/2 -translate-x-1/2`
- Background: `bg-gray-900`
- Text: White
- Z-index: 50 (above most content)
- Animation: Fade in/out with transition

**Usage:**
- "Coming soon" messages (Share, Settings, Plus, Mic buttons)
- Success notifications ("Property saved!")
- Error notifications
- Property removed confirmations ("Removed locally (prototype behavior)")

---

### 📝 Type Definitions (`types/`)

#### `types/property.ts`
**Purpose:** TypeScript interfaces for data structures

**Interfaces:**

1. **`Sector`**
   - Represents a real estate sector (e.g., Sector 150, Noida)
   - Fields: `id`, `city`, `name`, `avg_price_low/high`, `demand_level`, `supply_level`, `volatility_flag`

2. **`PropertyValidation`** (NEW)
   - Price validation context from chat/search
   - Fields: `market_range` (low/high), `verdict`, `risk_flag`, `reason_codes[]`

3. **`Property`**
   - Represents a property listing
   - Fields: `id`, `sector_id`, `property_type`, `bhk`, `size_sqft`, `price`, `price_per_sqft`, `builder`, `project_name?`, `image_url?`, `floor?`, `status`, `amenities[]`, `sector`, `score?`, `validation?`
   - `score`: Discovery ranking only (NOT investment quality metric) - with clarifying comment
   - `project_name` and `image_url`: Optional (nullable)
   - `validation`: Optional - added by chat/search endpoints when properties are validated

4. **`ChatMessage`**
   - Represents a chat message (user or AI)
   - Fields: `type` ('user' | 'ai'), `content`, `properties?`, `timestamp` (ISO string)
   - `timestamp`: ISO string (e.g., "2024-01-18T21:02:14.315Z") - with clarifying comment
   - `properties`: Optional - for AI responses that include property suggestions

**Type Aliases:**
- `ReasonCode`: Enum of possible reason codes
- `RiskFlag`: 'LOW' | 'MEDIUM' | 'HIGH'
- `Verdict`: 'Within market' | 'Slightly high' | 'Aggressive' | 'Market range only'

**Usage:** Imported across components and pages for type safety

---

### 🎨 Styling & Configuration

#### `tailwind.config.ts`
**Purpose:** Tailwind CSS configuration

**Features:**
- Content paths: `app/`, `components/`
- Theme extensions: CSS variables for background/foreground
- Custom colors: Uses CSS variables

**Note:** Tailwind scans these paths for class usage and generates CSS

---

#### `next.config.js`
**Purpose:** Next.js configuration

**Features:**
- Image domains: Empty array (no external image domains configured)
- Can add domains for `next/image` optimization

**Note:** For external images, add domains here

---

#### `postcss.config.js`
**Purpose:** PostCSS configuration (processes Tailwind CSS)

**Plugins:**
- `tailwindcss`: Generates utility classes
- `autoprefixer`: Adds vendor prefixes

---

### 🧪 Testing (`__tests__/`)

#### `__tests__/components/`
**Purpose:** Unit tests for React components

**Files:**
- `DiscoveryContent.test.tsx`: Tests chat interface, property display
- `PropertyCard.test.tsx`: Tests property card rendering
- `Sidebar.test.tsx`: Tests navigation and logout
- `Toast.test.tsx`: Tests toast display and auto-dismiss

**Testing Library:** Jest + React Testing Library

---

#### `__tests__/pages/`
**Purpose:** Unit tests for page components

**Files:**
- `discover.test.tsx`: Tests discover page (chat-first flow)
- `saved.test.tsx`: Tests saved properties page
- `compare.test.tsx`: Tests compare page
- `value-estimator.test.tsx`: Tests value estimator page
- `login.test.tsx`: Tests login page

**Coverage:** Component rendering, user interactions, API calls (mocked)

---

### 📦 Configuration Files

#### `package.json`
**Purpose:** Project dependencies and scripts

**Scripts:**
- `npm run dev`: Start development server (port 3001)
- `npm run build`: Build for production
- `npm start`: Start production server
- `npm run lint`: Run ESLint
- `npm test`: Run Jest tests
- `npm run test:watch`: Run tests in watch mode
- `npm run test:coverage`: Run tests with coverage

**Dependencies:**
- `next`: 14.2.5
- `react`: 18.3.1
- `react-dom`: 18.3.1
- `axios`: 1.7.7 (for API calls)

**Dev Dependencies:**
- `typescript`: 5.5.4
- `tailwindcss`: 3.4.7
- `jest`: 30.2.0
- `@testing-library/react`: 16.3.2
- `@testing-library/jest-dom`: 6.9.1

---

#### `tsconfig.json`
**Purpose:** TypeScript compiler configuration

**Settings:**
- Target: ES2020
- Module: ESNext
- JSX: preserve
- Strict mode enabled
- Path aliases: `@/*` → `./*`

---

#### `jest.config.js`
**Purpose:** Jest test configuration

**Settings:**
- Test environment: jsdom
- Setup file: `jest.setup.js`
- Module name mapper: `@/*` → `<rootDir>/*`
- Test match: `**/__tests__/**/*.test.{ts,tsx}`

---

#### `jest.setup.js`
**Purpose:** Jest setup file

**Contents:**
- Imports `@testing-library/jest-dom` for DOM matchers
- Configures test environment

---

## 🔄 Data Flow Examples

### Example 1: Chat-First Discovery Flow

```
1. User opens /discover
   ↓
2. DiscoveryContent.tsx → Shows welcome message
   ↓
3. User types "looking for a flat"
   ↓
4. handleChatSubmit() → POST /api/v1/chat
   ↓
5. Backend extracts intent, calculates completeness
   ↓
6a. If incomplete:
    → Returns: { message: "How many bedrooms...", showRecommendations: false }
    → Updates chat history, continues conversation
    
6b. If complete:
    → Returns: { message: "Great! I found...", properties: [...], showRecommendations: true }
    → Updates chat history
    → Sets showRecommendations = true
    → Displays properties below chat
```

### Example 2: Value Estimation Flow

```
1. User fills form on /value-estimator
   ↓
2. handleEstimate() → POST /api/v1/value-check
   ↓
3. Backend validates, estimates value
   ↓
4. Returns: { market_range, verdict, reason_codes, risk_flag }
   ↓
5. Frontend displays results with icons and badges
```

### Example 3: Property Detail Flow

```
1. User clicks property card
   ↓
2. PropertyCard.tsx → handleClick() → router.push(`/property/${id}`)
   ↓
3. PropertyDetail page → loadProperty() → GET /api/v1/properties/:id
   ↓
4. Displays property details
   ↓
5. User clicks "Save Property" → POST /api/v1/saved-properties
   ↓
6. Shows "Property saved!" toast
```

---

## 🎨 Design System

### Colors:
- **Primary:** Blue (`#2563EB` - `bg-blue-600`)
- **Background:** Light gray (`#F9FAFB`)
- **Sidebar:** Slightly darker (`#F3F4F6`)
- **Text:** Gray scale (`gray-900`, `gray-700`, `gray-600`, `gray-500`)
- **Status:** Green (ready), Yellow (under construction), Red (high risk)

### Typography:
- **Headings:** Bold, larger sizes (text-2xl, text-3xl, text-4xl)
- **Body:** Regular weight, readable sizes (text-sm, text-base, text-lg)
- **Helper Text:** Smaller, lighter (text-xs, text-gray-500)

### Spacing:
- **Padding:** Consistent (p-3, p-4, p-6, p-8)
- **Gaps:** Small (gap-2, gap-4)
- **Margins:** Vertical spacing (mb-2, mb-4, mt-4)

### Components:
- **Cards:** White background, rounded, shadow
- **Buttons:** Rounded, hover effects, disabled states
- **Inputs:** Rounded, focus rings, placeholders
- **Badges:** Small, rounded, color-coded

---

## 🔐 Authentication (MVP)

**Current Implementation:**
- Uses `localStorage.getItem('user_id')` (simple string)
- No real authentication (any email/password works)
- Stored in `localStorage` on frontend
- Sent as `X-User-Id` header to backend

**Protected Routes:**
- `/discover` - Redirects to `/login` if no `user_id`
- `/saved` - Redirects to `/login` if no `user_id`
- `/compare` - Redirects to `/login` if no `user_id`
- `/value-estimator` - Redirects to `/login` if no `user_id`
- `/property/[id]` - Redirects to `/login` if no `user_id`

**Logout:**
- Clears `localStorage.removeItem('user_id')`
- Redirects to `/login`

---

## 🌐 Environment Variables

**File:** `env.local`

**Variables:**
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: `http://localhost:3000/api/v1`)
- Note: AI features (Gemini API) are configured in the backend `.env` file
- The frontend communicates with the backend API which handles all AI operations

**Note:** `NEXT_PUBLIC_*` variables are exposed to the browser

---

## 📊 API Integration

**Base URL:** `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'`

**Endpoints Used:**
- `GET /properties` - Property discovery
- `GET /properties/:id` - Property details
- `POST /value-check` - Value estimation
- `POST /compare` - Property comparison
- `POST /saved-properties` - Save property
- `GET /saved-properties` - Get saved properties
- `POST /chat` - Chat & intent-based advisor
- `GET /chat/intent` - Get current intent
- `DELETE /chat/intent` - Reset intent

**Headers:**
- `Content-Type: application/json` (for POST requests)
- `X-User-Id: userId` (for authenticated endpoints)

**Error Handling:**
- Network errors → Toast notification
- 400/404 errors → Error message in toast
- 500 errors → Generic error message

---

## 🎯 Key Design Decisions

1. **Chat-First:** Discover page shows chat first, properties only after intent complete
2. **Component-Based:** Reusable components with clear responsibilities
3. **Type-Safe:** TypeScript interfaces for all data structures
4. **No Global State:** Uses React useState and localStorage only
5. **Responsive:** Mobile-first design with Tailwind breakpoints
6. **Image Optimization:** Uses Next.js Image component
7. **Toast Notifications:** Centralized toast component for all notifications
8. **Validation Display:** Properties show validation context when available
9. **Deterministic Language:** No "AI-powered" claims, uses "System Verdict", "Rule-based"
10. **MVP Simplicity:** No pagination, no complex state management

---

## 🚀 Running the Frontend

```bash
# Development
cd frontend
npm run dev
# Runs on http://localhost:3001

# Production
npm run build
npm start

# Testing
npm test
npm run test:watch
npm run test:coverage
```

---

## 📝 Notes

- **Port:** 3001 (different from backend 3000)
- **Framework:** Next.js 14 App Router
- **Styling:** Tailwind CSS utility classes
- **Images:** Stored in `public/images/` (19 property images)
- **Icons:** SVG files in `public/images/icons/`
- **Testing:** Jest + React Testing Library
- **No SSR:** All pages are client components (`'use client'`)
- **Chat-First:** Fundamental UX change - no properties until intent complete

---

This structure follows Next.js 14 best practices with a chat-first approach, making the application feel like an AI-led property advisor rather than a listings portal. The component-based architecture ensures maintainability and reusability.
