import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Generates a per-request nonce for Content-Security-Policy.
 * This allows removing `unsafe-inline` from script-src while still
 * permitting specific trusted inline scripts tagged with the nonce.
 */
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  const csp = [
    "default-src 'self'",
    // nonce covers Next.js inline hydration scripts; unsafe-eval is NOT included
    `script-src 'self' 'nonce-${nonce}' sdk.minepi.com *.minepi.com`,
    "connect-src 'self' sdk.minepi.com api.minepi.com *.minepi.com socialapis.pi",
    "img-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "frame-src 'self' sdk.minepi.com *.minepi.com",
    "frame-ancestors 'self' https://*.minepi.com https://*.pinet.com https://sdk.minepi.com",
  ].join('; ');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Set security headers on the response
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );
  response.headers.set('Cross-Origin-Opener-Policy', 'unsafe-none');
  response.headers.set('Cross-Origin-Embedder-Policy', 'unsafe-none');
  response.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
