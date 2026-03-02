/** @type {import('next').NextConfig} */
const nextConfig = {
  // CSP and other security headers are now set dynamically per-request in middleware.ts
  // so that a unique nonce can be injected, removing the need for `unsafe-inline` in script-src.
};

module.exports = nextConfig;
