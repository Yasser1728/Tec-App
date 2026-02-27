/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // unoptimized is required for GitHub Pages / static-export hosting.
    // Remove this if deploying to a platform that supports Next.js image optimisation (e.g. Vercel).
    unoptimized: true,
  },
  // CSP and other security headers are now set dynamically per-request in middleware.ts
  // so that a unique nonce can be injected, removing the need for `unsafe-inline` in script-src.
};

module.exports = nextConfig;
