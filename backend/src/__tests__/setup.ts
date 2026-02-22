import { vi } from 'vitest';

// ── Variabili d'ambiente per test ──
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.PORT = '0';

// ── Mock Prisma Client ──
// Tutte le operazioni Prisma sono mockate per non richiedere un DB reale

const mockPrismaClient = {
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  ordine: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    groupBy: vi.fn(),
  },
  materiale: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  faseProduzione: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  problema: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    groupBy: vi.fn(),
  },
  nota: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
  },
  logAttivita: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  $connect: vi.fn(),
  $disconnect: vi.fn(),
  $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) => fn(mockPrismaClient)),
};

vi.mock('../utils/prisma', () => ({
  default: mockPrismaClient,
}));

// ── Mock logger per silenziare output nei test ──
vi.mock('../utils/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

export { mockPrismaClient };
