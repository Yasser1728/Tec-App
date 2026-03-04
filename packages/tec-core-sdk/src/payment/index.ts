import { TecApiClient } from '../client';
import { isPiBrowser } from '../utils/pi-browser';
import type { A2UPaymentRequest, PaymentResult, Payment, PaymentHistoryOptions, PaginatedPaymentHistory } from '../types';

// ─── Validation ───────────────────────────────────────────────────────────────
const PI_PAYMENT_ID_REGEX = /^[a-zA-Z0-9]+([._-][a-zA-Z0-9]+)*$/;
const PI_TXID_REGEX = /^[a-zA-Z0-9_-]{8,128}$/;
const MAX_AMOUNT = 1_000_000;
const MIN_AMOUNT = 0.01;

// ─── Timeouts ─────────────────────────────────────────────────────────────────
const APPROVAL_TIMEOUT_MS = 3 * 60 * 1000;  // 3 minutes
const COMPLETION_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

export class TecPaymentSDK {
  private client: TecApiClient;

  constructor(client: TecApiClient) {
    this.client = client;
  }

  private validateAmount(amount: number): void {
    if (!Number.isFinite(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
      throw new Error(`Amount must be between ${MIN_AMOUNT} and ${MAX_AMOUNT}`);
    }
  }

  private validatePiPaymentId(piPaymentId: string): void {
    if (!piPaymentId || !PI_PAYMENT_ID_REGEX.test(piPaymentId)) {
      throw new Error('Invalid Pi payment ID format');
    }
  }

  private validateTxid(txid: string): void {
    if (!txid || !PI_TXID_REGEX.test(txid)) {
      throw new Error('Invalid transaction ID format');
    }
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

    this.validateAmount(amount);

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
      let settled = false;

      const safeResolve = (value: PaymentResult) => {
        if (settled) return;
        settled = true;
        clearTimeout(overallTimer);
        resolve(value);
      };

      const safeReject = (reason: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(overallTimer);
        reject(reason);
      };

      // Overall timeout: approval + completion combined
      const overallTimer = setTimeout(() => {
        safeReject(new Error('Payment timed out — please try again'));
      }, APPROVAL_TIMEOUT_MS + COMPLETION_TIMEOUT_MS);

      window.Pi.createPayment(
        { amount, memo, metadata },
        {
          onReadyForServerApproval: async (piPaymentId: string) => {
            try {
              this.validatePiPaymentId(piPaymentId);
              await this.client.post('/api/payments/approve', {
                payment_id: internalPaymentId,
                pi_payment_id: piPaymentId,
              }, { 'Idempotency-Key': idempotencyKey });
            } catch (err) {
              console.error('[TecSDK] Server approval failed:', err);
              safeReject(err instanceof Error ? err : new Error('Server approval failed'));
            }
          },
          onReadyForServerCompletion: async (_piPaymentId: string, txid: string) => {
            if (completionCalled) return;
            completionCalled = true;
            try {
              this.validateTxid(txid);
              const result = await this.client.post<PaymentResult>('/api/payments/complete', {
                payment_id: internalPaymentId,
                transaction_id: txid,
              }, { 'Idempotency-Key': idempotencyKey });
              safeResolve(result);
            } catch (err) {
              safeReject(err instanceof Error ? err : new Error('Payment completion failed'));
            }
          },
          onCancel: () => {
            safeResolve({ success: false, status: 'cancelled', amount, memo, message: 'Payment cancelled by user' });
          },
          onError: (error: Error) => {
            safeReject(error);
          },
        }
      );
    });
  }

  // Get payment status
  async getPaymentStatus(paymentId: string): Promise<Payment> {
    if (!paymentId) {
      throw new Error('paymentId is required');
    }
    return this.client.get<Payment>(`/api/payments/${encodeURIComponent(paymentId)}/status`);
  }

  // Cancel a payment
  async cancelPayment(paymentId: string): Promise<PaymentResult> {
    if (!paymentId) {
      throw new Error('paymentId is required');
    }
    return this.client.post<PaymentResult>('/api/payments/cancel', {
      payment_id: paymentId,
    });
  }

  // Get payment history (paginated)
  async getPaymentHistory(options?: PaymentHistoryOptions): Promise<PaginatedPaymentHistory> {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', String(options.page));
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.status) params.set('status', options.status);
    if (options?.payment_method) params.set('payment_method', options.payment_method);
    if (options?.from) params.set('from', options.from);
    if (options?.to) params.set('to', options.to);
    if (options?.sort) params.set('sort', options.sort);

    const qs = params.toString();
    return this.client.get<PaginatedPaymentHistory>(`/api/payments/history${qs ? `?${qs}` : ''}`);
  }

  // Test Pi SDK availability
  testSDK(): boolean {
    return isPiBrowser();
  }
}
