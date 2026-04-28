# RealtyPals — Claude Context

This file tells AI coding agents how to behave in this repo. Keep it short, accurate, and current. If the code drifts from this file, fix the file or fix the code — don't let them disagree.

---

## What This Is

RealtyPals (realtypals.in) is an AI assistant built by Furqan, currently being demoed to NCR brokerages (active pitch: Nimbus, follow-up demo this week).

**The bot answers two kinds of questions:**

1. **Real estate** — its specialty. Property search, market analysis, builder reputation, sector comparisons, valuation, advisory.
2. **Anything else** — weather, news, general questions, casual chat. The bot is a generalist that *also* happens to be a real estate expert. It does not refuse off-topic questions; it answers them and offers to help with property if relevant.

**Geographic scope:**

- **Marketing focus**: NCR (Noida, Gurgaon, Greater Noida).
- **Technical capability**: India-wide. Any Indian city — Mumbai, Bangalore, Ayodhya, Indore, anywhere — should work without code changes.
- **Outside India**: not a focus. If a user asks about Dubai or London, answer with general knowledge but make clear the bot's data layer is India-tuned.

The codebase must be city-agnostic. Do not hardcode "Noida" anywhere — not in defaults, not in geocoding addresses, not in distance-matrix POIs, not in fallback messages.

---

## Tech Stack

- **Runtime**: Node.js + TypeScript (strict mode)
- **Framework**: Express
- **ORM**: Prisma → PostgreSQL
- **LLMs**:
  - **Groq** (`llama-3.3-70b-versatile`) — fast structured tasks: intent extraction, topic classification, advisor responses
  - **Cohere** (`command-r-plus-08-2024`) — synthesis with grounded context: general queries
- **Data sources**:
  - **Google Maps APIs** (geocode, places, distance matrix, trends) — verified, highest trust
  - **Serper API** — single web fallback for trends, builder reputation, news

**Removed and not to be re-added:** Gemini, Tavily, DuckDuckGo. Each was tried and removed for cost, latency, or hallucination reasons. Two LLMs (Groq + Cohere) and two data sources (Google + Serper) is the committed surface area.

---

## Architecture

```
User Message
  ↓
chatController.ts             ← orchestration, no business logic
  ↓
intentManager.ts              ← conversation state
aiService.ts                  ← all LLM calls
  ├── prompts.ts              ← all prompt strings as named constants
  ├── googleIntelligence.ts   ← Google Maps verified data
  └── googlePlacesService.ts  ← Google Places search
discoveryEngine.ts            ← Prisma property queries (NOT used by chat primary flow)
valueEstimator.ts             ← deterministic pricing (NOT used by chat)
propertyValidationHelper.ts   ← risk flagging on shortlists
chatSessionService.ts         ← session persistence + cache
```

**Hard rules:**

- LLM calls live in `aiService.ts` and nowhere else.
- Prisma queries live in `src/logic/` and nowhere else.
- Controllers orchestrate. They do not contain business logic.
- The system must degrade gracefully if any external API fails. Empty data is honest; fake data is hallucination.

---

## Chat vs Database Separation

This is important and easily violated.

**The chat path uses Google Places + Google Intelligence live. It does NOT query the property database for primary discovery.** When a user asks "show me 2BHK in Sector 150", we hit Google Places, not Prisma.

**The database (`Property`, `Sector`, `PropertyImage`) powers non-chat services:**

- `valueEstimator.ts` — deterministic pricing model
- Property compare endpoints
- Anything that needs curated, structured property records

**One legitimate exception:** in advisor mode, when a user has a shortlist and issues a refinement command ("increase budget", "show only ready-to-move"), `chatController` may call `discoverProperties()` to re-rank. This is the only place chat touches the DB. Keep it that way.

If you find yourself adding a Prisma call in the primary chat flow, stop. Use Google Places.

---

## How the Chat Flow Works

### Intent extraction (Groq)

- Regex extracts what's confidently parseable: BHK, sector number, budget patterns, possession status.
- **Regex never assigns a city.** City must come from explicit user mention via Groq.
- Groq fills gaps: city, project name, conversational replies, `is_general_query` flag, `is_real_estate` flag.
- AI wins on conflicts (it has more context than regex).

### Routing

1. `conversational_reply` set → return it directly (greetings, thanks).
2. `is_real_estate: false` → general LLM mode (off-topic answer, see below).
3. `is_general_query: true` → `answerGeneralQuery()` — multi-location, source-tagged context, Cohere synthesis.
4. Shortlist exists and no new qualification → `handleAdvisorMode()`.
5. Otherwise → discovery: Google Places search + verified intelligence enrichment + Cohere synthesis.

