/**
 * Intent State Management
 * Maintains user intent across chat conversation
 */

export interface IntentState {
  property_type?: 'flat' | 'plot';
  bhk?: number;
  budget?: {
    min?: number;
    max?: number;
    flexibility: 'hard' | 'flexible' | 'unknown';
  };
  purpose?: 'end_use' | 'investment' | 'unknown';
  timeline?: string; // e.g., "immediate", "3 months", "6-12 months"
  sector?: string; // e.g., "Sector 150"
  city?: string; // e.g., "Noida"
  project_name?: string; // e.g., "Godrej Woods"
  preferences?: {
    ready_to_move?: boolean;
    under_construction?: boolean;
    builder_preference?: string;
    floor_preference?: 'low' | 'mid' | 'high' | 'any';
  };
  resolvedFields?: {
    property_type?: boolean;
    bhk?: boolean;
    budget?: boolean;
    sector?: boolean;
    city?: boolean;
    purpose?: boolean;
    timeline?: boolean;
    status?: boolean;
  };
  completenessScore: number; // 0-100
}

/**
 * Calculate completeness score based on filled fields
 */
export function calculateCompletenessScore(intent: IntentState): number {
  let score = 0;
  const weights = {
    property_type: 10,
    bhk: 20,
    budget: 30,
    purpose: 15,
    timeline: 10,
    preferences: 25,
  };

  if (intent.property_type) score += weights.property_type;
  if (intent.bhk) score += weights.bhk;

  if (intent.budget?.min || intent.budget?.max) {
    score += weights.budget * 0.7; // Partial budget
    if (intent.budget.min && intent.budget.max) {
      score += weights.budget * 0.3; // Full budget range
    }
  }

  if (intent.purpose && intent.purpose !== 'unknown') score += weights.purpose;
  if (intent.timeline) score += weights.timeline;

  // Preferences score
  if (intent.preferences) {
    const prefCount = Object.values(intent.preferences).filter(v => v !== undefined && v !== null).length;
    score += (weights.preferences * prefCount) / 3; // Max 3 preferences
  }

  return Math.min(100, Math.round(score));
}

export function isIntentComplete(intent: IntentState): boolean {
  // Require a sector to be specified before showing properties.
  // Score 50+ is enough for other visual recommendations, but only if we have a sector.
  return !!intent.sector && intent.completenessScore >= 50; 
}

/**
 * Merge new intent data into existing intent state
 * Applies canonicalization rules
 * Updates resolvedFields based on what was explicitly provided
 */
export function mergeIntentState(
  existing: IntentState,
  updates: Partial<IntentState>
): IntentState {
  // Ensure budget always has flexibility if budget object exists
  const mergedBudget = (existing.budget || updates.budget) ? {
    ...existing.budget,
    ...updates.budget,
    flexibility: updates.budget?.flexibility ?? existing.budget?.flexibility ?? 'unknown',
  } : undefined;

  // Filter updates to remove undefined/null values so they don't overwrite existing state
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined && v !== null)
  ) as Partial<IntentState>;

  const merged: IntentState = {
    ...existing,
    ...cleanUpdates,
    budget: mergedBudget,
    preferences: {
      ...existing.preferences,
      ...updates.preferences,
    },
    resolvedFields: {
      ...existing.resolvedFields,
      ...updates.resolvedFields,
    },
  };

  // Location canonicalization is handled upstream when sector/city are provided.

  // AUTOMATIC RESOLUTION MARKING (MANDATORY)
  // If a field appears in updates, immediately mark it as resolved.
  // No confidence checks. No exceptions. No re-evaluation later.
  // This guarantees: User answers once → field resolved → never asked again.
  if (!merged.resolvedFields) {
    merged.resolvedFields = {};
  }

  // BHK: Mark resolved if explicitly provided (even if value is 0 or negative, user answered)
  if (updates.bhk !== undefined) {
    merged.resolvedFields.bhk = true;
  }

  if (updates.property_type !== undefined) {
    merged.resolvedFields.property_type = true;
  }

  // Budget: Mark resolved if budget object is provided
  if (updates.budget !== undefined) {
    merged.resolvedFields.budget = true;
  }

  // Purpose: Mark resolved if explicitly provided (even if 'unknown', user answered)
  if (updates.purpose !== undefined) {
    merged.resolvedFields.purpose = true;
  }

  // Sector & City: Mark resolved if provided
  if (updates.sector !== undefined) {
    merged.resolvedFields.sector = true;
  }
  if (updates.city !== undefined) {
    merged.resolvedFields.city = true;
  }

  // Status: Mark resolved if any preference field is provided
  if (updates.preferences?.ready_to_move !== undefined ||
    updates.preferences?.under_construction !== undefined ||
    updates.preferences !== undefined) {
    merged.resolvedFields.status = true;
  }

  // Timeline: Mark resolved if explicitly provided (even if empty string, user answered)
  if (updates.timeline !== undefined) {
    merged.resolvedFields.timeline = true;
  }
  if (updates.project_name !== undefined) {
    (merged.resolvedFields as any).project_name = true;
  }

  // RECOMPUTE: Overwrite resolvedFields from actual values only.
  // Prevents stale "all resolved" state from DB from blocking progressive questions.
  merged.resolvedFields = recomputeResolvedFieldsFromValues(merged);
  merged.completenessScore = calculateCompletenessScore(merged);
  return merged;
}

