import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const message = 'Database operation failed';
    error = { message, statusCode: 400 } as ApiError;
  }

  // Prisma validation errors
  if (err.name === 'PrismaClientValidationError') {
    const message = 'Validation failed';
    error = { message, statusCode: 400 } as ApiError;
  }

  // Prisma not found errors
  if (err.name === 'PrismaClientKnownRequestError' && (err as any).code === 'P2025') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 } as ApiError;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    const message = 'Validation failed';
    error = { message, statusCode: 400 } as ApiError;
  }

  // Cast errors (invalid ObjectId)
  if (err.name === 'CastError') {
    const message = 'Invalid resource ID';
    error = { message, statusCode: 400 } as ApiError;
  }

  // Duplicate key errors
  if (err.name === 'PrismaClientKnownRequestError' && (err as any).code === 'P2002') {
    const message = 'Resource already exists';
    error = { message, statusCode: 409 } as ApiError;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    ...(process.env['NODE_ENV'] === 'development' && { stack: err.stack }),
  });
}; 