### Real estate vs off-topic responses

The bot has **two answer modes**, and they obey different rules:

**Real estate mode** (strict, source-grounded):

- Anti-hallucination contract is non-negotiable (see below).
- All factual claims trace to a tagged source: `[VERIFIED: Google Maps]`, `[LIVE MARKET PULSE]`, or `[WEB SEARCH — lower trust]`.
- If we have no data, the bot says so. It does not fill the gap from training.

**General mode** (off-topic):

- Answer naturally using LLM general knowledge.
- One-line disclaimer when the question touches anything time-sensitive: "(general knowledge — for current info you'd want to verify elsewhere)".
- After answering, optionally offer a soft pivot: "Anything I can help with on the property side?"
- The bot does not refuse off-topic questions. It is helpful first, real-estate-expert second.

### Anti-hallucination contract (real estate mode only)

1. **No default city.** If the user didn't say one, ask. Sector 150 is not a fallback.
2. **No invented specifics.** Project names, prices, ratings, contacts, possession dates, builder names — if it's not in the data block, the bot doesn't say it.
3. **Source-tagged context.** Cohere receives blocks labeled with their trust level.
4. **Empty states are explicit.** If we have no data for a location, the prompt says so. The LLM is instructed to admit it.
5. **No web-grounded prices.** Indian portal price data is manipulated and stale. For prices, fall back to `valueEstimator`, DB records, or "verify with the developer."

---

## LLM Usage Rules

- Every prompt is a named constant in `prompts.ts`. No inline template literals in service code.
- Every LLM call is wrapped in try/catch with a typed fallback (empty string, empty array, or pre-defined fallback text).
- Temperature: `0` for intent/classification, `0.1` for synthesis.
- Groq for structured output. Cohere for prose answers with grounded context.
- Cohere `preamble` carries the system prompt + tagged context. The user `message` is the user's actual query.

---

## Coding Standards

- TypeScript strict mode. No `any` unless justified with a `// any: <reason>` comment.
- Prisma in `logic/` only.
- Prompt strings in `prompts.ts` only.
- Hinglish is a first-class input language — intent extraction examples must include it.
- Indian price formatting: always `1.5 Cr` / `80 L`. Never raw integers, never USD, never "millions/billions".

---

## What "Better" Means Here

In priority order:

1. **Anti-hallucination** — bot says "I don't know" instead of fabricating. Most important trust signal for brokers.
2. **Reliability of intent extraction** — fewer failed/partial parses, especially for Hinglish.
3. **Discovery accuracy** — top result actually matches what the user asked for.
4. **Session persistence** — no lost context between messages.
5. **valueEstimator robustness** — pricing is the most defensible feature for broker pitches.

---

## Future Work (NOT YET BUILT)

These are mentioned in pitches and vision docs. They **do not exist in code**. Do not import from them. Do not assume they exist.

- PDF ingestion pipeline (parses developer brochures into Property records)
- Price Alerts (user subscribes to criteria)
- EMI / yield / financial deep-dive features
- Vision search (photo upload to find similar architectures)
- Authenticated user accounts
- International / non-India coverage

If asked to work on any of these, scaffold from scratch and update this section once the work lands.

---

## Things Claude Should NOT Do

- Do not refactor the `services/` vs `logic/` separation. It is intentional.
- Do not add LLM calls inside `discoveryEngine.ts` or `valueEstimator.ts`. They must remain deterministic.
- Do not remove graceful-degradation fallback paths. If Groq is down, fall back to regex + Cohere. If Cohere is down, fall back to template text. The bot must never crash.
- Do not re-add Gemini, Tavily, DuckDuckGo, or any third-party real-estate-portal API. They were considered and rejected.
- Do not hardcode "Noida" anywhere. The codebase is city-agnostic.
- Do not call Prisma from primary chat discovery. Use Google Places.
- Do not inline prompt strings. Always extract to `prompts.ts`.
- Do not invent project names, prices, or contact numbers. Fabrication is the product's anti-feature.
- Do not add new features without explicit instruction. The current priority is making existing flows precise and reliable, not expanding scope.

---

## Environment Variables

```
DATABASE_URL=
GROQ_API_KEY=
COHERE_API_KEY=
SERPER_API_KEY=
GOOGLE_MAPS_KEY=
GOOGLE_PLACES_API_KEY=
PORT=
NODE_ENV=
ENABLE_AI=true
```

`ENABLE_AI=false` is the kill switch — the bot falls back to regex + deterministic responses everywhere. Use in emergencies.

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
|------|----------|
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.
