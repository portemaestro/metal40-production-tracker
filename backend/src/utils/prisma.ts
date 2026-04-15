import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    datasources: {
      db: {
        url: appendPoolParams(process.env.DATABASE_URL || ''),
      },
    },
  });

// Aggiunge parametri di connection pool se non presenti
function appendPoolParams(url: string): string {
  if (!url) return url;
  const separator = url.includes('?') ? '&' : '?';
  // connection_limit: max connessioni per Prisma (default 5, aumentato a 15)
  // pool_timeout: secondi di attesa per una connessione libera
  if (!url.includes('connection_limit')) {
    return `${url}${separator}connection_limit=15&pool_timeout=10`;
  }
  return url;
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
