/**
 * AI Service — Intent extraction, topic classification, general queries, advisor mode.
 *
 * Architecture:
 *   - Groq (llama-3.3-70b)   → fast, structured (intent, topic classification)
 *   - Cohere (command-r-plus) → synthesis with grounded context (general queries, advisor)
 *   - Tavily / Serper / DDG  → web search fallback chain
 *   - googleIntelligence     → verified Google Maps data (highest trust)
 *
 * Anti-hallucination principles enforced here:
 *   1. City is never assumed — only set when user explicitly states it.
 *   2. Search context is source-tagged so the LLM knows what to trust.
 *   3. Empty data is signaled explicitly, not silently passed as garbage context.
 *   4. Regex extracts what it can confidently parse; AI only fills genuine gaps.
 *   5. No "simulated properties" — that function is gone.
 */

import {
  getMarketPulse,
  getWalkability,
  getNearbyAmenities,
  getStaticMapUrl,
  geocodeLocation,
  getAreaPhoto,
} from './googleIntelligence';
import { PROMPTS } from './prompts';
import { search, SafeSearchType } from 'duck-duck-scrape';

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

export interface IntentResult {
  bhk?: number;
  property_type?: 'flat' | 'plot';
  budget_min?: number;
  budget_max?: number;
  purpose?: 'end_use' | 'investment' | 'unknown';
  possession_status?: 'ready_to_move' | 'under_construction' | 'new_launch';
  ready_to_move?: boolean;
  under_construction?: boolean;
  floor_preference?: 'low' | 'mid' | 'high' | 'any';
  sector?: string;          // e.g. "Sector 150"
  city?: string;            // e.g. "Noida", "Gurgaon", "Ayodhya"
  project_name?: string;
  conversational_reply?: string | null;
  is_general_query?: boolean;
}

// Backwards-compat alias — older code imports IntentJSON
export type IntentJSON = IntentResult;
export type IntentExtractionResult = IntentResult;

export type TopicClass = 'price' | 'general' | 'builder' | 'area' | 'legal' | 'amenity';

interface AreaImage {
  url: string;
  caption: string;
  type: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Search & Grounding (raw web fallback chain)
// ────────────────────────────────────────────────────────────────────────────

async function callTavily(query: string): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return '';
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'advanced',
        max_results: 5,
      }),
    });
    if (!response.ok) return '';
    const data = (await response.json()) as any;
    return data.results?.map((r: any) => `${r.title}\n${r.content}`).join('\n\n') || '';
  } catch (e) {
    console.error('[Tavily] failed:', e);
    return '';
  }
}

async function callSerper(query: string): Promise<string> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return '';
  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, gl: 'in' }),
    });
    if (!response.ok) return '';
    const data = (await response.json()) as any;
    return (
      data.organic
        ?.slice(0, 5)
        .map((r: any) => `${r.title}\n${r.snippet}`)
        .join('\n\n') || ''
    );
  } catch (e) {
    console.error('[Serper] failed:', e);
    return '';
  }
}

async function callDuckDuckGo(query: string): Promise<string> {
  try {
    const sr = await search(query, { safeSearch: SafeSearchType.OFF });
    return sr.results
      .slice(0, 5)
      .map((r) => `${r.title}\n${r.description}`)
      .join('\n\n');
  } catch (e) {
    console.error('[DuckDuckGo] failed:', e);
    return '';
  }
}

/**
 * Run web search through the fallback chain.
 * Returns empty string if every source fails — caller must handle that case.
 */
async function searchWeb(query: string): Promise<string> {
  const [tavily, serper] = await Promise.all([
    callTavily(query).catch(() => ''),
    callSerper(query).catch(() => ''),
  ]);
  const combined = `${tavily}\n\n${serper}`.trim();
  if (combined) return combined;
  return await callDuckDuckGo(query);
}

// ────────────────────────────────────────────────────────────────────────────
// LLM callers
// ────────────────────────────────────────────────────────────────────────────

