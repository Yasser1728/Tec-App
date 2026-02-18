'use client';

import Script from 'next/script';
import { LocaleProvider } from '@/lib/i18n';
import { useTranslation } from '@/lib/i18n';
import './globals.css';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { locale, dir } = useTranslation();

  return (
    <html lang={locale} dir={dir}>
      <head>
        <title>TEC App — The Elite Consortium</title>
        <meta name="description" content="A complete ecosystem of 24 apps built on Pi Network" />
        <Script 
          src="https://sdk.minepi.com/pi-sdk.js" 
          strategy="beforeInteractive"
        />
        <Script id="pi-init" strategy="beforeInteractive">
          {`
            (function() {
              var MAX_WAIT = 15000;
              var POLL_INTERVAL = 200;
              
              function initPi() {
                if (typeof Pi !== 'undefined') {
                  try {
                    var sandbox = ${process.env.NEXT_PUBLIC_PI_SANDBOX === 'true' ? 'true' : 'false'};
                    Pi.init({ version: "2.0", sandbox: sandbox });
                    console.log("[TEC] Pi SDK initialized successfully (sandbox: " + sandbox + ")");
                    window.__TEC_PI_READY = true;
                    window.dispatchEvent(new Event('tec-pi-ready'));
                  } catch(e) {
                    console.error("[TEC] Pi.init() failed:", e);
                    window.dispatchEvent(new CustomEvent('tec-pi-error', { detail: e }));
                  }
                }
              }

              if (typeof Pi !== 'undefined') {
                initPi();
              } else {
                var elapsed = 0;
                var poll = setInterval(function() {
                  elapsed += POLL_INTERVAL;
                  if (typeof Pi !== 'undefined') {
                    clearInterval(poll);
                    initPi();
                  } else if (elapsed >= MAX_WAIT) {
                    clearInterval(poll);
                    console.error("[TEC] Pi SDK not available after " + MAX_WAIT + "ms");
                    window.dispatchEvent(new Event('tec-pi-error'));
                  }
                }, POLL_INTERVAL);
              }
            })();
          `}
        </Script>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LocaleProvider>
      <LayoutContent>{children}</LayoutContent>
    </LocaleProvider>
  );
}
