import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { seedDatabase } from './seed';

const run = async () => {
  try {
    await seedDatabase();
    logger.info('Seeding completed');
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exitCode = 1;
  } finally {
    try {
      await prisma.$disconnect();
    } catch (error) {
      logger.error('Failed to disconnect after seeding:', error);
      process.exitCode = 1;
    }
  }
};

void run();
