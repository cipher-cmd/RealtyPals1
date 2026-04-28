/**
 * Prisma Client Singleton
 * 
 * Best practice: Create a single PrismaClient instance and reuse it across the application.
 * This prevents connection pool exhaustion and ensures proper connection management.
 */

import { PrismaClient } from '@prisma/client';

// Prevent multiple instances in development (hot reload protection)
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error'], // Disabled 'query' logging to keep terminal clean
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
