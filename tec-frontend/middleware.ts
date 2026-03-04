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
    // nonce covers Next.js inline hydration scripts; unsafe-eval is NOT included.
    // https://sdk.minepi.com is the only external script host required by the Pi SDK.
    `script-src 'self' 'nonce-${nonce}' https://sdk.minepi.com`,
    "connect-src 'self' https://sdk.minepi.com https://api.minepi.com https://api.sandbox.minepi.com https://*.minepi.com https://socialapis.pi https://*.up.railway.app",
    "img-src 'self' data: https:",
    // unsafe-inline is required for style-src because Next.js App Router injects
    // inline <style> tags during SSR hydration. This cannot be removed without
    // a custom nonce setup for styles, which is not yet supported by Next.js.
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "frame-src 'self' https://sdk.minepi.com https://*.minepi.com",
    "frame-ancestors 'self' https://*.minepi.com https://*.pinet.com https://sdk.minepi.com",
    // Prevent plugin content (Flash, etc.) and disallow base tag injection
    "object-src 'none'",
    "base-uri 'self'",
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
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
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
