'use client';

import { LocaleProvider } from '@/lib/i18n';
import { ToastProvider } from '@/components/ToastProvider';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </LocaleProvider>
  );
}
