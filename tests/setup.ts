import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

// Load environment variables
config({ path: '.env.test' });

const testDatabaseUrl = () =>
  process.env['DATABASE_URL'] ||
  'postgresql://test:test@localhost:5432/apimocker_test';

const createTestPrisma = () =>
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString: testDatabaseUrl(),
      connectionTimeoutMillis: 5_000,
    }),
  });

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env['NODE_ENV'] = 'test';

  // Initialize test database connection
  const prisma = createTestPrisma();

  // Clean up database before all tests (children before parents).
  await prisma.$connect();
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.todo.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

// Global test teardown
afterAll(async () => {
  const prisma = createTestPrisma();

  // Clean up database after all tests (children before parents).
  await prisma.$connect();
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.todo.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

// Increase timeout for database operations
jest.setTimeout(30000);
