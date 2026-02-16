import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Request logging middleware
 * Logs all incoming requests with timing and context
 */
export function requestLogger(serviceName: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    
    // Generate request ID if not present
    const requestId = (req.headers['x-request-id'] as string) || uuidv4();
    
    // Attach request ID to request object for use in other middleware
    (req as Request & { requestId: string }).requestId = requestId;
    
    // Set request ID in response header
    res.setHeader('X-Request-ID', requestId);

    // Log when response finishes
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: 'info',
        service: serviceName,
        message: 'HTTP Request',
        requestId,
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode: res.statusCode,
        responseTime: duration,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.socket.remoteAddress,
      };

      console.log(JSON.stringify(logEntry));
    });

    next();
  };
}
