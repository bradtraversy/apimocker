import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { databaseSchemaFromUrl } from '../utils/databaseUrl';

const databaseUrl = process.env['DATABASE_URL'];

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to initialize Prisma');
}

const databaseSchema = databaseSchemaFromUrl(databaseUrl);

const adapter = new PrismaPg(
  {
    connectionString: databaseUrl,
    connectionTimeoutMillis: 5_000,
  },
  databaseSchema ? { schema: databaseSchema } : undefined
);

export const prisma = new PrismaClient({ adapter });
