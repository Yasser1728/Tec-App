import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Pi SDK domains: sdk.minepi.com (script), app-cdn.minepi.com (assets),
  // sandbox.minepi.com / *.pinet.com (postMessage host), api.minepi.com /
  // api.sandbox.minepi.com (API), socialapis.pi, *.piappengine.com (app studio).
  const piDomains =
    'https://sdk.minepi.com https://app-cdn.minepi.com https://sandbox.minepi.com https://*.minepi.com https://*.pinet.com https://*.piappengine.com https://socialapis.pi';

  const csp = [
    "default-src 'self'",
    // 'unsafe-inline' + 'unsafe-eval' required: Next.js App Router injects inline
    // hydration scripts, and the Pi SDK uses eval-like patterns internally.
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${piDomains}`,
    `connect-src 'self' ${piDomains} https://*.up.railway.app`,
    "img-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    `frame-src 'self' ${piDomains}`,
    `frame-ancestors 'self' ${piDomains}`,
    "object-src 'none'",
    "base-uri 'self'",
  ].join('; ');

  const response = NextResponse.next();

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
