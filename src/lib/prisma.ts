import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Run a query, falling back to a default if the database is unreachable.
 *
 * Public pages are built from the static config in src/config, with the
 * database layered on top for anything added through the admin. This wrapper
 * means a database outage (or a build running before `prisma db push`) degrades
 * to the static content instead of returning a 500.
 */
export async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[db] query failed, using fallback:', (error as Error).message);
    }
    return fallback;
  }
}
