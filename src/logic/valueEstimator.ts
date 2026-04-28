import { PrismaClient, PriceBand, Sector } from '@prisma/client';
import { PREMIUM_BUILDERS, TYPICAL_SIZE_BY_BHK } from '../utils/constants';
import { resolvePriceBand } from '../services/priceBandResolver';
import { ValidationError } from '../utils/errors';

export type ReasonCode =
  | 'RECENT_LOWER_DEALS'
  | 'RECENT_HIGHER_DEALS'
  | 'HIGH_SUPPLY'
  | 'LOW_SUPPLY'
  | 'SIZE_PREMIUM'
  | 'FLOOR_PREMIUM'
  | 'BUILDER_PREMIUM'
  | 'LOCATION_ADVANTAGE'
  | 'UNDER_CONSTRUCTION_DISCOUNT'
  | 'MARKET_ALIGNMENT'
  | 'PROJECT_LEVEL_PRICING'
  | 'PRICE_DISPERSION';

export type RiskFlag = 'LOW' | 'MEDIUM' | 'HIGH';

export type Verdict = 'Within market' | 'Slightly high' | 'Aggressive' | 'Market range only';

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface ValueEstimateLogicInput {
  size_sqft: number;
  quoted_price?: number;
  bhk: number;
  property_status?: 'ready' | 'under_construction';
  builder?: string;
  floor?: number;
}

export interface ValueEstimateLogicParams {
  priceBand: PriceBand | { price_low: number; price_high: number; confidence_level: ConfidenceLevel };
  sector: Sector;
  confidenceLevel: ConfidenceLevel;
  input: ValueEstimateLogicInput;
  // Optional: similar listings data for confidence anchoring
  similarListings?: Array<{ price: number; size_sqft: number }>;
  isProjectBand?: boolean; // Indicates if band is from ProjectPriceBand
  sectorBand?: PriceBand; // Original sector band for comparison (safety check)
}

export interface ValueEstimateResult {
  market_range: {
    low: number;
    high: number;
  };
  verdict: Verdict;
  reason_codes: ReasonCode[];
  risk_flag: RiskFlag;
  confidence_level: 'LOW' | 'MEDIUM' | 'HIGH';
  /** Number of comparable properties from DB used to refine the estimate (when available) */
  comparable_count?: number;
}

export interface ValueEstimateInput {
  sector: string; // Sector name (e.g., "Sector 150")
  bhk: number;
  size_sqft: number;
  quoted_price?: number;
  property_type: 'flat' | 'plot';
  property_status?: 'ready' | 'under_construction';
  builder?: string;
  project_name?: string; // Optional; improves project-level band matching
  floor?: number;
}

