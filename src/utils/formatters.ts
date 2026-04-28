/**
 * Shared formatting utilities for the RealtyPal chat system.
 * Extracted from chatController.ts per architecture-rules.md.
 * These are pure functions with no side effects.
 */

/**
 * Format a budget value in rupees into a human-readable string (lakh/crore).
 */
export function formatBudget(value: number): string {
    if (!value || Number.isNaN(value)) return '';
    if (value >= 10000000) {
        const crores = value / 10000000;
        const formatted = crores >= 10 ? crores.toFixed(0) : crores.toFixed(1);
        return `₹${formatted} crore`;
    }
    const lakhs = value / 100000;
    const formattedLakhs = lakhs >= 10 ? Math.round(lakhs).toString() : lakhs.toFixed(1);
    return `₹${formattedLakhs} lakh`;
}

/**
 * Normalize display text to sentence case (uppercase first letter, preserve rest).
 */
export function normalizeDisplayText(text: string): string {
    if (!text || text.length === 0) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Format a property reference as an ordinal word (first, second, third, etc.)
 */
export function formatPropertyReference(index: number, total: number): string {
    if (index < 0 || index >= total) return '';
    const ordinals = ['first', 'second', 'third', 'fourth', 'fifth'];
    return index < ordinals.length ? ordinals[index] : `${index + 1}th`;
}

/**
 * Parse an ordinal word or numeric ordinal in a message to a 0-based array index.
 * Returns -1 if no ordinal was found.
 *
 * Examples:
 *   "show me the 1st property"  → 0
 *   "tell me about the second"  → 1
 *   "details of third property" → 2
 */
export function parsePropertyOrdinal(messageLower: string): number {
    const indexMatch = messageLower.match(/(\d+)(st|nd|rd|th)/);
    if (indexMatch) return parseInt(indexMatch[1]) - 1;
    if (messageLower.includes('first')) return 0;
    if (messageLower.includes('second')) return 1;
    if (messageLower.includes('third')) return 2;
    if (messageLower.includes('fourth')) return 3;
    if (messageLower.includes('fifth')) return 4;
    return -1;
}

/**
 * Generate deterministic confidence explanation from validation data.
 * MUST be deterministic and repeatable — no AI calls here.
 */
export function generateConfidenceExplanation(validation: {
    confidence_level: 'LOW' | 'MEDIUM' | 'HIGH';
    reason_codes: string[];
    risk_flag: 'LOW' | 'MEDIUM' | 'HIGH';
}): string {
    const { confidence_level, reason_codes } = validation;

    if (confidence_level === 'HIGH') {
        if (reason_codes.includes('PROJECT_LEVEL_PRICING')) {
            return 'Based on project-level pricing data for this specific development.';
        }
        return 'Based on strong recent price band data for similar properties in this sector.';
    }

    if (confidence_level === 'MEDIUM') {
        if (reason_codes.includes('PROJECT_LEVEL_PRICING')) {
            return 'Based on project-level pricing data with limited recent comparable deals.';
        }
        if (reason_codes.length > 0 && reason_codes.some(rc => rc.includes('RECENT'))) {
            return 'Based on available market data with some recent comparable deals.';
        }
        return 'Based on available market data with limited recent comparable deals.';
    }

    if (confidence_level === 'LOW') {
        if (reason_codes.includes('PRICE_DISPERSION')) {
            return 'Based on broad sector-level data due to pricing variance in the project.';
        }
        return 'Based on broad sector-level data due to limited specific pricing information.';
    }

    return 'Based on available market data for this sector.';
}
