import { TecWalletSDK } from '../src/wallet';
import { TecApiClient } from '../src/client';
import type { Wallet, WalletBalance } from '../src/types';

jest.mock('../src/client');

describe('TecWalletSDK', () => {
  let walletSDK: TecWalletSDK;
  let mockClient: jest.Mocked<TecApiClient>;

  beforeEach(() => {
    mockClient = {
      get: jest.fn(),
      post: jest.fn(),
    } as unknown as jest.Mocked<TecApiClient>;
    walletSDK = new TecWalletSDK(mockClient);
    jest.clearAllMocks();
  });

  describe('getWallets', () => {
    it('should fetch all wallets', async () => {
      const mockWallets: Wallet[] = [
        {
          id: '1',
          user_id: 'user1',
          wallet_type: 'pi',
          balance: 100,
          currency: 'PI',
          is_primary: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];
      mockClient.get.mockResolvedValue(mockWallets);

      const wallets = await walletSDK.getWallets();

      expect(mockClient.get).toHaveBeenCalledWith('/api/wallets');
      expect(wallets).toEqual(mockWallets);
    });
  });

  describe('getBalance', () => {
    it('should fetch balance for specific wallet', async () => {
      const mockBalance: WalletBalance = {
        walletId: '1',
        balance: 100,
        currency: 'PI',
        walletType: 'pi',
        isPrimary: true,
      };
      mockClient.get.mockResolvedValue(mockBalance);

      const balance = await walletSDK.getBalance('1');

      expect(mockClient.get).toHaveBeenCalledWith('/api/wallets/1/balance');
      expect(balance).toEqual(mockBalance);
    });
  });

  describe('getPrimaryBalance', () => {
    it('should return balance for primary wallet', async () => {
      const mockWallets: Wallet[] = [
        {
          id: '1',
          user_id: 'user1',
          wallet_type: 'pi',
          balance: 100,
          currency: 'PI',
          is_primary: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '2',
          user_id: 'user1',
          wallet_type: 'crypto',
          balance: 50,
          currency: 'BTC',
          is_primary: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];
      const mockBalance: WalletBalance = {
        walletId: '1',
        balance: 100,
        currency: 'PI',
        walletType: 'pi',
        isPrimary: true,
      };

      mockClient.get.mockResolvedValueOnce(mockWallets).mockResolvedValueOnce(mockBalance);

      const balance = await walletSDK.getPrimaryBalance();

      expect(balance).toEqual(mockBalance);
    });

    it('should return null if no primary wallet', async () => {
      const mockWallets: Wallet[] = [
        {
          id: '2',
          user_id: 'user1',
          wallet_type: 'crypto',
          balance: 50,
          currency: 'BTC',
          is_primary: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockClient.get.mockResolvedValue(mockWallets);

      const balance = await walletSDK.getPrimaryBalance();

      expect(balance).toBeNull();
    });
  });

  describe('getTransactions', () => {
    it('should fetch transactions with query parameters', async () => {
      const mockResponse = {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
      mockClient.get.mockResolvedValue(mockResponse);

      await walletSDK.getTransactions('1', { page: 1, limit: 10, type: 'deposit' });

      expect(mockClient.get).toHaveBeenCalledWith(
        '/api/wallets/1/transactions?page=1&limit=10&type=deposit'
      );
    });
  });

  describe('linkWallet', () => {
    it('should link a new wallet', async () => {
      const mockWallet: Wallet = {
        id: '3',
        user_id: 'user1',
        wallet_address: '0x123',
        wallet_type: 'crypto',
        balance: 0,
        currency: 'ETH',
        is_primary: false,
        created_at: new Date(),
        updated_at: new Date(),
      };
      mockClient.post.mockResolvedValue(mockWallet);

      const wallet = await walletSDK.linkWallet('0x123', 'crypto');

      expect(mockClient.post).toHaveBeenCalledWith('/api/wallets/link', {
        wallet_address: '0x123',
        wallet_type: 'crypto',
      });
      expect(wallet).toEqual(mockWallet);
    });
  });
});
