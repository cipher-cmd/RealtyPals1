import { Request, Response } from 'express';
import { compareProperties, CompareInput } from '../logic/compareEngine';
import prisma from '../lib/prisma';

/**
 * POST /api/v1/compare
 * Body: { property_id_1, property_id_2 }
 */
export async function compare(req: Request, res: Response) {
  try {
    const { property_id_1, property_id_2 } = req.body;

    if (!property_id_1 || !property_id_2) {
      return res.status(400).json({ error: 'Missing required fields: property_id_1, property_id_2' });
    }

    const input: CompareInput = {
      property_id_1,
      property_id_2,
    };

    const result = await compareProperties(input, prisma);
    res.json(result);
  } catch (error: any) {
    const errorMessage = error.message;
    if (errorMessage === 'Cannot compare property with itself') {
      return res.status(400).json({ error: errorMessage });
    }
    if (errorMessage === 'Property not found') {
      return res.status(404).json({ error: errorMessage });
    }
    res.status(500).json({ error: errorMessage });
  }
}
