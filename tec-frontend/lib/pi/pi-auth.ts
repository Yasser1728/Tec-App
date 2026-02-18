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
    __PI_SANDBOX?: boolean;
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

/**
 * Waits for the Pi SDK to be ready before attempting authentication.
 * Resolves immediately if Pi SDK is already loaded, otherwise waits for 'tec-pi-ready' event.
 * 
 * @param timeout - Maximum time to wait for SDK in milliseconds (default: 10000ms)
 * @returns Promise that resolves when SDK is ready
 * @throws Error if SDK fails to load within the timeout period
 */
const waitForPiSDK = (timeout = 10000): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && typeof window.Pi !== 'undefined') {
      resolve();
      return;
    }
    
    const timer = setTimeout(() => {
      window.removeEventListener('tec-pi-ready', onReady);
      reject(new Error('Pi SDK failed to load. Please refresh and try again.'));
    }, timeout);
    
    const onReady = () => {
      clearTimeout(timer);
      resolve();
    };
    
    window.addEventListener('tec-pi-ready', onReady, { once: true });
  });
};

// Wrap authenticate with timeout
const authenticateWithTimeout = async (timeout = 30000): Promise<PiAuthResult> => {
  // First wait for Pi SDK to be ready
  await waitForPiSDK();
  
  return new Promise((resolve, reject) => {
    // Debug logging
    console.log('[TEC Pi Auth] Starting authentication...');
    console.log('[TEC Pi Auth] window.Pi exists:', typeof window.Pi !== 'undefined');
    console.log('[TEC Pi Auth] Requested scopes:', ['username', 'payments', 'wallet_address']);
    console.log('[TEC Pi Auth] Timeout value:', timeout, 'ms');
    
    const timer = setTimeout(() => {
      console.error('[TEC Pi Auth] Authentication timed out after', timeout, 'ms');
      reject(new Error(
        'انتهت مهلة المصادقة. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.\n' +
        'Authentication timed out. Please check your internet connection and try again.'
      ));
    }, timeout);

    console.log('[TEC Pi Auth] Calling window.Pi.authenticate()...');
    window.Pi.authenticate(
      ['username', 'payments', 'wallet_address'],
      handleIncompletePayment
    ).then(result => {
      clearTimeout(timer);
      console.log('[TEC Pi Auth] Authentication successful:', { uid: result.user.uid, username: result.user.username });
      resolve(result);
    }).catch(err => {
      clearTimeout(timer);
      console.error('[TEC Pi Auth] Authentication failed with error:', err);
      reject(err);
    });
  });
};

export const loginWithPi = async (): Promise<TecAuthResponse> => {
  if (!isPiBrowser()) {
    console.error('[TEC Pi Auth] Not in Pi Browser - window.Pi is undefined');
    throw new Error(
      'يرجى فتح التطبيق داخل متصفح Pi Network للمصادقة.\n' +
      'Please open the app inside Pi Browser to authenticate.\n\n' +
      'تعليمات: افتح تطبيق Pi Network → التطبيقات → TEC App\n' +
      'Instructions: Open Pi Network app → Apps → TEC App'
    );
  }

  console.log('[TEC Pi Auth] isPiBrowser() check passed, proceeding with authentication');
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
