import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';
import { seedDatabase } from './seed';

export const resetDatabase = async () => {
  try {
    logger.info('Starting database reset...');

    // Clear all data — children before parents.
    await prisma.like.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.todo.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();

    logger.info('All data cleared successfully');

    // Reset auto-increment sequences to start from 1
    await prisma.$executeRaw`ALTER SEQUENCE users_id_seq RESTART WITH 1`;
    await prisma.$executeRaw`ALTER SEQUENCE posts_id_seq RESTART WITH 1`;
    await prisma.$executeRaw`ALTER SEQUENCE todos_id_seq RESTART WITH 1`;
    await prisma.$executeRaw`ALTER SEQUENCE comments_id_seq RESTART WITH 1`;
    await prisma.$executeRaw`ALTER SEQUENCE likes_id_seq RESTART WITH 1`;

    logger.info('Auto-increment sequences reset to start from 1');

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