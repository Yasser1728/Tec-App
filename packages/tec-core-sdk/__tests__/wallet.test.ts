import { TecWalletSDK } from '../src/wallet';
import { TecApiClient } from '../src/client';
import type { Wallet, WalletBalance, Transaction } from '../src/types';
import type { WalletListResponse, WalletBalanceResponse, WalletTransactionsResponse, WalletOperationResponse, LinkWalletResponse, TransferResponse } from '../src/wallet';

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
    it('should fetch all wallets for a user', async () => {
      const mockWallet: Wallet = {
        id: '1',
        user_id: 'user1',
        wallet_type: 'pi',
        balance: 100,
        currency: 'PI',
        is_primary: true,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const mockResponse: WalletListResponse = {
        success: true,
        data: { wallets: [mockWallet] },
      };
      mockClient.get.mockResolvedValue(mockResponse);

      const result = await walletSDK.getWallets('user1');

      expect(mockClient.get).toHaveBeenCalledWith('/api/wallets?userId=user1');
      expect(result).toEqual(mockResponse);
    });

    it('should throw if userId is empty', async () => {
      await expect(walletSDK.getWallets('')).rejects.toThrow('userId is required');
    });
  });

  describe('getBalance', () => {
    it('should fetch balance for a specific wallet', async () => {
      const mockBalance: WalletBalance = {
        walletId: '1',
        balance: 100,
        currency: 'PI',
        walletType: 'pi',
        isPrimary: true,
      };
      const mockResponse: WalletBalanceResponse = {
        success: true,
        data: { wallet: mockBalance },
      };
      mockClient.get.mockResolvedValue(mockResponse);

      const result = await walletSDK.getBalance('1');

      expect(mockClient.get).toHaveBeenCalledWith('/api/wallets/1/balance');
      expect(result).toEqual(mockResponse);
    });

    it('should throw if walletId is empty', async () => {
      await expect(walletSDK.getBalance('')).rejects.toThrow('walletId is required');
    });
  });

  describe('getTransactions', () => {
    it('should fetch transactions with query parameters', async () => {
      const mockTransaction: Transaction = {
        id: 'tx1',
        wallet_id: '1',
        type: 'deposit',
        amount: 50,
        currency: 'PI',
        status: 'completed',
        created_at: new Date(),
        updated_at: new Date(),
      };
      const mockResponse: WalletTransactionsResponse = {
        success: true,
        data: {
          transactions: [mockTransaction],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
        },
      };
      mockClient.get.mockResolvedValue(mockResponse);

      const result = await walletSDK.getTransactions('1', { page: 1, limit: 10, type: 'deposit' });

      expect(mockClient.get).toHaveBeenCalledWith(
        '/api/wallets/1/transactions?page=1&limit=10&type=deposit'
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw if walletId is empty', async () => {
      await expect(walletSDK.getTransactions('')).rejects.toThrow('walletId is required');
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
      const mockResponse: LinkWalletResponse = { success: true, data: { wallet: mockWallet } };
      mockClient.post.mockResolvedValue(mockResponse);

      const result = await walletSDK.linkWallet({
        wallet_address: '0x123',
        wallet_type: 'crypto',
        userId: 'user1',
        currency: 'ETH',
      });

      expect(mockClient.post).toHaveBeenCalledWith('/api/wallets/link', {
        wallet_address: '0x123',
        wallet_type: 'crypto',
        userId: 'user1',
        currency: 'ETH',
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deposit', () => {
    it('should deposit funds to a wallet', async () => {
      const mockWallet: Wallet = {
        id: '1', user_id: 'user1', wallet_type: 'pi', balance: 150,
        currency: 'PI', is_primary: true, created_at: new Date(), updated_at: new Date(),
      };
      const mockTransaction: Transaction = {
        id: 'tx2', wallet_id: '1', type: 'deposit', amount: 50,
        currency: 'PI', status: 'completed', created_at: new Date(), updated_at: new Date(),
      };
      const mockResponse: WalletOperationResponse = {
        success: true,
        data: { wallet: mockWallet, transaction: mockTransaction },
      };
      mockClient.post.mockResolvedValue(mockResponse);

      const result = await walletSDK.deposit('1', 50);

      expect(mockClient.post).toHaveBeenCalledWith('/api/wallets/1/deposit', { amount: 50 });
      expect(result).toEqual(mockResponse);
    });

    it('should throw if walletId is empty', async () => {
      await expect(walletSDK.deposit('', 50)).rejects.toThrow('walletId is required');
    });

    it('should throw if amount is not positive', async () => {
      await expect(walletSDK.deposit('1', -10)).rejects.toThrow('amount must be a positive number');
      await expect(walletSDK.deposit('1', 0)).rejects.toThrow('amount must be a positive number');
    });
  });

  describe('withdraw', () => {
    it('should withdraw funds from a wallet', async () => {
      const mockWallet: Wallet = {
        id: '1', user_id: 'user1', wallet_type: 'pi', balance: 50,
        currency: 'PI', is_primary: true, created_at: new Date(), updated_at: new Date(),
      };
      const mockTransaction: Transaction = {
        id: 'tx3', wallet_id: '1', type: 'withdrawal', amount: 50,
        currency: 'PI', status: 'completed', created_at: new Date(), updated_at: new Date(),
      };
      const mockResponse: WalletOperationResponse = {
        success: true,
        data: { wallet: mockWallet, transaction: mockTransaction },
      };
      mockClient.post.mockResolvedValue(mockResponse);

      const result = await walletSDK.withdraw('1', 50, { description: 'test withdrawal' });

      expect(mockClient.post).toHaveBeenCalledWith('/api/wallets/1/withdraw', {
        amount: 50,
        description: 'test withdrawal',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw if walletId is empty', async () => {
      await expect(walletSDK.withdraw('', 50)).rejects.toThrow('walletId is required');
    });

    it('should throw if amount is not positive', async () => {
      await expect(walletSDK.withdraw('1', 0)).rejects.toThrow('amount must be a positive number');
    });
  });

  describe('transfer', () => {
    it('should transfer funds between wallets', async () => {
      const makeWallet = (id: string): Wallet => ({
        id, user_id: 'user1', wallet_type: 'pi', balance: 50,
        currency: 'PI', is_primary: id === '1', created_at: new Date(), updated_at: new Date(),
      });
      const makeTx = (id: string, type: Transaction['type']): Transaction => ({
        id, wallet_id: '1', type, amount: 30,
        currency: 'PI', status: 'completed', created_at: new Date(), updated_at: new Date(),
      });
      const mockResponse: TransferResponse = {
        success: true,
        data: {
          fromWallet: makeWallet('1'),
          toWallet: makeWallet('2'),
          debitTransaction: makeTx('tx4', 'transfer'),
          creditTransaction: makeTx('tx5', 'transfer'),
        },
      };
      mockClient.post.mockResolvedValue(mockResponse);

      const result = await walletSDK.transfer('1', '2', 30);

      expect(mockClient.post).toHaveBeenCalledWith('/api/wallets/transfer', {
        fromWalletId: '1',
        toWalletId: '2',
        amount: 30,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw if fromWalletId is empty', async () => {
      await expect(walletSDK.transfer('', '2', 30)).rejects.toThrow('Both fromWalletId and toWalletId are required');
    });

    it('should throw if toWalletId is empty', async () => {
      await expect(walletSDK.transfer('1', '', 30)).rejects.toThrow('Both fromWalletId and toWalletId are required');
    });

    it('should throw if transferring to the same wallet', async () => {
      await expect(walletSDK.transfer('1', '1', 30)).rejects.toThrow('Cannot transfer to the same wallet');
    });

    it('should throw if amount is not positive', async () => {
      await expect(walletSDK.transfer('1', '2', 0)).rejects.toThrow('amount must be a positive number');
    });
  });
});