/**
 * Compute resolvedFields strictly from current intent values.
 * Used after merge to avoid inheriting bogus resolved state from loaded sessions.
 */
function recomputeResolvedFieldsFromValues(intent: IntentState): NonNullable<IntentState['resolvedFields']> {
  const r: NonNullable<IntentState['resolvedFields']> = {};
  if (intent.property_type) r.property_type = true;
  if (typeof intent.bhk === 'number') r.bhk = true;
  if (intent.budget?.min != null || intent.budget?.max != null) r.budget = true;
  if (intent.purpose !== undefined && intent.purpose !== 'unknown') r.purpose = true;
  if (intent.timeline) r.timeline = true;
  if (
    intent.preferences?.ready_to_move !== undefined ||
    intent.preferences?.under_construction !== undefined
  ) {
    r.status = true;
  }
  if (intent.sector) r.sector = true;
  if (intent.city) r.city = true;
  if (intent.project_name) (r as any).project_name = true;
  return r;
}

/**
 * Get the next best question to ask based on intent state
 * STRICT PROGRESSIVE RULE: Only ONE question at a time, following priority order.
 * ABSOLUTE GUARD: If a field is marked as resolved, it is NEVER asked again, regardless of value.
 * LOCATION GUARD: Location fields are only asked when unresolved.
 * 
 * CRITICAL: Check resolvedFields FIRST before any value checks. Once resolved, field is NEVER questioned again.
 * 
 * Returns question, field, and optional hint for soft validation (e.g. "Add budget to see shortlist").
 */
export function getQuestionForField(
  field: 'property_type' | 'bhk' | 'budget' | 'purpose' | 'timeline' | 'status' | 'sector',
  intent: IntentState
): { question: string; field: 'property_type' | 'bhk' | 'budget' | 'purpose' | 'timeline' | 'status' | 'sector'; hint?: string } | null {
  switch (field) {
    case 'property_type':
      return {
        question: "What type of property are you looking for?",
        field: 'property_type',
      };
    case 'bhk':
      if (intent.property_type === 'plot') return null;
      return {
        question: "How many bedrooms would you like?",
        field: 'bhk',
      };
    case 'budget':
      return {
        question: "What's your budget range?",
        field: 'budget',
      };
    case 'purpose':
      return {
        question: "Is this for end-use or investment?",
        field: 'purpose',
      };
    case 'timeline':
      return {
        question: "When do you plan to move?",
        field: 'timeline',
      };
    case 'status':
      return {
        question: "Ready-to-move or under-construction?",
        field: 'status',
      };
    case 'sector':
      return {
        question: "Which sector or area are you looking in?",
        field: 'sector',
      };
    default:
      return null;
  }
}

export function getNextQuestion(intent: IntentState): {
  question: string;
  field?: 'property_type' | 'bhk' | 'budget' | 'purpose' | 'timeline' | 'status' | 'sector';
  hint?: string;
} {
  const resolvedFields = intent.resolvedFields || {};

  if (resolvedFields.sector !== true) {
    if (!intent.sector) {
      return {
        question: "Which sector or area are you looking in?",
        field: 'sector',
      };
    }
  }

  if (resolvedFields.property_type !== true) {
    if (!intent.property_type) {
      return {
        question: "What type of property are you looking for?",
        field: 'property_type',
      };
    }
  }

  if (resolvedFields.bhk !== true) {
    const hasBhk = typeof intent.bhk === 'number';
    if (intent.property_type === 'plot') {
      // Plots don't use BHK
    } else if (!hasBhk) {
      return {
        question: "How many bedrooms would you like?",
        field: 'bhk',
      };
    }
  }

  if (resolvedFields.budget !== true) {
    const hasBudget = intent.budget?.min || intent.budget?.max;
    if (!hasBudget) {
      return {
        question: "What's your budget range?",
        field: 'budget',
      };
    }
  }

  if (resolvedFields.purpose !== true) {
    const hasPurpose = intent.purpose && intent.purpose !== 'unknown';
    if (!hasPurpose) {
      return {
        question: "Is this for end-use or investment?",
        field: 'purpose',
      };
    }
  }

  if (resolvedFields.timeline !== true) {
    if (!intent.timeline) {
      return {
        question: "When do you plan to move?",
        field: 'timeline',
      };
    }
  }

  if (resolvedFields.status !== true) {
    const hasStatus =
      intent.preferences?.ready_to_move !== undefined || intent.preferences?.under_construction !== undefined;
    if (!hasStatus) {
      return {
        question: "Ready-to-move or under-construction?",
        field: 'status',
      };
    }
  }

  return { question: "I have everything I need. Finding the best matches for you..." };
}

/**
 * Convert IntentState to DiscoveryInput for property search
 */
export function intentToDiscoveryInput(
  intent: IntentState,
  defaultSector?: string,
  defaultPropertyType?: 'flat' | 'plot'
): {
  sector: string;
  bhk?: number;
  min_price?: number;
  max_price?: number;
  property_type?: 'flat' | 'plot';
} {
  return {
    sector: intent.sector ?? defaultSector ?? '',
    bhk: intent.bhk,
    min_price: intent.budget?.min,
    max_price: intent.budget?.max,
    property_type: intent.property_type ?? defaultPropertyType,
  };
}
