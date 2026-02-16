import { Express } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

export function setupProxyRoutes(app: Express): void {
  const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';
  const WALLET_SERVICE_URL = process.env.WALLET_SERVICE_URL || 'http://localhost:5002';
  const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:5003';

  // Auth Service Proxy
  app.use(
    '/api/auth',
    createProxyMiddleware({
      target: AUTH_SERVICE_URL,
      changeOrigin: true,
      pathRewrite: {
        '^/api/auth': '/auth',
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`[Proxy] ${req.method} ${req.url} -> ${AUTH_SERVICE_URL}`);
      },
      onError: (err, req, res) => {
        console.error('[Proxy Error]', err);
        res.status(502).json({
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Auth service is unavailable',
          },
        });
      },
    })
  );

  // Wallet Service Proxy
  app.use(
    '/api/wallet',
    createProxyMiddleware({
      target: WALLET_SERVICE_URL,
      changeOrigin: true,
      pathRewrite: {
        '^/api/wallet': '/wallet',
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`[Proxy] ${req.method} ${req.url} -> ${WALLET_SERVICE_URL}`);
      },
      onError: (err, req, res) => {
        console.error('[Proxy Error]', err);
        res.status(502).json({
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Wallet service is unavailable',
          },
        });
      },
    })
  );

  // Payment Service Proxy
  app.use(
    '/api/payment',
    createProxyMiddleware({
      target: PAYMENT_SERVICE_URL,
      changeOrigin: true,
      pathRewrite: {
        '^/api/payment': '/payment',
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`[Proxy] ${req.method} ${req.url} -> ${PAYMENT_SERVICE_URL}`);
      },
      onError: (err, req, res) => {
        console.error('[Proxy Error]', err);
        res.status(502).json({
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Payment service is unavailable',
          },
        });
      },
    })
  );
}
