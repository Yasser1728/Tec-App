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

      expect(mockClient.post).toHaveBeenCalledWith('/api/payments/a2u/create', request);
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
    it('should reject if Pi Browser is not available', async () => {
      (isPiBrowser as jest.Mock).mockReturnValue(false);

      await expect(paymentSDK.createU2APayment(10, 'Test payment')).rejects.toThrow(
        'Pi SDK غير متاح'
      );
    });

    it('should reject with Pi Browser available but no window.Pi', async () => {
      (isPiBrowser as jest.Mock).mockReturnValue(false);

      await expect(
        paymentSDK.createU2APayment(10, 'Test payment')
      ).rejects.toThrow();
    });
  });
});
