/**
 * Integration Test: POST /api/v1/value-check
 * Happy path test for confidence
 */

import { PrismaClient } from '@prisma/client';
import { estimatePropertyValue, ValueEstimateInput } from '../../logic/valueEstimator';

describe('Value Check Integration (Happy Path)', () => {
  let prisma: PrismaClient;
  let sectorId: string;
  let propertyId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();

    // Ensure database is seeded
    // In real scenario, this would use test database
    const sector = await prisma.sector.findFirst({
      where: { name: 'Sector 150' },
    });

    if (!sector) {
      throw new Error('Database must be seeded before running integration tests');
    }

    sectorId = sector.id;

    // Find a property for context
    const property = await prisma.property.findFirst({
      where: { sector_id: sectorId },
    });

    if (!property) {
      throw new Error('No properties found in database');
    }

    propertyId = property.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should return market range and verdict for valid input', async () => {
    const input: ValueEstimateInput = {
      sector: 'Sector 150',
      bhk: 3,
      size_sqft: 1400,
      quoted_price: 7500000,
      property_type: 'flat',
      property_status: 'ready',
      builder: 'Godrej',
      floor: 8,
    };

    const result = await estimatePropertyValue(input, prisma);

    // Assert structure
    expect(result).toHaveProperty('market_range');
    expect(result.market_range).toHaveProperty('low');
    expect(result.market_range).toHaveProperty('high');
    expect(result).toHaveProperty('verdict');
    expect(result).toHaveProperty('reason_codes');
    expect(result).toHaveProperty('risk_flag');
    expect(result).toHaveProperty('confidence_level');

    // Assert types
    expect(typeof result.market_range.low).toBe('number');
    expect(typeof result.market_range.high).toBe('number');
    expect(result.verdict).toMatch(/Within market|Slightly high|Aggressive|Market range only/);
    expect(Array.isArray(result.reason_codes)).toBe(true);
    expect(result.reason_codes.length).toBeLessThanOrEqual(3);
    expect(result.risk_flag).toMatch(/LOW|MEDIUM|HIGH/);
    expect(result.confidence_level).toMatch(/LOW|MEDIUM|HIGH/);
  });

  it('should return market range when quoted_price is not provided', async () => {
    const input: ValueEstimateInput = {
      sector: 'Sector 150',
      bhk: 3,
      size_sqft: 1400,
      property_type: 'flat',
    };

    const result = await estimatePropertyValue(input, prisma);

    expect(result.verdict).toBe('Market range only');
    expect(result.risk_flag).toBe('MEDIUM');
    expect(result.market_range.low).toBeGreaterThan(0);
    expect(result.market_range.high).toBeGreaterThan(result.market_range.low);
  });
});
