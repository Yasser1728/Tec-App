/**
 * Unit tests for pi-payment.ts - verifies that Idempotency-Key headers are
 * present in all payment POST requests (create, approve, complete, a2u).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---- mock dependencies ----
vi.mock('@/lib-client/pi/pi-auth', () => ({
  getAccessToken: vi.fn(() => 'test-token'),
  getStoredUser: vi.fn(() => ({ id: 'user-123' })),
  waitForPiSDK: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/lib-client/pi/payment-timeouts', () => ({
  APPROVAL_TIMEOUT_MS: 60000,
  COMPLETION_TIMEOUT_MS: 60000,
  RETRIABLE_STATUS_CODES: new Set([404, 429]),
  NON_RETRIABLE_STATUS_CODES: new Set([400, 401, 403, 500]),
  MAX_RETRIES: 0,
  RETRY_BASE_DELAY_MS: 0,
}));

import { createA2UPayment, createU2APayment } from '@/lib-client/pi/pi-payment';

const TEST_UUID =
  'test-uuid-1234-5678-abcd-ef0123456789' as `${string}-${string}-${string}-${string}-${string}`;

const makeOkResponse = (body: unknown) => ({
  ok: true,
  status: 200,
  json: () => Promise.resolve(body),
});

describe('pi-payment - Idempotency-Key header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(TEST_UUID);

    process.env.NEXT_PUBLIC_API_GATEWAY_URL = 'https://api.example.com';
  });

  describe('createA2UPayment', () => {
    it('sends Idempotency-Key header in /payments/a2u request', async () => {
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(
          makeOkResponse({
            success: true,
            status: 'pending',
            amount: 10,
            memo: 'test',
          }) as unknown as Response
        );

      await createA2UPayment({ recipientUid: 'uid-123', amount: 10, memo: 'test' });

      expect(fetchSpy).toHaveBeenCalledOnce();
      const [url, options] = fetchSpy.mock.calls[0];
      expect(url).toContain('/payments/a2u');
      expect((options?.headers as Record<string, string>)['Idempotency-Key']).toBe(TEST_UUID);
    });
  });

  describe('createU2APayment', () => {
    it('sends Idempotency-Key header in /payments/create request', async () => {
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(
          makeOkResponse({ data: { payment: { id: 'internal-id' } } }) as unknown as Response
        );

      // Set up window.Pi so the function does not reject before calling fetch
      (window as unknown as Record<string, unknown>).__TEC_PI_READY = true;
      const mockCreatePayment = vi.fn();
      (window as unknown as Record<string, unknown>).Pi = {
        createPayment: mockCreatePayment,
        authenticate: vi.fn(),
        init: vi.fn(),
      };

      // Do not await - we only want to verify the create fetch call
      const paymentPromise = createU2APayment(1, 'Test');

      // Wait until Pi.createPayment has been called (create fetch has completed)
      await vi.waitFor(() => expect(mockCreatePayment).toHaveBeenCalled());

      const createCall = fetchSpy.mock.calls.find(([url]) =>
        String(url).includes('/api/payments/create')
      );
      expect(createCall).toBeDefined();
      const headers = createCall![1]?.headers as Record<string, string>;
      expect(headers['Idempotency-Key']).toBe(TEST_UUID);

      // Resolve the promise cleanly by triggering the cancel callback
      const callbacks = mockCreatePayment.mock.calls[0][1];
      callbacks.onCancel();
      await paymentPromise;
    });

    it('sends the same Idempotency-Key in /payments/approve and /payments/complete', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
        const urlStr = String(url);
        if (urlStr.includes('/api/payments/create')) {
          return Promise.resolve(
            makeOkResponse({ data: { payment: { id: 'internal-id' } } }) as unknown as Response
          );
        }
        if (urlStr.includes('/api/payments/approve')) {
          return Promise.resolve(makeOkResponse({ success: true }) as unknown as Response);
        }
        if (urlStr.includes('/api/payments/complete')) {
          return Promise.resolve(
            makeOkResponse({
              success: true,
              paymentId: 'pi-pay-1',
              txid: 'txid-abc12345',
              status: 'completed',
              amount: 1,
              memo: 'Test',
            }) as unknown as Response
          );
        }
        return Promise.resolve(makeOkResponse({}) as unknown as Response);
      });

      const mockCreatePayment = vi.fn();
      (window as unknown as Record<string, unknown>).__TEC_PI_READY = true;
      (window as unknown as Record<string, unknown>).Pi = {
        createPayment: mockCreatePayment,
        authenticate: vi.fn(),
        init: vi.fn(),
      };

      const paymentPromise = createU2APayment(1, 'Test');

      // Wait until Pi.createPayment has been called (create fetch has completed)
      await vi.waitFor(() => expect(mockCreatePayment).toHaveBeenCalled());

      const callbacks = mockCreatePayment.mock.calls[0][1];

      await callbacks.onReadyForServerApproval('pi-pay-1');
      await callbacks.onReadyForServerCompletion('pi-pay-1', 'txid-abc12345');
      await paymentPromise;

      const approveCall = fetchSpy.mock.calls.find(([url]) =>
        String(url).includes('/api/payments/approve')
      );
      const completeCall = fetchSpy.mock.calls.find(([url]) =>
        String(url).includes('/api/payments/complete')
      );

      expect(approveCall).toBeDefined();
      expect(completeCall).toBeDefined();

      const approveKey = (approveCall![1]?.headers as Record<string, string>)['Idempotency-Key'];
      const completeKey = (completeCall![1]?.headers as Record<string, string>)['Idempotency-Key'];

      expect(approveKey).toBe(TEST_UUID);
      expect(completeKey).toBe(TEST_UUID);
      // Same key reused across approve and complete
      expect(approveKey).toBe(completeKey);
    });

    it('E2E: create => approve => complete completes without 400 (missing-header) error', async () => {
      // Simulate a backend that returns 400 when Idempotency-Key is absent
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((url, options) => {
        const urlStr = String(url);
        const headers = (options?.headers ?? {}) as Record<string, string>;
        if (!headers['Idempotency-Key']) {
          return Promise.resolve({
            ok: false,
            status: 400,
            json: () => Promise.resolve({ message: 'Missing Idempotency-Key' }),
          } as unknown as Response);
        }
        if (urlStr.includes('/api/payments/create')) {
          return Promise.resolve(
            makeOkResponse({ data: { payment: { id: 'e2e-id' } } }) as unknown as Response
          );
        }
        if (urlStr.includes('/api/payments/approve')) {
          return Promise.resolve(makeOkResponse({ success: true }) as unknown as Response);
        }
        if (urlStr.includes('/api/payments/complete')) {
          return Promise.resolve(
            makeOkResponse({
              success: true,
              paymentId: 'pi-e2e',
              txid: 'txid-e2e12345',
              status: 'completed',
              amount: 1,
              memo: 'E2E Test',
            }) as unknown as Response
          );
        }
        return Promise.resolve(makeOkResponse({}) as unknown as Response);
      });

      const mockCreatePayment = vi.fn();
      (window as unknown as Record<string, unknown>).__TEC_PI_READY = true;
      (window as unknown as Record<string, unknown>).Pi = {
        createPayment: mockCreatePayment,
        authenticate: vi.fn(),
        init: vi.fn(),
      };

      const paymentPromise = createU2APayment(1, 'E2E Test');

      // Wait until Pi.createPayment has been called (create fetch has completed)
      await vi.waitFor(() => expect(mockCreatePayment).toHaveBeenCalled());

      const callbacks = mockCreatePayment.mock.calls[0][1];

      await callbacks.onReadyForServerApproval('pi-e2e');
      await callbacks.onReadyForServerCompletion('pi-e2e', 'txid-e2e12345');
      const result = await paymentPromise;

      // All requests succeeded - no 400 from missing header
      expect(result.success).toBe(true);
      expect(result.status).toBe('completed');

      // Every payment POST had the Idempotency-Key header
      const paymentCalls = fetchSpy.mock.calls.filter(
        ([url]) =>
          String(url).includes('/api/payments/create') ||
          String(url).includes('/api/payments/approve') ||
          String(url).includes('/api/payments/complete')
      );
      expect(paymentCalls).toHaveLength(3);
      for (const [, options] of paymentCalls) {
        const headers = (options?.headers ?? {}) as Record<string, string>;
        expect(headers['Idempotency-Key']).toBeTruthy();
      }
    });
  });
});
