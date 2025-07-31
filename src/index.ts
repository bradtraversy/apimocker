import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { requestLogger } from './middleware/requestLogger';
import { setupCronJobs } from './utils/cronJobs';

// Import routes
import userRoutes from './routes/users';
import postRoutes from './routes/posts';
import todoRoutes from './routes/todos';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize Prisma client
export const prisma = new PrismaClient();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Custom middleware
app.use(requestLogger);
app.use(rateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/users', userRoutes);
app.use('/posts', postRoutes);
app.use('/todos', todoRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Setup cron jobs
    setupCronJobs();

    app.listen(port, () => {
      logger.info(`🚀 ApiMocker server running on port ${port}`);
      logger.info(`📊 Health check: http://localhost:${port}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 