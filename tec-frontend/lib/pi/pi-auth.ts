import { PiAuthResult, TecAuthResponse } from '@/types/pi.types';

const AUTH_SERVICE_URL = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:4001';

declare global {
  interface Window {
    Pi: {
      authenticate: (
        scopes: string[],
        onIncompletePayment: (payment: any) => void
      ) => Promise<PiAuthResult>;
      createPayment: (paymentData: any, callbacks: any) => void;
    };
  }
}

export const isPiBrowser = (): boolean => {
  if (typeof window === 'undefined') return false;
  return typeof window.Pi !== 'undefined';
};

export const loginWithPi = async (): Promise<TecAuthResponse> => {
  if (!isPiBrowser()) {
    throw new Error('يجب فتح التطبيق داخل Pi Browser');
  }

  const piAuth = await window.Pi.authenticate(
    ['username', 'payments', 'wallet_address'],
    (payment) => console.log('Incomplete payment:', payment)
  );

  const response = await fetch(`${AUTH_SERVICE_URL}/api/v1/auth/pi-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accessToken: piAuth.accessToken,
      appSource: 'tec',
    }),
  });

  if (!response.ok) throw new Error('فشل تسجيل الدخول — حاول مرة أخرى');

  const data: TecAuthResponse = await response.json();

  localStorage.setItem('tec_access_token', data.tokens.accessToken);
  localStorage.setItem('tec_refresh_token', data.tokens.refreshToken);
  localStorage.setItem('tec_user', JSON.stringify(data.user));

  return data;
};

export const getStoredUser = () => {
  if (typeof window === 'undefined') return null;
  const userData = localStorage.getItem('tec_user');
  return userData ? JSON.parse(userData) : null;
};

export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('tec_access_token');
};

export const logout = () => {
  localStorage.removeItem('tec_access_token');
  localStorage.removeItem('tec_refresh_token');
  localStorage.removeItem('tec_user');
};