async function callGroq(
  systemPrompt: string,
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return '';
  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      })),
      { role: 'user', content: userMessage },
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.1,
      }),
    });
    if (!response.ok) return '';
    const data = (await response.json()) as any;
    const text = data.choices?.[0]?.message?.content || '';
    console.log('[Groq response length]', text.length);
    return text;
  } catch (e) {
    console.error('[Groq] failed:', e);
    return '';
  }
}

async function callGemini(
  systemPrompt: string,
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return await callCohere(systemPrompt, userMessage, conversationHistory);

  try {
    const history = conversationHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [
          ...history,
          { role: 'user', parts: [{ text: userMessage }] }
        ],
        generationConfig: {
          temperature: 0.1,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      console.warn('[Gemini] API failed, falling back to Cohere');
      return await callCohere(systemPrompt, userMessage, conversationHistory);
    }

    const data: any = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('[Gemini response length]', text.length);
    return text;
  } catch (e) {
    console.error('[Gemini] failed, falling back:', e);
    return await callCohere(systemPrompt, userMessage, conversationHistory);
  }
}

async function callCohere(
  systemPrompt: string,
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<string> {
  const apiKey = process.env.COHERE_API_KEY;
  if (!apiKey) throw new Error('COHERE_API_KEY missing');

  const chatHistory = conversationHistory.map((msg) => ({
    role: msg.role === 'assistant' ? 'CHATBOT' : 'USER',
    message: msg.content,
  }));

  const response = await fetch('https://api.cohere.com/v1/chat', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'command-r-plus-08-2024',
      message: userMessage,
      preamble: systemPrompt,
      temperature: 0.1,
      chat_history: chatHistory.length > 0 ? chatHistory : undefined,
    }),
  });

  if (!response.ok) return '';
  const data = (await response.json()) as any;
  const text = data.text || '';
  console.log('[Cohere response length]', text.length);
  return text;
}

// ────────────────────────────────────────────────────────────────────────────
// Intent extraction
//
// Strategy: regex extracts only what it can be confident about (BHK numbers,
// budget patterns, sector numbers). It does NOT assign city. AI fills gaps,
// including city detection. AI wins on conflicts (it has more context).
// ────────────────────────────────────────────────────────────────────────────

