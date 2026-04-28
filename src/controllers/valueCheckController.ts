import { Request, Response } from 'express';
import { estimatePropertyValue, ValueEstimateInput } from '../logic/valueEstimator';
import prisma from '../lib/prisma';

/**
 * POST /api/v1/value-check
 * Body: { sector, bhk, size_sqft, quoted_price?, property_type, property_status?, builder?, floor? }
 */
export async function checkValue(req: Request, res: Response) {
  try {
    const { sector, bhk, size_sqft, quoted_price, property_type, property_status, builder, project_name, floor } = req.body;

    // Validate required fields
    if (!sector || !bhk || !size_sqft || !property_type) {
      return res.status(400).json({ error: 'Missing required fields: sector, bhk, size_sqft, property_type' });
    }

    // Validate property_type enum
    if (property_type !== 'flat' && property_type !== 'plot') {
      return res.status(400).json({ error: 'property_type must be either "flat" or "plot"' });
    }

    // Validate numeric fields
    const parsedBhk = parseInt(bhk);
    const parsedSizeSqft = parseInt(size_sqft);
    
    if (isNaN(parsedBhk) || parsedBhk < 1 || parsedBhk > 10) {
      return res.status(400).json({ error: 'bhk must be a number between 1 and 10' });
    }

    if (isNaN(parsedSizeSqft) || parsedSizeSqft < 100 || parsedSizeSqft > 10000) {
      return res.status(400).json({ error: 'size_sqft must be a number between 100 and 10000' });
    }

    // Validate optional fields
    let parsedQuotedPrice: number | undefined;
    if (quoted_price !== undefined && quoted_price !== null && quoted_price !== '') {
      parsedQuotedPrice = parseFloat(quoted_price);
      if (isNaN(parsedQuotedPrice) || parsedQuotedPrice < 0) {
        return res.status(400).json({ error: 'quoted_price must be a positive number' });
      }
    }

    let parsedFloor: number | undefined;
    if (floor !== undefined && floor !== null && floor !== '') {
      parsedFloor = parseInt(floor);
      if (isNaN(parsedFloor) || parsedFloor < 0) {
        return res.status(400).json({ error: 'floor must be a non-negative number' });
      }
    }

    // Validate property_status enum if provided
    if (property_status !== undefined && property_status !== null && property_status !== '') {
      if (property_status !== 'ready' && property_status !== 'under_construction') {
        return res.status(400).json({ error: 'property_status must be either "ready" or "under_construction"' });
      }
    }

    const input: ValueEstimateInput = {
      sector: sector.toString().trim(),
      bhk: parsedBhk,
      size_sqft: parsedSizeSqft,
      quoted_price: parsedQuotedPrice,
      property_type,
      property_status: property_status || undefined,
      builder: builder && builder.trim() ? builder.trim() : undefined,
      project_name: project_name && typeof project_name === 'string' && project_name.trim() ? project_name.trim() : undefined,
      floor: parsedFloor,
    };

    const result = await estimatePropertyValue(input, prisma);
    res.json(result);
  } catch (error: any) {
    console.error('Value check error:', error);
    const statusCode = error.message?.includes('Invalid sector') || error.message?.includes('Insufficient data') ? 400 : 500;
    res.status(statusCode).json({ error: error.message || 'Failed to estimate property value' });
  }
}
