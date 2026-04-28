/**
 * Premium Builders List (normalized to lowercase)
 * Builders in this list trigger BUILDER_PREMIUM reason code
 */
export const PREMIUM_BUILDERS = ['godrej', 'dlf', 'sobha'] as const;

/**
 * Typical Size by BHK (in sqft)
 * Used for SIZE_PREMIUM reason code calculation
 * Do not compute dynamically - use this constant
 */
export const TYPICAL_SIZE_BY_BHK: Record<number, number> = {
  1: 600,
  2: 1000,
  3: 1400,
  4: 1800,
  5: 2200,
  6: 3000,
} as const;
