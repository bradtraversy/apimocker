import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Store for tracking write operations per IP
const writeCounts = new Map<string, { count: number; resetTime: number }>();

// Rate limiter for write operations (POST, PUT, DELETE)
export const writeRateLimiter = (req: Request, res: Response, next: Function) => {
  // Get IP address, handling proxy scenarios
  const ip = req.ip || 
             req.headers['x-forwarded-for']?.toString().split(',')[0] || 
             req.connection.remoteAddress || 
             'unknown';
  const now = Date.now();
  const windowMs = parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '86400000'); // 24 hours
  const maxWrites = parseInt(process.env['RATE_LIMIT_MAX_WRITES'] || '100');

  // Get current count for this IP
  const current = writeCounts.get(ip);
  
  if (!current || now > current.resetTime) {
    // First request or window expired
    writeCounts.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }

  if (current.count >= maxWrites) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: `Write limit exceeded. Maximum ${maxWrites} write operations per day per IP.`,
      resetTime: new Date(current.resetTime).toISOString(),
    });
  }

  // Increment count
  current.count++;
  writeCounts.set(ip, current);
  next();
};

// General rate limiter for all requests (less restrictive)
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Combined rate limiter middleware
export const rateLimiter = (req: Request, res: Response, next: Function) => {
  // Apply general rate limiting first
  generalRateLimiter(req, res, (err: any) => {
    if (err) return next(err);
    
    // Apply write rate limiting for write operations
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      return writeRateLimiter(req, res, next);
    }
    
    next();
  });
}; 