import { PrismaClient, PriceBand } from '@prisma/client';
import { EstimationError } from '../utils/errors';

export type ConfidenceLevel = 'low' | 'medium' | 'high';

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
 * Project-level price band interface (compatible with PriceBand for value estimator)
 */
export interface ProjectPriceBandLike {
  price_low: number;
  price_high: number;
  confidence_level: ConfidenceLevel;
  isProjectBand?: boolean;
}

/**
 * Finds matching PriceBand using priority order
 * Priority 0 (NEW): Project-level bands (if builder/project_name provided)
 * Priority 1: Exact sector+bhk+size match
 * Priority 2: Relaxed sector+bhk match
 * Priority 3: Sector-only fallback
 * 
 * Returns matched band and forced confidence level
 * IMPURE - calls Prisma
 */
export async function resolvePriceBand(
  prisma: PrismaClient,
  sector_id: string,
  property_type: 'flat' | 'plot',
  bhk: number,
  size_sqft: number,
  builder?: string,
  project_name?: string
): Promise<{ band: PriceBand | ProjectPriceBandLike; forcedConfidence: ConfidenceLevel; isProjectBand?: boolean }> {
  // Priority 0 (NEW): Project-level price bands
  // If builder OR project_name is provided, check for project-level bands first
  if (builder || project_name) {
    // Try exact match: project_name + bhk
    if (project_name) {
      const projectExact = await prisma.projectPriceBand.findFirst({
        where: {
          project_name: {
            equals: project_name,
            mode: 'insensitive',
          },
          sector_id,
          bhk,
        },
        orderBy: {
          updated_at: 'desc', // Prefer most recent
        },
      });

      if (projectExact) {
        const projectBand: ProjectPriceBandLike = {
          price_low: projectExact.min_price_psf,
          price_high: projectExact.max_price_psf,
          confidence_level: projectExact.confidence as ConfidenceLevel,
          isProjectBand: true,
        };
        return {
          band: projectBand,
          forcedConfidence: projectExact.confidence === 'high' ? 'high' : 'medium',
          isProjectBand: true,
        };
      }

      // Try relaxed: project_name only (bhk = null)
      const projectRelaxed = await prisma.projectPriceBand.findFirst({
        where: {
          project_name: {
            equals: project_name,
            mode: 'insensitive',
          },
          sector_id,
          bhk: null,
        },
        orderBy: {
          updated_at: 'desc',
        },
      });

      if (projectRelaxed) {
        const projectBand: ProjectPriceBandLike = {
          price_low: projectRelaxed.min_price_psf,
          price_high: projectRelaxed.max_price_psf,
          confidence_level: projectRelaxed.confidence as ConfidenceLevel,
          isProjectBand: true,
        };
        return {
          band: projectBand,
          forcedConfidence: 'medium', // Relaxed match = medium confidence
          isProjectBand: true,
        };
      }
    }

    // Try builder match (using builder name as project identifier)
    if (builder) {
      const builderMatch = await prisma.projectPriceBand.findFirst({
        where: {
          project_name: {
            contains: builder,
            mode: 'insensitive',
          },
          sector_id,
          OR: [
            { bhk },
            { bhk: null },
          ],
        },
        orderBy: [
          { bhk: 'desc' }, // Prefer exact bhk match
          { updated_at: 'desc' },
        ],
      });

      if (builderMatch) {
        const projectBand: ProjectPriceBandLike = {
          price_low: builderMatch.min_price_psf,
          price_high: builderMatch.max_price_psf,
          confidence_level: builderMatch.confidence as ConfidenceLevel,
          isProjectBand: true,
        };
        return {
          band: projectBand,
          forcedConfidence: builderMatch.bhk === bhk ? (builderMatch.confidence === 'high' ? 'high' : 'medium') : 'medium',
          isProjectBand: true,
        };
      }
    }
  }
  // Priority 1: Exact match - sector + property_type + bhk + size within range
  const exactMatch = await prisma.priceBand.findFirst({
    where: {
      sector_id,
      property_type,
      bhk,
      min_size: { lte: size_sqft },
      max_size: { gte: size_sqft },
    },
    orderBy: {
      confidence_level: 'desc', // Prefer higher confidence if multiple match
    },
  });

  if (exactMatch) {
    return { band: exactMatch, forcedConfidence: exactMatch.confidence_level };
  }

  // Priority 2: Relax size - sector + property_type + bhk (ignore size)
  const relaxedSize = await prisma.priceBand.findFirst({
    where: {
      sector_id,
      property_type,
      bhk,
    },
    orderBy: {
      confidence_level: 'desc', // Prefer higher confidence if multiple match
    },
  });

  if (relaxedSize) {
    return { band: relaxedSize, forcedConfidence: 'low' };
  }

  // Priority 3: Sector-only - sector + property_type IS NULL + bhk IS NULL
  const sectorOnly = await prisma.priceBand.findFirst({
    where: {
      sector_id,
      property_type: null,
      bhk: null,
    },
    orderBy: {
      confidence_level: 'desc',
    },
  });

  if (sectorOnly) {
    return { band: sectorOnly, forcedConfidence: 'low' };
  }

  // Priority 4: Derive from DB – percentiles per sector + bhk + type
  const derived = await deriveBandFromProperties(prisma, sector_id, property_type, bhk);
  if (derived) {
    return { band: derived, forcedConfidence: 'low' };
  }

  throw new EstimationError('Insufficient data for estimation');
}

/**
 * Compute a synthetic price band from actual properties (percentiles).
 * Used when no PriceBand or ProjectPriceBand matches.
 */
async function deriveBandFromProperties(
  prisma: PrismaClient,
  sector_id: string,
  property_type: 'flat' | 'plot',
  bhk: number
): Promise<ProjectPriceBandLike | null> {
  const props = await prisma.property.findMany({
    where: { sector_id, property_type, bhk },
    select: { price_per_sqft: true },
    take: 200,
  });

  if (props.length < 3) return null;

  const vals = props.map((p) => p.price_per_sqft).sort((a, b) => a - b);
  const p25 = percentileSorted(vals, 0.25);
  const p75 = percentileSorted(vals, 0.75);
  const p50 = medianSorted(vals);

  let low = Math.round(p25);
  let high = Math.round(p75);
  if (low >= high) {
    low = Math.round(p50 * 0.9);
    high = Math.round(p50 * 1.1);
  }

  return {
    price_low: low,
    price_high: high,
    confidence_level: vals.length >= 10 ? 'medium' : 'low',
    isProjectBand: false,
  };
}
