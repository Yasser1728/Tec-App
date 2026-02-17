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

// Wrap authenticate with timeout
const authenticateWithTimeout = (timeout = 30000): Promise<PiAuthResult> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(
        'انتهت مهلة المصادقة. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.\n' +
        'Authentication timed out. Please check your internet connection and try again.'
      ));
    }, timeout);

    window.Pi.authenticate(
      ['username', 'payments', 'wallet_address'],
      handleIncompletePayment
    ).then(result => {
      clearTimeout(timer);
      resolve(result);
    }).catch(err => {
      clearTimeout(timer);
      reject(err);
    });
  });
};

export const loginWithPi = async (): Promise<TecAuthResponse> => {
  if (!isPiBrowser()) {
    throw new Error(
      'يرجى فتح التطبيق داخل متصفح Pi Network للمصادقة.\n' +
      'Please open the app inside Pi Browser to authenticate.\n\n' +
      'تعليمات: افتح تطبيق Pi Network → التطبيقات → TEC App\n' +
      'Instructions: Open Pi Network app → Apps → TEC App'
    );
  }

  const piAuth = await authenticateWithTimeout();

  // For Testnet/demo: create a local auth response
  // TODO(production): Replace with real backend auth endpoint
  // - Call POST /api/auth/login with piAuth data
  // - Backend should verify Pi auth token
  // - Backend should check if user exists in database (isNewUser)
  // - Backend should generate proper JWT tokens with refresh token rotation
  const user = {
    id: piAuth.user.uid,
    piId: piAuth.user.uid,
    piUsername: piAuth.user.username,
    role: 'user',
    subscriptionPlan: null,
    createdAt: new Date().toISOString(),
  };

  // TODO(production): Get isNewUser from backend - hardcoded to true for testnet
  const data: TecAuthResponse = {
    success: true,
    isNewUser: true,
    user,
    tokens: {
      accessToken: piAuth.accessToken,
      // TODO(production): Backend should generate proper refresh token
      // For testnet, using same token as accessToken
      refreshToken: piAuth.accessToken, 
    },
  };

  // Wrap localStorage calls to handle private browsing mode
  try {
    localStorage.setItem('tec_access_token', data.tokens.accessToken);
    localStorage.setItem('tec_refresh_token', data.tokens.refreshToken);
    localStorage.setItem('tec_user', JSON.stringify(data.user));
  } catch (err) {
    console.error('[Pi Auth] Failed to save to localStorage (private browsing mode?):', err);
    throw new Error(
      'تعذر حفظ بيانات المصادقة. يرجى التأكد من عدم استخدام وضع التصفح الخاص.\n' +
      'Failed to save authentication data. Please ensure private browsing mode is disabled.'
    );
  }

  return data;
};

export const getStoredUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const userData = localStorage.getItem('tec_user');
    return userData ? JSON.parse(userData) : null;
  } catch (err) {
    console.error('[Pi Auth] Failed to read from localStorage:', err);
    return null;
  }
};

export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('tec_access_token');
  } catch (err) {
    console.error('[Pi Auth] Failed to read from localStorage:', err);
    return null;
  }
};

export const logout = () => {
  try {
    localStorage.removeItem('tec_access_token');
    localStorage.removeItem('tec_refresh_token');
    localStorage.removeItem('tec_user');
  } catch (err) {
    console.error('[Pi Auth] Failed to clear localStorage:', err);
  }
};
