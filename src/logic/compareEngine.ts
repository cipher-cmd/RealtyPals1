import { PrismaClient, Property } from '@prisma/client';
import { ValidationError, NotFoundError } from '../utils/errors';

export interface CompareInput {
  property_id_1: string;
  property_id_2: string;
}

export interface ComparisonResult {
  property_1: {
    id: string;
    price: number;
    price_per_sqft: number;
    size_sqft: number;
    status: string;
    amenities: string[];
  };
  property_2: {
    id: string;
    price: number;
    price_per_sqft: number;
    size_sqft: number;
    status: string;
    amenities: string[];
  };
  differences: {
    price_diff: number;
    price_per_sqft_diff: number;
    size_diff: number;
    amenities_diff: {
      only_in_1: string[];
      only_in_2: string[];
      common: string[];
    };
    status_diff: boolean;
  };
}

/**
 * Compare Properties Engine
 * Pure function - no AI, deterministic comparison
 * Returns normalized comparison object
 */
export async function compareProperties(
  input: CompareInput,
  prisma: PrismaClient
): Promise<ComparisonResult> {
  // Validation: Cannot compare property with itself
  if (input.property_id_1 === input.property_id_2) {
    throw new ValidationError('Cannot compare property with itself');
  }

  // Fetch both properties
  const [property1, property2] = await Promise.all([
    prisma.property.findUnique({ where: { id: input.property_id_1 } }),
    prisma.property.findUnique({ where: { id: input.property_id_2 } }),
  ]);

  // Validation: Both properties must exist
  if (!property1 || !property2) {
    throw new NotFoundError('Property not found');
  }

  // Calculate differences
  const price_diff = property1.price - property2.price;
  const price_per_sqft_diff = property1.price_per_sqft - property2.price_per_sqft;
  const size_diff = property1.size_sqft - property2.size_sqft;
  const status_diff = property1.status !== property2.status;

  // Calculate amenities differences
  const amenities1 = new Set(property1.amenities);
  const amenities2 = new Set(property2.amenities);

  const only_in_1 = property1.amenities.filter((a) => !amenities2.has(a));
  const only_in_2 = property2.amenities.filter((a) => !amenities1.has(a));
  const common = property1.amenities.filter((a) => amenities2.has(a));

  return {
    property_1: {
      id: property1.id,
      price: property1.price,
      price_per_sqft: property1.price_per_sqft,
      size_sqft: property1.size_sqft,
      status: property1.status,
      amenities: property1.amenities,
    },
    property_2: {
      id: property2.id,
      price: property2.price,
      price_per_sqft: property2.price_per_sqft,
      size_sqft: property2.size_sqft,
      status: property2.status,
      amenities: property2.amenities,
    },
    differences: {
      price_diff,
      price_per_sqft_diff,
      size_diff,
      amenities_diff: {
        only_in_1,
        only_in_2,
        common,
      },
      status_diff,
    },
  };
}
