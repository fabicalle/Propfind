import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.DEBUG_QUERIES === 'true') {
  const queryLogs: Array<{ query: string; params: unknown }> = [];
  const queryEventHandler = (e: { query: string; params: unknown }) => {
    queryLogs.push({ query: e.query, params: e.params });
    if (queryLogs.length > 200) queryLogs.shift();
  };
  (prisma as unknown as { $on: (event: string, handler: (e: { query: string; params: unknown }) => void) => void }).$on('query', queryEventHandler);
}


if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
