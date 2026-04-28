import { Request, Response } from 'express';
import prisma from '../lib/prisma';

/**
 * POST /api/v1/saved-properties
 * Header: X-User-Id (MANDATORY)
 * Body: { property_id }
 */
export async function saveProperty(req: Request, res: Response) {
  try {
    const user_id = req.headers['x-user-id'] as string;
    const { property_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'X-User-Id header is required' });
    }

    if (!property_id) {
      return res.status(400).json({ error: 'property_id is required' });
    }

    // Verify property exists
    const property = await prisma.property.findUnique({ where: { id: property_id } });
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const savedProperty = await prisma.savedProperty.upsert({
      where: {
        user_id_property_id: {
          user_id,
          property_id,
        },
      },
      update: {},
      create: {
        user_id,
        property_id,
      },
    });

    res.json({ savedProperty });
  } catch (error: any) {
    console.error('[savedProperty] saveProperty error:', error.message);
    res.status(500).json({ error: true, message: 'Failed to save property. Please try again.' });
  }
}

/**
 * GET /api/v1/saved-properties
 * Header: X-User-Id (MANDATORY)
 */
export async function getSavedProperties(req: Request, res: Response) {
  try {
    const user_id = req.headers['x-user-id'] as string;

    if (!user_id) {
      return res.status(400).json({ error: 'X-User-Id header is required' });
    }

    const savedProperties = await prisma.savedProperty.findMany({
      where: { user_id },
      include: {
        property: {
          include: { sector: true },
        },
      },
      orderBy: { saved_at: 'desc' },
    });

    res.json({ savedProperties });
  } catch (error: any) {
    console.error('[savedProperty] getSavedProperties error:', error.message);
    res.status(500).json({ error: true, message: 'Failed to fetch saved properties.' });
  }
}

/**
 * DELETE /api/v1/saved-properties/:propertyId
 * Header: X-User-Id (MANDATORY)
 */
export async function removeSavedProperty(req: Request, res: Response) {
  try {
    const user_id = req.headers['x-user-id'] as string;
    const property_id = req.params.propertyId;

    if (!user_id) {
      return res.status(400).json({ error: 'X-User-Id header is required' });
    }
    if (!property_id) {
      return res.status(400).json({ error: 'propertyId is required' });
    }

    await prisma.savedProperty.delete({
      where: {
        user_id_property_id: {
          user_id,
          property_id,
        },
      },
    });

    res.json({ removed: true });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: true, message: 'Saved property not found.' });
    }
    console.error('[savedProperty] removeSavedProperty error:', error.message);
    res.status(500).json({ error: true, message: 'Failed to remove saved property.' });
  }
}