export async function extractIntentFromMessage(
  message: string,
  currentIntent: unknown,
  userId?: string
): Promise<IntentResult> {
  const result: IntentResult = {};

  // BHK
  const bhkMatch = message.match(/(\d)\s*(?:bhk|bedroom|rk|bed)/i);
  if (bhkMatch) result.bhk = parseInt(bhkMatch[1], 10);

  // Sector — but DO NOT assume city. City must come from explicit mention.
  const sectorMatches = [...message.toLowerCase().matchAll(/sector\s*(\d+)/g)];
  if (sectorMatches.length > 0) {
    result.sector = `Sector ${sectorMatches[0][1]}`;
  }

  // Property type
  const typeMatch = message.toLowerCase().match(/\b(flat|apartment|floor|home|house|plot|land|kothi)s?\b/);
  if (typeMatch) {
    const t = typeMatch[1].toLowerCase();
    result.property_type = t === 'plot' || t === 'land' || t === 'kothi' ? 'plot' : 'flat';
  }

  // Purpose
  if (/\b(end\s*use|stay|living|family|residence|residential|to live)\b/i.test(message)) {
    result.purpose = 'end_use';
  }
  if (/\b(invest|rental?|returns?|resale|roi|appreciation)\b/i.test(message)) {
    result.purpose = 'investment';
  }

  // Possession
  if (/\b(ready|completed|rtm|immediate|handover)\b/i.test(message)) {
    result.ready_to_move = true;
    result.possession_status = 'ready_to_move';
  }
  if (/\b(under construction|uc|ongoing|prelaunch|new launch)\b/i.test(message)) {
    result.under_construction = true;
    result.possession_status = 'under_construction';
  }

  // Budget
  const budgetMaxMatch = message
    .toLowerCase()
    .match(/(?:under|max|below|within|upto|budget)\s*(\d+(?:\.\d+)?)\s*(crore|cr|c|lakh|lac|l)\b/i);
  if (budgetMaxMatch) {
    result.budget_max = sanitizeBudget(budgetMaxMatch[1] + budgetMaxMatch[2]);
  }

  const budgetRangeMatch = message
    .toLowerCase()
    .match(/(\d+(?:\.\d+)?)\s*(?:to|-|se)\s*(\d+(?:\.\d+)?)\s*(crore|cr|c|lakh|lac|l)\b/i);
  if (budgetRangeMatch) {
    const unit = budgetRangeMatch[3];
    result.budget_min = sanitizeBudget(budgetRangeMatch[1] + unit);
    result.budget_max = sanitizeBudget(budgetRangeMatch[2] + unit);
  }

  if (!shouldCallAi(userId)) return result;

  // AI fills gaps (especially city, project_name, conversational_reply, is_general_query)
  try {
    const promptWithContext =
      currentIntent && typeof currentIntent === 'object' && Object.keys(currentIntent as object).length > 0
        ? `${PROMPTS.INTENT_EXTRACTION}\n\nExisting known intent: ${JSON.stringify(currentIntent)}`
        : PROMPTS.INTENT_EXTRACTION;

    const content = await callGroq(promptWithContext, message);
    if (!content) return result;

    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const aiJson = JSON.parse(cleaned);

    if (aiJson.budget_min !== undefined) aiJson.budget_min = sanitizeBudget(aiJson.budget_min);
    if (aiJson.budget_max !== undefined) aiJson.budget_max = sanitizeBudget(aiJson.budget_max);

    const aiMapped = mapIntentJsonToResult(aiJson);
    return { ...result, ...aiMapped };
  } catch (error) {
    handleRateLimit(error, userId);
    return result;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Topic classification
// ────────────────────────────────────────────────────────────────────────────

export async function classifyTopic(message: string, userId?: string): Promise<TopicClass> {
  const kw = classifyTopicByKeywords(message);
  if (kw !== null) return kw;
  if (!shouldCallAi(userId)) return 'general';
  try {
    const raw = await callGroq(PROMPTS.TOPIC_CLASSIFIER, message);
    if (!raw) return 'general';
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    const valid: TopicClass[] = ['price', 'general', 'builder', 'area', 'legal', 'amenity'];
    if (typeof parsed.topic === 'string' && valid.includes(parsed.topic as TopicClass)) {
      return parsed.topic as TopicClass;
    }
    return 'general';
  } catch {
    return 'general';
  }
}

// ────────────────────────────────────────────────────────────────────────────
// General query — the main anti-hallucination focus.
//
// Steps:
//   1. Identify locations the user is asking about.
//   2. For each location, pull VERIFIED data from googleIntelligence.
//   3. Pull WEB SEARCH data as supplementary context (lower trust).
//   4. Build a source-tagged context string.
//   5. If we have ZERO data, tell the LLM that explicitly.
//   6. Cohere synthesizes — its prompt knows how to handle empty/partial data.
// ────────────────────────────────────────────────────────────────────────────

export async function answerGeneralQuery(
  message: string,
  intent: IntentResult,
  userId?: string
): Promise<{ text: string; images?: AreaImage[] }> {
  console.log('[GENERAL_QUERY] called with intent:', JSON.stringify(intent));
  // Resolve which locations to look up
  const locationsToSearch = resolveLocations(message, intent);
  const isComparison = locationsToSearch.length > 1 || /\b(compare|versus|vs|difference|better)\b/i.test(message);

  if (locationsToSearch.length === 0) {
    return {
      text: "Which area or sector are you asking about? Please mention the city and (if relevant) the sector so I can give you accurate details.",
    };
  }

  if (!shouldCallAi(userId)) {
    return {
      text: `${locationsToSearch[0]} is an area I can help with. Could you tell me a bit more about what you're looking for?`,
    };
  }

  // Build verified context per location (with city hint for accurate geocoding)
  const cityHint = intent.city;
  let verifiedContext = '';
  let webContext = '';
  const images: AreaImage[] = [];

  for (const loc of locationsToSearch) {
    const block = await buildLocationContext(loc, cityHint, images);
    verifiedContext += block;
  }

  // Web search supplements verified data — for general questions and trends
  const webQuery = buildWebQuery(message, locationsToSearch, intent);
  webContext = await searchWeb(webQuery);

  // Assemble the final source-tagged context
  const searchContext = assembleSearchContext(verifiedContext, webContext, locationsToSearch);

  try {
    const comparisonNote = isComparison
      ? `\n\nNOTE: User is comparing ${locationsToSearch.join(' vs ')}. Return a markdown comparison table.`
      : `\n\nNOTE: User is asking about ${locationsToSearch[0]}. Focus only on that area. Do not bring up unrelated areas.`;

    const systemPrompt = PROMPTS.GENERAL_QUERY.replace('{{SEARCH_CONTEXT}}', searchContext) + comparisonNote;

    // Use Groq as primary for speed, fallback to Gemini
    let text = await callGroq(systemPrompt, message);
    if (!text) {
      console.log('[answerGeneralQuery] Groq failed, trying Gemini backup');
      text = await callGemini(systemPrompt, message);
    }

    const finalText = text.trim() || fallbackText(locationsToSearch[0]);
    return {
      text: finalText,
      images: images.slice(0, 4),
    };
  } catch (error) {
    console.error('[answerGeneralQuery] failed:', error);
    return { text: fallbackText(locationsToSearch[0]) };
  }
}

/**
 * Determine which locations the user is asking about.
 * Uses sectors from the message, plus the project_name from intent if set.
 */
function resolveLocations(message: string, intent: IntentResult): string[] {
  const sectorMatches = [...message.toLowerCase().matchAll(/sector\s*(\d+)/g)];
  const sectors = sectorMatches.map((m) => `Sector ${m[1]}`);

  // De-duplicate sectors while preserving order
  const uniqueSectors = Array.from(new Set(sectors));

  if (intent.project_name && !uniqueSectors.includes(intent.project_name)) {
    uniqueSectors.unshift(intent.project_name);
  }

  // Check for city name in message if no sectors found
  const cityNames = ['ayodhya', 'noida', 'gurgaon', 'mumbai', 'delhi', 'bangalore', 'pune', 'chennai', 'hyderabad', 'kolkata'];
  for (const city of cityNames) {
    if (message.toLowerCase().includes(city)) {
      uniqueSectors.push(city.charAt(0).toUpperCase() + city.slice(1));
    }
  }

  if (uniqueSectors.length > 0) return Array.from(new Set(uniqueSectors));

  // Fallbacks — use whatever location signal we have
  if (intent.sector) return [intent.sector];
  if (intent.city) return [intent.city];
  return [];
}

/**
 * Pull verified Google data for one location and append to context.
 * Side effect: pushes images into the shared images array.
 */
async function buildLocationContext(
  location: string,
  cityHint: string | undefined,
  images: AreaImage[]
): Promise<string> {
  let block = `\n\n### ${location}\n`;
  let hasAnyVerifiedData = false;

  try {
    // Geocode with city hint so "Sector 5" doesn't always resolve to Noida
    const coords = await geocodeLocation(location, cityHint);
    const pulse = await getMarketPulse(location);

    if (pulse) {
      block += `[LIVE MARKET PULSE]\n${pulse}\n`;
      hasAnyVerifiedData = true;
    }

    if (coords) {
      const [mapUrl, areaPhoto, amenities, walkability] = await Promise.all([
        Promise.resolve(getStaticMapUrl(coords.lat, coords.lng)),
        getAreaPhoto(location, cityHint),
        getNearbyAmenities(coords.lat, coords.lng),
        getWalkability(coords.lat, coords.lng, cityHint),
      ]);

      if (mapUrl && !images.find((img) => img.url === mapUrl)) {
        images.push({ url: mapUrl, caption: `Map: ${location}`, type: 'view' });
      }
      if (areaPhoto && !images.find((img) => img.url === areaPhoto)) {
        images.push({ url: areaPhoto, caption: `Vibe: ${location}`, type: 'exterior' });
      }
      if (amenities) {
        block += `[VERIFIED: Google Maps]\n${amenities}\n`;
        hasAnyVerifiedData = true;
      }
      if (walkability) {
        block += `[VERIFIED: Google Maps]\n${walkability}\n`;
        hasAnyVerifiedData = true;
      }
    }
  } catch (e) {
    console.error(`[buildLocationContext] failed for ${location}:`, e);
  }

  if (!hasAnyVerifiedData) {
    block += `(No verified live data available for ${location}.)\n`;
  }

  return block;
}

/**
 * Build a smart web search query for the user's question.
 */
function buildWebQuery(message: string, locations: string[], intent: IntentResult): string {
  const cityPart = intent.city ? ` ${intent.city}` : '';
  const locPart = locations.length > 0 ? locations.join(' ') : '';
  return `${message} ${locPart}${cityPart}`.trim();
}

/**
 * Wrap web context with a clear "lower trust" tag and assemble the final context.
 */
function assembleSearchContext(verified: string, web: string, locations: string[]): string {
  let ctx = '';

  if (verified.trim()) {
    ctx += verified;
  } else {
    ctx += `\n(No verified Google Maps data available for ${locations.join(', ')}.)\n`;
  }

  if (web.trim()) {
    const validationHint = locations.length > 0
      ? `Validation hint: Only cite projects/details whose source mentions one of these locations: ${locations.join(', ')}. Ignore others.`
      : '';
    ctx += `\n\n### [WEB SEARCH — lower trust, validate before citing]\n${web}\n${validationHint}\n`;
  } else {
    ctx += `\n(No web search results available.)\n`;
  }

  return ctx;
}

function fallbackText(location: string): string {
  return `I don't have live data for ${location} right now. For current listings, I'd recommend checking 99acres or MagicBricks directly. Want me to help you think through what to look for?`;
}

// ────────────────────────────────────────────────────────────────────────────
// Question generation
// ────────────────────────────────────────────────────────────────────────────

export async function generateNextQuestion(currentIntent: any, _conversationHistory: any[] = []): Promise<string> {
  const intentManager = await import('./intentManager');
  return intentManager.getNextQuestion(currentIntent).question;
}

// ────────────────────────────────────────────────────────────────────────────
// Advisor mode
// ────────────────────────────────────────────────────────────────────────────

export async function generateAdvisorResponse(
  message: string,
  shortlistedProperties: any[],
  intent: unknown,
  userId?: string,
  conversationHistory: any[] = []
): Promise<string> {
  console.log('[ADVISOR] called with', shortlistedProperties.length, 'properties');
  if (!shouldCallAi(userId)) return '';

  const propContext = shortlistedProperties
    .map((p, i) => {
      const lines = [`${i + 1}. ${p.project_name || 'Unnamed project'}${p.builder ? ` by ${p.builder}` : ''}`];
      if (p.bhk) lines.push(`   BHK: ${p.bhk}`);
      if (p.price && p.price > 0) lines.push(`   Price: ₹${(p.price / 10000000).toFixed(2)} Cr`);
      if (p.status) lines.push(`   Status: ${p.status}`);
      if (p.address) lines.push(`   Address: ${p.address}`);
      if (p.rating && p.rating > 0) lines.push(`   Google Rating: ${p.rating}/5 (${p.reviewsCount || 0} reviews)`);
      return lines.join('\n');
    })
    .join('\n\n');

  const intel = intent as any;
  const verifiedBlocks: string[] = [];
  if (intel?.marketPulse) verifiedBlocks.push(`[LIVE MARKET PULSE]\n${intel.marketPulse}`);
  if (intel?.walkability) verifiedBlocks.push(`[VERIFIED: Google Maps]\n${intel.walkability}`);
  if (intel?.localVibe) verifiedBlocks.push(`[VERIFIED: Google Maps]\n${intel.localVibe}`);

  const verifiedContext = verifiedBlocks.length > 0 ? verifiedBlocks.join('\n\n') : '(No live area data available.)';

  const fullSystem =
    PROMPTS.ADVISOR_MODE +
    `\n\n═══ SHORTLISTED PROPERTIES ═══\n${propContext}` +
    `\n\n═══ AREA INTELLIGENCE ═══\n${verifiedContext}`;

  // Use Groq as primary, fallback to Gemini
  let text = await callGroq(fullSystem, message, conversationHistory);
  if (!text) {
    console.log('[generateAdvisorResponse] Groq failed, trying Gemini backup');
    text = await callGemini(fullSystem, message, conversationHistory);
  }
  return text;
}

// ────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ────────────────────────────────────────────────────────────────────────────

function isAiEnabled(): boolean {
  return process.env.ENABLE_AI === 'true';
}

function shouldCallAi(userId?: string): boolean {
  if (!isAiEnabled()) return false;
  if (userId && rateLimitedUsers.has(userId)) return false;
  return true;
}

const rateLimitedUsers = new Set<string>();

function handleRateLimit(error: unknown, userId?: string): void {
  if (userId) {
    rateLimitedUsers.add(userId);
    setTimeout(() => rateLimitedUsers.delete(userId), 5000);
  }
}

export function sanitizeBudget(raw: string | number): number {
  if (typeof raw === 'number') return raw;
  const str = String(raw).trim().toLowerCase().replace(/,/g, '');

  const match = str.match(/(\d+(?:\.\d+)?)\s*(crore|cr|c|lakh|lac|l)\b/);
  if (match) {
    const num = parseFloat(match[1]);
    const multiplier = match[2];
    if (multiplier.startsWith('c')) return Math.round(num * 10000000);
    if (multiplier.startsWith('l')) return Math.round(num * 100000);
  }

  const n = parseFloat(str.replace(/[^\d.]/g, ''));
  return isNaN(n) ? 0 : Math.round(n);
}

function mapIntentJsonToResult(ai: Partial<IntentResult> & { sector?: number | string }): IntentResult {
  const mapped: IntentResult = {};
  if (typeof ai.bhk === 'number') mapped.bhk = ai.bhk;
  if (ai.budget_min !== undefined) {
    mapped.budget_min = typeof ai.budget_min === 'number' ? ai.budget_min : sanitizeBudget(ai.budget_min);
  }
  if (ai.budget_max !== undefined) {
    mapped.budget_max = typeof ai.budget_max === 'number' ? ai.budget_max : sanitizeBudget(ai.budget_max);
  }
  if (ai.possession_status === 'ready_to_move') {
    mapped.ready_to_move = true;
    mapped.under_construction = false;
    mapped.possession_status = 'ready_to_move';
  } else if (ai.possession_status === 'under_construction') {
    mapped.under_construction = true;
    mapped.ready_to_move = false;
    mapped.possession_status = 'under_construction';
  }
  if (typeof ai.sector === 'number') {
    mapped.sector = `Sector ${ai.sector}`;
  } else if (typeof ai.sector === 'string' && ai.sector) {
    mapped.sector = ai.sector.startsWith('Sector') ? ai.sector : `Sector ${ai.sector}`;
  }
  if (ai.property_type) mapped.property_type = ai.property_type;
  if (ai.purpose) mapped.purpose = ai.purpose;
  if (ai.city) mapped.city = ai.city;
  if (ai.project_name) mapped.project_name = ai.project_name;
  if (ai.conversational_reply !== undefined) mapped.conversational_reply = ai.conversational_reply;
  if (ai.is_general_query) mapped.is_general_query = ai.is_general_query;
  return mapped;
}

function classifyTopicByKeywords(message: string): TopicClass | null {
  const msg = message.toLowerCase();
  if (/\bprice\b|\bcost\b|\bkitna\b|\bhow\s+much\b/.test(msg)) return 'price';
  if (/\brera\b|\blegal\b/.test(msg)) return 'legal';
  if (/\bbuilder\b|\bdeveloper\b/.test(msg)) return 'builder';
  if (/\bgym\b|\bpool\b|\bclubhouse\b/.test(msg)) return 'amenity';
  if (/\bmetro\b|\bexpressway\b|\bschools?\b|\bhospital\b/.test(msg)) return 'area';
  return null;
}