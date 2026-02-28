'use client';

import { useEffect } from 'react';

interface PiSdkLoaderProps {
  sandbox: boolean;
  timeout: number;
}

/**
 * Client component that initialises the Pi SDK once it loads.
 * Replaces the dangerouslySetInnerHTML inline script in layout.tsx,
 * removing the need for `unsafe-inline` in script-src CSP.
 */
export default function PiSdkLoader({ sandbox, timeout }: PiSdkLoaderProps) {
  useEffect(() => {
    const MAX_WAIT = timeout;
    const POLL_INTERVAL = 200;
    const startTime = Date.now();

    function initPi() {
      if (typeof window.Pi !== 'undefined') {
        try {
          const elapsed = Date.now() - startTime;
          console.log(`[TEC] Pi SDK loaded after ${elapsed}ms`);

          const appId = process.env.NEXT_PUBLIC_PI_APP_ID;
          if (!appId) {
            console.warn('[TEC] NEXT_PUBLIC_PI_APP_ID is not set — Pi.init() will run without appId');
          }
          window.Pi.init({ version: '2.0', sandbox, appId });

          console.log(`[TEC] Pi SDK initialized (sandbox: ${sandbox})`);
          window.__TEC_PI_READY = true;
          window.dispatchEvent(new Event('tec-pi-ready'));
        } catch (e) {
          console.error('[TEC] Pi.init() failed:', e);
          window.__TEC_PI_ERROR = true;
          window.dispatchEvent(new CustomEvent('tec-pi-error', { detail: e }));
        }
      }
    }

    if (typeof window.Pi !== 'undefined') {
      initPi();
    } else {
      let elapsed = 0;
      const poll = setInterval(() => {
        elapsed += POLL_INTERVAL;
        if (typeof window.Pi !== 'undefined') {
          clearInterval(poll);
          initPi();
        } else if (elapsed >= MAX_WAIT) {
          clearInterval(poll);
          const totalElapsed = Date.now() - startTime;
          console.error(
            `[TEC] Pi SDK not available after ${totalElapsed}ms (timeout: ${MAX_WAIT}ms)`
          );
          window.__TEC_PI_ERROR = true;
          window.dispatchEvent(
            new CustomEvent('tec-pi-error', { detail: { message: 'SDK load timeout' } })
          );
        }
      }, POLL_INTERVAL);

      return () => clearInterval(poll);
    }
  }, [sandbox, timeout]);

  return null;
}