function percentileSorted(values: number[], p: number): number {
  if (values.length === 0) return 0;
  if (values.length === 1) return values[0];
  const index = (values.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return values[lower]!;
  const weight = index - lower;
  return values[lower]! * (1 - weight) + values[upper]! * weight;
}

function medianSorted(values: number[]): number {
  return percentileSorted(values, 0.5);
}

/**
 * PURE LOGIC FUNCTION
 * No side effects, no Prisma calls
 * Computes verdict, reason codes, and risk flag from input data
 */
export function estimatePropertyValueLogic(
  params: ValueEstimateLogicParams
): ValueEstimateResult {
  const { priceBand, sector, confidenceLevel, input, similarListings, isProjectBand, sectorBand } = params;
  const { size_sqft, quoted_price, bhk, property_status, builder, floor } = input;

  // Convert PriceBand to Total Prices (MANDATORY)
  // PriceBand prices are in ₹ per sqft, must multiply by size_sqft
  let band_total_low = priceBand.price_low * size_sqft;
  let band_total_high = priceBand.price_high * size_sqft;
  const band_center = (band_total_low + band_total_high) / 2;
  const band_width = band_total_high - band_total_low;

  // PART 1: Size-sensitive price band tightening
  // Determine size bucket relative to typical size for this BHK
  const typicalSize = TYPICAL_SIZE_BY_BHK[bhk] || 1400; // Default to 3BHK typical
  const sizeRatio = size_sqft / typicalSize;
  let sizeAdjustmentFactor = 1.0; // No change for typical size

  if (sizeRatio < 0.9) {
    // Small unit: tighten band by ~5%
    sizeAdjustmentFactor = 0.95;
  } else if (sizeRatio > 1.1) {
    // Large unit: widen band by ~5-8%
    sizeAdjustmentFactor = 1.065; // Average of 5-8%
  }
  // Typical size (0.9 <= sizeRatio <= 1.1): no adjustment

  // Apply size adjustment to band width (NOT center)
  const adjusted_width = band_width * sizeAdjustmentFactor;
  const width_delta = adjusted_width - band_width;
  band_total_low = band_center - adjusted_width / 2;
  band_total_high = band_center + adjusted_width / 2;

  // PART 2: Confidence-driven range width adjustment
  // Apply after size adjustment
  let confidenceAdjustmentFactor = 1.0;
  if (confidenceLevel === 'high') {
    // Tighten band by additional ~5%
    confidenceAdjustmentFactor = 0.95;
  } else if (confidenceLevel === 'low') {
    // Widen band by additional ~10-15%
    confidenceAdjustmentFactor = 1.125; // Average of 10-15%
  }
  // Medium: no change

  // Apply confidence adjustment
  let final_width = adjusted_width * confidenceAdjustmentFactor;
  let final_center = (band_total_low + band_total_high) / 2;

  // When we have enough comparables, anchor range to actual market (median total price)
  if (similarListings && similarListings.length >= 3) {
    const totals = similarListings.map((l) => l.price).sort((a, b) => a - b);
    const rawP25 = percentileSorted(totals, 0.25);
    const rawP75 = percentileSorted(totals, 0.75);
    const rawIqr = Math.max(rawP75 - rawP25, band_width * 0.1);
    const lowerBound = rawP25 - rawIqr * 1.5;
    const upperBound = rawP75 + rawIqr * 1.5;
    const trimmed = totals.filter((v) => v >= lowerBound && v <= upperBound);
    const effective = trimmed.length >= 3 ? trimmed : totals;
    const medianTotal = medianSorted(effective);
    const p25 = percentileSorted(effective, 0.25);
    const p75 = percentileSorted(effective, 0.75);
    const iqr = Math.max(p75 - p25, band_width * 0.1);
    const comparableHalfWidth = Math.max(iqr * 0.6, final_width / 2);
    const comparableWeight = Math.min(0.75, 0.4 + 0.05 * Math.max(0, effective.length - 3));
    final_center = (1 - comparableWeight) * final_center + comparableWeight * medianTotal;
    final_width = Math.max(final_width, comparableHalfWidth * 2);
  }

  // Cap the band width to a maximum of 16% (±8%) of the center price to keep brackets tighter
  final_width = Math.min(final_width, final_center * 0.16);

  band_total_low = Math.max(0, final_center - final_width / 2);
  band_total_high = Math.max(band_total_low + 1, final_center + final_width / 2);

  // Determine verdict
  let verdict: Verdict;
  if (quoted_price === undefined) {
    verdict = 'Market range only';
  } else {
    if (quoted_price <= band_total_high) {
      verdict = 'Within market';
    } else if (quoted_price <= band_total_high * 1.15) {
      verdict = 'Slightly high';
    } else {
      verdict = 'Aggressive';
    }
  }

  // Apply confidence safety rule
  if (confidenceLevel === 'low') {
    // Verdict cannot be "Within market" if confidence is low
    if (verdict === 'Within market') {
      verdict = 'Slightly high';
    }
  }

  // PART 5: Similar listings as secondary signal (for confidence/reason codes)
  // Compute median ₹/sqft from similar listings if available
  let similarListingsMedianPerSqft: number | undefined;
  let similarListingsSignal: 'close' | 'lower' | 'higher' | undefined;

  if (similarListings && similarListings.length > 0) {
    const perSqftValues = similarListings.map(l => l.price / l.size_sqft);
    perSqftValues.sort((a, b) => a - b);
    similarListingsMedianPerSqft = medianSorted(perSqftValues);

    // Compare median to band center (per sqft)
    const band_center_per_sqft = (priceBand.price_low + priceBand.price_high) / 2;
    const deviation = Math.abs(similarListingsMedianPerSqft - band_center_per_sqft) / band_center_per_sqft;

    if (deviation < 0.05) {
      // Within 5% - close to band center
      similarListingsSignal = 'close';
    } else if (similarListingsMedianPerSqft < band_center_per_sqft * 0.95) {
      // More than 5% below - consistently lower
      similarListingsSignal = 'lower';
    } else if (similarListingsMedianPerSqft > band_center_per_sqft * 1.05) {
      // More than 5% above - consistently higher
      similarListingsSignal = 'higher';
    }
  }

  // Generate reason codes (max 3, priority order, no contradictions)
  const reason_codes: ReasonCode[] = [];

  // Priority 1: RECENT_LOWER_DEALS (only if similar listings suggest lower, or quoted price is high)
  if (reason_codes.length < 3 && quoted_price && quoted_price > band_total_high) {
    // Only add if similar listings also suggest lower, or if no similar listings data
    if (similarListingsSignal === 'lower' || similarListingsSignal === undefined) {
      reason_codes.push('RECENT_LOWER_DEALS');
    }
  }

  // Priority 2: RECENT_HIGHER_DEALS (only if similar listings suggest higher, or quoted price is low)
  if (reason_codes.length < 3 && quoted_price && quoted_price < band_total_low * 0.9) {
    // Only add if similar listings also suggest higher, or if no similar listings data
    if (similarListingsSignal === 'higher' || similarListingsSignal === undefined) {
      reason_codes.push('RECENT_HIGHER_DEALS');
    }
  }

  // Add similar listings reason codes if they contradict quoted price
  if (reason_codes.length < 3 && similarListingsSignal === 'lower' && quoted_price && quoted_price <= band_total_high) {
    reason_codes.push('RECENT_LOWER_DEALS');
  }
  if (reason_codes.length < 3 && similarListingsSignal === 'higher' && quoted_price && quoted_price >= band_total_low) {
    reason_codes.push('RECENT_HIGHER_DEALS');
  }

  // Priority 3: HIGH_SUPPLY
  if (reason_codes.length < 3 && sector.supply_level === 'high') {
    reason_codes.push('HIGH_SUPPLY');
  }

  // Priority 4: LOW_SUPPLY
  if (reason_codes.length < 3 && sector.supply_level === 'low') {
    reason_codes.push('LOW_SUPPLY');
  }

  // Priority 5: UNDER_CONSTRUCTION_DISCOUNT
  if (reason_codes.length < 3 && property_status === 'under_construction') {
    reason_codes.push('UNDER_CONSTRUCTION_DISCOUNT');
  }

  // Priority 6: PROJECT_LEVEL_PRICING (if project band is used)
  if (isProjectBand && reason_codes.length < 3) {
    reason_codes.push('PROJECT_LEVEL_PRICING');
  }

  // Priority 7: BUILDER_PREMIUM (as explanation, not pricing modifier)
  // Track if builder is premium for later risk/confidence adjustment
  let isPremiumBuilder = false;
  if (builder) {
    const normalizedBuilder = builder.toLowerCase();
    if (PREMIUM_BUILDERS.includes(normalizedBuilder as typeof PREMIUM_BUILDERS[number])) {
      isPremiumBuilder = true;
      if (reason_codes.length < 3) {
        reason_codes.push('BUILDER_PREMIUM');
      }
    }
  }

  // Priority 8: SIZE_PREMIUM
  if (reason_codes.length < 3 && bhk && size_sqft > TYPICAL_SIZE_BY_BHK[bhk]) {
    reason_codes.push('SIZE_PREMIUM');
  }

  // Priority 9: FLOOR_PREMIUM (tiered logic)
  // Floor 1-3: no premium
  // Floor 4-10: mild premium
  // Floor >10: premium (ready) or premium + higher risk (under construction)
  let hasFloorPremium = false;
  if (floor !== undefined) {
    if (floor >= 4 && floor <= 10) {
      hasFloorPremium = true;
      if (reason_codes.length < 3) {
        reason_codes.push('FLOOR_PREMIUM');
      }
    } else if (floor > 10) {
      hasFloorPremium = true;
      if (reason_codes.length < 3) {
        reason_codes.push('FLOOR_PREMIUM');
      }
    }
  }

  // Initialize adjusted confidence level (will be modified by builder premium and similar listings)
  let adjustedConfidenceLevel = confidenceLevel;

  // Priority 10: PRICE_DISPERSION (safety check - if project band conflicts with sector band)
  // Check if project band diverges significantly from sector band (>20% delta)
  if (isProjectBand && sectorBand && reason_codes.length < 3) {
    const sectorCenter = (sectorBand.price_low + sectorBand.price_high) / 2;
    const projectCenter = (priceBand.price_low + priceBand.price_high) / 2;
    const delta = Math.abs(projectCenter - sectorCenter) / sectorCenter;
    if (delta > 0.20) {
      reason_codes.push('PRICE_DISPERSION');
    }
  }

  // Priority 11: MARKET_ALIGNMENT (only if confidence is not low and price is within range)
  if (
    reason_codes.length < 3 &&
    adjustedConfidenceLevel !== 'low' &&
    quoted_price &&
    quoted_price >= band_total_low &&
    quoted_price <= band_total_high
  ) {
    reason_codes.push('MARKET_ALIGNMENT');
  }

  // PART 6: Reason code cleanup - ensure max 3 and no contradictions
  // Remove duplicates and ensure RECENT_LOWER_DEALS and RECENT_HIGHER_DEALS never together
  const cleanedReasonCodes: ReasonCode[] = [];
  const hasLower = reason_codes.includes('RECENT_LOWER_DEALS');
  const hasHigher = reason_codes.includes('RECENT_HIGHER_DEALS');

  for (const code of reason_codes) {
    if (cleanedReasonCodes.length >= 3) break;

    // Skip if contradictory
    if (code === 'RECENT_LOWER_DEALS' && hasHigher) continue;
    if (code === 'RECENT_HIGHER_DEALS' && hasLower) continue;

    // Skip duplicates
    if (cleanedReasonCodes.includes(code)) continue;

    cleanedReasonCodes.push(code);
  }

  // Set risk_flag (deterministic logic)
  let risk_flag: RiskFlag;
  if (quoted_price === undefined) {
    risk_flag = 'MEDIUM';
  } else if (confidenceLevel === 'low') {
    risk_flag = 'HIGH';
  } else if (quoted_price > band_total_high * 1.15) {
    risk_flag = 'HIGH';
  } else if (quoted_price > band_total_high) {
    risk_flag = 'MEDIUM';
  } else {
    risk_flag = 'LOW';
  }

  // PART 3: Builder premium affects risk and confidence (NOT price range)
  if (isPremiumBuilder) {
    // Reduce risk if currently MEDIUM
    if (risk_flag === 'MEDIUM') {
      risk_flag = 'LOW';
    }
    // Increase confidence (internal only, for UI display)
    if (adjustedConfidenceLevel === 'medium') {
      adjustedConfidenceLevel = 'high';
    }
  }

  // PART 3.5: Project-level pricing confidence adjustment
  // If project band is used, confidence cannot exceed 'MEDIUM' unless project confidence is 'high'
  if (isProjectBand) {
    if (confidenceLevel !== 'high' && adjustedConfidenceLevel === 'high') {
      adjustedConfidenceLevel = 'medium';
    }
  }

  // PART 3.6: Price dispersion safety - increase risk if project band conflicts with sector band
  if (isProjectBand && sectorBand && reason_codes.includes('PRICE_DISPERSION')) {
    // Increase risk by one level if price dispersion detected
    if (risk_flag === 'LOW') {
      risk_flag = 'MEDIUM';
    } else if (risk_flag === 'MEDIUM') {
      risk_flag = 'HIGH';
    }
  }

  // PART 4: Floor premium affects risk for high floors + under construction
  if (hasFloorPremium && floor !== undefined && floor > 10 && property_status === 'under_construction') {
    // High floor + under construction: slightly increase risk
    if (risk_flag === 'LOW') {
      risk_flag = 'MEDIUM';
    }
  }

  // PART 5: Similar listings affect confidence (if signal is close, increase confidence)
  if (similarListingsSignal === 'close' && adjustedConfidenceLevel === 'medium') {
    adjustedConfidenceLevel = 'high';
  }

  // Convert to UI confidence level
  const uiConfidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH' =
    adjustedConfidenceLevel === 'high' ? 'HIGH' : adjustedConfidenceLevel === 'medium' ? 'MEDIUM' : 'LOW';

  return {
    market_range: {
      low: band_total_low,
      high: band_total_high,
    },
    verdict,
    reason_codes: cleanedReasonCodes,
    risk_flag,
    confidence_level: uiConfidenceLevel,
  };
}

/**
 * IMPURE ORCHESTRATION FUNCTION
 * Handles Prisma calls and data fetching
 * Calls pure logic function with fetched data
 */
export async function estimatePropertyValue(
  input: ValueEstimateInput,
  prisma: PrismaClient
): Promise<ValueEstimateResult> {
  // Resolve sector (include city for future safety with @@unique([city, name]))
  const sector = await prisma.sector.findFirst({
    where: {
      name: input.sector,
    },
  });

  if (!sector) {
    throw new ValidationError('Invalid sector. Please choose a supported sector.');
  }

  // Resolve PriceBand (priority order) - now includes project-level bands (Priority 0)
  const { band, forcedConfidence, isProjectBand } = await resolvePriceBand(
    prisma,
    sector.id,
    input.property_type,
    input.bhk,
    input.size_sqft,
    input.builder,
    input.project_name
  );

  // If project band is used, also fetch sector band for comparison (safety check)
  let sectorBand: PriceBand | undefined;
  if (isProjectBand) {
    try {
      // Try to get sector-level band for comparison
      const sectorBandResult = await prisma.priceBand.findFirst({
        where: {
          sector_id: sector.id,
          property_type: input.property_type,
          bhk: input.bhk,
        },
        orderBy: {
          confidence_level: 'desc',
        },
      });
      if (sectorBandResult) {
        sectorBand = sectorBandResult;
      }
    } catch (error) {
      // Non-fatal - continue without sector band comparison
      console.warn('Could not fetch sector band for comparison:', error);
    }
  }

  // Fetch similar properties from DB: same sector, BHK, type, size ±15%.
  // Optionally filter by project_name or builder when provided for tighter comparables.
  const sizeTolerance = input.size_sqft * 0.15;
  const baseWhere = {
    sector_id: sector.id,
    bhk: input.bhk,
    property_type: input.property_type,
    size_sqft: {
      gte: Math.round(input.size_sqft - sizeTolerance),
      lte: Math.round(input.size_sqft + sizeTolerance),
    },
    ...(input.property_status ? { status: input.property_status } : {}),
  } as const;

  type WhereClause = typeof baseWhere & {
    project_name?: { equals: string; mode: 'insensitive' };
    builder?: { contains: string; mode: 'insensitive' };
  };

  let similarListingsRaw: Array<{ price: number; size_sqft: number }>;

  const fetchSimilar = async (where: WhereClause) =>
    prisma.property.findMany({
      where,
      select: { price: true, size_sqft: true },
      take: 15,
    });

  if (input.project_name && input.project_name.trim()) {
    const withProject = await fetchSimilar({
      ...baseWhere,
      project_name: { equals: input.project_name.trim(), mode: 'insensitive' },
    });
    if (withProject.length > 0) {
      similarListingsRaw = withProject;
    } else {
      similarListingsRaw = await fetchSimilar(baseWhere);
    }
  } else if (input.builder && input.builder.trim()) {
    const withBuilder = await fetchSimilar({
      ...baseWhere,
      builder: { contains: input.builder.trim(), mode: 'insensitive' },
    });
    if (withBuilder.length > 0) {
      similarListingsRaw = withBuilder;
    } else {
      similarListingsRaw = await fetchSimilar(baseWhere);
    }
  } else {
    similarListingsRaw = await fetchSimilar(baseWhere);
  }

  const similarListings = similarListingsRaw
    .filter((l): l is { price: number; size_sqft: number } => l.price != null)
    .map(l => ({ price: l.price, size_sqft: l.size_sqft }));

  const logicResult = estimatePropertyValueLogic({
    priceBand: band,
    sector,
    confidenceLevel: forcedConfidence,
    input: {
      size_sqft: input.size_sqft,
      quoted_price: input.quoted_price,
      bhk: input.bhk,
      property_status: input.property_status,
      builder: input.builder,
      floor: input.floor,
    },
    similarListings: similarListings.length > 0 ? similarListings : undefined,
    isProjectBand,
    sectorBand,
  });

  return {
    ...logicResult,
    comparable_count: similarListings.length > 0 ? similarListings.length : undefined,
  };
}
