import { TecPaymentSDK } from '../src/payment';
import { TecApiClient } from '../src/client';
import { isPiBrowser } from '../src/utils/pi-browser';
import type { A2UPaymentRequest, PaymentResult } from '../src/types';

jest.mock('../src/client');
jest.mock('../src/utils/pi-browser');
jest.mock('../src/utils/storage');

describe('TecPaymentSDK', () => {
  let paymentSDK: TecPaymentSDK;
  let mockClient: jest.Mocked<TecApiClient>;

  beforeEach(() => {
    mockClient = {
      post: jest.fn(),
      get: jest.fn(),
    } as unknown as jest.Mocked<TecApiClient>;
    paymentSDK = new TecPaymentSDK(mockClient);
    jest.clearAllMocks();
  });

  describe('testSDK', () => {
    it('should return true when Pi Browser is available', () => {
      (isPiBrowser as jest.Mock).mockReturnValue(true);

      expect(paymentSDK.testSDK()).toBe(true);
    });

    it('should return false when Pi Browser is not available', () => {
      (isPiBrowser as jest.Mock).mockReturnValue(false);

      expect(paymentSDK.testSDK()).toBe(false);
    });
  });

  describe('createA2UPayment', () => {
    it('should create App-to-User payment', async () => {
      const request: A2UPaymentRequest = {
        recipientUid: 'user123',
        amount: 100,
        memo: 'Reward payment',
        metadata: { reason: 'referral' },
      };
      const mockResult: PaymentResult = {
        success: true,
        paymentId: 'payment123',
        status: 'pending',
        amount: 100,
        memo: 'Reward payment',
      };

      mockClient.post.mockResolvedValue(mockResult);

      const result = await paymentSDK.createA2UPayment(request);

      expect(mockClient.post).toHaveBeenCalledWith('/api/payments/a2u', request);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getPaymentStatus', () => {
    it('should fetch payment status', async () => {
      const mockPayment = {
        id: 'payment123',
        user_id: 'user1',
        amount: 50,
        currency: 'PI',
        status: 'completed' as const,
        payment_method: 'pi' as const,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockClient.get.mockResolvedValue(mockPayment);

      const payment = await paymentSDK.getPaymentStatus('payment123');

      expect(mockClient.get).toHaveBeenCalledWith('/api/payments/payment123/status');
      expect(payment).toEqual(mockPayment);
    });
  });

  describe('createU2APayment', () => {
    beforeEach(() => {
      // Reset window.Pi before each test
      (window as unknown as Record<string, unknown>).Pi = undefined;
    });

    it('should reject if Pi Browser is not available', async () => {
      (isPiBrowser as jest.Mock).mockReturnValue(false);

      await expect(paymentSDK.createU2APayment(10, 'Test payment')).rejects.toThrow(
        'Pi SDK غير متاح'
      );
    });

    it('should reject when backend payment create fails', async () => {
      (isPiBrowser as jest.Mock).mockReturnValue(true);
      mockClient.post.mockRejectedValue(new Error('Network error'));

      await expect(paymentSDK.createU2APayment(10, 'Test payment')).rejects.toThrow('Network error');
      expect(mockClient.post).toHaveBeenCalledWith('/api/payments/create', expect.objectContaining({
        amount: 10,
        currency: 'PI',
        payment_method: 'pi',
      }));
    });

    it('should call approve with snake_case fields after onReadyForServerApproval', async () => {
      (isPiBrowser as jest.Mock).mockReturnValue(true);

      const mockCreatePayment = jest.fn();
      (window as unknown as Record<string, unknown>).Pi = { createPayment: mockCreatePayment };

      mockClient.post.mockImplementation(async (url: string) => {
        if (url === '/api/payments/create') return { data: { id: 'internal-uuid-123' } };
        if (url === '/api/payments/approve') return {};
        return {};
      });

      // Start payment — don't await; it waits for Pi SDK callbacks
      const paymentPromise = paymentSDK.createU2APayment(10, 'Test payment');

      // Wait for the async create step and Pi.createPayment call
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockCreatePayment).toHaveBeenCalled();
      const callbacks = mockCreatePayment.mock.calls[0][1];

      // Trigger the approval callback
      await callbacks.onReadyForServerApproval('pi-payment-id-abc');

      expect(mockClient.post).toHaveBeenCalledWith('/api/payments/approve', {
        payment_id: 'internal-uuid-123',
        pi_payment_id: 'pi-payment-id-abc',
      });

      // Promise intentionally left unresolved — we only test the approval callback, not the full flow
      paymentPromise.catch(() => {});
    });

    it('should call complete with snake_case fields and resolve on onReadyForServerCompletion', async () => {
      (isPiBrowser as jest.Mock).mockReturnValue(true);

      const mockResult: PaymentResult = {
        success: true,
        paymentId: 'pi-payment-id-abc',
        txid: 'txid-xyz',
        status: 'completed',
        amount: 10,
        memo: 'Test payment',
      };

      const mockCreatePayment = jest.fn();
      (window as unknown as Record<string, unknown>).Pi = { createPayment: mockCreatePayment };

      mockClient.post.mockImplementation(async (url: string) => {
        if (url === '/api/payments/create') return { data: { id: 'internal-uuid-123' } };
        if (url === '/api/payments/complete') return mockResult;
        return {};
      });

      const paymentPromise = paymentSDK.createU2APayment(10, 'Test payment');

      // Wait for create step and Pi.createPayment call
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockCreatePayment).toHaveBeenCalled();
      const callbacks = mockCreatePayment.mock.calls[0][1];

      // Trigger completion callback
      await callbacks.onReadyForServerCompletion('pi-payment-id-abc', 'txid-xyz');

      const result = await paymentPromise;

      expect(mockClient.post).toHaveBeenCalledWith('/api/payments/complete', {
        payment_id: 'internal-uuid-123',
        transaction_id: 'txid-xyz',
      });
      expect(result).toEqual(mockResult);
    });

    it('E2E flow: create → approve → complete resolves with COMPLETED status', async () => {
      (isPiBrowser as jest.Mock).mockReturnValue(true);

      const mockResult: PaymentResult = {
        success: true,
        paymentId: 'pi-pay-e2e',
        txid: 'txid-e2e',
        status: 'completed',
        amount: 5,
        memo: 'E2E payment',
      };

      const mockCreatePayment = jest.fn();
      (window as unknown as Record<string, unknown>).Pi = { createPayment: mockCreatePayment };

      mockClient.post.mockImplementation(async (url: string) => {
        if (url === '/api/payments/create') return { data: { id: 'e2e-uuid' } };
        if (url === '/api/payments/approve') return { success: true };
        if (url === '/api/payments/complete') return mockResult;
        return {};
      });

      const paymentPromise = paymentSDK.createU2APayment(5, 'E2E payment');
      await new Promise(resolve => setTimeout(resolve, 50));

      const callbacks = mockCreatePayment.mock.calls[0][1];

      // Step: approval
      await callbacks.onReadyForServerApproval('pi-pay-e2e');
      expect(mockClient.post).toHaveBeenCalledWith('/api/payments/approve', {
        payment_id: 'e2e-uuid',
        pi_payment_id: 'pi-pay-e2e',
      });

      // Step: completion
      await callbacks.onReadyForServerCompletion('pi-pay-e2e', 'txid-e2e');
      const result = await paymentPromise;

      expect(mockClient.post).toHaveBeenCalledWith('/api/payments/complete', {
        payment_id: 'e2e-uuid',
        transaction_id: 'txid-e2e',
      });
      expect(result.status).toBe('completed');
      expect(result.success).toBe(true);
    });

    it('should not call /api/payments/complete a second time if onReadyForServerCompletion fires twice', async () => {
      (isPiBrowser as jest.Mock).mockReturnValue(true);

      const mockResult: PaymentResult = {
        success: true,
        paymentId: 'pi-pay-dup',
        txid: 'txid-dup',
        status: 'completed',
        amount: 1,
        memo: 'Dup test',
      };

      const mockCreatePayment = jest.fn();
      (window as unknown as Record<string, unknown>).Pi = { createPayment: mockCreatePayment };

      mockClient.post.mockImplementation(async (url: string) => {
        if (url === '/api/payments/create') return { data: { id: 'dup-uuid' } };
        if (url === '/api/payments/complete') return mockResult;
        return {};
      });

      const paymentPromise = paymentSDK.createU2APayment(1, 'Dup test');
      await new Promise(resolve => setTimeout(resolve, 50));

      const callbacks = mockCreatePayment.mock.calls[0][1];

      // First completion call — should resolve the promise
      await callbacks.onReadyForServerCompletion('pi-pay-dup', 'txid-dup');
      await paymentPromise;

      // Second completion call — should be silently ignored (no additional post call)
      await callbacks.onReadyForServerCompletion('pi-pay-dup', 'txid-dup');

      const completeCalls = mockClient.post.mock.calls.filter(([url]) => url === '/api/payments/complete');
      expect(completeCalls).toHaveLength(1);
    });

    it('should not call window.Pi.createPayment if backend pre-create fails (no orphaned Pi payment)', async () => {
      (isPiBrowser as jest.Mock).mockReturnValue(true);

      const mockCreatePayment = jest.fn();
      (window as unknown as Record<string, unknown>).Pi = { createPayment: mockCreatePayment };

      mockClient.post.mockRejectedValue(new Error('Backend unavailable'));

      await expect(paymentSDK.createU2APayment(10, 'Test')).rejects.toThrow('Backend unavailable');
      expect(mockCreatePayment).not.toHaveBeenCalled();
    });
  });
});
