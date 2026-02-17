import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

/**
 * Global error handling middleware
 * Catches all errors and returns structured JSON responses
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
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

  // Log error (in production, you might use a structured logger)
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (!isProduction) {
    console.error('Error details:', {
      code,
      message,
      stack: err.stack,
      details,
    });
  }

  // Prepare response
  const errorResponse: any = {
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
