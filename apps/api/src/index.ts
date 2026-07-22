import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { requestLogger } from './middleware/requestLogger';
import {
  environmentAttemptRateLimiter,
  environmentPayloadError,
} from './middleware/environmentAccess';
import { setupCronJobs } from './utils/cronJobs';
import { resolveResetSchedulerMode } from './utils/resetScheduler';
import { prisma } from './lib/prisma';

// Import routes
import userRoutes from './routes/users';
import postRoutes from './routes/posts';
import todoRoutes from './routes/todos';
import commentRoutes from './routes/comments';
import errorRoutes from './routes/errors';
import environmentRoutes from './routes/environments';


// Load environment variables
dotenv.config();

const app: express.Express = express();
const port = process.env['PORT'] || 8000;

// Trust proxy for rate limiting behind load balancers/proxies
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(cors());

if (process.env['ENABLE_ISOLATED_ENVIRONMENTS'] === 'true') {
  app.use(
    '/v1/environments/:slug',
    environmentAttemptRateLimiter,
    express.json({ limit: '64kb' }),
    express.urlencoded({ extended: true, limit: '64kb' }),
    requestLogger,
    environmentRoutes,
    (req: express.Request, res: express.Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.originalUrl} not found`,
      });
    },
    environmentPayloadError
  );
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Custom middleware
app.use(requestLogger);
app.use(rateLimiter);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/', (_req, res) => {
  res.json({
    name: 'ApiMocker API',
    status: 'running',
    health: '/health',
  });
});

// API routes
app.use('/users', userRoutes);
app.use('/posts', postRoutes);
app.use('/todos', todoRoutes);
app.use('/comments', commentRoutes);
app.use('/error', errorRoutes);


// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected successfully');

    const resetSchedulerMode = resolveResetSchedulerMode();

    if (resetSchedulerMode === 'in_process') {
      setupCronJobs();
    } else {
      logger.info(
        `In-process reset scheduler disabled (RESET_SCHEDULER=${resetSchedulerMode})`
      );
    }

    app.listen(port, () => {
      logger.info(`🚀 ApiMocker server running on port ${port}`);
      logger.info(`📊 Health check: http://localhost:${port}/health`);
      logger.info(`🌐 API status: http://localhost:${port}/`);
      logger.info(`🔗 API base: http://localhost:${port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Only start the server (and attach process signal handlers) when this file
// is executed directly. Tests import the app without these side effects.
if (require.main === module) {
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

  startServer();
}

export default app;
