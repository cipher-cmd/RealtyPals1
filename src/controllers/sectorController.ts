import { Request, Response } from 'express';
import prisma from '../lib/prisma';

/**
 * GET /api/v1/sectors
 * Returns list of supported sectors from DB
 */
export async function getSectors(req: Request, res: Response) {
  try {
    const sectors = await prisma.sector.findMany({
      orderBy: [{ city: 'asc' }, { name: 'asc' }],
    });
    res.json({ sectors });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch sectors' });
  }
}
