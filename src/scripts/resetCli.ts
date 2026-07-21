import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { resetDatabase } from './reset';

const run = async () => {
  try {
    await resetDatabase();
    logger.info('Reset completed');
  } catch (error) {
    logger.error('Reset failed:', error);
    process.exitCode = 1;
  } finally {
    try {
      await prisma.$disconnect();
    } catch (error) {
      logger.error('Failed to disconnect after reset:', error);
      process.exitCode = 1;
    }
  }
};

void run();
