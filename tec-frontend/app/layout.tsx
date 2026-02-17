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
        <Script src="https://sdk.minepi.com/pi-sdk.js" strategy="afterInteractive" />
        <Script id="pi-init" strategy="afterInteractive">
          {`
            function initPi() {
              if (typeof Pi !== 'undefined') {
                var sandbox = "${process.env.NEXT_PUBLIC_PI_SANDBOX || 'true'}" !== "false";
                Pi.init({ version: "2.0", sandbox: sandbox });
                console.log("Pi SDK initialized (sandbox: " + sandbox + ")");
              }
            }
            if (typeof Pi !== 'undefined') {
              initPi();
            } else {
              let checkPi = setInterval(function() {
                if (typeof Pi !== 'undefined') {
                  clearInterval(checkPi);
                  clearTimeout(timeoutId);
                  initPi();
                }
              }, 100);
              let timeoutId = setTimeout(function() {
                clearInterval(checkPi);
                console.error("Pi SDK failed to load after 10 seconds");
              }, 10000);
            }
          `}
        </Script>
      </head>
      <body>{children}</body>
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
