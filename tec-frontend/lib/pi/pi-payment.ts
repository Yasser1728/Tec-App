// App-to-User Payment Service
// This handles payments FROM the app TO the user (rewards, refunds, etc.)

const PAYMENT_SERVICE_URL = process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL || 'http://localhost:4003';

export interface PaymentConfig {
  amount: number;
  memo: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  txid?: string;
  error?: string;
}

// Test Pi SDK connectivity
export const testPiSdk = (): boolean => {
  if (typeof window === 'undefined' || !window.Pi) {
    console.error('❌ Pi SDK not available');
    return false;
  }
  console.log('✅ Pi SDK is available');
  console.log('📦 Pi SDK version:', window.Pi);
  return true;
};

// Create App-to-User payment (User pays the app)
export const createAppToUserPayment = async (config: PaymentConfig): Promise<PaymentResult> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.Pi) {
      resolve({ success: false, error: 'Pi SDK not available' });
      return;
    }

    window.Pi.createPayment(
      {
        amount: config.amount,
        memo: config.memo,
        metadata: config.metadata || {},
      },
      {
        onReadyForServerApproval: async (paymentId: string) => {
          console.log('📋 Payment ready for approval:', paymentId);
          try {
            await fetch(`${PAYMENT_SERVICE_URL}/api/v1/payments/approve`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId }),
            });
          } catch (err) {
            console.error('❌ Server approval failed:', err);
          }
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          console.log('✅ Payment completing:', paymentId, txid);
          try {
            await fetch(`${PAYMENT_SERVICE_URL}/api/v1/payments/complete`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId, txid }),
            });
            resolve({ success: true, paymentId, txid });
          } catch (err) {
            console.error('❌ Server completion failed:', err);
            resolve({ success: false, error: 'Server completion failed' });
          }
        },
        onCancel: () => {
          console.log('❌ Payment cancelled');
          resolve({ success: false, error: 'Payment cancelled by user' });
        },
        onError: (error: any) => {
          console.error('💥 Payment error:', error);
          resolve({ success: false, error: error?.message || 'Payment failed' });
        },
      }
    );
  });
};
