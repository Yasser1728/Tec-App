'use client';

import { useEffect } from 'react';

interface PiSdkLoaderProps {
  sandbox: boolean;
  timeout: number;
}

/**
 * Polls for window.Pi (set by pi-sdk.js) then calls Pi.init().
 * Fires 'tec-pi-ready' on success or 'tec-pi-error' on failure/timeout.
 */
export default function PiSdkLoader({ sandbox, timeout }: PiSdkLoaderProps) {
  useEffect(() => {
    // Guard against double-init (React strict-mode / hot-reload)
    if (window.__TEC_PI_READY || window.__TEC_PI_ERROR) return;

    const POLL_INTERVAL = 250;
    const startTime = Date.now();

    function tryInit(): boolean {
      if (typeof window.Pi === 'undefined') return false;

      try {
        const elapsed = Date.now() - startTime;
        console.log(`[TEC] Pi SDK detected after ${elapsed}ms, calling Pi.init()`);

        const appId = process.env.NEXT_PUBLIC_PI_APP_ID;
        if (!appId) {
          console.warn('[TEC] NEXT_PUBLIC_PI_APP_ID is not set — Pi.init() may fail');
        }

        window.Pi.init({ version: '2.0', sandbox, ...(appId ? { appId } : {}) });

        console.log(`[TEC] Pi SDK initialized (sandbox: ${sandbox})`);
        window.__TEC_PI_READY = true;
        window.dispatchEvent(new Event('tec-pi-ready'));
        return true;
      } catch (e) {
        console.error('[TEC] Pi.init() failed:', e);
        window.__TEC_PI_ERROR = true;
        window.dispatchEvent(new CustomEvent('tec-pi-error', { detail: e }));
        return true; // stop polling
      }
    }

    // SDK might already be loaded (beforeInteractive script)
    if (tryInit()) return;

    const poll = setInterval(() => {
      if (tryInit()) {
        clearInterval(poll);
        return;
      }
      if (Date.now() - startTime >= timeout) {
        clearInterval(poll);
        console.error(`[TEC] Pi SDK not available after ${timeout}ms`);
        window.__TEC_PI_ERROR = true;
        window.dispatchEvent(
          new CustomEvent('tec-pi-error', { detail: { message: 'SDK load timeout' } })
        );
      }
    }, POLL_INTERVAL);

    return () => clearInterval(poll);
  }, [sandbox, timeout]);

  return null;
}
