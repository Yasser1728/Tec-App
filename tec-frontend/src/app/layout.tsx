import './globals.css';
import { headers } from 'next/headers';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';
import { ClientProviders } from '@/components/ClientProviders';
import PiSdkLoader from '@/components/PiSdkLoader';

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-sans',
  display: 'swap',
});

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
const sdkTimeout = sdkTimeoutEnv > 0 && sdkTimeoutEnv < 120000 ? sdkTimeoutEnv : 25000; // Cap at 2 minutes for safety

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const nonce = headersList.get('x-nonce') ?? '';

  return (
    <html lang="en" dir="ltr" className={`${cormorantGaramond.variable} ${dmSans.variable}`}>
      <head>
        {/* External SDK script — allowed by CSP without unsafe-inline */}
        <script src="https://sdk.minepi.com/pi-sdk.js" defer nonce={nonce || undefined} />
      </head>
      <body>
        {/* PiSdkLoader replaces the dangerouslySetInnerHTML inline init script */}
        <PiSdkLoader sandbox={piSandbox} timeout={sdkTimeout} />
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
