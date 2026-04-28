import { estimatePropertyValue } from './valueEstimator';
import { generateConfidenceExplanation } from '../utils/formatters';
import prisma from '../lib/prisma';

/**
 * A fully-validated property with match score and market pricing information.
 */
export interface ValidatedProperty {
    id: string;
    property_index: number;
    property_reference: string;
    match_score: number;
    validation: {
        market_range: { low: number; high: number };
        verdict: string;
        risk_flag: 'LOW' | 'MEDIUM' | 'HIGH';
        reason_codes: string[];
        confidence_level: 'LOW' | 'MEDIUM' | 'HIGH';
        confidence_explanation: string;
    } | null;
    // Allow any other property fields from Prisma
    [key: string]: unknown;
}

/**
 * Validates a batch of discovered properties by running the value estimator on each.
 * De-duplicated from the three copy-pasted blocks in chatController.ts.
 *
 * @param properties - Raw properties from the discovery engine (with sector relation)
 * @param sectorName - Fallback sector name if property.sector is missing
 * @param limit - Max number of properties to validate (default: 5)
 */
export async function validatePropertyPrices(
    properties: any[],
    sectorName: string,
    limit = 5
): Promise<ValidatedProperty[]> {
    const slice = properties.slice(0, limit);

    const validated = await Promise.all(
        slice.map(async (property, index) => {
            try {
                const valueEstimate = await estimatePropertyValue(
                    {
                        sector: property.sector?.name ?? sectorName,
                        bhk: property.bhk,
                        size_sqft: property.size_sqft,
                        quoted_price: property.price,
                        property_type: property.property_type,
                        property_status: property.status,
                        builder: property.builder,
                        floor: property.floor ?? undefined,
                    },
                    prisma
                );

                return {
                    ...property,
                    property_index: index,
                    property_reference: `Property ${index + 1}`,
                    match_score: property.match_score ?? 90,
                    validation: {
                        market_range: valueEstimate.market_range,
                        verdict: valueEstimate.verdict,
                        risk_flag: valueEstimate.risk_flag,
                        reason_codes: valueEstimate.reason_codes,
                        confidence_level: valueEstimate.confidence_level,
                        confidence_explanation: generateConfidenceExplanation({
                            confidence_level: valueEstimate.confidence_level,
                            reason_codes: valueEstimate.reason_codes,
                            risk_flag: valueEstimate.risk_flag,
                        }),
                    },
                } as ValidatedProperty;
            } catch {
                // Non-fatal: return without validation if estimator fails
                return {
                    ...property,
                    property_index: index,
                    property_reference: `Property ${index + 1}`,
                    match_score: property.match_score ?? 90,
                    validation: null,
                } as ValidatedProperty;
            }
        })
    );

    return validated;
}
