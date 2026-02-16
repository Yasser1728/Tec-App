import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { createLogger } from '../utils/logger';

const logger = createLogger('error-handler');

interface ErrorResponse {
  success: boolean;
  error: {
    code: string;
    message: string;
    details?: unknown;
    stack?: string;
  };
}

/**
 * Global error handling middleware
 * Catches all errors and returns structured JSON responses
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Default error values
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Internal server error';
  let details = undefined;

  // If it's an AppError, use its properties
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  }

  // Log error using structured logger
  const isProduction = process.env.NODE_ENV === 'production';
  
  logger.error(message, {
    code,
    requestId: (req as Request & { requestId?: string }).requestId,
    url: req.originalUrl || req.url,
    method: req.method,
    details,
  }, err);

  // Prepare response
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
    },
  };

  // Only include details if they exist
  if (details) {
    errorResponse.error.details = details;
  }

  // Never expose stack traces in production
  if (!isProduction && err.stack) {
    errorResponse.error.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
}
