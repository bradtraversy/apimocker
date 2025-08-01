import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { requestLogger } from './middleware/requestLogger';
import { setupCronJobs } from './utils/cronJobs';
import { prisma } from './lib/prisma';

// Import routes
import userRoutes from './routes/users';
import postRoutes from './routes/posts';
import todoRoutes from './routes/todos';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env['PORT'] || 5000;

// Middleware
app.use(helmet());
app.use(cors());
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

// Web interface at root
app.get('/', (_req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ApiMocker - Fake REST API Service</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        .header {
            text-align: center;
            color: white;
            margin-bottom: 3rem;
        }
        .header h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .header p {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        .content {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .section {
            margin-bottom: 2rem;
            padding-bottom: 2rem;
            border-bottom: 1px solid #eee;
        }
        .section:last-child {
            border-bottom: none;
            margin-bottom: 0;
        }
        .section h2 {
            color: #667eea;
            margin-bottom: 1rem;
            font-size: 1.5rem;
        }
        .endpoint {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1rem;
            font-family: 'Monaco', 'Menlo', monospace;
        }
        .method {
            display: inline-block;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-weight: bold;
            font-size: 0.8rem;
            margin-right: 0.5rem;
        }
        .get { background: #d4edda; color: #155724; }
        .post { background: #d1ecf1; color: #0c5460; }
        .put { background: #fff3cd; color: #856404; }
        .delete { background: #f8d7da; color: #721c24; }
        .url {
            color: #667eea;
            font-weight: bold;
        }
        .description {
            color: #666;
            margin-top: 0.5rem;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        .stat {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 1.5rem;
            border-radius: 8px;
            text-align: center;
        }
        .stat h3 {
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }
        .stat p {
            opacity: 0.9;
        }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        .feature {
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        .feature h4 {
            color: #667eea;
            margin-bottom: 0.5rem;
        }
        .btn {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 0.75rem 1.5rem;
            text-decoration: none;
            border-radius: 6px;
            margin: 0.5rem;
            transition: background 0.3s;
        }
        .btn:hover {
            background: #5a6fd8;
        }
        .footer {
            text-align: center;
            margin-top: 2rem;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 ApiMocker</h1>
            <p>A comprehensive fake REST API service for developers</p>
        </div>
        
        <div class="content">
            <div class="stats">
                <div class="stat">
                    <h3>10</h3>
                    <p>Users</p>
                </div>
                <div class="stat">
                    <h3>100</h3>
                    <p>Posts</p>
                </div>
                <div class="stat">
                    <h3>200</h3>
                    <p>Todos</p>
                </div>
                <div class="stat">
                    <h3>24h</h3>
                    <p>Daily Reset</p>
                </div>
            </div>

            <div class="section">
                <h2>✨ Features</h2>
                <div class="features">
                    <div class="feature">
                        <h4>🔒 Rate Limiting</h4>
                        <p>100 writes/day per IP, 1000 reads/15min per IP</p>
                    </div>
                    <div class="feature">
                        <h4>✅ Validation</h4>
                        <p>Comprehensive input validation for all endpoints</p>
                    </div>
                    <div class="feature">
                        <h4>📄 Pagination</h4>
                        <p>Built-in pagination with customizable limits</p>
                    </div>
                    <div class="feature">
                        <h4>🔍 Filtering</h4>
                        <p>Query-based filtering for all resources</p>
                    </div>
                    <div class="feature">
                        <h4>📝 Logging</h4>
                        <p>Detailed request/response logging with Winston</p>
                    </div>
                    <div class="feature">
                        <h4>🔄 Auto Reset</h4>
                        <p>Daily database reset at midnight UTC</p>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>🔗 API Endpoints</h2>
                <p>All endpoints are available under <code>/api</code> prefix:</p>
                
                <div class="endpoint">
                    <span class="method get">GET</span>
                    <span class="url">/api/users</span>
                    <div class="description">Get all users with pagination</div>
                </div>
                
                <div class="endpoint">
                    <span class="method get">GET</span>
                    <span class="url">/api/users/:id</span>
                    <div class="description">Get user by ID</div>
                </div>
                
                <div class="endpoint">
                    <span class="method post">POST</span>
                    <span class="url">/api/users</span>
                    <div class="description">Create a new user</div>
                </div>
                
                <div class="endpoint">
                    <span class="method get">GET</span>
                    <span class="url">/api/posts</span>
                    <div class="description">Get all posts with filtering</div>
                </div>
                
                <div class="endpoint">
                    <span class="method get">GET</span>
                    <span class="url">/api/todos</span>
                    <div class="description">Get all todos with completion filtering</div>
                </div>
                
                <div class="endpoint">
                    <span class="method get">GET</span>
                    <span class="url">/api/users/:id/posts</span>
                    <div class="description">Get posts by user ID</div>
                </div>
                
                <div class="endpoint">
                    <span class="method get">GET</span>
                    <span class="url">/api/users/:id/todos</span>
                    <div class="description">Get todos by user ID</div>
                </div>
            </div>

            <div class="section">
                <h2>🧪 Quick Test</h2>
                <p>Try these endpoints to test the API:</p>
                <a href="/api/users" class="btn">Get Users</a>
                <a href="/api/posts" class="btn">Get Posts</a>
                <a href="/api/todos" class="btn">Get Todos</a>
                <a href="/health" class="btn">Health Check</a>
            </div>

            <div class="section">
                <h2>📚 Documentation</h2>
                <p>For complete API documentation, including:</p>
                <ul style="margin-left: 2rem; margin-top: 1rem;">
                    <li>Detailed endpoint documentation</li>
                    <li>Request/response examples</li>
                    <li>Rate limiting information</li>
                    <li>Validation rules</li>
                    <li>Error handling</li>
                </ul>
                <p style="margin-top: 1rem;">Please refer to the <a href="https://github.com/your-repo/apimocker" style="color: #667eea;">GitHub repository</a> for full documentation.</p>
            </div>
        </div>

        <div class="footer">
            <p>ApiMocker - Your reliable fake API for development and testing! 🎯</p>
        </div>
    </div>
</body>
</html>
  `);
});

// API routes
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/todos', todoRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
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
      logger.info(`🌐 Web interface: http://localhost:${port}/`);
      logger.info(`🔗 API base: http://localhost:${port}/api`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
