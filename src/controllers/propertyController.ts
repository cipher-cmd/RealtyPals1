import { Request, Response } from 'express';
import { discoverProperties, DiscoveryInput } from '../logic/discoveryEngine';
import prisma from '../lib/prisma';

/**
 * GET /api/v1/properties
 * Query params: sector, bhk, min_price, max_price, property_type
 */
export async function getProperties(req: Request, res: Response) {
  try {
    const input: DiscoveryInput = {
      sector: req.query.sector as string,
      bhk: req.query.bhk ? parseInt(req.query.bhk as string) : undefined,
      min_price: req.query.min_price ? parseInt(req.query.min_price as string) : undefined,
      max_price: req.query.max_price ? parseInt(req.query.max_price as string) : undefined,
      property_type: req.query.property_type as 'flat' | 'plot' | undefined,
    };

    if (!input.sector) {
      return res.status(400).json({ error: 'sector is required' });
    }

    const properties = await discoverProperties(input, prisma);
    res.json({ properties });
  } catch (error: any) {
    console.error('[propertyController] getProperties error:', error.message);
    res.status(400).json({ error: true, message: 'Failed to fetch properties. Check your query parameters.' });
  }
}

/**
 * GET /api/v1/properties/:id
 */
export async function getPropertyById(req: Request, res: Response) {
  try {
    const property = await prisma.property.findUnique({
      where: { id: req.params.id },
      include: {
        sector: true,
        images: { orderBy: { sort_order: 'asc' } },
      },
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    res.json({ property });
  } catch (error: any) {
    console.error('[propertyController] getPropertyById error:', error.message);
    res.status(500).json({ error: true, message: 'Failed to fetch property details.' });
  }
}
