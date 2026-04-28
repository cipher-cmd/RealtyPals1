import { PrismaClient } from '@prisma/client';
import {
  estimatePropertyValueLogic,
  estimatePropertyValue,
  ValueEstimateLogicParams,
  ValueEstimateInput,
} from '../valueEstimator';

// Mock Prisma client
const createMockPrisma = () => {
  const mockSector = {
    id: 'sector-123',
    city: 'Noida',
    name: 'Sector 150',
    avg_price_low: 4500,
    avg_price_high: 6500,
    demand_level: 'medium' as const,
    supply_level: 'medium' as const,
    volatility_flag: false,
  };

  const mockPriceBands = [
    {
      id: 'band-1',
      sector_id: 'sector-123',
      property_type: 'flat' as const,
      bhk: 3,
      min_size: 1300,
      max_size: 1600,
      price_low: 4800, // ₹/sqft
      price_high: 6000, // ₹/sqft
      confidence_level: 'high' as const,
    },
    {
      id: 'band-2',
      sector_id: 'sector-123',
      property_type: null,
      bhk: null,
      min_size: 0,
      max_size: 99999,
      price_low: 4500,
      price_high: 6500,
      confidence_level: 'low' as const,
    },
  ];

  return {
    sector: {
      findUnique: jest.fn().mockResolvedValue(mockSector),
      findUniqueOrThrow: jest.fn().mockResolvedValue(mockSector),
    },
    priceBand: {
      findFirst: jest.fn().mockImplementation(({ where }) => {
        // Exact match
        if (where.property_type && where.bhk && where.min_size && where.max_size) {
          return mockPriceBands[0];
        }
        // Sector-only fallback
        if (where.property_type === null && where.bhk === null) {
          return mockPriceBands[1];
        }
        return null;
      }),
    },
  } as any;
};

