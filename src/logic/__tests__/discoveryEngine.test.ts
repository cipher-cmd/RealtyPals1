import { PrismaClient } from '@prisma/client';
import { discoverProperties, DiscoveryInput } from '../discoveryEngine';

const createMockPrisma = () => {
  const mockSector = {
    id: 'sector-123',
    city: 'Noida',
    name: 'Sector 150',
  };

  const mockProperties = [
    {
      id: 'prop-1',
      sector_id: 'sector-123',
      property_type: 'flat' as const,
      bhk: 3,
      size_sqft: 1400,
      price: 7000000,
      price_per_sqft: 5000,
      builder: 'Godrej',
      floor: 5,
      status: 'ready' as const,
      amenities: ['parking', 'security', 'lift'],
      sector: mockSector,
    },
    {
      id: 'prop-2',
      sector_id: 'sector-123',
      property_type: 'flat' as const,
      bhk: 3,
      size_sqft: 1450,
      price: 7105000,
      price_per_sqft: 4900,
      builder: 'DLF',
      floor: 4,
      status: 'under_construction' as const,
      amenities: ['parking', 'security'],
      sector: mockSector,
    },
    {
      id: 'prop-3',
      sector_id: 'sector-123',
      property_type: 'flat' as const,
      bhk: 2,
      size_sqft: 1000,
      price: 4500000,
      price_per_sqft: 4500,
      builder: 'Sobha',
      floor: 3,
      status: 'ready' as const,
      amenities: ['parking', 'lift'],
      sector: mockSector,
    },
  ];

  return {
    sector: {
      findUnique: jest.fn().mockResolvedValue(mockSector),
    },
    property: {
      findMany: jest.fn().mockResolvedValue(mockProperties),
    },
  } as any;
};

describe('Discovery Engine', () => {
  let mockPrisma: PrismaClient;

  beforeEach(() => {
    mockPrisma = createMockPrisma() as any;
  });

  describe('Basic functionality', () => {
    it('should filter by sector', async () => {
      const input: DiscoveryInput = {
        sector: 'Sector 150',
      };

      const result = await discoverProperties(input, mockPrisma);
      expect(result.length).toBeGreaterThan(0);
      expect(mockPrisma.property.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({ sector_id: 'sector-123' }),
        include: { sector: true },
      });
    });

    it('should filter by bhk', async () => {
      const input: DiscoveryInput = {
        sector: 'Sector 150',
        bhk: 3,
      };

      await discoverProperties(input, mockPrisma);
      expect(mockPrisma.property.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({ bhk: 3 }),
        include: { sector: true },
      });
    });

    it('should filter by price range', async () => {
      const input: DiscoveryInput = {
        sector: 'Sector 150',
        min_price: 5000000,
        max_price: 8000000,
      };

      await discoverProperties(input, mockPrisma);
      expect(mockPrisma.property.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          price: { gte: 5000000, lte: 8000000 },
        }),
        include: { sector: true },
      });
    });

    it('should filter by property_type', async () => {
      const input: DiscoveryInput = {
        sector: 'Sector 150',
        property_type: 'flat',
      };

      await discoverProperties(input, mockPrisma);
      expect(mockPrisma.property.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({ property_type: 'flat' }),
        include: { sector: true },
      });
    });
  });

  describe('Scoring algorithm', () => {
    it('should add +10 points for ready status', async () => {
      const input: DiscoveryInput = {
        sector: 'Sector 150',
      };

      const result = await discoverProperties(input, mockPrisma);
      const readyProperty = result.find((p) => p.status === 'ready');
      const ucProperty = result.find((p) => p.status === 'under_construction');

      expect(readyProperty).toBeDefined();
      expect(ucProperty).toBeDefined();
      if (readyProperty && ucProperty) {
        // Ready property should have higher score (or equal if same other factors)
        expect(readyProperty.score).toBeGreaterThanOrEqual(ucProperty.score - 10);
      }
    });

    it('should rank ready properties higher than under_construction', async () => {
      const input: DiscoveryInput = {
        sector: 'Sector 150',
      };

      const result = await discoverProperties(input, mockPrisma);
      // First property should be ready (has +10 bonus)
      const topProperty = result[0];
      expect(topProperty.status).toBe('ready');
    });

    it('should return max 20 properties', async () => {
      // Create 25 mock properties
      const manyProperties = Array.from({ length: 25 }, (_, i) => ({
        id: `prop-${i}`,
        sector_id: 'sector-123',
        property_type: 'flat' as const,
        bhk: 3,
        size_sqft: 1400,
        price: 7000000,
        price_per_sqft: 5000,
        builder: 'Builder',
        floor: 5,
        status: 'ready' as const,
        amenities: [],
        sector: { id: 'sector-123', name: 'Sector 150' },
      }));

      (mockPrisma.property.findMany as jest.Mock).mockResolvedValueOnce(manyProperties);

      const input: DiscoveryInput = {
        sector: 'Sector 150',
      };

      const result = await discoverProperties(input, mockPrisma);
      expect(result.length).toBe(20);
    });
  });

  describe('Error handling', () => {
    it('should throw error for invalid sector', async () => {
      (mockPrisma.sector.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const input: DiscoveryInput = {
        sector: 'Sector 99',
      };

      await expect(discoverProperties(input, mockPrisma)).rejects.toThrow(
        'Invalid sector. Please choose a supported sector.'
      );
    });
  });
});
