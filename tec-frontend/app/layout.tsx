import './globals.css';
import { ClientProviders } from '@/components/ClientProviders';

export const metadata = {
  title: 'TEC App — The Elite Consortium',
  description: 'A complete ecosystem of 24 apps built on Pi Network',
};

const piSandbox = process.env.NEXT_PUBLIC_PI_SANDBOX !== 'false';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        {/* Pi SDK must load synchronously to prevent race condition with initialization script below */}
        <script src="https://sdk.minepi.com/pi-sdk.js"></script>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var MAX_WAIT = 15000;
            var POLL_INTERVAL = 200;
            function initPi() {
              if (typeof Pi !== 'undefined') {
                try {
                  Pi.init({ version: "2.0", sandbox: ${piSandbox} });
                  console.log("[TEC] Pi SDK initialized (sandbox: ${piSandbox})");
                  window.__TEC_PI_READY = true;
                  window.dispatchEvent(new Event('tec-pi-ready'));
                } catch(e) {
                  console.error("[TEC] Pi.init() failed:", e);
                  window.dispatchEvent(new CustomEvent('tec-pi-error', { detail: e }));
                }
              }
            }
            if (typeof Pi !== 'undefined') { initPi(); }
            else {
              var elapsed = 0;
              var poll = setInterval(function() {
                elapsed += POLL_INTERVAL;
                if (typeof Pi !== 'undefined') { clearInterval(poll); initPi(); }
                else if (elapsed >= MAX_WAIT) {
                  clearInterval(poll);
                  console.error("[TEC] Pi SDK not available after " + MAX_WAIT + "ms");
                  window.dispatchEvent(new Event('tec-pi-error'));
                }
              }, POLL_INTERVAL);
            }
          })();
        `}} />
      </head>
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