describe('Value Estimator Logic (Pure Function)', () => {
  const mockSector = {
    id: 'sector-123',
    city: 'Noida',
    name: 'Sector 150',
    avg_price_low: 4500,
    avg_price_high: 6500,
    demand_level: 'medium' as const,
    supply_level: 'medium' as const,
    volatility_flag: false,
  };

  const mockPriceBand = {
    id: 'band-1',
    sector_id: 'sector-123',
    property_type: 'flat' as const,
    bhk: 3,
    min_size: 1300,
    max_size: 1600,
    price_low: 4800,
    price_high: 6000,
    confidence_level: 'high' as const,
  };

  describe('Basic functionality', () => {
    it('should calculate market range correctly (per sqft * size)', () => {
      const params: ValueEstimateLogicParams = {
        priceBand: mockPriceBand,
        sector: mockSector,
        confidenceLevel: 'high',
        input: {
          size_sqft: 1400,
          quoted_price: 7000000,
          bhk: 3,
        },
      };

      const result = estimatePropertyValueLogic(params);

      // price_high = 6000/sqft * 1400 sqft = 8,400,000
      expect(result.market_range.high).toBe(6000 * 1400);
      expect(result.market_range.low).toBe(4800 * 1400);
    });

    it('should return "Within market" when quoted_price <= price_high', () => {
      const params: ValueEstimateLogicParams = {
        priceBand: mockPriceBand,
        sector: mockSector,
        confidenceLevel: 'high',
        input: {
          size_sqft: 1400,
          quoted_price: 7000000, // Less than 8,400,000 (6000 * 1400)
          bhk: 3,
        },
      };

      const result = estimatePropertyValueLogic(params);
      expect(result.verdict).toBe('Within market');
    });

    it('should return "Slightly high" when quoted_price > price_high but <= 1.15x', () => {
      const params: ValueEstimateLogicParams = {
        priceBand: mockPriceBand,
        sector: mockSector,
        confidenceLevel: 'high',
        input: {
          size_sqft: 1400,
          quoted_price: 9000000, // Between 8,400,000 and 9,660,000 (1.15x)
          bhk: 3,
        },
      };

      const result = estimatePropertyValueLogic(params);
      expect(result.verdict).toBe('Slightly high');
    });

    it('should return "Aggressive" when quoted_price > 1.15x price_high', () => {
      const params: ValueEstimateLogicParams = {
        priceBand: mockPriceBand,
        sector: mockSector,
        confidenceLevel: 'high',
        input: {
          size_sqft: 1400,
          quoted_price: 10000000, // More than 9,660,000 (1.15x)
          bhk: 3,
        },
      };

      const result = estimatePropertyValueLogic(params);
      expect(result.verdict).toBe('Aggressive');
    });
  });

  describe('Without quoted_price', () => {
    it('should return "Market range only" when quoted_price not provided', () => {
      const params: ValueEstimateLogicParams = {
        priceBand: mockPriceBand,
        sector: mockSector,
        confidenceLevel: 'high',
        input: {
          size_sqft: 1400,
          bhk: 3,
        },
      };

      const result = estimatePropertyValueLogic(params);
      expect(result.verdict).toBe('Market range only');
      expect(result.risk_flag).toBe('MEDIUM');
    });
  });

  describe('Confidence safety rules', () => {
    it('should force HIGH risk_flag when confidence_level is low', () => {
      const params: ValueEstimateLogicParams = {
        priceBand: mockPriceBand,
        sector: mockSector,
        confidenceLevel: 'low',
        input: {
          size_sqft: 1400,
          quoted_price: 7000000,
          bhk: 3,
        },
      };

      const result = estimatePropertyValueLogic(params);
      expect(result.risk_flag).toBe('HIGH');
    });

    it('should upgrade verdict from "Within market" to "Slightly high" when confidence is low', () => {
      const params: ValueEstimateLogicParams = {
        priceBand: mockPriceBand,
        sector: mockSector,
        confidenceLevel: 'low',
        input: {
          size_sqft: 1400,
          quoted_price: 7000000, // Within range
          bhk: 3,
        },
      };

      const result = estimatePropertyValueLogic(params);
      expect(result.verdict).toBe('Slightly high'); // Upgraded from "Within market"
    });

    it('should NOT add MARKET_ALIGNMENT when confidence is low', () => {
      const params: ValueEstimateLogicParams = {
        priceBand: mockPriceBand,
        sector: mockSector,
        confidenceLevel: 'low',
        input: {
          size_sqft: 1400,
          quoted_price: 7000000, // Within range, but confidence is low
          bhk: 3,
        },
      };

      const result = estimatePropertyValueLogic(params);
      expect(result.reason_codes).not.toContain('MARKET_ALIGNMENT');
    });
  });

  describe('Reason codes', () => {
    it('should generate RECENT_LOWER_DEALS when quoted_price > band_total_high', () => {
      const params: ValueEstimateLogicParams = {
        priceBand: mockPriceBand,
        sector: mockSector,
        confidenceLevel: 'high',
        input: {
          size_sqft: 1400,
          quoted_price: 10000000, // > 8,400,000
          bhk: 3,
        },
      };

      const result = estimatePropertyValueLogic(params);
      expect(result.reason_codes).toContain('RECENT_LOWER_DEALS');
    });

    it('should generate MARKET_ALIGNMENT when confidence is high and price is in range', () => {
      const params: ValueEstimateLogicParams = {
        priceBand: mockPriceBand,
        sector: mockSector,
        confidenceLevel: 'high',
        input: {
          size_sqft: 1400,
          quoted_price: 8000000, // Within range (4,800*1400 = 6,720,000 to 6,000*1400 = 8,400,000)
          bhk: 3,
        },
      };

      const result = estimatePropertyValueLogic(params);
      expect(result.reason_codes).toContain('MARKET_ALIGNMENT');
    });

    it('should generate at most 3 reason codes', () => {
      const params: ValueEstimateLogicParams = {
        priceBand: mockPriceBand,
        sector: mockSector,
        confidenceLevel: 'high',
        input: {
          size_sqft: 1500, // Larger than typical 1400 for 3BHK
          quoted_price: 10000000,
          bhk: 3,
          property_status: 'under_construction',
          builder: 'Godrej', // Premium builder (normalized)
          floor: 10, // >= 8
        },
      };

      const result = estimatePropertyValueLogic(params);
      expect(result.reason_codes.length).toBeLessThanOrEqual(3);
    });

    it('should handle builder names case-insensitively', () => {
      const params: ValueEstimateLogicParams = {
        priceBand: mockPriceBand,
        sector: mockSector,
        confidenceLevel: 'high',
        input: {
          size_sqft: 1400,
          quoted_price: 7000000,
          bhk: 3,
          builder: 'GODREJ', // Uppercase
        },
      };

      const result = estimatePropertyValueLogic(params);
      expect(result.reason_codes).toContain('BUILDER_PREMIUM');
    });
  });
});

describe('Value Estimator Service (Impure Orchestration)', () => {
  let mockPrisma: PrismaClient;

  beforeEach(() => {
    mockPrisma = createMockPrisma() as any;
  });

  describe('Basic functionality', () => {
    it('should orchestrate Prisma calls and call pure logic', async () => {
      const input: ValueEstimateInput = {
        sector: 'Sector 150',
        bhk: 3,
        size_sqft: 1400,
        quoted_price: 7000000,
        property_type: 'flat',
      };

      const result = await estimatePropertyValue(input, mockPrisma);

      expect(result.market_range.high).toBe(6000 * 1400);
      expect(mockPrisma.sector.findUnique).toHaveBeenCalled();
      expect(mockPrisma.priceBand.findFirst).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should throw error for invalid sector', async () => {
      (mockPrisma.sector.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const input: ValueEstimateInput = {
        sector: 'Sector 99',
        bhk: 3,
        size_sqft: 1400,
        property_type: 'flat',
      };

      await expect(estimatePropertyValue(input, mockPrisma)).rejects.toThrow(
        'Invalid sector. Please choose a supported sector.'
      );
    });

    it('should throw error when no price band found', async () => {
      (mockPrisma.priceBand.findFirst as jest.Mock).mockResolvedValue(null);

      const input: ValueEstimateInput = {
        sector: 'Sector 150',
        bhk: 3,
        size_sqft: 1400,
        property_type: 'flat',
      };

      await expect(estimatePropertyValue(input, mockPrisma)).rejects.toThrow(
        'Insufficient data for estimation'
      );
    });
  });
});
