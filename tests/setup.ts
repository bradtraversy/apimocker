import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables
config({ path: '.env.test' });

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env['NODE_ENV'] = 'test';

  // Initialize test database connection
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url:
          process.env['DATABASE_URL'] ||
          'postgresql://test:test@localhost:5432/apimocker_test',
      },
    },
  });

  // Clean up database before all tests
  await prisma.$connect();
  await prisma.user.deleteMany();
  await prisma.post.deleteMany();
  await prisma.todo.deleteMany();
  await prisma.$disconnect();
});

// Global test teardown
afterAll(async () => {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url:
          process.env['DATABASE_URL'] ||
          'postgresql://test:test@localhost:5432/apimocker_test',
      },
    },
  });

  // Clean up database after all tests
  await prisma.$connect();
  await prisma.user.deleteMany();
  await prisma.post.deleteMany();
  await prisma.todo.deleteMany();
  await prisma.$disconnect();
});

// Increase timeout for database operations
jest.setTimeout(30000);
