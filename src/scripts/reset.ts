import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { seedDatabase } from './seed';

const prisma = new PrismaClient();

export const resetDatabase = async () => {
  try {
    logger.info('Starting database reset...');

    // Clear all data
    await prisma.todo.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();

    logger.info('All data cleared successfully');

    // Reseed with fresh data
    await seedDatabase();

    logger.info('Database reset completed successfully!');

  } catch (error) {
    logger.error('Error resetting database:', error);
    throw error;
  }
};

// Run reset if this file is executed directly
if (require.main === module) {
  resetDatabase()
    .then(() => {
      logger.info('Reset completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Reset failed:', error);
      process.exit(1);
    });
} 