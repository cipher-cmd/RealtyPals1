/**
 * Integration Test: GET /api/v1/properties
 * Happy path test for confidence
 */

import { PrismaClient } from '@prisma/client';
import { discoverProperties, DiscoveryInput } from '../../logic/discoveryEngine';

describe('Properties Discovery Integration (Happy Path)', () => {
  let prisma: PrismaClient;
  let sectorId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();

    const sector = await prisma.sector.findFirst({
      where: { name: 'Sector 150' },
    });

    if (!sector) {
      throw new Error('Database must be seeded before running integration tests');
    }

    sectorId = sector.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should return properties with scores for valid sector', async () => {
    const input: DiscoveryInput = {
      sector: 'Sector 150',
    };

    const properties = await discoverProperties(input, prisma);

    // Assert structure
    expect(Array.isArray(properties)).toBe(true);
    expect(properties.length).toBeGreaterThan(0);
    expect(properties.length).toBeLessThanOrEqual(20);

    // Assert first property has required fields
    if (properties.length > 0) {
      const first = properties[0];
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('score');
      expect(first).toHaveProperty('price');
      expect(first).toHaveProperty('bhk');
      expect(typeof first.score).toBe('number');
    }
  });

  it('should filter by bhk and return max 20 results', async () => {
    const input: DiscoveryInput = {
      sector: 'Sector 150',
      bhk: 3,
    };

    const properties = await discoverProperties(input, prisma);

    expect(properties.length).toBeLessThanOrEqual(20);

    // All should be 3BHK
    properties.forEach((prop) => {
      expect(prop.bhk).toBe(3);
    });

    // Should be sorted by score descending
    for (let i = 1; i < properties.length; i++) {
      expect(properties[i - 1].score).toBeGreaterThanOrEqual(properties[i].score);
    }
  });

  it('should filter by price range', async () => {
    const input: DiscoveryInput = {
      sector: 'Sector 150',
      min_price: 5000000,
      max_price: 8000000,
    };

    const properties = await discoverProperties(input, prisma);

    properties.forEach((prop) => {
      expect(prop.price).toBeGreaterThanOrEqual(5000000);
      expect(prop.price).toBeLessThanOrEqual(8000000);
    });
  });
});
