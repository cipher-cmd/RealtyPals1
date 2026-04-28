import { IntentState } from './intentManager';
import prisma from '../lib/prisma';

/**
 * Merge two IntentState objects, keeping existing values when incoming fields are undefined/null.
 * This prevents a partial intent update from wiping previously collected fields.
 * Example: existing has { bhk: 3, budget: { max: 8000000 } }, incoming has { sector: 'Sector 150' }
 *          → result: { bhk: 3, budget: { max: 8000000 }, sector: 'Sector 150' }
 */
function mergeIntent(existing: IntentState, incoming: IntentState): IntentState {
  const filteredIncoming = Object.fromEntries(
    Object.entries(incoming).filter(([, v]) => v !== undefined && v !== null)
  ) as Partial<IntentState>;

  return { ...existing, ...filteredIncoming };
}

/**
 * Chat phase type — represents the current stage of the user's conversation.
 * DB stores one of: DISCOVERY | ADVISOR | ARCHIVED
 */
export type ChatPhase = 'DISCOVERY' | 'ADVISOR' | 'ARCHIVED';

/**
 * Full session state for one user.
 */
export interface ChatSession {
    intent: IntentState;
    chatPhase: ChatPhase;
    shortlistedPropertyIds: string[];
    advisorIntroShown: boolean;
    lastDetailedPropertyId: string | null;
}

/**
 * Performance cache: avoids redundant DB hits for the same user within a request burst.
 * These Maps are treated as a CACHE only — the database is always the source of truth.
 * On a server restart, the cache is empty but DB load restores it transparently.
 */
const intentCache = new Map<string, IntentState>();
const phaseCache = new Map<string, ChatPhase>();
const shortlistCache = new Map<string, any[]>();
const advisorIntroCache = new Map<string, boolean>();
const lastDetailedPropertyCache = new Map<string, string>();

// ── Sector name cache (changes rarely) ──
let cachedDefaultSectorName: string | null = null;
let cachedSeededSectorNames: string[] | null = null;

export async function getDefaultSectorName(): Promise<string> {
    return 'Noida';
}

/**
 * Returns all seeded sector names (e.g. ["Sector 150"]).
 * Cached at module level — sectors are added rarely and a restart clears the cache.
 */
export async function getSeededSectorNames(): Promise<string[]> {
    return ['Noida Sector 150', 'Noida Sector 44', 'Noida Sector 76', 'Noida Sector 104'];
}

// ── Raw in-memory getters (for within-request access) ──
export function getCachedIntent(userId: string): IntentState | undefined {
    return intentCache.get(userId);
}
export function getCachedPhase(userId: string): ChatPhase | undefined {
    return phaseCache.get(userId);
}
export function getCachedShortlist(userId: string): any[] {
    return shortlistCache.get(userId) || [];
}
export function getCachedAdvisorIntro(userId: string): boolean {
    return advisorIntroCache.get(userId) || false;
}
export function getCachedLastDetailedPropertyId(userId: string): string | null {
    return lastDetailedPropertyCache.get(userId) || null;
}

export function setShortlist(userId: string, properties: any[]): void {
    shortlistCache.set(userId, properties);
}
export function setAdvisorIntro(userId: string, shown: boolean): void {
    advisorIntroCache.set(userId, shown);
}
export function setLastDetailedPropertyId(userId: string, propertyId: string): void {
    lastDetailedPropertyCache.set(userId, propertyId);
}
export function setCachedPhase(userId: string, phase: ChatPhase): void {
    phaseCache.set(userId, phase);
}
export function setCachedIntent(userId: string, intent: IntentState): void {
    const existing = intentCache.get(userId);
    if (existing) {
        // Merge rather than replace — prevents a partial update from wiping prior fields (BUG-02 fix)
        intentCache.set(userId, mergeIntent(existing, intent));
    } else {
        intentCache.set(userId, intent);
    }
}

// ── Clear all in-memory state for a user (on reset) ──
export function clearUserCache(userId: string): void {
    intentCache.delete(userId);
    phaseCache.delete(userId);
    shortlistCache.delete(userId);
    advisorIntroCache.delete(userId);
    lastDetailedPropertyCache.delete(userId);
}

export async function loadOrCreateChatSession(userId: string): Promise<{
    intent: IntentState;
    chatPhase: ChatPhase;
}> {
    try {
        const session = await prisma.chatContext.findUnique({
            where: { user_id: userId },
        });

        if (session) {
            const intentData = session.intent_state as any;
            const intent: IntentState = {
                ...intentData,
                completenessScore: intentData?.completenessScore ?? session.completeness ?? 0,
                resolvedFields: intentData?.resolvedFields ?? (session.resolved as any) ?? {},
            };
            const phase = session.phase as ChatPhase;

            // Populate cache
            intentCache.set(userId, intent);
            phaseCache.set(userId, phase);

            return { intent, chatPhase: phase };
        }
    } catch (error) {
        console.error('Error loading chat session:', error);
    }

    return { intent: { completenessScore: 0 }, chatPhase: 'DISCOVERY' };
}

export async function saveChatSession(
    userId: string,
    intent: IntentState,
    chatPhase: ChatPhase
): Promise<void> {
    const effectiveIntent = intentCache.get(userId) ?? intent;

    try {
        const payload: any = {
            intent_state: effectiveIntent as any,
            resolved: effectiveIntent.resolvedFields || {},
            phase: chatPhase,
            completeness: effectiveIntent.completenessScore,
            updated_at: new Date(),
        };

        await prisma.chatContext.upsert({
            where: { user_id: userId },
            update: payload,
            create: { user_id: userId, ...payload },
        });
    } catch (error) {
        console.error('Error saving chat session:', error);
    }
}

/**
 * Track analytics event, non-fatal.
 */
export async function trackAnalytics(
    userId: string,
    event: string,
    field?: string,
    phase?: string
): Promise<void> {
    try {
        await prisma.chatAnalytics.create({
            data: {
                user_id: userId,
                event,
                field: field || null,
                phase: phase || 'DISCOVERY',
            },
        });
    } catch (error) {
        console.error('Error tracking analytics:', error);
    }
}
