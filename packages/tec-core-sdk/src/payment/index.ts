import { TecApiClient } from '../client';
import { isPiBrowser } from '../utils/pi-browser';
import type { A2UPaymentRequest, PaymentResult, Payment } from '../types';

export class TecPaymentSDK {
  private client: TecApiClient;

  constructor(client: TecApiClient) {
    this.client = client;
  }

  // App-to-User payment (server-side)
  async createA2UPayment(data: A2UPaymentRequest): Promise<PaymentResult> {
    return this.client.post<PaymentResult>('/api/payments/a2u', data);
  }

  // User-to-App payment (client-side via Pi SDK)
  createU2APayment(amount: number, memo: string, metadata: Record<string, unknown> = {}): Promise<PaymentResult> {
    return new Promise((resolve, reject) => {
      if (!isPiBrowser()) {
        reject(new Error('Pi SDK غير متاح'));
        return;
      }

      window.Pi.createPayment(
        { amount, memo, metadata },
        {
          onReadyForServerApproval: async (paymentId: string) => {
            try {
              await this.client.post('/api/payments/approve', { paymentId });
            } catch (err) {
              console.error('Server approval failed:', err);
              reject(err instanceof Error ? err : new Error('Server approval failed'));
            }
          },
          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            try {
              const result = await this.client.post<PaymentResult>('/api/payments/complete', { paymentId, txid });
              resolve(result);
            } catch (err) {
              reject(err);
            }
          },
          onCancel: () => {
            resolve({ success: false, status: 'cancelled', amount, memo });
          },
          onError: (error: Error) => {
            reject(error);
          },
        }
      );
    });
  }

  // Get payment status
  async getPaymentStatus(paymentId: string): Promise<Payment> {
    return this.client.get<Payment>(`/api/payments/${paymentId}/status`);
  }

  // Test Pi SDK availability
  testSDK(): boolean {
    return isPiBrowser();
  }
}
