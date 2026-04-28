import { PrismaClient } from '@prisma/client';
import { compareProperties, CompareInput } from '../compareEngine';

const createMockPrisma = () => {
  const mockProperty1 = {
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
    amenities: ['parking', 'security', 'lift', 'gym'],
  };

  const mockProperty2 = {
    id: 'prop-2',
    sector_id: 'sector-123',
    property_type: 'flat' as const,
    bhk: 3,
    size_sqft: 1450,
    price: 7105000,
    price_per_sqft: 4900,
    builder: 'DLF',
    floor: 4,
    status: 'ready' as const,
    amenities: ['parking', 'security', 'lift'],
  };

  return {
    property: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === 'prop-1') return mockProperty1;
        if (where.id === 'prop-2') return mockProperty2;
        return null;
      }),
    },
  } as any;
};

describe('Compare Engine', () => {
  let mockPrisma: PrismaClient;

  beforeEach(() => {
    mockPrisma = createMockPrisma() as any;
  });

  describe('Basic functionality', () => {
    it('should compare two different properties', async () => {
      const input: CompareInput = {
        property_id_1: 'prop-1',
        property_id_2: 'prop-2',
      };

      const result = await compareProperties(input, mockPrisma);

      expect(result.property_1.id).toBe('prop-1');
      expect(result.property_2.id).toBe('prop-2');
      expect(result.differences.price_diff).toBe(7000000 - 7105000); // -105000
      expect(result.differences.size_diff).toBe(1400 - 1450); // -50
    });

    it('should calculate amenities differences correctly', async () => {
      const input: CompareInput = {
        property_id_1: 'prop-1',
        property_id_2: 'prop-2',
      };

      const result = await compareProperties(input, mockPrisma);

      // prop-1 has: parking, security, lift, gym
      // prop-2 has: parking, security, lift
      expect(result.differences.amenities_diff.common).toEqual(['parking', 'security', 'lift']);
      expect(result.differences.amenities_diff.only_in_1).toContain('gym');
      expect(result.differences.amenities_diff.only_in_2).toEqual([]);
    });

    it('should detect status differences', async () => {
      // Mock property 2 with different status
      (mockPrisma.property.findUnique as jest.Mock).mockImplementation(({ where }) => {
        if (where.id === 'prop-1')
          return {
            id: 'prop-1',
            status: 'ready',
            price: 7000000,
            price_per_sqft: 5000,
            size_sqft: 1400,
            amenities: [],
          };
        if (where.id === 'prop-2')
          return {
            id: 'prop-2',
            status: 'under_construction',
            price: 7105000,
            price_per_sqft: 4900,
            size_sqft: 1450,
            amenities: [],
          };
        return null;
      });

      const input: CompareInput = {
        property_id_1: 'prop-1',
        property_id_2: 'prop-2',
      };

      const result = await compareProperties(input, mockPrisma);
      expect(result.differences.status_diff).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should throw error when comparing property with itself', async () => {
      const input: CompareInput = {
        property_id_1: 'prop-1',
        property_id_2: 'prop-1',
      };

      await expect(compareProperties(input, mockPrisma)).rejects.toThrow(
        'Cannot compare property with itself'
      );
    });

    it('should throw error when property not found', async () => {
      (mockPrisma.property.findUnique as jest.Mock).mockResolvedValue(null);

      const input: CompareInput = {
        property_id_1: 'prop-nonexistent',
        property_id_2: 'prop-2',
      };

      await expect(compareProperties(input, mockPrisma)).rejects.toThrow('Property not found');
    });
  });

  describe('Comparison calculations', () => {
    it('should calculate price_per_sqft difference correctly', async () => {
      const input: CompareInput = {
        property_id_1: 'prop-1',
        property_id_2: 'prop-2',
      };

      const result = await compareProperties(input, mockPrisma);
      expect(result.differences.price_per_sqft_diff).toBe(5000 - 4900); // 100
    });

    it('should handle negative differences', async () => {
      const input: CompareInput = {
        property_id_1: 'prop-2', // Higher price
        property_id_2: 'prop-1', // Lower price
      };

      const result = await compareProperties(input, mockPrisma);
      expect(result.differences.price_diff).toBeGreaterThan(0); // prop-2 price - prop-1 price
    });
  });
});
