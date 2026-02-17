import { PiAuthResult, TecAuthResponse, PiPaymentData, PiPaymentCallbacks } from '@/types/pi.types';

declare global {
  interface Window {
    Pi: {
      authenticate: (
        scopes: string[],
        onIncompletePayment: (payment: unknown) => void
      ) => Promise<PiAuthResult>;
      createPayment: (
        paymentData: PiPaymentData,
        callbacks: PiPaymentCallbacks
      ) => void;
    };
  }
}

export const isPiBrowser = (): boolean => {
  if (typeof window === 'undefined') return false;
  return typeof window.Pi !== 'undefined';
};

// Handle incomplete payments from previous sessions
const handleIncompletePayment = async (payment: unknown) => {
  console.warn('Incomplete payment detected:', payment);
  try {
    const paymentObj = payment as { identifier?: string };
    if (paymentObj?.identifier) {
      await fetch('/api/payments/incomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: paymentObj.identifier }),
      });
    }
  } catch (err) {
    console.error('Failed to handle incomplete payment:', err);
  }
};

export const loginWithPi = async (): Promise<TecAuthResponse> => {
  if (!isPiBrowser()) {
    throw new Error('يجب فتح التطبيق داخل Pi Browser');
  }

  const piAuth = await window.Pi.authenticate(
    ['username', 'payments', 'wallet_address'],
    handleIncompletePayment
  );

  // For Testnet/demo: create a local auth response
  // In production, this would call a real auth backend
  const user = {
    id: piAuth.user.uid,
    piId: piAuth.user.uid,
    piUsername: piAuth.user.username,
    role: 'user',
    subscriptionPlan: null,
    createdAt: new Date().toISOString(),
  };

  const data: TecAuthResponse = {
    success: true,
    isNewUser: true,
    user,
    tokens: {
      accessToken: piAuth.accessToken,
      refreshToken: piAuth.accessToken,
    },
  };

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
