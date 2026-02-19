import './globals.css';
import { ClientProviders } from '@/components/ClientProviders';

export const metadata = {
  title: 'TEC App — The Elite Consortium',
  description: 'A complete ecosystem of 24 apps built on Pi Network',
};

const piSandbox = process.env.NEXT_PUBLIC_PI_SANDBOX !== 'false';
// SDK timeout: configurable via env var, default 25 seconds (increased from 15s to handle slow networks)
// Environment variable is resolved at build time, validated to be a positive number
const sdkTimeoutEnv = process.env.NEXT_PUBLIC_PI_SDK_TIMEOUT 
  ? parseInt(process.env.NEXT_PUBLIC_PI_SDK_TIMEOUT, 10) 
  : 25000;
const sdkTimeout = (sdkTimeoutEnv > 0 && sdkTimeoutEnv < 120000) ? sdkTimeoutEnv : 25000; // Cap at 2 minutes for safety

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <script src="https://sdk.minepi.com/pi-sdk.js" defer></script>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var MAX_WAIT = ${sdkTimeout};
            var POLL_INTERVAL = 200;
            var startTime = Date.now();
            
            function initPi() {
              if (typeof Pi !== 'undefined') {
                try {
                  var elapsed = Date.now() - startTime;
                  console.log("[TEC] Pi SDK loaded after " + elapsed + "ms");
                  Pi.init({ version: "2.0", sandbox: ${piSandbox} });
                  console.log("[TEC] Pi SDK initialized (sandbox: ${piSandbox})");
                  window.__TEC_PI_READY = true;
                  window.dispatchEvent(new Event('tec-pi-ready'));
                } catch(e) {
                  console.error("[TEC] Pi.init() failed:", e);
                  window.__TEC_PI_ERROR = true;
                  window.dispatchEvent(new CustomEvent('tec-pi-error', { detail: e }));
                }
              }
            }
            
            if (typeof Pi !== 'undefined') { initPi(); }
            else {
              var elapsed = 0;
              var poll = setInterval(function() {
                elapsed += POLL_INTERVAL;
                if (typeof Pi !== 'undefined') { 
                  clearInterval(poll); 
                  initPi(); 
                }
                else if (elapsed >= MAX_WAIT) {
                  clearInterval(poll);
                  var totalElapsed = Date.now() - startTime;
                  console.error("[TEC] Pi SDK not available after " + totalElapsed + "ms (timeout: " + MAX_WAIT + "ms)");
                  window.__TEC_PI_ERROR = true;
                  window.dispatchEvent(new CustomEvent('tec-pi-error', { detail: { message: 'SDK load timeout' } }));
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
