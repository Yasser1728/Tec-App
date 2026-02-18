import './globals.css';
import { ClientProviders } from '@/components/ClientProviders';

export const metadata = {
  title: 'TEC App — The Elite Consortium',
  description: 'A complete ecosystem of 24 apps built on Pi Network',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const piSandbox = process.env.NEXT_PUBLIC_PI_SANDBOX === 'true';
  return (
    <html lang="en" dir="ltr">
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="https://sdk.minepi.com/pi-sdk.js"></script>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            Pi.init({ version: "2.0", sandbox: ${piSandbox} });
            console.log("[TEC] Pi SDK initialized successfully (sandbox: ${piSandbox})");
            window.__TEC_PI_READY = true;
          } catch(e) {
            console.error("[TEC] Pi.init() failed:", e);
          }
        `}} />
      </head>
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
