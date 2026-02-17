import { getAccessToken } from './pi-auth';

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
  maxRetries = 2
): Promise<Response> => {
  let lastError: Error | null = null;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Unknown error');
      if (i < maxRetries) {
        // Wait before retry (exponential backoff: 1s, 2s)
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }
  
  throw lastError || new Error('Request failed');
};

// Create App-to-User payment (server-side initiated)
export const createA2UPayment = async (data: A2UPaymentRequest): Promise<PaymentResult> => {
  const token = getAccessToken();
  if (!token) throw new Error('غير مصرح — سجل الدخول أولاً / Unauthorized - Please log in first');

  try {
    const response = await retryFetch('/api/payments/a2u', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || 'فشل إنشاء الدفعة / Failed to create payment');
    }

    return response.json();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'فشل إنشاء الدفعة / Failed to create payment';
    throw new Error(message);
  }
};

// User-to-App payment using Pi SDK (client-side)
export const createU2APayment = (
  amount: number,
  memo: string,
  metadata: Record<string, unknown> = {}
): Promise<PaymentResult> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.Pi) {
      reject(new Error('Pi SDK غير متاح — افتح التطبيق في Pi Browser / Pi SDK not available - Open in Pi Browser'));
      return;
    }

    window.Pi.createPayment(
      { amount, memo, metadata },
      {
        onReadyForServerApproval: async (paymentId: string) => {
          try {
            console.log('[Pi Payment] Server approval requested for:', paymentId);
            const res = await retryFetch('/api/payments/approve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId }),
            });
            
            if (!res.ok) {
              const errorText = await res.text();
              console.error('[Pi Payment] Server approval failed:', errorText);
              throw new Error(`فشلت الموافقة / Approval failed: ${errorText}`);
            }
            
            const result = await res.json();
            console.log('[Pi Payment] Server approval successful:', result);
          } catch (err) {
            console.error('[Pi Payment] Server approval error:', err);
            // Don't reject here - let Pi SDK handle the flow
          }
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          try {
            console.log('[Pi Payment] Server completion requested for:', paymentId, txid);
            const res = await retryFetch('/api/payments/complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId, txid }),
            });
            
            if (!res.ok) {
              const errorText = await res.text();
              console.error('[Pi Payment] Server completion failed:', errorText);
              throw new Error(`فشل الإكمال / Completion failed: ${errorText}`);
            }
            
            const result = await res.json();
            console.log('[Pi Payment] Server completion successful:', result);
            
            resolve({
              success: true,
              paymentId,
              txid,
              status: 'completed',
              amount,
              memo,
              message: 'تمت الدفعة بنجاح! 🎉 / Payment successful! 🎉',
              ...result,
            });
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'فشلت الدفعة / Payment failed';
            reject(new Error(errorMessage));
          }
        },
        onCancel: () => {
          console.log('[Pi Payment] Payment cancelled by user');
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
          reject(new Error(`خطأ Pi SDK / Pi SDK error: ${error.message}`));
        },
      }
    );
  });
};

// Get payment status from server
export const getPaymentStatus = async (paymentId: string): Promise<PaymentResult> => {
  try {
    const response = await fetch(`/api/payments/status?paymentId=${encodeURIComponent(paymentId)}`);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || 'فشل جلب حالة الدفعة / Failed to fetch payment status');
    }
    
    return response.json();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'فشل جلب حالة الدفعة / Failed to fetch payment status';
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
