import { PiAuthResult, TecAuthResponse, PiPaymentData, PiPaymentCallbacks } from '@/types/pi.types';

declare global {
  interface Window {
    Pi: {
      authenticate: (
        scopes: string[],
        onIncompletePayment: (payment: unknown) => void
      ) => Promise<PiAuthResult>;
      createPayment: (paymentData: PiPaymentData, callbacks: PiPaymentCallbacks) => void;
      init: (config: { version: string; sandbox: boolean; appId?: string }) => void;
    };
    __PI_SANDBOX?: boolean;
    __TEC_PI_READY?: boolean;
    __TEC_PI_ERROR?: boolean;
  }
}

export const isPiBrowser = (): boolean => {
  if (typeof window === 'undefined') return false;
  // If window.Pi exists with authenticate method, we're in Pi Browser.
  // The Pi SDK only provides a functional Pi object inside Pi Browser.
  return typeof window.Pi !== 'undefined' && typeof window.Pi.authenticate === 'function';
};

const resolveIncompletePayment = async (payment: unknown) => {
  console.warn('[TEC Pi Auth] Incomplete payment detected:', payment);

  const p = payment as {
    identifier?: string;
    status?: {
      developer_approved?: boolean;
      transaction_verified?: boolean;
      developer_completed?: boolean;
      cancelled?: boolean;
    };
    transaction?: { txid?: string } | null;
  };

  const piPaymentId = p?.identifier;
  if (!piPaymentId) {
    console.error('[TEC Pi Auth] Incomplete payment has no identifier, cannot resolve');
    return;
  }

  const token = getAccessToken();
  if (!token) {
    console.warn('[TEC Pi Auth] No access token, cannot resolve incomplete payment');
    return;
  }

  const gatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL;
  if (!gatewayUrl) {
    console.warn('[TEC Pi Auth] No gateway URL configured, cannot resolve incomplete payment');
    return;
  }

  try {
    const isApproved = p?.status?.developer_approved === true;
    const txid = p?.transaction?.txid;

    if (isApproved && txid && !p?.status?.developer_completed) {
      // Payment was approved and has a blockchain transaction but wasn't completed server-side.
      // Attempt to complete it.
      console.log('[TEC Pi Auth] Attempting to complete incomplete payment:', piPaymentId);
      const res = await fetch(`${gatewayUrl}/api/payments/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          // Pi SDK only provides the Pi payment ID here; the backend looks up the internal
          // payment record by its pi_payment_id column to resolve the completion.
          payment_id: piPaymentId,
          transaction_id: txid,
        }),
      });
      if (res.ok) {
        console.log('[TEC Pi Auth] Incomplete payment completed successfully');
      } else {
        console.warn('[TEC Pi Auth] Failed to complete incomplete payment:', res.status);
      }
    } else if (!p?.status?.cancelled) {
      // Payment is not completed and not cancelled — log warning.
      // No cancel-by-pi-payment-id endpoint exists yet; Pi SDK will eventually expire it.
      console.log(
        '[TEC Pi Auth] Incomplete payment not yet approved or already cancelled:',
        piPaymentId
      );
      console.warn(
        '[TEC Pi Auth] Cannot cancel incomplete payment programmatically — Pi SDK will expire it'
      );
    }
  } catch (err) {
    console.error('[TEC Pi Auth] Error handling incomplete payment:', err);
  }
};

// Handle incomplete payments from previous sessions.
// Pi SDK callback must be synchronous; async resolution runs as fire-and-forget.
const handleIncompletePayment = (payment: unknown) => {
  void resolveIncompletePayment(payment);
};

/**
 * Waits for the Pi SDK to be ready before attempting authentication.
 * Resolves immediately if Pi SDK is already loaded, otherwise waits for 'tec-pi-ready' event.
 *
 * @param timeout - Maximum time to wait for SDK in milliseconds (default: 15000ms)
 *                  Note: This is separate from SDK initialization timeout (25s in layout.tsx)
 *                  This timeout is for waiting after page load, while SDK timeout is for initial load
 * @returns Promise that resolves when SDK is ready
 * @throws Error if SDK fails to load within the timeout period
 */
export const waitForPiSDK = (timeout = 15000): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if Pi SDK init failed
    if (typeof window !== 'undefined' && window.__TEC_PI_ERROR) {
      // No need to register listeners if SDK already failed
      reject(
        new Error(
          'تعذر تحميل Pi SDK. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.\n' +
            'Pi SDK failed to load. Please check your internet connection and try again.'
        )
      );
      return;
    }

    // Check if Pi SDK is already ready (window.Pi exists and __TEC_PI_READY flag is set)
    // Both must be true for safety - the flag indicates successful Pi.init()
    if (
      typeof window !== 'undefined' &&
      typeof window.Pi !== 'undefined' &&
      window.__TEC_PI_READY
    ) {
      console.log('[TEC Pi Auth] Pi SDK already ready');
      resolve();
      return;
    }

    const startTime = Date.now();
    console.log(`[TEC Pi Auth] Waiting for Pi SDK (timeout: ${timeout}ms)...`);

    const timer = setTimeout(() => {
      window.removeEventListener('tec-pi-ready', onReady);
      window.removeEventListener('tec-pi-error', onError);
      const elapsed = Date.now() - startTime;
      console.error(`[TEC Pi Auth] Pi SDK wait timeout after ${elapsed}ms`);
      reject(
        new Error(
          'تعذر تحميل Pi SDK. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.\n' +
            'Pi SDK failed to load. Please check your internet connection and try again.'
        )
      );
    }, timeout);

    const onReady = () => {
      const elapsed = Date.now() - startTime;
      console.log(`[TEC Pi Auth] Pi SDK ready after ${elapsed}ms`);
      clearTimeout(timer);
      window.removeEventListener('tec-pi-error', onError);
      resolve();
    };

    const onError = (event: Event) => {
      const elapsed = Date.now() - startTime;
      const detail = (event as CustomEvent).detail;
      console.error(`[TEC Pi Auth] Pi SDK init error after ${elapsed}ms:`, detail);
      clearTimeout(timer);
      window.removeEventListener('tec-pi-ready', onReady);
      reject(
        new Error(
          'فشل تهيئة Pi SDK. يرجى المحاولة مرة أخرى.\n' +
            'Pi SDK initialization failed. Please try again.'
        )
      );
    };

    window.addEventListener('tec-pi-ready', onReady, { once: true });
    window.addEventListener('tec-pi-error', onError, { once: true });
  });
};

// Wrap authenticate with timeout
// Default timeout increased from 30s to 45s to account for SDK wait time + network latency
// Can be overridden via NEXT_PUBLIC_PI_AUTH_TIMEOUT environment variable (set at build time)
const getAuthTimeout = (): number => {
  const envTimeout = process.env.NEXT_PUBLIC_PI_AUTH_TIMEOUT
    ? parseInt(process.env.NEXT_PUBLIC_PI_AUTH_TIMEOUT, 10)
    : 45000;

  // Validate and cap timeout (must be positive, max 2 minutes for safety)
  if (!isNaN(envTimeout) && envTimeout > 0 && envTimeout < 120000) {
    return envTimeout;
  }
  return 45000; // Default 45 seconds
};

const authenticateWithTimeout = async (timeout?: number): Promise<PiAuthResult> => {
  const effectiveTimeout = timeout ?? getAuthTimeout();

  // First wait for Pi SDK to be ready
  await waitForPiSDK();

  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    // Debug logging
    console.log('[TEC Pi Auth] Starting authentication...');
    console.log('[TEC Pi Auth] window.Pi exists:', typeof window.Pi !== 'undefined');
    console.log('[TEC Pi Auth] Requested scopes:', ['username', 'payments']);
    console.log(`[TEC Pi Auth] Timeout value: ${effectiveTimeout}ms`);

    const timer = setTimeout(() => {
      const elapsed = Date.now() - startTime;
      console.error(
        `[TEC Pi Auth] Authentication timed out after ${elapsed}ms (timeout: ${effectiveTimeout}ms)`
      );
      // Provide a specific message depending on the actual failure point
      const sdkReady = typeof window !== 'undefined' && !!window.__TEC_PI_READY;
      const inPiBrowser = isPiBrowser();
      let message: string;
      if (!inPiBrowser) {
        message =
          'يرجى فتح التطبيق داخل متصفح Pi Network للمصادقة.\n' +
          'Please open the app inside Pi Browser to authenticate.\n\n' +
          'تعليمات: افتح تطبيق Pi Network → التطبيقات → TEC App\n' +
          'Instructions: Open Pi Network app → Apps → TEC App';
      } else if (!sdkReady) {
        message =
          'تعذر تهيئة Pi SDK. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.\n' +
          'Pi SDK failed to initialize. Please check your internet connection and try again.';
      } else {
        message =
          'انتهت مهلة المصادقة. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.\n' +
          'Authentication timed out. Please check your internet connection and try again.';
      }
      reject(new Error(message));
    }, effectiveTimeout);

    console.log('[TEC Pi Auth] Calling window.Pi.authenticate()...');
    window.Pi.authenticate(['username', 'payments'], handleIncompletePayment)
      .then((result) => {
        clearTimeout(timer);
        const elapsed = Date.now() - startTime;
        console.log(`[TEC Pi Auth] Authentication successful after ${elapsed}ms:`, {
          uid: result.user.uid,
          username: result.user.username,
        });
        resolve(result);
      })
      .catch((err) => {
        clearTimeout(timer);
        const elapsed = Date.now() - startTime;
        console.error(`[TEC Pi Auth] Authentication failed after ${elapsed}ms with error:`, err);
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

  const gatewayRes = await fetch(`${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/auth/pi-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken: piAuth.accessToken }),
  });

  if (!gatewayRes.ok) {
    const errBody = await gatewayRes.json().catch(() => ({ message: 'Auth failed' }));
    // Backend error format: { success: false, error: { code, message } }
    const errMsg =
      errBody?.error?.message || errBody?.message || 'فشل التحقق من Pi / Pi verification failed';
    throw new Error(errMsg);
  }

  const raw = await gatewayRes.json();
  // The auth service wraps the response in { success, data: { user, tokens, isNewUser } }.
  // Unwrap so the rest of the code can access user/tokens directly.
  const envelope = raw.data ?? raw;
  const data: TecAuthResponse = {
    success: raw.success ?? true,
    isNewUser: envelope.isNewUser ?? false,
    user: {
      id: envelope.user?.id ?? '',
      piId: envelope.user?.piUid ?? envelope.user?.pi_uid ?? '',
      piUsername: envelope.user?.piUsername ?? envelope.user?.pi_username ?? '',
      role: envelope.user?.role ?? 'user',
      subscriptionPlan: envelope.user?.subscriptionPlan ?? null,
      createdAt: envelope.user?.created_at ?? envelope.user?.createdAt ?? '',
    },
    tokens: {
      accessToken: envelope.tokens?.accessToken ?? '',
      refreshToken: envelope.tokens?.refreshToken ?? '',
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
