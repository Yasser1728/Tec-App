import { getAccessToken, getStoredUser, waitForPiSDK } from './pi-auth';
import {
  APPROVAL_TIMEOUT_MS,
  COMPLETION_TIMEOUT_MS,
  RETRIABLE_STATUS_CODES,
  NON_RETRIABLE_STATUS_CODES,
  MAX_RETRIES,
  RETRY_BASE_DELAY_MS,
} from './payment-timeouts';

export interface A2UPaymentRequest {
  recipientUid: string;
  amount: number;
  memo: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  txid?: string;
  status: 'pending' | 'approved' | 'completed' | 'cancelled' | 'failed';
  amount: number;
  memo: string;
  message?: string;
}

// Retry helper function
const retryFetch = async (
  url: string,
  options: RequestInit,
  maxRetries = MAX_RETRIES
): Promise<Response> => {
  let lastError: Error | null = null;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      const response = await fetch(url, options);

      // Non-retriable status codes: return immediately without retrying
      if (NON_RETRIABLE_STATUS_CODES.has(response.status)) {
        return response;
      }

      // Retriable status codes (e.g. 404 = payment not yet indexed, 429 = rate limited)
      // Retry with exponential back-off unless this is the last attempt
      if (RETRIABLE_STATUS_CODES.has(response.status) && i < maxRetries) {
        const delay = RETRY_BASE_DELAY_MS * (i + 1);
        console.warn(
          `[Pi Payment] Retriable HTTP ${response.status} on attempt ${i + 1}/${maxRetries + 1}, retrying in ${delay}ms`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      return response;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Unknown error');
      if (i < maxRetries) {
        // Wait before retry (exponential backoff: 1s, 2s)
        await new Promise((resolve) => setTimeout(resolve, RETRY_BASE_DELAY_MS * (i + 1)));
      }
    }
  }

  throw lastError || new Error('Request failed');
};

// Create App-to-User payment (server-side initiated)
export const createA2UPayment = async (data: A2UPaymentRequest): Promise<PaymentResult> => {
  const token = getAccessToken();
  if (!token) throw new Error('غير مصرح — سجل الدخول أولاً / Unauthorized - Please log in first');

  const idempotencyKey = crypto.randomUUID();

  try {
    // [source: Core-Backend]
    const response = await retryFetch(`${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/payments/a2u`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || 'فشل إنشاء الدفعة / Failed to create payment');
    }

    return response.json();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'فشل إنشاء الدفعة / Failed to create payment';
    throw new Error(message);
  }
};

// Diagnostic callback type
export type DiagnosticCallback = (type: string, message: string, data?: unknown) => void;

// Pi payment ID validation: alphanumeric with optional single separators (., -, _)
const PI_PAYMENT_ID_REGEX = /^[a-zA-Z0-9]+([._-][a-zA-Z0-9]+)*$/;
// Pi transaction ID validation: alphanumeric + underscores/hyphens, 8-128 chars
const PI_TXID_REGEX = /^[a-zA-Z0-9_-]{8,128}$/;

