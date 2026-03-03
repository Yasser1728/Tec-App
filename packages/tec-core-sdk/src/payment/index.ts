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
    const idempotencyKey = crypto.randomUUID();
    return this.client.post<PaymentResult>('/api/payments/a2u', data, { 'Idempotency-Key': idempotencyKey });
  }

  // User-to-App payment (client-side via Pi SDK)
  async createU2APayment(amount: number, memo: string, metadata: Record<string, unknown> = {}): Promise<PaymentResult> {
    if (!isPiBrowser()) {
      throw new Error('Pi SDK غير متاح');
    }

    const idempotencyKey = crypto.randomUUID();

    // Step 1: Create payment record in backend to obtain internal UUID.
    // userId 'current' is resolved from the JWT by the backend.
    const createResult = await this.client.post<{ data: { id: string } }>('/api/payments/create', {
      userId: 'current',
      amount,
      currency: 'PI',
      payment_method: 'pi',
      metadata,
    });
    const internalPaymentId = createResult.data.id;

    return new Promise((resolve, reject) => {
      // Guard: prevent duplicate completion calls (e.g. Pi SDK retry behaviour)
      let completionCalled = false;

      window.Pi.createPayment(
        { amount, memo, metadata },
        {
          onReadyForServerApproval: async (piPaymentId: string) => {
            try {
              await this.client.post('/api/payments/approve', {
                payment_id: internalPaymentId,
                pi_payment_id: piPaymentId,
              }, { 'Idempotency-Key': idempotencyKey });
            } catch (err) {
              console.error('Server approval failed:', err);
              reject(err instanceof Error ? err : new Error('Server approval failed'));
            }
          },
          onReadyForServerCompletion: async (_piPaymentId: string, txid: string) => {
            if (completionCalled) return;
            completionCalled = true;
            try {
              const result = await this.client.post<PaymentResult>('/api/payments/complete', {
                payment_id: internalPaymentId,
                transaction_id: txid,
              }, { 'Idempotency-Key': idempotencyKey });
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
