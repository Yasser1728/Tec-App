import { getAccessToken } from './pi-auth';

const PAYMENT_SERVICE_URL = process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL || 'http://localhost:4003';

export interface A2UPaymentRequest {
  recipientUid: string;
  amount: number;
  memo: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentResult {
  success: boolean;
  paymentId: string;
  txid?: string;
  status: 'pending' | 'approved' | 'completed' | 'cancelled' | 'failed';
  amount: number;
  memo: string;
}

// Create App-to-User payment (server-side initiated)
export const createA2UPayment = async (data: A2UPaymentRequest): Promise<PaymentResult> => {
  const token = getAccessToken();
  if (!token) throw new Error('غير مصرح — سجل الدخول أولاً');

  const response = await fetch(`${PAYMENT_SERVICE_URL}/api/v1/payments/a2u/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error((error as Record<string, string>).message || 'فشل إنشاء الدفعة');
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
      reject(new Error('Pi SDK غير متاح'));
      return;
    }

    const token = getAccessToken();

    window.Pi.createPayment(
      { amount, memo, metadata },
      {
        onReadyForServerApproval: async (paymentId: string) => {
          try {
            await fetch(`${PAYMENT_SERVICE_URL}/api/v1/payments/approve`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({ paymentId }),
            });
          } catch (err) {
            console.error('Server approval failed:', err);
          }
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          try {
            const res = await fetch(`${PAYMENT_SERVICE_URL}/api/v1/payments/complete`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({ paymentId, txid }),
            });
            const result = await res.json();
            resolve(result as PaymentResult);
          } catch (err) {
            reject(err);
          }
        },
        onCancel: () => {
          resolve({
            success: false,
            paymentId: '',
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
