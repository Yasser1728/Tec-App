import './globals.css';
import Script from 'next/script';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';
import { ClientProviders } from '@/components/ClientProviders';
import PiSdkLoader from '@/components/PiSdkLoader';
import { BackendOfflineBanner } from '@/components/BackendOfflineBanner';

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
const sdkTimeoutEnv = process.env.NEXT_PUBLIC_PI_SDK_TIMEOUT
  ? parseInt(process.env.NEXT_PUBLIC_PI_SDK_TIMEOUT, 10)
  : 25000;
const sdkTimeout = sdkTimeoutEnv > 0 && sdkTimeoutEnv < 120000 ? sdkTimeoutEnv : 25000;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${cormorantGaramond.variable} ${dmSans.variable}`}>
      <body>
        {/* Load Pi SDK before hydration so window.Pi is available to PiSdkLoader */}
        <Script src="https://sdk.minepi.com/pi-sdk.js" strategy="beforeInteractive" />
        <PiSdkLoader sandbox={piSandbox} timeout={sdkTimeout} />
        <BackendOfflineBanner />
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
