import { PrismaClient } from '@prisma/client';
import config from '../config/env.js';

/**
 * Singleton Prisma client.
 * In dev, we attach it to globalThis to survive hot reloads.
 */
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__prisma ??
  new PrismaClient({
    log:
      config.NODE_ENV === 'development'
        ? ['warn', 'error']
        : ['error'],
    datasources: { db: { url: config.DATABASE_URL } },
  });

if (config.NODE_ENV !== 'production') {
  globalForPrisma.__prisma = prisma;
}

/** Graceful shutdown helper — call on SIGINT/SIGTERM. */
export async function disconnectPrisma() {
  await prisma.$disconnect();
}

export default prisma;
