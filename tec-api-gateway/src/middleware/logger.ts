import morgan from 'morgan';
import { Request, Response } from 'express';

// Custom token for request ID
morgan.token('id', (req: Request) => {
  return req.headers['x-request-id'] as string || 'unknown';
});

// Custom format with timestamp
const logFormat = ':method :url :status :response-time ms - :res[content-length] - [:id]';

export const requestLogger = morgan(logFormat, {
  stream: {
    write: (message: string) => {
      console.log(`[${new Date().toISOString()}] ${message.trim()}`);
    },
  },
});
