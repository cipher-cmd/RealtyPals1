# Test Scripts

Individual scripts to verify app flow. **Start the backend first:** `npm run dev`.

## Environment

All config comes from `.env` at project root (no hardcoded URLs). API tests read `API_BASE_URL`:

- Add `API_BASE_URL=http://localhost:3000` to `.env` (see `.env.example`).
- Ensure the backend runs on that port (set `PORT` in `.env`).

## Scripts

| Script | Description | Server |
|--------|-------------|--------|
| `test-intent-manager` | Unit tests for intent merge, getNextQuestion, recompute | No |
| `test-health-and-apis` | Health, GET /properties, chat validation | Yes |
| `test-chat-qualification` | Empty → BHK → budget, reset, progressive | Yes |
| `test-chat-progressive` | 2bhk→budget, order, timeline, no duplicate | Yes |
| `test-chat-requalify` | 3 BHK results → "2bhk flat under 1 crore" → no stale 3 BHK | Yes |

## Run

```bash
# Ensure .env has API_BASE_URL (and optionally PORT). Then:
# All scripts (default)
npm test

# Individual
npm run test:intent
npm run test:health
npm run test:chat-qual
npm run test:chat-progressive
npm run test:chat-requalify
```

## Requalify tests

`test-chat-requalify` checks that changing BHK (e.g. "2bhk flat under 1 crore") after 3 BHK results **re-qualifies** instead of showing stale 3 BHK. **Restart the backend** after changing `aiService` (e.g. regex vs AI merge) so requalify tests pick up the fix.

## Debug

```bash
npx ts-node scripts/test-chat-requalify-debug.ts
```

Logs API responses for the requalify flow. Uses `API_BASE_URL` from `.env` (see Environment above).
