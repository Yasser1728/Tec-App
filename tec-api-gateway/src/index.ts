import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { setupProxyRoutes } from './routes/proxy';
import { rateLimiter } from './middleware/rateLimiter';
import { requestLogger } from './middleware/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Request logging
app.use(requestLogger);

// Rate limiting
app.use(rateLimiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'healthy', 
    service: 'api-gateway',
    timestamp: new Date().toISOString() 
  });
});

// Setup proxy routes
setupProxyRoutes(app);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    success: false, 
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found'
    }
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📡 Proxying to:`);
  console.log(`   - Auth Service: ${process.env.AUTH_SERVICE_URL}`);
  console.log(`   - Wallet Service: ${process.env.WALLET_SERVICE_URL}`);
  console.log(`   - Payment Service: ${process.env.PAYMENT_SERVICE_URL}`);
});
