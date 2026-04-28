/**
 * Integration Test: POST /api/v1/compare
 * Happy path test for confidence
 */

import { PrismaClient } from '@prisma/client';
import { compareProperties, CompareInput } from '../../logic/compareEngine';

describe('Compare Properties Integration (Happy Path)', () => {
  let prisma: PrismaClient;
  let propertyId1: string;
  let propertyId2: string;

  beforeAll(async () => {
    prisma = new PrismaClient();

    // Find two different properties
    const properties = await prisma.property.findMany({
      take: 2,
    });

    if (properties.length < 2) {
      throw new Error('Database must have at least 2 properties for comparison test');
    }

    propertyId1 = properties[0].id;
    propertyId2 = properties[1].id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should compare two different properties and return differences', async () => {
    const input: CompareInput = {
      property_id_1: propertyId1,
      property_id_2: propertyId2,
    };

    const result = await compareProperties(input, prisma);

    // Assert structure
    expect(result).toHaveProperty('property_1');
    expect(result).toHaveProperty('property_2');
    expect(result).toHaveProperty('differences');

    // Assert property data
    expect(result.property_1.id).toBe(propertyId1);
    expect(result.property_2.id).toBe(propertyId2);
    expect(result.property_1).toHaveProperty('price');
    expect(result.property_1).toHaveProperty('price_per_sqft');
    expect(result.property_1).toHaveProperty('size_sqft');
    expect(result.property_1).toHaveProperty('status');
    expect(result.property_1).toHaveProperty('amenities');

    // Assert differences structure
    expect(result.differences).toHaveProperty('price_diff');
    expect(result.differences).toHaveProperty('price_per_sqft_diff');
    expect(result.differences).toHaveProperty('size_diff');
    expect(result.differences).toHaveProperty('amenities_diff');
    expect(result.differences).toHaveProperty('status_diff');

    // Assert amenities_diff structure
    expect(result.differences.amenities_diff).toHaveProperty('only_in_1');
    expect(result.differences.amenities_diff).toHaveProperty('only_in_2');
    expect(result.differences.amenities_diff).toHaveProperty('common');

    // Assert types
    expect(typeof result.differences.price_diff).toBe('number');
    expect(typeof result.differences.size_diff).toBe('number');
    expect(typeof result.differences.status_diff).toBe('boolean');
  });

  it('should calculate price difference correctly', async () => {
    const input: CompareInput = {
      property_id_1: propertyId1,
      property_id_2: propertyId2,
    };

    const result = await compareProperties(input, prisma);

    const expectedPriceDiff = result.property_1.price - result.property_2.price;
    expect(result.differences.price_diff).toBe(expectedPriceDiff);
  });
});
