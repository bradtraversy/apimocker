import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { assertTestDatabaseIsIsolated } from './utils/testDatabaseSafety';
import { databaseSchemaFromUrl } from '../src/utils/databaseUrl';

const existingDatabaseUrl = process.env['DATABASE_URL'];
config({ path: '.env.test' });
const testDatabaseUrl = process.env['TEST_DATABASE_URL'];
const databaseUrlBeforeOverwrite = existingDatabaseUrl || process.env['DATABASE_URL'];

if (!testDatabaseUrl) {
  throw new Error(
    'TEST_DATABASE_URL must be defined before running database tests'
  );
}

assertTestDatabaseIsIsolated(testDatabaseUrl, databaseUrlBeforeOverwrite);
process.env['NODE_ENV'] = 'test';
process.env['DATABASE_URL'] = testDatabaseUrl;

const testDatabaseSchema = databaseSchemaFromUrl(testDatabaseUrl);

const createTestPrisma = () =>
  new PrismaClient({
    adapter: new PrismaPg(
      {
        connectionString: testDatabaseUrl,
        connectionTimeoutMillis: 5_000,
      },
      testDatabaseSchema ? { schema: testDatabaseSchema } : undefined
    ),
  });

// Global test setup
const cleanup = async (prisma: PrismaClient) => {
  try {
    await prisma.$connect();
    await prisma.like.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.todo.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();
  } finally {
    await prisma.$disconnect();
  }
};

beforeAll(async () => {
  const prisma = createTestPrisma();
  await cleanup(prisma);
});

afterAll(async () => {
  const prisma = createTestPrisma();
  try {
    await cleanup(prisma);
  } finally {
    const { prisma: appPrisma } = await import('../src/lib/prisma');
    if (typeof appPrisma.$disconnect === 'function') {
      await appPrisma.$disconnect();
    }
  }
});

// Increase timeout for database operations
jest.setTimeout(30000);
