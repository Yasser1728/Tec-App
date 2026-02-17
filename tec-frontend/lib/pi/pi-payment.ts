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
}

// Create App-to-User payment (server-side initiated)
export const createA2UPayment = async (data: A2UPaymentRequest): Promise<PaymentResult> => {
  const token = getAccessToken();
  if (!token) throw new Error('غير مصرح — سجل الدخول أولاً');

  const response = await fetch('/api/payments/a2u', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || 'فشل إنشاء الدفعة');
  }

  return response.json();
};

// User-to-App payment using Pi SDK (client-side)
export const createU2APayment = (
  amount: number,
  memo: string,
  metadata: Record<string, unknown> = {}
): Promise<PaymentResult> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.Pi) {
      reject(new Error('Pi SDK غير متاح — افتح التطبيق في Pi Browser'));
      return;
    }

    window.Pi.createPayment(
      { amount, memo, metadata },
      {
        onReadyForServerApproval: async (paymentId: string) => {
          try {
            const res = await fetch('/api/payments/approve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId }),
            });
            if (!res.ok) {
              console.error('Server approval failed:', await res.text());
            }
          } catch (err) {
            console.error('Server approval failed:', err);
          }
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          try {
            const res = await fetch('/api/payments/complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId, txid }),
            });
            const result = await res.json();
            resolve({
              success: true,
              paymentId,
              txid,
              status: 'completed',
              amount,
              memo,
              ...result,
            });
          } catch (err) {
            reject(err);
          }
        },
        onCancel: () => {
          resolve({
            success: false,
            status: 'cancelled',
            amount,
            memo,
          });
        },
        onError: (error: Error) => {
          reject(error);
        },
      }
    );
  });
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