// User-to-App payment using Pi SDK (client-side)
export const createU2APayment = async (
  amount: number,
  memo: string,
  metadata: Record<string, unknown> = {},
  onDiagnostic?: DiagnosticCallback
): Promise<PaymentResult> => {
  if (typeof window === 'undefined') {
    throw new Error(
      'Pi SDK غير متاح — افتح التطبيق في Pi Browser / Pi SDK not available - Open in Pi Browser'
    );
  }

  // Wait for Pi SDK to be ready before attempting payment
  await waitForPiSDK();

  const idempotencyKey = crypto.randomUUID();

  // Step 1: Create backend payment record first (tec-ecosystem flow).
  // This gives us an internal UUID (internalId) which the approve/complete
  // endpoints require as payment_id. If creation fails (e.g. userId not yet
  // a DB-linked UUID in testnet), we log a warning and fall back to using the
  // Pi payment ID directly in the callbacks.
  let internalId: string | null = null;
  const storedUser = getStoredUser();
  const userId = storedUser?.id ?? null;
  const token = getAccessToken();

  if (userId) {
    try {
      onDiagnostic?.(
        'info',
        `Creating backend payment record (userId: ${userId}, amount: ${amount})`,
        { userId, amount }
      );
      console.log('[Pi Payment] Creating backend payment record for userId:', userId);
      const createRes = await retryFetch(
        `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/payments/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ userId, amount, payment_method: 'pi', metadata }),
        }
      );
      if (createRes.ok) {
        const createData = await createRes.json();
        internalId = createData?.data?.payment?.id ?? null;
        console.log('[Pi Payment] Backend payment record created, internalId:', internalId);
        onDiagnostic?.('info', `Backend record created (internalId: ${internalId})`, {
          internalId,
        });
      } else {
        const errData = await createRes.json().catch(() => ({}));
        console.warn(
          '[Pi Payment] Backend payment create failed (non-blocking):',
          errData?.error?.message ?? createRes.status
        );
        onDiagnostic?.(
          'warn',
          `Backend create failed (${createRes.status}) — proceeding without internalId`,
          { status: createRes.status }
        );
      }
    } catch (createErr) {
      console.warn('[Pi Payment] Backend payment create error (non-blocking):', createErr);
      onDiagnostic?.('warn', 'Backend create request failed — proceeding without internalId');
    }
  } else {
    console.warn('[Pi Payment] No stored userId — skipping backend payment record creation');
    onDiagnostic?.('warn', 'No userId available — skipping backend payment record creation');
  }

  return new Promise((resolve, reject) => {
    if (!window.Pi) {
      reject(
        new Error(
          'Pi SDK غير متاح — افتح التطبيق في Pi Browser / Pi SDK not available - Open in Pi Browser'
        )
      );
      return;
    }

    // Payment timeout: Separate timeouts for approval and completion stages.
    // Values come from the centralized payment-timeouts.ts configuration.
    // Approval: configurable via NEXT_PUBLIC_PI_APPROVAL_TIMEOUT (default 3 min)
    // Completion: configurable via NEXT_PUBLIC_PI_COMPLETION_TIMEOUT (default 3 min)
    // Total: up to 6 minutes — each stage has dedicated time.
    const approvalTimeoutMs = APPROVAL_TIMEOUT_MS;
    const completionTimeoutMs = COMPLETION_TIMEOUT_MS;

    let paymentTimedOut = false;
    let paymentTimer: NodeJS.Timeout | null = null;

    const startApprovalTimer = () => {
      // Clear any existing timer first
      if (paymentTimer) {
        clearTimeout(paymentTimer);
      }
      console.log(`[Pi Payment] Starting approval timeout: ${approvalTimeoutMs}ms`);
      paymentTimer = setTimeout(() => {
        paymentTimedOut = true;
        console.error(`[Pi Payment] Approval stage timed out after ${approvalTimeoutMs}ms`);
        reject(
          new Error(
            'انتهت مهلة موافقة الدفع. يرجى المحاولة مرة أخرى.\n' +
              'Payment approval timed out. Please try again.'
          )
        );
      }, approvalTimeoutMs);
    };

    const startCompletionTimer = () => {
      // Clear existing timer
      if (paymentTimer) {
        clearTimeout(paymentTimer);
      }
      console.log(`[Pi Payment] Starting completion timeout: ${completionTimeoutMs}ms`);
      paymentTimer = setTimeout(() => {
        paymentTimedOut = true;
        console.error(`[Pi Payment] Completion stage timed out after ${completionTimeoutMs}ms`);
        reject(
          new Error(
            'انتهت مهلة إكمال الدفع. يرجى المحاولة مرة أخرى.\n' +
              'Payment completion timed out. Please try again.'
          )
        );
      }, completionTimeoutMs);
    };

    // Helper to clear timeout
    const clearPaymentTimer = () => {
      if (paymentTimer) {
        clearTimeout(paymentTimer);
        paymentTimer = null;
      }
    };

    // Start approval timer
    startApprovalTimer();

    window.Pi.createPayment(
      { amount, memo, metadata },
      {
        onReadyForServerApproval: async (piPaymentId: string) => {
          if (paymentTimedOut) return;

          // Log diagnostic event
          onDiagnostic?.('approval', `onReadyForServerApproval: piPaymentId=${piPaymentId}`, {
            piPaymentId,
            internalId,
          });

          // Validate Pi payment ID format before sending to server
          if (!PI_PAYMENT_ID_REGEX.test(piPaymentId)) {
            console.error('[Pi Payment] Invalid piPaymentId format:', piPaymentId);
            onDiagnostic?.('error', `Invalid piPaymentId format: ${piPaymentId}`, { piPaymentId });
            clearPaymentTimer();
            reject(new Error('معرف الدفع غير صالح / Invalid payment ID format'));
            return;
          }

          if (!internalId) {
            // No backend record — approve step will fail validation; log and skip
            console.error(
              '[Pi Payment] No internalId — cannot call /payments/approve (backend record not created); payment will not be reconcilable'
            );
            onDiagnostic?.(
              'error',
              'Skipping /payments/approve — no backend payment record (internalId missing); payment may not be reconcilable',
              { piPaymentId }
            );
            startCompletionTimer();
            return;
          }

          try {
            console.log('[Pi Payment] Calling /payments/approve:', {
              payment_id: internalId,
              pi_payment_id: piPaymentId,
            });
            // [source: Core-Backend]
            const res = await retryFetch(
              `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/payments/approve`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Idempotency-Key': idempotencyKey,
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ payment_id: internalId, pi_payment_id: piPaymentId }),
              }
            );

            if (!res.ok) {
              const errorData = await res.json().catch(() => ({ message: 'Approval failed' }));
              const errorMsg = errorData.message || 'فشلت الموافقة / Approval failed';
              console.error('[Pi Payment] Server approval failed:', errorMsg);
              console.warn('[Pi Payment] Incomplete payment may remain:', piPaymentId);
              onDiagnostic?.('error', `Server approval failed: ${errorMsg}`, {
                piPaymentId,
                internalId,
                error: errorMsg,
              });
              clearPaymentTimer();
              reject(new Error(errorMsg));
              return;
            }

            const result = await res.json();
            console.log('[Pi Payment] Server approval successful:', result);
            onDiagnostic?.('approval', `Server approval successful (internalId: ${internalId})`, {
              piPaymentId,
              internalId,
              result,
            });

            // Switch to completion timer after successful approval
            startCompletionTimer();
          } catch (err) {
            console.error('[Pi Payment] Server approval error:', err);
            console.warn('[Pi Payment] Incomplete payment may remain:', piPaymentId);
            const errorMessage =
              err instanceof Error ? err.message : 'فشلت الموافقة / Approval failed';
            onDiagnostic?.('error', `Server approval error: ${errorMessage}`, {
              piPaymentId,
              internalId,
              error: errorMessage,
            });
            clearPaymentTimer();
            reject(new Error(errorMessage));
          }
        },
        onReadyForServerCompletion: async (piPaymentId: string, txid: string) => {
          if (paymentTimedOut) return;

          // Log diagnostic event
          onDiagnostic?.(
            'completion',
            `onReadyForServerCompletion: piPaymentId=${piPaymentId} txid=${txid}`,
            { piPaymentId, txid, internalId }
          );

          // Validate Pi payment ID format before sending to server
          if (!PI_PAYMENT_ID_REGEX.test(piPaymentId)) {
            console.error('[Pi Payment] Invalid piPaymentId format in completion:', piPaymentId);
            onDiagnostic?.('error', `Invalid piPaymentId format in completion: ${piPaymentId}`, {
              piPaymentId,
            });
            clearPaymentTimer();
            reject(new Error('معرف الدفع غير صالح / Invalid payment ID format'));
            return;
          }

          // Validate txid format (accept Pi testnet/mainnet IDs without allowing path separators)
          if (!PI_TXID_REGEX.test(txid)) {
            console.error('[Pi Payment] Invalid txid format:', txid);
            onDiagnostic?.('error', `Invalid txid format: ${txid}`, { txid });
            clearPaymentTimer();
            reject(new Error('معرف المعاملة غير صالح / Invalid transaction ID format'));
            return;
          }

          if (!internalId) {
            // No backend record — resolve as completed on the Pi side
            console.warn(
              '[Pi Payment] No internalId — skipping /payments/complete (backend record not created)'
            );
            onDiagnostic?.(
              'warn',
              'Skipping /payments/complete — no backend payment record (internalId missing)',
              { piPaymentId, txid }
            );
            clearPaymentTimer();
            resolve({
              success: false,
              paymentId: piPaymentId,
              txid,
              status: 'completed',
              amount,
              memo,
              message:
                'تمت الدفعة لكن لم يتم تسجيلها — يرجى التواصل مع الدعم / Payment sent but not recorded — please contact support',
            });
            return;
          }

          try {
            console.log('[Pi Payment] Calling /payments/complete:', {
              payment_id: internalId,
              transaction_id: txid,
            });
            // [source: Core-Backend]
            const res = await retryFetch(
              `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/payments/complete`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Idempotency-Key': idempotencyKey,
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ payment_id: internalId, transaction_id: txid }),
              }
            );

            if (!res.ok) {
              const errorData = await res.json().catch(() => ({ message: 'Completion failed' }));
              const errorMsg = errorData.message || 'فشل الإكمال / Completion failed';
              console.error('[Pi Payment] Server completion failed:', errorMsg);
              onDiagnostic?.('error', `Server completion failed: ${errorMsg}`, {
                piPaymentId,
                internalId,
                txid,
                error: errorMsg,
              });
              clearPaymentTimer();
              reject(new Error(errorMsg));
              return;
            }

            const result = await res.json();
            console.log('[Pi Payment] Server completion successful:', result);
            onDiagnostic?.(
              'completion',
              `Server completion successful (internalId: ${internalId})`,
              { piPaymentId, internalId, txid, result }
            );

            clearPaymentTimer();
            resolve({
              success: true,
              paymentId: piPaymentId,
              txid,
              status: 'completed',
              amount,
              memo,
              message: 'تمت الدفعة بنجاح! 🎉 / Payment successful! 🎉',
              ...result,
            });
          } catch (err) {
            const errorMessage =
              err instanceof Error ? err.message : 'فشلت الدفعة / Payment failed';
            onDiagnostic?.('error', `Server completion error: ${errorMessage}`, {
              piPaymentId,
              internalId,
              txid,
              error: errorMessage,
            });
            clearPaymentTimer();
            reject(new Error(errorMessage));
          }
        },
        onCancel: () => {
          console.log('[Pi Payment] Payment cancelled by user');
          onDiagnostic?.('cancel', 'Payment cancelled by user');
          clearPaymentTimer();
          resolve({
            success: false,
            status: 'cancelled',
            amount,
            memo,
            message: 'ألغيت الدفعة / Payment cancelled',
          });
        },
        onError: (error: Error) => {
          console.error('[Pi Payment] SDK error:', error);
          onDiagnostic?.('error', `Pi SDK error: ${error.message}`, { error: error.message });
          clearPaymentTimer();
          reject(new Error(`خطأ Pi SDK / Pi SDK error: ${error.message}`));
        },
      }
    );
  });
};

// Get payment status from server
export const getPaymentStatus = async (paymentId: string): Promise<PaymentResult> => {
  try {
    // [source: Core-Backend]
    const token = getAccessToken();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/payments/${encodeURIComponent(paymentId)}/status`,
      {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || 'فشل جلب حالة الدفعة / Failed to fetch payment status');
    }

    return response.json();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'فشل جلب حالة الدفعة / Failed to fetch payment status';
    throw new Error(message);
  }
};

// Test Pi SDK connectivity
export const testPiSDK = (): boolean => {
  if (typeof window === 'undefined') return false;
  const available = typeof window.Pi !== 'undefined';
  console.log('Pi SDK available:', available);
  if (available) {
    console.log('Pi SDK object:', window.Pi);
  }
  return available;
};
