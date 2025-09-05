import cron from 'node-cron';
import { logger } from './logger';
import { prisma } from '../lib/prisma';
import { seedDatabase } from '../scripts/seed';

export const setupCronJobs = () => {
  // Daily reset at midnight UTC (00:00)
  cron.schedule(
    '0 0 * * *',
    async () => {
      logger.info('Starting daily database reset...');

      try {
        // Clear all data
        await prisma.comment.deleteMany();
        await prisma.todo.deleteMany();
        await prisma.post.deleteMany();
        await prisma.user.deleteMany();

        logger.info('Database cleared successfully');

        // Reset auto-increment sequences to start from 1
        await prisma.$executeRaw`ALTER SEQUENCE users_id_seq RESTART WITH 1`;
        await prisma.$executeRaw`ALTER SEQUENCE posts_id_seq RESTART WITH 1`;
        await prisma.$executeRaw`ALTER SEQUENCE todos_id_seq RESTART WITH 1`;
        await prisma.$executeRaw`ALTER SEQUENCE comments_id_seq RESTART WITH 1`;

        logger.info('Sequences reset successfully');

        // Reseed with fresh data
        await seedDatabase();

        logger.info('Daily database reset completed successfully');
      } catch (error) {
        logger.error('Failed to perform daily database reset:', error);
      }
    },
    {
      timezone: 'UTC',
    }
  );

  logger.info('Cron jobs scheduled: Daily reset at 00:00 UTC');
};
