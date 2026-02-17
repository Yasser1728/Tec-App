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
        <Script src="https://sdk.minepi.com/pi-sdk.js" strategy="beforeInteractive" />
        <Script id="pi-init" strategy="afterInteractive">
          {`
            var sandboxMode = ${process.env.NEXT_PUBLIC_PI_SANDBOX !== 'false'};
            if (typeof Pi !== 'undefined') {
              Pi.init({ version: "2.0", sandbox: sandboxMode });
            } else {
              document.addEventListener('PiSDKReady', function() {
                Pi.init({ version: "2.0", sandbox: sandboxMode });
              });
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
