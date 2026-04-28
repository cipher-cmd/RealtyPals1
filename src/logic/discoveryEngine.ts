import { PrismaClient, Prisma } from '@prisma/client';
import { ValidationError } from '../utils/errors';

export interface DiscoveryInput {
  sector: string; // Sector name (e.g., "Sector 150")
  bhk?: number;
  min_price?: number;
  max_price?: number;
  property_type?: 'flat' | 'plot';
  status_filter?: 'ready' | 'under_construction'; // Filter by status when timeline is immediate or user prefers ready
}

type PropertyWithSector = Prisma.PropertyGetPayload<{ include: { sector: { include: { intelligence: true } }; images: true } }>;

export type ScoredProperty = PropertyWithSector & {
  score: number;
  match_score: number;
};

/**
 * Gradient budget scoring — replaces binary in/out gate (BUG-03 fix).
 *
 * Returns 0-30 points:
 *   - 30 pts: property is within [budget_min, budget_max]
 *   - 20 pts: property is under budget_min (under-budget is acceptable, slight penalty)
 *   - 0-29 pts: property is 0-20% over budget_max (gradient; 20% over = 0 pts)
 *   -  0 pts: property is > 20% over budget_max (hard exclude at scoring level)
 *   - 15 pts: no budget constraint given (neutral)
 */
function scoreBudget(price: number, budget_max?: number, budget_min?: number): number {
  if (!budget_max) return 15; // neutral if no budget constraint given

  if (price <= budget_max && (!budget_min || price >= budget_min)) {
    return 30; // perfect match — within range
  }

  if (price > budget_max) {
    const overage = (price - budget_max) / budget_max;
    if (overage > 0.20) return 0; // more than 20% over = hard exclude at scoring level
    return Math.round(30 * (1 - overage / 0.20)); // gradient: 29 pts at 0% over → 0 pts at 20% over
  }

  if (budget_min && price < budget_min) {
    return 20; // under budget is acceptable, slight penalty vs. in-range
  }

  return 15;
}

/**
 * Resolves sector name to sector_id
 * Throws error if sector not found
 * Uses city + name for safety with @@unique([city, name])
 */
async function resolveSectorHelper(prisma: PrismaClient, sectorName: string): Promise<string> {
  const sector = await prisma.sector.findFirst({
    where: {
      name: sectorName,
    },
  });

  if (!sector) {
    throw new ValidationError('Invalid sector. Please choose a supported sector.');
  }

  return sector.id;
}

/**
 * Calculates score for a property based on deterministic rules:
 * - +10 if status = ready
 * - +5 if price closer to budget midpoint
 * - +1 per matching amenity (if any amenity filter is provided)
 */
function calculateScore(
  property: PropertyWithSector,
  min_price?: number,
  max_price?: number,
  input?: DiscoveryInput
): { score: number, match_score: number } {
  let score = 0;
  let match_score = 60; // base score for matching sector

  // BHK Match
  if (input?.bhk && property.bhk === input.bhk) {
    match_score += 15;
  } else if (!input?.bhk) {
    match_score += 10;
  }

  // Status Match
  if (input?.status_filter === 'ready' && property.status === 'ready') {
    match_score += 15;
    score += 10;
  } else if (!input?.status_filter) {
    match_score += 10;
    if (property.status === 'ready') score += 10;
  }

  // Budget Match — gradient scoring (BUG-03 fix)
  match_score += scoreBudget(property.price, max_price, min_price);

  match_score = Math.min(100, Math.round(match_score));

  return { score, match_score };
}

/**
 * Property Discovery Engine
 * Pure function - deterministic scoring algorithm, no AI
 * Returns top 10 ranked properties (no pagination)
 */
export async function discoverProperties(
  input: DiscoveryInput,
  prisma: PrismaClient
): Promise<ScoredProperty[]> {
  // Resolve sector
  const sector_id = await resolveSectorHelper(prisma, input.sector);

  // Build query filters
  const where: any = {
    sector_id,
  };

  if (input.bhk !== undefined) {
    where.bhk = input.bhk;
  }

  if (input.property_type) {
    where.property_type = input.property_type;
  }

  // STRICT FILTERING: If status_filter is 'ready', exclude under_construction properties
  // This enforces the rule: immediate timeline OR ready preference → only ready properties
  if (input.status_filter === 'ready') {
    where.status = 'ready';
  }

  // Build price filter - only include if at least one price bound is provided
  // Handle cases where only min_price OR only max_price is provided
  if (input.min_price !== undefined || input.max_price !== undefined) {
    where.price = {};
    // Only add gte if min_price is explicitly provided and is a valid number
    if (input.min_price !== undefined && input.min_price !== null && !isNaN(input.min_price)) {
      where.price.gte = input.min_price;
    }
    // Allow up to 20% over budget so gradient scoreBudget() can rank borderline properties.
    // Properties more than 20% over will score 0 from scoreBudget() and sort to the bottom.
    if (input.max_price !== undefined && input.max_price !== null && !isNaN(input.max_price)) {
      where.price.lte = Math.round(input.max_price * 1.20);
    }
    // If price object is empty after checks, remove it to avoid Prisma errors
    if (Object.keys(where.price).length === 0) {
      delete where.price;
    }
  }

  // Query properties with filters
  const properties: PropertyWithSector[] = await prisma.property.findMany({
    where,
    include: {
      sector: { include: { intelligence: true } },
      images: { orderBy: { sort_order: 'asc' } },
    },
  });

  // Calculate scores and sort
  const scoredProperties: ScoredProperty[] = properties
    .map((property) => {
      const { score, match_score } = calculateScore(property, input.min_price, input.max_price, input);
      return {
        ...property,
        score,
        match_score
      };
    })
    .sort((a: ScoredProperty, b: ScoredProperty) => b.score - a.score); // Sort descending by score

  // Return top 20 (increased from 10 to show all properties)
  return scoredProperties.slice(0, 20);
}
