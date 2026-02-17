import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { createLogger } from '../utils/logger';

const logger = createLogger('error-handler');

/**
 * Global error handling middleware
 * Catches all errors and returns structured JSON responses
 */
export function errorHandler(
  err: Error | AppError,
  _req: Request,
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

  // Log error using shared logger
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (!isProduction) {
    logger.error(message, {
      code,
      statusCode,
      details,
    }, err);
  } else {
    logger.error(message, { code, statusCode });
  }

  // Prepare response
  interface ErrorResponse {
    success: boolean;
    error: {
      code: string;
      message: string;
      details?: unknown;
      stack?: string;
    };
  }

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
